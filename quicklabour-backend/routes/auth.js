import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Helper to generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'quicklabour_secret_key_12345', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  const { fullName, email, password, phone, address, latitude, longitude, role, occupation, avatar, idType, idFile } = req.body;

  try {
    // Password validation: Strong password required
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!strongPasswordRegex.test(password)) {
      return res.status(400).json({ 
        message: 'Password is too weak. It must be at least 8 characters long, and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&#).' 
      });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const user = await User.create({
      fullName,
      email,
      password,
      plainPassword: password,
      phone,
      address,
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
      role,
      occupation: role === 'worker' ? occupation : '',
      avatar: avatar || undefined,
      idType: idType || 'Aadhaar',
      idFile: idFile || '',
      isOnline: true,
      skills: role === 'worker' ? [occupation] : [],
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        occupation: user.occupation,
        avatar: user.avatar,
        latitude: user.latitude,
        longitude: user.longitude,
        isOnline: user.isOnline,
        rating: user.rating,
        token: generateToken(user._id),
        permissions: user.role === 'admin' 
          ? (user.permissions && user.permissions.length > 0 
              ? user.permissions 
              : (user.email === 'admin@quicklabour.com' 
                  ? ['overview', 'clients', 'workers', 'jobs', 'reviews', 'contacts', 'admins']
                  : ['overview', 'clients', 'workers', 'jobs', 'reviews', 'contacts']))
          : [],
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({
      $or: [
        { email: email },
        { phone: email }
      ]
    });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        occupation: user.occupation,
        avatar: user.avatar,
        latitude: user.latitude,
        longitude: user.longitude,
        isOnline: user.isOnline,
        rating: user.rating,
        token: generateToken(user._id),
        permissions: user.role === 'admin' 
          ? (user.permissions && user.permissions.length > 0 
              ? user.permissions 
              : (user.email === 'admin@quicklabour.com' 
                  ? ['overview', 'clients', 'workers', 'jobs', 'reviews', 'contacts', 'admins']
                  : ['overview', 'clients', 'workers', 'jobs', 'reviews', 'contacts']))
          : [],
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        occupation: user.occupation,
        avatar: user.avatar,
        latitude: user.latitude,
        longitude: user.longitude,
        isOnline: user.isOnline,
        rating: user.rating,
        jobsCompleted: user.jobsCompleted,
        skills: user.skills,
        permissions: user.role === 'admin' 
          ? (user.permissions && user.permissions.length > 0 
              ? user.permissions 
              : (user.email === 'admin@quicklabour.com' 
                  ? ['overview', 'clients', 'workers', 'jobs', 'reviews', 'contacts', 'admins']
                  : ['overview', 'clients', 'workers', 'jobs', 'reviews', 'contacts']))
          : [],
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Toggle Worker Online Status
// @route   PUT /api/auth/status
// @access  Private
router.put('/status', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user && user.role === 'worker') {
      user.isOnline = req.body.isOnline !== undefined ? req.body.isOnline : !user.isOnline;
      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        isOnline: updatedUser.isOnline,
      });
    } else {
      res.status(404).json({ message: 'Worker profile not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all active workers / filter by occupation
// @route   GET /api/auth/workers
// @access  Public
router.get('/workers', async (req, res) => {
  const { occupation } = req.query;
  try {
    let query = { role: 'worker' };
    if (occupation) {
      query.occupation = new RegExp(occupation, 'i');
    }
    const workers = await User.find(query).select('-password');
    res.json(workers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
