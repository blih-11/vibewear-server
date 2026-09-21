import express from 'express';
import Order from '../models/Order.js';

const router = express.Router();

// ── POST /api/payments/verify — public, called right after the Paystack popup
// reports success on the frontend. NEVER trust the frontend alone — this
// re-verifies the transaction server-side with Paystack's secret key before
// marking the order paid, and cross-checks the amount actually charged
// against the order's own total so a tampered/replayed request can't slip a
// smaller charge through as "paid in full". ───────────────────────────────────
router.post('/verify', async (req, res) => {
  try {
    const { reference, orderId } = req.body;
    if (!reference || !orderId) {
      return res.status(400).json({ success: false, message: 'Missing reference or orderId.' });
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      console.error('⚠️  PAYSTACK_SECRET_KEY not set — cannot verify payments.');
      return res.status(500).json({ success: false, message: 'Payments are not configured on the server yet.' });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    // Idempotent: if this order was already confirmed (e.g. the success page
    // reloaded, or the callback fired twice), just return success again
    // rather than re-verifying or erroring.
    if (order.status === 'completed') {
      return res.json({ success: true, order });
    }

    const psRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    const psData = await psRes.json();

    if (!psRes.ok || !psData.status) {
      return res.status(400).json({ success: false, message: psData.message || 'Could not verify payment with Paystack.' });
    }

    const tx = psData.data;
    // order.totalGHS is the server-computed GHS charge amount (order.total is in
    // USD, the store's base currency — see routes/orders.js). Older orders from
    // before this field existed fall back to treating `total` as already-GHS,
    // which was the previous (buggy) behavior, so this stays backward compatible.
    const expectedGHS = order.totalGHS ?? order.total;
    const expectedAmount = Math.round(expectedGHS * 100); // GHS → pesewas (Paystack's smallest unit)

    if (tx.status !== 'success') {
      return res.status(400).json({ success: false, message: `Payment was not successful (status: ${tx.status}).` });
    }
    if (tx.currency !== 'GHS') {
      return res.status(400).json({ success: false, message: 'Unexpected payment currency.' });
    }
    if (tx.amount !== expectedAmount) {
      return res.status(400).json({ success: false, message: 'Payment amount does not match the order total.' });
    }

    order.status = 'completed';
    order.txRef = reference;
    order.transactionId = String(tx.id);
    await order.save();

    res.json({ success: true, order });
  } catch (err) {
    console.error('❌ Payment verification failed:', err);
    res.status(500).json({ success: false, message: 'Something went wrong verifying your payment.' });
  }
});

export default router;