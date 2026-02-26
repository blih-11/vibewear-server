import express from 'express';
import Activity from '../models/Activity.js';

const router = express.Router();

// ── POST track user activity ──────────────────────────────────────────────────
router.post('/track', async (req, res) => {
  try {
    const { uid, email, name } = req.body;
    if (!uid) return res.status(400).json({ success: false, message: 'uid required' });

    const today = new Date().toISOString().slice(0, 10);

    await Activity.findOneAndUpdate(
      { uid, date: today },
      { uid, email: email || '', name: name || (uid.startsWith('guest_') ? 'Guest' : ''), date: today },
      { upsert: true, new: true }
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET analytics summary ─────────────────────────────────────────────────────
router.get('/summary', async (req, res) => {
  try {
    const totalUsers = await Activity.distinct('uid').then(r => r.length);

    const today = new Date().toISOString().slice(0, 10);
    const todayActive = await Activity.countDocuments({ date: today });

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

    const newSignupsRaw = await Activity.aggregate([
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

    const recentUsers = await Activity.find({ date: today })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('uid email name date createdAt');

    res.json({ success: true, totalUsers, todayActive, daily, newSignups, recentUsers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

// ── GET full user history (paginated, filterable) ─────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const page     = Math.max(1, parseInt(req.query.page)  || 1);
    const limit    = Math.min(100, parseInt(req.query.limit) || 30);
    const search   = req.query.search?.trim() || '';
    const dateFrom = req.query.from || '';
    const dateTo   = req.query.to   || '';
    const type     = req.query.type || 'all'; // 'all' | 'registered' | 'guest'

    // Build match filter
    const match = {};
    if (dateFrom || dateTo) {
      match.date = {};
      if (dateFrom) match.date.$gte = dateFrom;
      if (dateTo)   match.date.$lte = dateTo;
    }
    if (type === 'registered') match.uid = { $not: /^guest_/ };
    if (type === 'guest')      match.uid = /^guest_/;
    if (search) {
      match.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name:  { $regex: search, $options: 'i' } },
        { uid:   { $regex: search, $options: 'i' } },
      ];
    }

    // Get unique users with their visit history
    const pipeline = [
      { $match: match },
      { $sort: { date: -1 } },
      {
        $group: {
          _id: '$uid',
          uid:       { $first: '$uid' },
          email:     { $first: '$email' },
          name:      { $first: '$name' },
          firstSeen: { $min: '$date' },
          lastSeen:  { $max: '$date' },
          visitDates:{ $push: '$date' },
          totalVisits:{ $sum: 1 },
        }
      },
      { $sort: { lastSeen: -1 } },
    ];

    const allUsers = await Activity.aggregate(pipeline);
    const total = allUsers.length;
    const users = allUsers.slice((page - 1) * limit, page * limit);

    res.json({
      success: true,
      users,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET single user visit history ─────────────────────────────────────────────
router.get('/users/:uid', async (req, res) => {
  try {
    const visits = await Activity.find({ uid: req.params.uid })
      .sort({ date: -1 })
      .select('date createdAt');
    
    const user = visits[0] ? await Activity.findOne({ uid: req.params.uid }).select('uid email name') : null;

    res.json({ success: true, user, visits });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
