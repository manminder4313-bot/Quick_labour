import express from 'express';
import Review from '../models/Review.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Get all reviews
// @route   GET /api/reviews
// @access  Public
router.get('/', async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    const optimizedReviews = reviews.map(r => {
      if (r.avatar && r.avatar.startsWith('data:image')) {
        const doc = r.toObject();
        doc.avatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
        return doc;
      }
      return r;
    });
    res.json(optimizedReviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create a review
// @route   POST /api/reviews
// @access  Private
router.post('/', protect, async (req, res) => {
  const { text, rating, workerType } = req.body;

  try {
    const sub = `${req.user.role === 'worker' ? 'Worker' : 'Client'}, ${req.user.address}`;
    const review = new Review({
      name: req.user.fullName,
      sub,
      text,
      avatar: req.user.avatar,
      rating: Number(rating),
      workerType,
    });

    const createdReview = await review.save();
    res.status(201).json(createdReview);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
