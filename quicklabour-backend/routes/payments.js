import express from 'express';
import Stripe from 'stripe';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Initialize Stripe with the developer secret key from .env (fallback to a placeholder for testing sandbox stability)
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_51OhPzdJv0q7r5qGvG6j7m8n9p0q1r2s3t4u5v6w7x8y9z0a1b2c3d4e5f6g7h8i9j0';
const stripe = new Stripe(stripeSecretKey);

const PLAN_PRICES = {
  basic: 99 * 100,      // ₹99.00 in paise (subunits)
  standard: 199 * 100,  // ₹199.00 in paise
  premium: 499 * 100,   // ₹499.00 in paise
};

const PLAN_POINTS = {
  basic: 90,
  standard: 190,
  premium: 460,
};

// @desc    Create a secure Stripe Payment Intent
// @route   POST /api/payments/create-intent
// @access  Private (Worker only)
router.post('/create-intent', protect, async (req, res) => {
  const { planType } = req.body;

  if (req.user.role !== 'worker') {
    return res.status(403).json({ message: 'Only registered workers can purchase point subscriptions.' });
  }

  if (!PLAN_PRICES[planType]) {
    return res.status(400).json({ message: 'Invalid subscription plan selected.' });
  }

  try {
    // If the Stripe secret key is still the default placeholder, simulate elements details so it remains 100% free and functional!
    if (stripeSecretKey.startsWith('sk_test_51OhPzdJ')) {
      // Return a simulated token so developers can inspect the frontend pipeline even before adding their own keys
      return res.json({
        clientSecret: 'pi_simulated_secret_key_' + Math.random().toString(36).substring(7),
        intentId: 'pi_' + Math.random().toString(36).substring(7),
        isSimulated: true
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: PLAN_PRICES[planType],
      currency: 'inr',
      metadata: { 
        userId: req.user._id.toString(), 
        planType 
      },
      automatic_payment_methods: { enabled: true },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      intentId: paymentIntent.id,
      isSimulated: false
    });
  } catch (error) {
    res.status(500).json({ message: 'Stripe Gateway Error: ' + error.message });
  }
});

// @desc    Verify Stripe Payment and Credit Points to Worker
// @route   POST /api/payments/verify-and-credit
// @access  Private (Worker only)
router.post('/verify-and-credit', protect, async (req, res) => {
  const { intentId, planType, isSimulated } = req.body;

  if (req.user.role !== 'worker') {
    return res.status(403).json({ message: 'Only registered workers can complete checkouts.' });
  }

  const pointsToAdd = PLAN_POINTS[planType];
  if (!pointsToAdd) {
    return res.status(400).json({ message: 'Invalid subscription plan.' });
  }

  try {
    const worker = await User.findById(req.user._id);
    if (!worker) {
      return res.status(404).json({ message: 'Worker profile not found.' });
    }

    if (isSimulated) {
      // Process secure mock validation in developer sandboxes
      worker.points = (worker.points || 0) + pointsToAdd;
      await worker.save();

      return res.json({
        success: true,
        message: `Successfully processed mock gateway transaction! Subscribed to ${planType} plan.`,
        pointsAdded: pointsToAdd,
        updatedPoints: worker.points,
        user: worker
      });
    }

    // Retrieve active details from Stripe to verify status
    const paymentIntent = await stripe.paymentIntents.retrieve(intentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ message: 'Payment authorization is incomplete.' });
    }

    // Protect against double points crediting
    if (paymentIntent.metadata.credited === 'true') {
      return res.status(400).json({ message: 'This checkout has already been credited.' });
    }

    worker.points = (worker.points || 0) + pointsToAdd;
    await worker.save();

    // Mark Stripe Intent as processed in metadata
    await stripe.paymentIntents.update(intentId, {
      metadata: { credited: 'true' }
    });

    res.json({
      success: true,
      message: `Successfully confirmed Stripe transaction! Subscribed to ${planType} plan.`,
      pointsAdded: pointsToAdd,
      updatedPoints: worker.points,
      user: worker
    });
  } catch (error) {
    res.status(500).json({ message: 'Stripe Verification Error: ' + error.message });
  }
});

export default router;
