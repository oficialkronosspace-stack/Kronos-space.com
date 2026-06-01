const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getEvents, getMyEvents, getEvent, createEvent, updateEvent, cancelEvent,
  buyTicket, getMyTicket, getMyTickets, checkIn, getAttendees,
  ticketWebhookHandler,
} = require('../controllers/eventController');

// Públicas
router.get('/',           getEvents);
router.get('/:id',        getEvent);

// Protegidas
router.use(protect);
router.get('/user/my',          getMyEvents);
router.get('/user/my-tickets',  getMyTickets);
router.post('/',                createEvent);
router.put('/:id',              updateEvent);
router.delete('/:id',           cancelEvent);
router.post('/:id/buy-ticket',  buyTicket);
router.get('/:id/my-ticket',    getMyTicket);
router.post('/:id/checkin/:qr', checkIn);
router.get('/:id/attendees',    getAttendees);

module.exports = router;
module.exports.ticketWebhookHandler = ticketWebhookHandler;
