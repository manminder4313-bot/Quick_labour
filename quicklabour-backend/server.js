import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import User from './models/User.js';
import Review from './models/Review.js';
import authRoutes from './routes/auth.js';
import jobRoutes from './routes/jobs.js';
import reviewRoutes from './routes/reviews.js';
import contactRoutes from './routes/contact.js';
import adminRoutes from './routes/admin.js';
import messageRoutes from './routes/messages.js';
import paymentRoutes from './routes/payments.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to Database
connectDB().then(() => {
  seedDatabase();
});

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Seed Database with defaults if empty
const seedDatabase = async () => {
  try {
    // 1. Seed Tester Accounts if they don't exist
    const clientExists = await User.findOne({ email: 'client@quicklabour.com' });
    if (!clientExists) {
      console.log('🌱 Seeding default Client tester profile...');
      await User.create({
        fullName: 'Raj Malhotra',
        email: 'client@quicklabour.com',
        password: 'client123', // Will be hashed via pre-save hook
        plainPassword: 'client123',
        phone: '+91 98765 43210',
        address: 'Mumbai, Maharashtra',
        role: 'client',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
        idType: 'Aadhaar',
        rating: 5.0,
        jobsCompleted: 3,
      });
    }

    const workerExists = await User.findOne({ email: 'worker@quicklabour.com' });
    if (!workerExists) {
      console.log('🌱 Seeding default Worker tester profile...');
      await User.create({
        fullName: 'Ramesh Kumar',
        email: 'worker@quicklabour.com',
        password: 'worker123', // Will be hashed via pre-save hook
        plainPassword: 'worker123',
        phone: '+91 99887 76655',
        address: 'Bandra, Mumbai',
        role: 'worker',
        occupation: 'Professional Plumber',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&q=80',
        idType: 'Aadhaar',
        rating: 4.9,
        jobsCompleted: 18,
        skills: ['Leakage Repair', 'PVC Pipes', 'Taps & Faucets'],
        isOnline: true,
      });
    }

    const adminExists = await User.findOne({ email: 'admin@quicklabour.com' });
    if (!adminExists) {
      console.log('🌱 Seeding default Admin tester profile...');
      await User.create({
        fullName: 'Admin Supervisor',
        email: 'admin@quicklabour.com',
        password: 'admin123',
        plainPassword: 'admin123',
        phone: '+91 99999 88888',
        address: 'QuickLabour HQ, Amritsar',
        role: 'admin',
        permissions: ['overview', 'clients', 'workers', 'jobs', 'reviews', 'contacts', 'admins'],
      });
    }

    // Seed some other workers for matching specialties
    const electricianExists = await User.findOne({ email: 'electrician@quicklabour.com' });
    if (!electricianExists) {
      console.log('🌱 Seeding additional Worker specialties...');
      await User.create({
        fullName: 'Suresh Kumar',
        email: 'electrician@quicklabour.com',
        password: 'worker123',
        plainPassword: 'worker123',
        phone: '+91 98765 00112',
        address: 'Andheri West, Mumbai',
        role: 'worker',
        occupation: 'Electrician',
        avatar: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&q=80',
        skills: ['Electric Work', 'Wiring', 'Appliances'],
        rating: 4.8,
        jobsCompleted: 34,
      });
    }

    const painterExists = await User.findOne({ email: 'painter@quicklabour.com' });
    if (!painterExists) {
      console.log('🌱 Seeding additional Worker specialties...');
      await User.create({
        fullName: 'Vijay Patel',
        email: 'painter@quicklabour.com',
        password: 'worker123',
        plainPassword: 'worker123',
        phone: '+91 99887 77665',
        address: 'Thane, Mumbai',
        role: 'worker',
        occupation: 'Painter',
        avatar: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150&q=80',
        skills: ['Painting', 'Wall Texture', 'Polishing'],
        rating: 4.5,
        jobsCompleted: 12,
      });
    }

    // 2. Seed Reviews if empty
    const reviewCount = await Review.countDocuments();
    if (reviewCount === 0) {
      console.log('🌱 Seeding community reviews list...');
      const initialReviews = [
        {
          name: 'Rahul Mehta',
          sub: 'Home Owner, Ludhiana',
          text: 'Found an electrician within 20 minutes of posting. He was professional, did excellent work, and charged exactly what was quoted. QuickLabour is a game changer!',
          avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
          rating: 5,
          workerType: 'Electrician',
        },
        {
          name: 'Karan Malhotra',
          sub: 'Villa Owner, Amritsar',
          text: 'Hired a painter to paint our living room. Extremely neat, finished ahead of schedule, and used high-quality paints. Highly recommended!',
          avatar: 'https://randomuser.me/api/portraits/men/84.jpg',
          rating: 5,
          workerType: 'Painter',
        },
        {
          name: 'Balwinder Singh',
          sub: 'Professional Plumber, Amritsar',
          text: 'As a plumber, QuickLabour helped me find steady work every day. My income has doubled. The app is easy to use and payments are always on time.',
          avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
          rating: 5,
          workerType: 'Plumber',
        },
        {
          name: 'Priya Arora',
          sub: 'Factory Manager, Chandigarh',
          text: 'Managing our factory maintenance is now so smooth. We hire 10–15 workers weekly through QuickLabour. Verified profiles save us so much vetting time.',
          avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
          rating: 4.5,
          workerType: 'General Labour',
        },
      ];
      await Review.insertMany(initialReviews);
    }
    console.log('✅ Database checked and seeded successfully!');
  } catch (error) {
    console.error(`🌱 Seeding error: ${error.message}`);
  }
};

// Trigger Database Seeding after successful connection


// Base API route
app.get('/api', (req, res) => {
  res.json({ message: '🚀 QuickLabour Express API is running!' });
});

// Setup Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/payments', paymentRoutes);

// Serve Frontend Static Files
const distPath = path.join(__dirname, '../quicklabour-react/dist');
app.use(express.static(distPath));

// Catch-all route to serve the React app's index.html for client-side routing
app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

// Error Handling Middlewares
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
