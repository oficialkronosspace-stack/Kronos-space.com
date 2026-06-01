const Listing = require('../models/Listing');
const User = require('../models/User');

const COMMISSION_RATE = 0.07; // 7% — dentro del rango 6-8%

exports.getListings = async (req, res) => {
  try {
    const { category, search, page = 1 } = req.query;
    const limit = 20;
    const skip = (parseInt(page) - 1) * limit;

    const filter = { status: 'active' };
    if (category && category !== '') filter.category = category;
    if (search && search.trim() !== '') {
      filter.$text = { $search: search.trim() };
    }

    const [listings, total] = await Promise.all([
      Listing.find(filter)
        .populate('seller', 'username firstName lastName avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Listing.countDocuments(filter)
    ]);

    res.json({ listings, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyListings = async (req, res) => {
  try {
    const listings = await Listing.find({ seller: req.user._id })
      .populate('buyer', 'username firstName lastName avatar')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ listings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createListing = async (req, res) => {
  try {
    const { title, description, price, category, images } = req.body;
    if (!title || price === undefined) {
      return res.status(400).json({ message: 'title y price son requeridos' });
    }
    const listing = await Listing.create({
      title,
      description: description || '',
      price: Number(price),
      category: category || 'otro',
      images: Array.isArray(images) ? images : (images ? [images] : []),
      seller: req.user._id
    });
    await listing.populate('seller', 'username firstName lastName avatar');
    res.status(201).json({ listing });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('seller', 'username firstName lastName avatar')
      .populate('buyer', 'username firstName lastName avatar')
      .lean();
    if (!listing) return res.status(404).json({ message: 'Listing no encontrado' });
    res.json({ listing });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.buyListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing no encontrado' });
    if (listing.status !== 'active') {
      return res.status(400).json({ message: 'Este listing no está disponible' });
    }
    if (listing.seller.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'No puedes comprar tu propio listing' });
    }

    const commission = Math.round(listing.price * COMMISSION_RATE * 100) / 100;
    const sellerReceives = Math.round((listing.price - commission) * 100) / 100;

    listing.status = 'escrow';
    listing.buyer = req.user._id;
    listing.escrow = { held: true, amount: listing.price, commission, sellerReceives, releasedAt: null };
    await listing.save();
    await listing.populate('seller', 'username firstName lastName avatar');
    await listing.populate('buyer', 'username firstName lastName avatar');

    res.json({ listing, message: 'Fondos en escrow. Confirma cuando recibas el producto.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.releaseFunds = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing no encontrado' });
    if (listing.status !== 'escrow') {
      return res.status(400).json({ message: 'El listing no está en escrow' });
    }
    if (!listing.buyer || listing.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Solo el comprador puede confirmar la recepción' });
    }

    listing.status = 'completed';
    listing.escrow.held = false;
    listing.escrow.releasedAt = new Date();
    await listing.save();

    // Acreditar al vendedor su parte neta en kronosTokens (wallet virtual)
    const sellerNet = listing.escrow.sellerReceives || listing.price;
    await User.findByIdAndUpdate(listing.seller, {
      $inc: { kronosTokens: sellerNet }
    });

    res.json({
      listing,
      message: 'Fondos liberados. Transacción completada.',
      breakdown: {
        total: listing.escrow.amount,
        commission: listing.escrow.commission,
        sellerReceives: listing.escrow.sellerReceives,
        commissionRate: `${COMMISSION_RATE * 100}%`
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.cancelEscrow = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing no encontrado' });
    if (listing.status !== 'escrow') {
      return res.status(400).json({ message: 'El listing no está en escrow' });
    }

    const userId = req.user._id.toString();
    const isBuyer = listing.buyer && listing.buyer.toString() === userId;
    const isSeller = listing.seller.toString() === userId;

    if (!isBuyer && !isSeller) {
      return res.status(403).json({ message: 'No tienes permisos para cancelar este escrow' });
    }

    listing.status = 'active';
    listing.buyer = null;
    listing.escrow = { held: false, amount: 0, releasedAt: null };
    await listing.save();

    res.json({ listing, message: 'Escrow cancelado. Listing disponible nuevamente.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing no encontrado' });
    if (listing.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Solo el vendedor puede eliminar este listing' });
    }
    if (listing.status !== 'active') {
      return res.status(400).json({ message: 'Solo se pueden eliminar listings activos' });
    }

    await listing.deleteOne();
    res.json({ message: 'Listing eliminado' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
