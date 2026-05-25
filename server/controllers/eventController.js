const { Event, Ticket } = require('../models/Event');
const { createNotification } = require('./notificationController');

// GET /api/events — Listar eventos publicados (con filtros)
exports.getEvents = async (req, res) => {
  try {
    const { category, type, page = 1, limit = 20, search } = req.query;
    const skip = (page - 1) * limit;

    const filter = { status: 'published', startDate: { $gte: new Date() } };
    if (category) filter.category = category;
    if (type) filter.type = type;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate('organizer', 'username avatar firstName lastName')
        .sort({ featured: -1, startDate: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Event.countDocuments(filter),
    ]);

    res.json({ success: true, events, total, page: parseInt(page) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/events/my — Mis eventos (organizador)
exports.getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user.id })
      .sort({ createdAt: -1 });
    res.json({ success: true, events });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/events/:id — Detalle de evento
exports.getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'username avatar firstName lastName isVerified');
    if (!event) return res.status(404).json({ message: 'Evento no encontrado' });

    // Incrementar vistas
    event.views += 1;
    await event.save({ validateBeforeSave: false });

    res.json({ success: true, event });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/events — Crear evento
exports.createEvent = async (req, res) => {
  try {
    const {
      title, description, category, type, location, onlineLink,
      coverImage, startDate, endDate, ticketTypes,
    } = req.body;

    if (!title || !startDate || !ticketTypes?.length) {
      return res.status(400).json({ message: 'Título, fecha y al menos un tipo de boleto son requeridos' });
    }

    const event = new Event({
      organizer: req.user.id,
      title, description, category, type, location, onlineLink,
      coverImage, startDate, endDate,
      ticketTypes: ticketTypes.map(t => ({
        name: t.name,
        price: Number(t.price) || 0,
        quantity: Number(t.quantity) || 1,
        description: t.description || '',
      })),
      status: 'published',
    });

    await event.save();
    await event.populate('organizer', 'username avatar firstName lastName');
    res.status(201).json({ success: true, event });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/events/:id — Editar evento (solo organizador)
exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Evento no encontrado' });
    if (event.organizer.toString() !== req.user.id)
      return res.status(403).json({ message: 'No tienes permiso para editar este evento' });

    const allowed = ['title','description','category','type','location','onlineLink','coverImage','startDate','endDate','status'];
    allowed.forEach(k => { if (req.body[k] !== undefined) event[k] = req.body[k]; });

    await event.save();
    res.json({ success: true, event });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/events/:id — Cancelar evento
exports.cancelEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Evento no encontrado' });
    if (event.organizer.toString() !== req.user.id)
      return res.status(403).json({ message: 'No tienes permiso' });

    event.status = 'cancelled';
    await event.save();
    res.json({ success: true, message: 'Evento cancelado' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/events/:id/buy-ticket — Comprar boleto
exports.buyTicket = async (req, res) => {
  try {
    const { ticketTypeId } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Evento no encontrado' });
    if (event.status !== 'published') return res.status(400).json({ message: 'Este evento no está disponible' });

    const ticketType = event.ticketTypes.id(ticketTypeId);
    if (!ticketType) return res.status(404).json({ message: 'Tipo de boleto no encontrado' });
    if (ticketType.sold >= ticketType.quantity)
      return res.status(400).json({ message: 'No hay boletos disponibles de este tipo' });

    // Verificar que no tenga ya un boleto de este tipo
    const existing = await Ticket.findOne({ event: event._id, ticketType: ticketTypeId, owner: req.user.id, status: 'active' });
    if (existing) return res.status(400).json({ message: 'Ya tienes un boleto para este evento' });

    // Crear boleto
    const ticket = new Ticket({
      event: event._id,
      ticketType: ticketTypeId,
      owner: req.user.id,
      price: ticketType.price,
    });
    await ticket.save();

    // Incrementar vendidos
    ticketType.sold += 1;
    await event.save({ validateBeforeSave: false });

    // Notificar al organizador
    createNotification({
      recipient: event.organizer,
      sender: req.user.id,
      type: 'purchase',
      title: 'Nuevo boleto vendido',
      body: `Alguien compró un boleto para "${event.title}"`,
      link: `/events/${event._id}`,
    }).catch(() => {});

    res.status(201).json({ success: true, ticket });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/events/:id/my-ticket — Mi boleto con código QR
exports.getMyTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      event: req.params.id,
      owner: req.user.id,
      status: 'active',
    }).populate('event', 'title startDate location coverImage organizer');

    if (!ticket) return res.status(404).json({ message: 'No tienes boleto para este evento' });

    res.json({ success: true, ticket });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/events/my-tickets — Todos mis boletos
exports.getMyTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ owner: req.user.id })
      .populate('event', 'title startDate location coverImage status')
      .sort({ createdAt: -1 });
    res.json({ success: true, tickets });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/events/:id/checkin/:qr — Check-in con QR (organizador/scanner)
exports.checkIn = async (req, res) => {
  try {
    const { qr } = req.params;
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Evento no encontrado' });
    if (event.organizer.toString() !== req.user.id)
      return res.status(403).json({ message: 'Solo el organizador puede hacer check-in' });

    const ticket = await Ticket.findOne({ qrCode: qr, event: req.params.id })
      .populate('owner', 'username avatar firstName lastName');

    if (!ticket) return res.status(404).json({ message: 'Boleto no encontrado' });
    if (ticket.status === 'used') return res.status(400).json({ message: 'Este boleto ya fue usado' });
    if (ticket.status !== 'active') return res.status(400).json({ message: 'Boleto inválido' });

    ticket.checkedIn = true;
    ticket.checkedInAt = new Date();
    ticket.checkedInBy = req.user.id;
    ticket.status = 'used';
    await ticket.save();

    res.json({ success: true, message: '✅ Check-in exitoso', ticket });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/events/:id/attendees — Lista de asistentes (organizador)
exports.getAttendees = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Evento no encontrado' });
    if (event.organizer.toString() !== req.user.id)
      return res.status(403).json({ message: 'No tienes permiso' });

    const tickets = await Ticket.find({ event: req.params.id })
      .populate('owner', 'username avatar firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({ success: true, tickets, total: tickets.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
