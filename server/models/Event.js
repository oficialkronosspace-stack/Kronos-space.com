const mongoose = require('mongoose');
const crypto = require('crypto');

// ── Tipos de boleto dentro de un evento ──
const ticketTypeSchema = new mongoose.Schema({
  name:        { type: String, required: true },        // 'VIP', 'General', 'Estudiante'
  price:       { type: Number, required: true, min: 0 },
  quantity:    { type: Number, required: true, min: 1 },
  sold:        { type: Number, default: 0 },
  description: { type: String, default: '' },
}, { _id: true });

// ── Evento principal ──
const eventSchema = new mongoose.Schema({
  organizer:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  category:    { type: String, enum: ['música','deporte','arte','tecnología','gastronomía','educación','otro'], default: 'otro' },
  type:        { type: String, enum: ['physical','online','hybrid'], default: 'physical' },
  location:    { type: String, default: '' },
  onlineLink:  { type: String, default: '' },
  coverImage:  { type: String, default: '' },
  startDate:   { type: Date, required: true },
  endDate:     { type: Date },
  ticketTypes: [ticketTypeSchema],
  status:      { type: String, enum: ['draft','published','cancelled','finished'], default: 'draft' },
  featured:    { type: Boolean, default: false },
  views:       { type: Number, default: 0 },
}, { timestamps: true });

eventSchema.index({ startDate: 1 });
eventSchema.index({ organizer: 1 });
eventSchema.index({ status: 1 });

// ── Boleto individual ──
const ticketSchema = new mongoose.Schema({
  event:       { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  ticketType:  { type: mongoose.Schema.Types.ObjectId, required: true },
  owner:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  qrCode:      { type: String, unique: true },           // token único para el QR
  checkedIn:   { type: Boolean, default: false },
  checkedInAt: { type: Date },
  checkedInBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  price:       { type: Number, required: true },
  status:      { type: String, enum: ['active','used','cancelled','refunded'], default: 'active' },
}, { timestamps: true });

// Genera el código QR único antes de guardar
ticketSchema.pre('save', function (next) {
  if (!this.qrCode) {
    this.qrCode = crypto.randomBytes(20).toString('hex');
  }
  next();
});

ticketSchema.index({ owner: 1 });
ticketSchema.index({ event: 1 });
ticketSchema.index({ qrCode: 1 }, { unique: true });

const Event  = mongoose.model('Event',  eventSchema);
const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = { Event, Ticket };
