import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import Client from '../models/Client.js';
import Labour from '../models/Labour.js';
import Admin from '../models/Admin.js';
import Job from '../models/Job.js';
import Contact from '../models/Contact.js';
import Review from '../models/Review.js';
import SosAlert from '../models/SosAlert.js';
import Dispute from '../models/Dispute.js';
import Transaction from '../models/Transaction.js';

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
    const clients = await Client.find({}).select('-idFile -avatar').sort({ createdAt: -1 });
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
    const workers = await Labour.find({}).select('-idFile -avatar').sort({ createdAt: -1 });
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
      .populate('client', 'fullName email phone address')
      .populate('hiredWorker', 'fullName occupation rating phone address')
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

// @desc    Reply to a support ticket
// @route   POST /api/admin/contacts/:id/reply
// @access  Private (Admin only)
router.post('/contacts/:id/reply', protect, adminCheck, async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ message: 'Support ticket not found' });
    }
    const { from, to, subject, message } = req.body;
    
    // Simulate sending email: log it to console or record in the DB
    console.log(`[EMAIL SIMULATION] Sending email from ${from} to ${to}:`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${message}`);
    
    res.json({ message: `Email reply successfully dispatched from ${from}!` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// @desc    Get all community reviews
// @route   GET /api/admin/reviews
// @access  Private (Admin only)
router.get('/reviews', protect, adminCheck, async (req, res) => {
  try {
    const reviews = await Review.find({}).select('-avatar').sort({ createdAt: -1 });
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
    const { fullName, email, password, phone, avatar, permissions } = req.body;

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
      plainPassword: password,
      phone,
      avatar: avatar || undefined,
      role: 'admin',
      permissions: (permissions && permissions.length > 0) ? permissions : ['overview', 'clients', 'workers', 'jobs', 'reviews', 'contacts', 'admins'],
    });

    res.status(201).json({
      _id: newAdmin._id,
      fullName: newAdmin.fullName,
      email: newAdmin.email,
      phone: newAdmin.phone,
      avatar: newAdmin.avatar,
      role: 'admin',
      permissions: newAdmin.permissions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update a user's password securely (Administrative Credential Management)
// @route   PUT /api/admin/reset-password
// @access  Private (Admin only)
router.put('/reset-password', protect, adminCheck, async (req, res) => {
  const { userId, role, newPassword } = req.body;

  if (!userId || !role || !newPassword) {
    return res.status(400).json({ message: 'Missing required fields: userId, role, newPassword' });
  }

  try {
    let userModel;
    const normalizedRole = role.toLowerCase();

    if (normalizedRole.includes('client')) {
      userModel = Client;
    } else if (normalizedRole.includes('worker') || normalizedRole.includes('labour')) {
      userModel = Labour;
    } else if (normalizedRole.includes('admin')) {
      userModel = Admin;
    } else {
      return res.status(400).json({ message: `Invalid user role specified: ${role}` });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User account not found' });
    }

    // Set plaintext password, saving will trigger pre('save') middleware to automatically hash
    user.password = newPassword;
    user.plainPassword = newPassword;
    await user.save();

    res.json({ message: `Password for ${user.fullName} updated securely!` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all SOS emergency alerts
// @route   GET /api/admin/sos
// @access  Private (Admin only)
router.get('/sos', protect, adminCheck, async (req, res) => {
  try {
    const alerts = await SosAlert.find({})
      .populate('worker', 'fullName phone occupation tokens')
      .populate({
        path: 'job',
        select: 'title money client',
        populate: {
          path: 'client',
          select: 'fullName phone'
        }
      })
      .sort({ createdAt: -1 });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Verify and resolve SOS alert
// @route   POST /api/admin/sos/:id/verify
// @access  Private (Admin only)
router.post('/sos/:id/verify', protect, adminCheck, async (req, res) => {
  const { status } = req.body;
  if (!['Verified', 'Incorrect'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status. Must be "Verified" or "Incorrect"' });
  }

  try {
    const alert = await SosAlert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ message: 'SOS alert not found' });
    }

    if (alert.status !== 'Pending') {
      return res.status(400).json({ message: 'This SOS alert has already been resolved.' });
    }

    alert.status = status;
    if (status === 'Verified') {
      alert.refundStatus = 'Refunded';
      // Credit tokens to the worker if they claimed refund
      if (alert.claimRefund) {
        const worker = await Labour.findById(alert.worker);
        if (worker) {
          worker.tokens = (worker.tokens || 0) + alert.refundAmount;
          await worker.save();
        }
      }
    } else {
      alert.refundStatus = 'No Refund';
      // Apply Worker Conduct Policy penalty since the SOS claim was false/incorrect
      const worker = await Labour.findById(alert.worker);
      if (worker) {
        const job = await Job.findById(alert.job);
        if (job && !job.travelTimeoutPenalized) {
          job.travelTimeoutPenalized = true;
          await job.save();

          worker.policyViolations = (worker.policyViolations || 0) + 1;
          if (worker.policyViolations === 1) {
            worker.warnings.push(`Warning 1: SOS alert flagged as Incorrect for job "${job.title}". Travel confirmation policy violation.`);
          } else if (worker.policyViolations === 2) {
            worker.walletBalance = Math.max(0, (worker.walletBalance || 0) - 50);
            await Transaction.create({
              userId: worker._id,
              type: 'Incorrect SOS alert penalty',
              amount: 50,
              isCredit: false,
              status: 'Completed',
            });
            worker.warnings.push(`Violation 2: SOS alert flagged as Incorrect for job "${job.title}". ₹50 penalty deducted from wallet.`);
          } else if (worker.policyViolations >= 3) {
            worker.isSuspended = true;
            worker.suspendedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
            worker.warnings.push(`Violation 3: SOS alert flagged as Incorrect for job "${job.title}". Account suspended for 7 days.`);
          }
          await worker.save();
        }
      }
    }

    await alert.save();
    res.json({ message: `SOS emergency alert resolved as ${status}`, alert });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all disputes
// @route   GET /api/admin/disputes
// @access  Private (Admin only)
router.get('/disputes', protect, adminCheck, async (req, res) => {
  try {
    const disputes = await Dispute.find({}).sort({ createdAt: -1 });
    res.json(disputes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Resolve a dispute
// @route   POST /api/admin/disputes/:id/resolve
// @access  Private (Admin only)
router.post('/disputes/:id/resolve', protect, adminCheck, async (req, res) => {
  const { decision } = req.body;
  if (!decision) {
    return res.status(400).json({ message: 'Missing resolution decision' });
  }

  try {
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }

    const decisionLower = decision.toLowerCase();
    
    // 1. Visit compensation approved for client no-show
    if (decisionLower.includes('visit compensation of ₹50 paid to worker')) {
      const job = await Job.findById(dispute.jobId);
      if (job) {
        // Find worker and client
        const worker = await Labour.findById(job.hiredWorker);
        const client = await Client.findById(job.client);
        
        if (worker) {
          worker.walletBalance = (worker.walletBalance || 0) + 50;
          await worker.save();
          
          await Transaction.create({
            userId: worker._id,
            type: 'Client no-show visit compensation',
            amount: 50,
            isCredit: true,
            status: 'Completed',
          });
        }
        if (client) {
          client.walletBalance = Math.max(0, (client.walletBalance || 0) - 50);
          await client.save();

          await Transaction.create({
            userId: client._id,
            type: 'Client no-show visit compensation charge',
            amount: 50,
            isCredit: false,
            status: 'Completed',
          });
        }
        
        job.status = 'Rejected'; // Mark as rejected/cancelled due to no-show
        await job.save();
      }
    }
    // 2. Resolved in favor of Client (Worker penalized)
    else if (decisionLower.includes('resolved in favor of client') || decisionLower.includes('worker penalized')) {
      const job = await Job.findById(dispute.jobId);
      if (job) {
        const worker = await Labour.findById(job.hiredWorker);
        if (worker) {
          // Penalize worker ₹50
          worker.walletBalance = Math.max(0, (worker.walletBalance || 0) - 50);
          worker.policyViolations = (worker.policyViolations || 0) + 1;
          await worker.save();

          await Transaction.create({
            userId: worker._id,
            type: 'Dispute resolution penalty',
            amount: 50,
            isCredit: false,
            status: 'Completed',
          });
        }
        
        job.status = 'Rejected';
        await job.save();
      }
    }
    // 3. Resolved in favor of Worker (Compensation confirmed)
    else if (decisionLower.includes('resolved in favor of worker') || decisionLower.includes('compensation confirmed')) {
      const job = await Job.findById(dispute.jobId);
      if (job) {
        const worker = await Labour.findById(job.hiredWorker);
        const client = await Client.findById(job.client);
        const jobWage = job.money || 0;
        
        if (worker) {
          worker.walletBalance = (worker.walletBalance || 0) + jobWage;
          await worker.save();

          await Transaction.create({
            userId: worker._id,
            type: `Job earnings released: ${job.title}`,
            amount: jobWage,
            isCredit: true,
            status: 'Completed',
          });
        }
        if (client) {
          client.walletBalance = Math.max(0, (client.walletBalance || 0) - jobWage);
          await client.save();

          await Transaction.create({
            userId: client._id,
            type: `Job wage paid: ${job.title}`,
            amount: jobWage,
            isCredit: false,
            status: 'Completed',
          });
        }
        
        job.status = 'Completed';
        await job.save();
      }
    }

    dispute.status = 'Resolved';
    dispute.resolutionDecision = decision;
    await dispute.save();

    // Increment global stateVersion to notify all dashboards to refetch
    global.stateVersion = (global.stateVersion || 0) + 1;

    res.json({ message: 'Dispute successfully resolved', dispute });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete a dispute
// @route   DELETE /api/admin/disputes/:id
// @access  Private (Admin only)
router.delete('/disputes/:id', protect, adminCheck, async (req, res) => {
  try {
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }

    await dispute.deleteOne();
    res.json({ message: 'Dispute record successfully deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

