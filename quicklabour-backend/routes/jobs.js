import express from 'express';
import Job from '../models/Job.js';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';
import Message from '../models/Message.js';
import Review from '../models/Review.js';

const router = express.Router();

const getDeductionPoints = (money) => {
  const cleanStr = String(money || '').replace(/[^\d.]/g, '');
  const val = parseFloat(cleanStr) || 0;
  if (val <= 500) return 10;
  if (val <= 1000) return 15;
  if (val <= 1500) return 20;
  if (val <= 2000) return 25;
  if (val <= 2500) return 30;
  if (val <= 3000) return 35;
  if (val <= 3500) return 40;
  if (val <= 4000) return 45;
  if (val <= 4500) return 50;
  if (val <= 5000) return 55;
  return 60;
};

// Helper to calculate distance in km using the Haversine formula
const getDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

// @desc    Create a new job request
// @route   POST /api/jobs
// @access  Private (Client only)
router.post('/', protect, async (req, res) => {
  if (req.user.role === 'worker') {
    return res.status(403).json({ message: 'Workers are not authorized to create jobs or hire other workers.' });
  }
  const { name, location, fullAddress, latitude, longitude, repair, money, workerId, workersNeeded, invitedWorkers } = req.body;

  try {
    const title = `${repair} Request at ${location}`;
    const isDirectHire = !!workerId;

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
      status: isDirectHire ? 'Accepted' : 'Waiting...',
      hiredWorker: isDirectHire ? workerId : null,
      workersNeeded: Number(workersNeeded) || 1,
      invitedWorkers: invitedWorkers || [],
    });

    if (isDirectHire) {
      job.bidders = [];
      
      // Increment hired worker's job count
      const worker = await User.findById(workerId);
      if (worker) {
        const pointsCost = getDeductionPoints(job.money);
        if ((worker.points || 0) < pointsCost) {
          return res.status(403).json({
            message: 'INSUFFICIENT_POINTS',
            error: `The selected worker does not have enough subscription points to accept this job. This job requires ${pointsCost} points, but they only have ${worker.points || 0} points.`
          });
        }
        worker.jobsCompleted = (worker.jobsCompleted || 0) + 1;
        worker.acceptedJobsCount = (worker.acceptedJobsCount || 0) + 1;
        worker.points = (worker.points || 0) - pointsCost;
        await worker.save();
      }
    } else if (invitedWorkers && invitedWorkers.length > 0) {
      const selectedWorkersList = await User.find({ _id: { $in: invitedWorkers } });
      job.bidders = selectedWorkersList.map((w) => ({
        worker: w._id,
        rate: `₹${Math.round((w.rating || 4.8) * 150)}/day`,
      }));
    } else {
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
    }

    const createdJob = await job.save();

    // Auto-generate details exchange chat messages upon accepting a direct hire
    if (isDirectHire) {
      try {
        const clientUser = req.user;
        const workerUser = await User.findById(workerId);

        if (clientUser && workerUser) {
          // Worker detail-share message
          const workerText = `Hello! I have accepted your direct request for "${repair}". Here are my contact details:\n\n👷 Worker Name: ${workerUser.fullName}\n📞 Phone Number: ${workerUser.phone}\n🛠️ Specialty: ${workerUser.occupation || 'Trade Worker'}\n⭐ Rating: ${workerUser.rating || '4.9'} / 5.0\n\nI am on my way to your location!`;
          
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
          const clientText = `Thank you for accepting my booking! Here are my job details and work address:\n\n🏠 Client Name: ${job.name}\n📞 Contact Number: ${clientUser.phone}\n📍 Area: ${job.location}\n📌 Full Address: ${job.fullAddress || 'Shared location'}\n🗺️ GPS Coordinates: ${job.latitude && job.longitude ? `${job.latitude}, ${job.longitude}` : 'Not shared'}\n💰 Price/Budget: ₹${job.money}\n\nLet's coordinate the visiting time here!`;

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
      } catch (err) {
        console.error('Error auto-sending details messages on direct hire:', err);
      }
    }

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
      let keyword = req.user.occupation ? req.user.occupation.split(' ')[0] : '';
      
      // Normalize keywords to match job categories (e.g. Electrician -> Electric)
      if (keyword.toLowerCase().startsWith('elect')) {
        keyword = 'Electric';
      } else if (keyword.toLowerCase().startsWith('plumb')) {
        keyword = 'Plumbing';
      } else if (keyword.toLowerCase().startsWith('paint')) {
        keyword = 'Painting';
      } else if (keyword.toLowerCase().startsWith('clean')) {
        keyword = 'Cleaning';
      }

      let query = { status: 'Waiting...' };
      
      // Look for jobs matching worker category
      if (keyword) {
        query.repair = new RegExp(keyword, 'i');
      }

      const availableJobs = await Job.find(query)
        .populate('client', 'fullName email phone address avatar');

      // Map jobs to calculate GPS distance and format readable text
      const availableJobsWithDistance = availableJobs.map((job, idx) => {
        let distance = null;
        let distanceText = '';
        if (req.user.latitude && req.user.longitude && job.latitude && job.longitude) {
          distance = getDistance(req.user.latitude, req.user.longitude, job.latitude, job.longitude);
          distanceText = `${distance.toFixed(1)} km away`;
        }
        
        const jobObj = job.toObject();
        jobObj.calculatedDistance = distance;
        jobObj.distanceText = distanceText;
        return jobObj;
      });

      // Filter to keep only jobs within 10 km (if coordinates are provided)
      const nearbyJobs = availableJobsWithDistance.filter(job => {
        if (job.calculatedDistance !== null && job.calculatedDistance !== undefined) {
          return job.calculatedDistance <= 10;
        }
        return true; // Keep job if coordinates aren't set
      });

      res.json({
        hiredJobs,
        availableJobs: nearbyJobs,
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
  if (req.user.role === 'worker') {
    return res.status(403).json({ message: 'Workers are not authorized to hire other workers.' });
  }
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
      const pointsCost = getDeductionPoints(job.money);
      if ((worker.points || 0) < pointsCost) {
        return res.status(403).json({
          message: 'INSUFFICIENT_POINTS',
          error: `The selected worker does not have enough subscription points to accept this job. This job requires ${pointsCost} points, but they only have ${worker.points || 0} points.`
        });
      }
      worker.jobsCompleted = (worker.jobsCompleted || 0) + 1;
      worker.acceptedJobsCount = (worker.acceptedJobsCount || 0) + 1;
      worker.points = (worker.points || 0) - pointsCost;
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
  if (req.user.role === 'worker') {
    return res.status(403).json({ message: 'Workers are not authorized to manage bids.' });
  }
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
        const worker = await User.findById(req.user._id);
        if (!worker) {
          return res.status(404).json({ message: 'Worker profile not found' });
        }

        const pointsCost = getDeductionPoints(job.money);

        if ((worker.points || 0) < pointsCost) {
          return res.status(403).json({
            message: 'INSUFFICIENT_POINTS',
            error: `This job requires ${pointsCost} points, but you only have ${worker.points || 0} points. Please purchase a subscription to accept more jobs.`
          });
        }
        // Deduct points
        worker.points = (worker.points || 0) - pointsCost;

        // Increment accepted jobs count
        worker.acceptedJobsCount = (worker.acceptedJobsCount || 0) + 1;
        await worker.save();

        job.hiredWorker = req.user._id;
        job.status = 'Accepted';
        job.bidders = [];
      } else {
        return res.status(401).json({ message: 'Not authorized to modify this job status' });
      }
    } else {
      job.status = status;
    }

    // Auto-assign worker deactivated to ensure client manual selection only
    /*
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
    */

    const updatedJob = await job.save();

    // Automatically delete chat messages if the status is set to Completed
    if (status === 'Completed' && job.hiredWorker) {
      const clientId = job.client && (job.client._id ? job.client._id.toString() : job.client.toString());
      const workerId = job.hiredWorker && (job.hiredWorker._id ? job.hiredWorker._id.toString() : job.hiredWorker.toString());
      if (clientId && workerId) {
        await Message.deleteMany({
          $or: [
            { senderId: clientId, receiverId: workerId },
            { senderId: workerId, receiverId: clientId }
          ]
        });
      }
    }

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
            const clientText = `Thank you for accepting! Here are my job details and work address:\n\n🏠 Client Name: ${job.name}\n📞 Contact Number: ${clientUser.phone}\n📍 Area: ${job.location}\n📌 Full Address: ${job.fullAddress || 'Shared location'}\n🗺️ GPS Coordinates: ${job.latitude && job.longitude ? `${job.latitude}, ${job.longitude}` : 'Not shared'}\n💰 Price/Budget: ₹${job.money}\n\nLet's coordinate the visiting time here!`;

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

// @desc    Complete a job, add a review, and update worker rating
// @route   PUT /api/jobs/:id/complete
// @access  Private (Client only)
router.put('/:id/complete', protect, async (req, res) => {
  if (req.user.role === 'worker') {
    return res.status(403).json({ message: 'Workers are not authorized to complete jobs.' });
  }
  const { rating, reviewText, paymentMode, onlineMethod } = req.body;

  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.client.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to modify this job' });
    }

    if (!job.hiredWorker) {
      return res.status(400).json({ message: 'No worker is hired for this job yet' });
    }

    const amount = job.money || 0;

    // Handle Client Wallet Deduction if Online via QuickLabour Wallet
    if (paymentMode === 'online' && onlineMethod === 'wallet') {
      const clientUser = await User.findById(req.user._id);
      if (!clientUser) {
        return res.status(404).json({ message: 'Client profile not found' });
      }
      if ((clientUser.walletBalance || 0) < amount) {
        return res.status(400).json({ message: `Insufficient wallet balance (₹${clientUser.walletBalance || 0}). Please add funds or use another online method.` });
      }
      clientUser.walletBalance = (clientUser.walletBalance || 0) - amount;
      await clientUser.save();
    }

    // 1. Update job status to 'Completed'
    job.status = 'Completed';
    await job.save();

    // 2. Fetch worker user
    const worker = await User.findById(job.hiredWorker);
    if (worker) {
      // Credit worker wallet if paid online
      if (paymentMode === 'online') {
        worker.walletBalance = (worker.walletBalance || 0) + amount;
      }
      // Ensure rating is bounded correctly within 1 to 5 stars
      let ratingVal = Number(rating) || 5;
      if (ratingVal > 5) ratingVal = 5;
      if (ratingVal < 1) ratingVal = 1;

      // 3. Create review in database
      const subText = `${job.repair} Service Review`;
      await Review.create({
        name: req.user.fullName,
        sub: subText,
        text: reviewText || 'Excellent work done! Highly recommended and professional worker.',
        avatar: req.user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
        rating: ratingVal,
        workerType: worker.occupation || 'Trade Worker',
      });

      // 4. Update worker's average rating and jobsCompleted count
      const oldRating = worker.rating || 4.9;
      const oldJobs = worker.jobsCompleted || 0;
      const newJobs = oldJobs + 1;
      const newRating = ((oldRating * oldJobs) + ratingVal) / newJobs;

      worker.rating = Math.min(parseFloat(newRating.toFixed(1)), 5.0);
      worker.jobsCompleted = newJobs;
      await worker.save();
    }

    // 5. Automatically delete all chat messages between the client and the hired worker
    const clientId = job.client && (job.client._id ? job.client._id.toString() : job.client.toString());
    const workerId = job.hiredWorker && (job.hiredWorker._id ? job.hiredWorker._id.toString() : job.hiredWorker.toString());
    if (clientId && workerId) {
      await Message.deleteMany({
        $or: [
          { senderId: clientId, receiverId: workerId },
          { senderId: workerId, receiverId: clientId }
        ]
      });
    }

    res.json({ message: 'Job completed and worker rating updated successfully!', job });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
