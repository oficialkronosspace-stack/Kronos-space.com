const HealthLog = require('../models/HealthLog');
const User = require('../models/User');
const { addXpInternal } = require('./gamificationController');

// Returns a Date at midnight (UTC) for a given date
function startOfDay(d) {
  const dt = new Date(d);
  dt.setUTCHours(0, 0, 0, 0);
  return dt;
}

function endOfDay(d) {
  const dt = new Date(d);
  dt.setUTCHours(23, 59, 59, 999);
  return dt;
}

// GET /api/health/today
exports.getTodayLog = async (req, res) => {
  try {
    const today = new Date();
    let log = await HealthLog.findOne({
      user: req.user._id,
      date: { $gte: startOfDay(today), $lte: endOfDay(today) }
    });

    if (!log) {
      log = await HealthLog.create({
        user: req.user._id,
        date: today
      });
    }

    res.json({ success: true, data: log });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/health/log
exports.upsertLog = async (req, res) => {
  try {
    const { steps, calories, waterGlasses, workoutMinutes, mood, notes } = req.body;
    const today = new Date();

    let log = await HealthLog.findOne({
      user: req.user._id,
      date: { $gte: startOfDay(today), $lte: endOfDay(today) }
    });

    const hadEarnedTokens = log ? log.tokensEarned > 0 : false;
    const newSteps = steps !== undefined ? Number(steps) : (log ? log.steps : 0);
    const earnTokens = newSteps >= 10000 && !hadEarnedTokens;

    const updateData = {
      user: req.user._id,
      date: today,
      steps: newSteps,
      calories: calories !== undefined ? Number(calories) : (log ? log.calories : 0),
      waterGlasses: waterGlasses !== undefined ? Number(waterGlasses) : (log ? log.waterGlasses : 0),
      workoutMinutes: workoutMinutes !== undefined ? Number(workoutMinutes) : (log ? log.workoutMinutes : 0),
      mood: mood || (log ? log.mood : 'okay'),
      notes: notes !== undefined ? notes : (log ? log.notes : ''),
      tokensEarned: earnTokens ? 10 : (log ? log.tokensEarned : 0)
    };

    log = await HealthLog.findOneAndUpdate(
      {
        user: req.user._id,
        date: { $gte: startOfDay(today), $lte: endOfDay(today) }
      },
      updateData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Acreditar tokens al wallet del usuario y otorgar XP en gamificación
    if (earnTokens) {
      await User.findByIdAndUpdate(req.user._id, { $inc: { kronosTokens: 10 } });
      // addXpInternal también actualiza la racha de salud (health_logged)
      await addXpInternal(req.user._id, 50, 'health_logged');
    }

    res.json({ success: true, data: log, tokensAwarded: earnTokens ? 10 : 0 });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/health/history?days=7
exports.getHistory = async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 7, 90);
    const since = new Date();
    since.setDate(since.getDate() - days);

    const logs = await HealthLog.find({
      user: req.user._id,
      date: { $gte: startOfDay(since) }
    }).sort({ date: 1 }).lean();

    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/health/stats
exports.getStats = async (req, res) => {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const logs = await HealthLog.find({
      user: req.user._id,
      date: { $gte: startOfDay(since) }
    }).lean();

    const totalSteps = logs.reduce((s, l) => s + (l.steps || 0), 0);
    const totalCalories = logs.reduce((s, l) => s + (l.calories || 0), 0);
    const totalWorkoutMinutes = logs.reduce((s, l) => s + (l.workoutMinutes || 0), 0);
    const totalWater = logs.reduce((s, l) => s + (l.waterGlasses || 0), 0);
    const totalTokens = logs.reduce((s, l) => s + (l.tokensEarned || 0), 0);
    const activeDays = logs.filter(l => (l.steps || 0) > 0).length;

    res.json({
      success: true,
      data: { totalSteps, totalCalories, totalWorkoutMinutes, totalWater, totalTokens, activeDays, periodDays: 30 }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
