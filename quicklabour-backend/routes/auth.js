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

    // Safeguard: Crop excessively large base64 strings to prevent database bloating (allow up to 10MB)
    let safeAvatar = avatar;
    if (avatar && avatar.startsWith('data:') && avatar.length > 10000000) {
      safeAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random&color=fff&size=150`;
    }

    let safeIdFile = idFile;
    if (idFile && idFile.length > 50000) {
      safeIdFile = idFile.substring(0, 1000) + '...[truncated for performance]';
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
      avatar: safeAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random&color=fff&size=150`,
      idType: idType || 'Aadhaar',
      idFile: safeIdFile || '',
      isOnline: true,
      skills: role === 'worker' ? [occupation] : [],
      walletBalance: role === 'worker' ? 0 : 500,
      points: role === 'worker' ? 20 : 0,
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
        acceptedJobsCount: user.acceptedJobsCount,
        points: user.points,
        walletBalance: user.walletBalance !== undefined ? user.walletBalance : 0,
        token: generateToken(user._id),
        permissions: user.role === 'admin' 
          ? (user.permissions && user.permissions.length > 0 
              ? user.permissions 
              : (user.email === 'admin' 
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
  const { email, password, role } = req.body;

  try {
    const baseQuery = {
      $or: [
        { email: email },
        { phone: email }
      ]
    };

    let user;
    if (role) {
      user = await User.findOne({ ...baseQuery, role });
    }

    if (!user) {
      user = await User.findOne(baseQuery);
    }

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
        acceptedJobsCount: user.acceptedJobsCount,
        points: user.points,
        walletBalance: user.walletBalance !== undefined ? user.walletBalance : 0,
        token: generateToken(user._id),
        permissions: user.role === 'admin' 
          ? (user.permissions && user.permissions.length > 0 
              ? user.permissions 
              : (user.email === 'admin' 
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
    if (req.query.lite === 'true') {
      const user = await User.findById(req.user._id).select('walletBalance points acceptedJobsCount jobsCompleted rating role');
      if (user) {
        return res.json({
          _id: user._id,
          role: user.role,
          walletBalance: user.walletBalance !== undefined ? user.walletBalance : 0,
          points: user.points !== undefined ? user.points : 0,
          acceptedJobsCount: user.acceptedJobsCount !== undefined ? user.acceptedJobsCount : 0,
          jobsCompleted: user.jobsCompleted !== undefined ? user.jobsCompleted : 0,
          rating: user.rating !== undefined ? user.rating : 4.9,
        });
      } else {
        return res.status(404).json({ message: 'User not found' });
      }
    }

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
        acceptedJobsCount: user.acceptedJobsCount,
        points: user.points,
        walletBalance: user.walletBalance !== undefined ? user.walletBalance : 0,
        skills: user.skills,
        permissions: user.role === 'admin' 
          ? (user.permissions && user.permissions.length > 0 
              ? user.permissions 
              : (user.email === 'admin' 
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

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.fullName = req.body.fullName || user.fullName;
      user.phone = req.body.phone || user.phone;
      user.address = req.body.address || user.address;
      
      if (req.body.avatar) {
        let safeAvatar = req.body.avatar;
        if (safeAvatar.startsWith('data:') && safeAvatar.length > 10000000) {
          safeAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=random&color=fff&size=150`;
        }
        user.avatar = safeAvatar;
      }
      
      if (req.body.idFile) {
        let safeIdFile = req.body.idFile;
        if (safeIdFile.length > 50000) {
          safeIdFile = safeIdFile.substring(0, 1000) + '...[truncated for performance]';
        }
        user.idFile = safeIdFile;
      }

      if (req.body.latitude !== undefined) user.latitude = req.body.latitude;
      if (req.body.longitude !== undefined) user.longitude = req.body.longitude;
      
      if ((user.role === 'worker' || user.occupation !== undefined) && req.body.occupation) {
        user.occupation = req.body.occupation;
        user.skills = [req.body.occupation];
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        role: updatedUser.role,
        occupation: updatedUser.occupation,
        avatar: updatedUser.avatar,
        latitude: updatedUser.latitude,
        longitude: updatedUser.longitude,
        isOnline: updatedUser.isOnline,
        rating: updatedUser.rating,
        jobsCompleted: updatedUser.jobsCompleted,
        acceptedJobsCount: updatedUser.acceptedJobsCount,
        points: updatedUser.points,
        walletBalance: updatedUser.walletBalance !== undefined ? updatedUser.walletBalance : 0,
        skills: updatedUser.skills
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

// @desc    Purchase a subscription plan to add points
// @route   POST /api/auth/subscribe
// @access  Private (Worker only)
router.post('/subscribe', protect, async (req, res) => {
  const { planType } = req.body;

  if (req.user.role !== 'worker') {
    return res.status(400).json({ message: 'Only workers can purchase subscriptions' });
  }

  let pointsToAdd = 0;
  let price = 0;
  let gst = 0;
  let total = 0;

  if (planType === 'basic') {
    price = 100;
    pointsToAdd = 90;
  } else if (planType === 'standard') {
    price = 200;
    pointsToAdd = 190;
  } else if (planType === 'premium') {
    price = 500;
    pointsToAdd = 460;
  } else {
    return res.status(400).json({ message: 'Invalid subscription plan type' });
  }

  gst = price * 0.05; // 5% GST
  total = price + gst;

  try {
    const worker = await User.findById(req.user._id);
    if (!worker) {
      return res.status(404).json({ message: 'Worker profile not found' });
    }

    worker.points = (worker.points || 0) + pointsToAdd;
    await worker.save();

    // Automatically add subscription money to Admin wallet
    const admin = await User.findOne({ role: 'admin' });
    if (admin) {
      admin.walletBalance = (admin.walletBalance || 0) + total;
      await admin.save();
    }

    res.json({
      message: `Successfully purchased ${planType} plan!`,
      planType,
      price,
      gst,
      total,
      pointsAdded: pointsToAdd,
      updatedPoints: worker.points,
      user: {
        _id: worker._id,
        fullName: worker.fullName,
        email: worker.email,
        phone: worker.phone,
        address: worker.address,
        role: worker.role,
        occupation: worker.occupation,
        avatar: worker.avatar,
        latitude: worker.latitude,
        longitude: worker.longitude,
        isOnline: worker.isOnline,
        rating: worker.rating,
        jobsCompleted: worker.jobsCompleted,
        acceptedJobsCount: worker.acceptedJobsCount,
        points: worker.points,
        walletBalance: worker.walletBalance !== undefined ? worker.walletBalance : 0,
        skills: worker.skills,
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Add money to wallet
// @route   POST /api/auth/wallet/add
// @access  Private
router.post('/wallet/add', protect, async (req, res) => {
  const { amount, method } = req.body;

  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({ message: 'Invalid amount specified' });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.walletBalance = (user.walletBalance || 0) + Number(amount);
    await user.save();

    res.json({
      message: `Successfully added ₹${amount} to your wallet via ${method.toUpperCase()}!`,
      walletBalance: user.walletBalance,
      user: {
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
        acceptedJobsCount: user.acceptedJobsCount,
        points: user.points,
        walletBalance: user.walletBalance,
        skills: user.skills
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Request withdrawal OTP
// @route   POST /api/auth/wallet/withdraw-otp
// @access  Private
router.post('/wallet/withdraw-otp', protect, async (req, res) => {
  const { amount } = req.body;

  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({ message: 'Invalid amount specified' });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if ((user.walletBalance || 0) < Number(amount)) {
      return res.status(400).json({ message: 'Insufficient wallet balance for withdrawal' });
    }

    // Generate a random 4 digit OTP code
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Store in User document
    user.withdrawalOtp = otp;
    user.withdrawalOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    console.log(`[WITHDRAWAL OTP] Sent OTP ${otp} to phone number ${user.phone} for withdrawal of ₹${amount}`);

    res.json({
      success: true,
      message: `Simulated SMS sent to ${user.phone}. Please enter the OTP to confirm withdrawal.`,
      otp, // Sending OTP back in response for demonstration in frontend
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Withdraw money from wallet
// @route   POST /api/auth/wallet/withdraw
// @access  Private
router.post('/wallet/withdraw', protect, async (req, res) => {
  const { amount, otp } = req.body;

  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({ message: 'Invalid amount specified' });
  }

  if (!otp) {
    return res.status(400).json({ message: 'Verification OTP is required' });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if ((user.walletBalance || 0) < Number(amount)) {
      return res.status(400).json({ message: 'Insufficient wallet balance for withdrawal' });
    }

    if (!user.withdrawalOtp || user.withdrawalOtp !== otp) {
      return res.status(400).json({ message: 'Invalid verification OTP' });
    }

    if (user.withdrawalOtpExpires && new Date(user.withdrawalOtpExpires).getTime() < Date.now()) {
      return res.status(400).json({ message: 'Verification OTP has expired' });
    }

    // Clear OTP fields
    user.withdrawalOtp = null;
    user.withdrawalOtpExpires = null;

    user.walletBalance = (user.walletBalance || 0) - Number(amount);
    await user.save();

    res.json({
      success: true,
      message: `Successfully withdrew ₹${amount} from your wallet!`,
      walletBalance: user.walletBalance,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Transfer money from client to worker (Pay Labour Fee via QR)
// @route   POST /api/auth/wallet/transfer
// @access  Private (Client only)
router.post('/wallet/transfer', protect, async (req, res) => {
  const { workerId, amount } = req.body;

  if (!workerId) {
    return res.status(400).json({ message: 'Worker ID is required' });
  }
  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({ message: 'Invalid amount specified' });
  }

  try {
    const client = await User.findById(req.user._id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    if (client.role !== 'client') {
      return res.status(403).json({ message: 'Only clients can transfer wallet balances.' });
    }

    if ((client.walletBalance || 0) < Number(amount)) {
      return res.status(400).json({ message: 'Insufficient wallet balance. Please add money to your wallet first.' });
    }

    const worker = await User.findById(workerId);
    if (!worker) {
      return res.status(404).json({ message: 'Labour / Worker profile not found.' });
    }
    if (worker.role !== 'worker') {
      return res.status(400).json({ message: 'Recipient is not a worker profile.' });
    }

    // Process Transfer
    client.walletBalance = (client.walletBalance || 0) - Number(amount);
    worker.walletBalance = (worker.walletBalance || 0) + Number(amount);

    await client.save();
    await worker.save();

    res.json({
      success: true,
      message: `Successfully paid ₹${amount} to ${worker.fullName}!`,
      walletBalance: client.walletBalance,
      clientWalletBalance: client.walletBalance,
      workerName: worker.fullName
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Recharge points using wallet balance
// @route   POST /api/auth/recharge-points-wallet
// @access  Private (Worker only)
router.post('/recharge-points-wallet', protect, async (req, res) => {
  const { planType } = req.body;

  if (req.user.role !== 'worker') {
    return res.status(403).json({ message: 'Only workers can recharge points.' });
  }

  const prices = {
    basic: 99,
    standard: 199,
    premium: 499,
  };

  const pointsToAdd = {
    basic: 90,
    standard: 190,
    premium: 460,
  };

  const cost = prices[planType];
  const points = pointsToAdd[planType];

  if (!cost) {
    return res.status(400).json({ message: 'Invalid points plan type selected' });
  }

  try {
    const worker = await User.findById(req.user._id);
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }

    if ((worker.walletBalance || 0) < cost) {
      return res.status(400).json({ message: 'Insufficient wallet balance. Please add money to your wallet first.' });
    }

    worker.walletBalance = (worker.walletBalance || 0) - cost;
    worker.points = (worker.points || 0) + points;
    await worker.save();

    // Automatically add recharge money to Admin wallet
    const admin = await User.findOne({ role: 'admin' });
    if (admin) {
      admin.walletBalance = (admin.walletBalance || 0) + cost;
      await admin.save();
    }

    res.json({
      success: true,
      message: `Successfully recharged ${planType} plan! Added ${points} points.`,
      walletBalance: worker.walletBalance,
      updatedPoints: worker.points,
      user: {
        _id: worker._id,
        fullName: worker.fullName,
        email: worker.email,
        phone: worker.phone,
        address: worker.address,
        role: worker.role,
        occupation: worker.occupation,
        avatar: worker.avatar,
        latitude: worker.latitude,
        longitude: worker.longitude,
        isOnline: worker.isOnline,
        rating: worker.rating,
        acceptedJobsCount: worker.acceptedJobsCount,
        points: worker.points,
        walletBalance: worker.walletBalance,
        skills: worker.skills
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
