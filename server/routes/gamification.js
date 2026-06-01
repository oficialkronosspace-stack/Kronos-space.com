const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getMyStats, addXp, getLeaderboard, getAllBadges, getUserStats, recordLoginStreak,
} = require('../controllers/gamificationController');

router.get('/leaderboard',       protect, getLeaderboard);
router.get('/badges',            protect, getAllBadges);
router.get('/user/:userId',      getUserStats);
router.get('/',                  protect, getMyStats);
router.post('/add-xp',           protect, addXp);
router.post('/login-streak',     protect, recordLoginStreak);

module.exports = router;
