import express from 'express';
import Activity from '../models/Activity.js';

const router = express.Router();

// ── POST track user activity (call on login / page load) ─────────────────────
router.post('/track', async (req, res) => {
  try {
    const { uid, email, name } = req.body;
    if (!uid) return res.status(400).json({ success: false, message: 'uid required' });

    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // upsert: one record per user per day
    await Activity.findOneAndUpdate(
      { uid, date: today },
      { uid, email, name, date: today },
      { upsert: true, new: true }
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET analytics summary ────────────────────────────────────────────────────
router.get('/summary', async (req, res) => {
  try {
    // Total unique users ever
    const totalUsers = await Activity.distinct('uid').then(r => r.length);

    // Today's active users
    const today = new Date().toISOString().slice(0, 10);
    const todayActive = await Activity.countDocuments({ date: today });

    // Daily active users — last 14 days
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }

    const dailyRaw = await Activity.aggregate([
      { $match: { date: { $in: days } } },
      { $group: { _id: '$date', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const dailyMap = Object.fromEntries(dailyRaw.map(r => [r._id, r.count]));
    const daily = days.map(date => ({
      date,
      label: new Date(date + 'T12:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      count: dailyMap[date] || 0,
    }));

    // New signups per day (first ever appearance of uid per day)
    const newSignupsRaw = await Activity.aggregate([
      // Get each uid's first date
      { $sort: { date: 1 } },
      { $group: { _id: '$uid', firstDate: { $first: '$date' } } },
      { $match: { firstDate: { $in: days } } },
      { $group: { _id: '$firstDate', count: { $sum: 1 } } },
    ]);
    const signupsMap = Object.fromEntries(newSignupsRaw.map(r => [r._id, r.count]));
    const newSignups = days.map(date => ({
      date,
      label: new Date(date + 'T12:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      count: signupsMap[date] || 0,
    }));

    // Recent active users list
    const recentUsers = await Activity.find({ date: today })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('uid email name date createdAt');

    res.json({
      success: true,
      totalUsers,
      todayActive,
      daily,
      newSignups,
      recentUsers,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
