import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import Client from '../models/Client.js';
import Labour from '../models/Labour.js';
import Admin from '../models/Admin.js';
import Job from '../models/Job.js';
import Contact from '../models/Contact.js';
import Review from '../models/Review.js';

const router = express.Router();

// Middleware to ensure the authenticated user is an administrator
const adminCheck = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Administrative privileges required' });
  }
};

// @desc    Get system dashboard stats
// @route   GET /api/admin/stats
// @access  Private (Admin only)
router.get('/stats', protect, adminCheck, async (req, res) => {
  try {
    const clientsCount = await Client.countDocuments();
    const workersCount = await Labour.countDocuments();
    const jobsCount = await Job.countDocuments();
    const contactsCount = await Contact.countDocuments();
    const reviewsCount = await Review.countDocuments();

    // Calculate total job budgets
    const allJobs = await Job.find({});
    const totalBudget = allJobs.reduce((acc, job) => acc + (job.money || 0), 0);

    res.json({
      clientsCount,
      workersCount,
      jobsCount,
      contactsCount,
      reviewsCount,
      totalBudget,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all registered clients
// @route   GET /api/admin/clients
// @access  Private (Admin only)
router.get('/clients', protect, adminCheck, async (req, res) => {
  try {
    const clients = await Client.find({}).sort({ createdAt: -1 });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete a client profile
// @route   DELETE /api/admin/clients/:id
// @access  Private (Admin only)
router.delete('/clients/:id', protect, adminCheck, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (client) {
      await client.deleteOne();
      res.json({ message: 'Client profile successfully deleted' });
    } else {
      res.status(404).json({ message: 'Client profile not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all registered workers (labours)
// @route   GET /api/admin/workers
// @access  Private (Admin only)
router.get('/workers', protect, adminCheck, async (req, res) => {
  try {
    const workers = await Labour.find({}).sort({ createdAt: -1 });
    res.json(workers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete a worker profile
// @route   DELETE /api/admin/workers/:id
// @access  Private (Admin only)
router.delete('/workers/:id', protect, adminCheck, async (req, res) => {
  try {
    const worker = await Labour.findById(req.params.id);
    if (worker) {
      await worker.deleteOne();
      res.json({ message: 'Worker profile successfully deleted' });
    } else {
      res.status(404).json({ message: 'Worker profile not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all posted job listings
// @route   GET /api/admin/jobs
// @access  Private (Admin only)
router.get('/jobs', protect, adminCheck, async (req, res) => {
  try {
    const jobs = await Job.find({})
      .populate('client', 'fullName email phone address avatar')
      .populate('hiredWorker', 'fullName occupation avatar rating phone address')
      .sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete a job listing
// @route   DELETE /api/admin/jobs/:id
// @access  Private (Admin only)
router.delete('/jobs/:id', protect, adminCheck, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (job) {
      await job.deleteOne();
      res.json({ message: 'Job listing successfully deleted' });
    } else {
      res.status(404).json({ message: 'Job listing not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all support tickets
// @route   GET /api/admin/contacts
// @access  Private (Admin only)
router.get('/contacts', protect, adminCheck, async (req, res) => {
  try {
    const contacts = await Contact.find({}).sort({ createdAt: -1 });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete a support ticket
// @route   DELETE /api/admin/contacts/:id
// @access  Private (Admin only)
router.delete('/contacts/:id', protect, adminCheck, async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (contact) {
      await contact.deleteOne();
      res.json({ message: 'Support ticket successfully removed' });
    } else {
      res.status(404).json({ message: 'Support ticket not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all community reviews
// @route   GET /api/admin/reviews
// @access  Private (Admin only)
router.get('/reviews', protect, adminCheck, async (req, res) => {
  try {
    const reviews = await Review.find({}).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete a community review
// @route   DELETE /api/admin/reviews/:id
// @access  Private (Admin only)
router.delete('/reviews/:id', protect, adminCheck, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (review) {
      await review.deleteOne();
      res.json({ message: 'Review successfully deleted' });
    } else {
      res.status(404).json({ message: 'Review not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all administrative accounts
// @route   GET /api/admin/admins
// @access  Private (Admin only)
router.get('/admins', protect, adminCheck, async (req, res) => {
  try {
    const admins = await Admin.find({}).sort({ createdAt: -1 });
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete an admin account
// @route   DELETE /api/admin/admins/:id
// @access  Private (Admin only)
router.delete('/admins/:id', protect, adminCheck, async (req, res) => {
  try {
    // Prevent self-deletion
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Self-deletion is prohibited' });
    }
    const admin = await Admin.findById(req.params.id);
    if (admin) {
      await admin.deleteOne();
      res.json({ message: 'Admin account successfully deleted' });
    } else {
      res.status(404).json({ message: 'Admin account not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Register a new administrator
// @route   POST /api/admin/admins
// @access  Private (Admin only)
router.post('/admins', protect, adminCheck, async (req, res) => {
  try {
    const { fullName, email, password, phone, avatar } = req.body;

    // Password validation: Strong password required
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!strongPasswordRegex.test(password)) {
      return res.status(400).json({ 
        message: 'Password is too weak. It must be at least 8 characters long, and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&#).' 
      });
    }

    // Check if admin already exists
    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      return res.status(400).json({ message: 'An administrative profile with this email already exists' });
    }

    const newAdmin = await Admin.create({
      fullName,
      email,
      password,
      phone,
      avatar: avatar || undefined,
      role: 'admin',
    });

    res.status(201).json({
      _id: newAdmin._id,
      fullName: newAdmin.fullName,
      email: newAdmin.email,
      phone: newAdmin.phone,
      avatar: newAdmin.avatar,
      role: 'admin',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
