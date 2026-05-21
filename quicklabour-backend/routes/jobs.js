import express from 'express';
import Job from '../models/Job.js';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';
import Message from '../models/Message.js';

const router = express.Router();

// @desc    Create a new job request
// @route   POST /api/jobs
// @access  Private (Client only)
router.post('/', protect, async (req, res) => {
  const { name, location, fullAddress, latitude, longitude, repair, money } = req.body;

  try {
    const title = `${repair} Request at ${location}`;
    const job = new Job({
      client: req.user._id,
      name: name || req.user.fullName,
      title,
      location,
      fullAddress: fullAddress || '',
      latitude: latitude || null,
      longitude: longitude || null,
      repair,
      money: Number(money),
      status: 'Waiting...',
    });

    // To make the client dashboard super dynamic, let's look for workers of this specialty
    // in the database and pre-populate bidders if any exist. If not, we generate dynamic mock ones!
    const matchingWorkers = await User.find({
      role: 'worker',
      occupation: new RegExp(repair.split(' ')[0], 'i'), // match "Plumbing" -> "Plumber"
    });

    if (matchingWorkers.length > 0) {
      job.bidders = matchingWorkers.slice(0, 3).map((w) => ({
        worker: w._id,
        rate: `₹${Math.round(w.rating * 150)}/day`,
      }));
    } else {
      // Fallback mock workers from standard profiles
      const fallbackWorkers = await User.find({ role: 'worker' }).limit(2);
      job.bidders = fallbackWorkers.map((w, idx) => ({
        worker: w._id,
        rate: `₹${(idx + 1) * 350 + 200}/day`,
      }));
    }

    const createdJob = await job.save();
    res.status(201).json(createdJob);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all jobs (Client's posted jobs or Worker's matching jobs)
// @route   GET /api/jobs
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    if (req.user.role === 'client') {
      // Clients see jobs they posted, populated with bidders' details
      const jobs = await Job.find({ client: req.user._id })
        .populate('hiredWorker', 'fullName occupation avatar rating phone address')
        .populate('bidders.worker', 'fullName occupation avatar rating phone address jobsCompleted');
      res.json(jobs);
    } else if (req.user.role === 'worker') {
      // Workers see jobs matching their specialty, or jobs they are hired for
      // First, get jobs they are explicitly hired for
      const hiredJobs = await Job.find({ hiredWorker: req.user._id })
        .populate('client', 'fullName email phone address avatar');

      // Second, get "Waiting..." jobs that match their occupation (or all jobs if no specific matches)
      const keyword = req.user.occupation ? req.user.occupation.split(' ')[0] : '';
      let query = { status: 'Waiting...' };
      
      // Look for jobs matching worker category
      if (keyword) {
        query.repair = new RegExp(keyword, 'i');
      }

      const availableJobs = await Job.find(query)
        .populate('client', 'fullName email phone address avatar');

      res.json({
        hiredJobs,
        availableJobs,
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Hire a worker for a job
// @route   PUT /api/jobs/:id/hire
// @access  Private (Client only)
router.put('/:id/hire', protect, async (req, res) => {
  const { workerId, rate } = req.body;

  try {
    const job = await Job.findById(req.id || req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.client.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to modify this job' });
    }

    job.status = 'Accepted';
    job.hiredWorker = workerId;
    // clear other bids to finalize hire
    job.bidders = [];

    const updatedJob = await job.save();
    
    // Increment hired worker's job count
    const worker = await User.findById(workerId);
    if (worker) {
      worker.jobsCompleted += 1;
      await worker.save();
    }

    res.json(updatedJob);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Decline/Remove a bid
// @route   PUT /api/jobs/:id/decline-bid
// @access  Private (Client only)
router.put('/:id/decline-bid', protect, async (req, res) => {
  const { bidderId } = req.body;

  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.client.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    job.bidders = job.bidders.filter(b => b.worker.toString() !== bidderId);
    const updatedJob = await job.save();
    res.json(updatedJob);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update job status (Accept, Complete, Reject)
// @route   PUT /api/jobs/:id/status
// @access  Private
router.put('/:id/status', protect, async (req, res) => {
  const { status } = req.body;

  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Verify authorized user
    const isClient = job.client.toString() === req.user._id.toString();
    const isWorker = job.hiredWorker && job.hiredWorker.toString() === req.user._id.toString();
    
    // A worker can accept a job invitation or complete a job
    if (!isClient && !isWorker) {
      // If it's a worker accepting a job that has no hiredWorker yet
      if (req.user.role === 'worker' && status === 'Accepted') {
        job.hiredWorker = req.user._id;
        job.status = 'Accepted';
        job.bidders = [];
      } else {
        return res.status(401).json({ message: 'Not authorized to modify this job status' });
      }
    } else {
      job.status = status;
    }

    // Auto-assign worker if accepted and none is assigned (e.g. mock panel)
    if (status === 'Accepted' && !job.hiredWorker) {
      const matchingWorker = await User.findOne({
        role: 'worker',
        occupation: new RegExp(job.repair.split(' ')[0], 'i'),
      });
      if (matchingWorker) {
        job.hiredWorker = matchingWorker._id;
      } else {
        const anyWorker = await User.findOne({ role: 'worker' });
        if (anyWorker) {
          job.hiredWorker = anyWorker._id;
        }
      }
      job.bidders = [];
    }

    const updatedJob = await job.save();

    // Auto-generate details exchange chat messages upon accepting
    if (status === 'Accepted' && job.hiredWorker) {
      try {
        const clientUser = await User.findById(job.client);
        const workerUser = await User.findById(job.hiredWorker);

        if (clientUser && workerUser) {
          // Check if messages already exist to prevent duplicates
          const alreadyExchanged = await Message.findOne({
            senderId: workerUser._id.toString(),
            receiverId: clientUser._id.toString(),
            text: new RegExp('I have accepted your request', 'i')
          });

          if (!alreadyExchanged) {
            // Worker detail-share message
            const workerText = `Hello! I have accepted your request for "${job.repair}". Here are my contact details:\n\n👷 Worker Name: ${workerUser.fullName}\n📞 Phone Number: ${workerUser.phone}\n🛠️ Specialty: ${workerUser.occupation || 'Trade Worker'}\n⭐ Rating: ${workerUser.rating || '4.9'} / 5.0\n\nI am on my way to your location!`;
            
            await Message.create({
              senderId: workerUser._id.toString(),
              senderName: workerUser.fullName,
              senderRole: 'worker',
              senderAvatar: workerUser.avatar || '',
              receiverId: clientUser._id.toString(),
              receiverName: clientUser.fullName,
              text: workerText,
            });

            // Client detail-share message
            const clientText = `Thank you for accepting! Here are my job details and work address:\n\n🏠 Client Name: ${job.name}\n📍 Area: ${job.location}\n📌 Full Address: ${job.fullAddress || 'Shared location'}\n🗺️ GPS Coordinates: ${job.latitude && job.longitude ? `${job.latitude}, ${job.longitude}` : 'Not shared'}\n💰 Price/Budget: ₹${job.money}\n\nLet's coordinate the visiting time here!`;

            await Message.create({
              senderId: clientUser._id.toString(),
              senderName: clientUser.fullName,
              senderRole: 'client',
              senderAvatar: clientUser.avatar || '',
              receiverId: workerUser._id.toString(),
              receiverName: workerUser.fullName,
              text: clientText,
            });
          }
        }
      } catch (err) {
        console.error('Error auto-sending details messages:', err);
      }
    }

    res.json(updatedJob);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
