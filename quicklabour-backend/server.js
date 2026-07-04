import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import User, { Client, Labour } from './models/User.js';
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
    // 1. Delete Demo Tester Accounts if they exist (except admin)
    await Client.deleteMany({ email: { $in: ['client@quicklabour.com'] } });
    await Labour.deleteMany({ email: { $in: ['worker@quicklabour.com', 'electrician@quicklabour.com', 'painter@quicklabour.com'] } });

    // 2. Seed Admin Tester Profile if it doesn't exist
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

    // 3. Migrate any static unsplash avatars to dynamic name-based initials
    const migrateStaticAvatars = async () => {
      try {
        console.log('🔄 Checking for static Unsplash or empty avatars to migrate...');
        
        // Find Clients with Unsplash or empty avatar
        const clientsToMigrate = await Client.find({
          $or: [
            { avatar: { $regex: 'images.unsplash.com/photo-1534528741775-53994a69daeb' } },
            { avatar: '' },
            { avatar: null }
          ]
        });
        
        if (clientsToMigrate.length > 0) {
          console.log(`Updating ${clientsToMigrate.length} clients to dynamic initials avatars...`);
          for (const c of clientsToMigrate) {
            c.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.fullName)}&background=random&color=fff&size=150`;
            await c.save();
          }
        }

        // Find Labours with Unsplash or empty avatar
        const laboursToMigrate = await Labour.find({
          $or: [
            { avatar: { $regex: 'images.unsplash.com/photo-1506794778202-cad84cf45f1d' } },
            { avatar: '' },
            { avatar: null }
          ]
        });
        
        if (laboursToMigrate.length > 0) {
          console.log(`Updating ${laboursToMigrate.length} workers/labours to dynamic initials avatars...`);
          for (const l of laboursToMigrate) {
            l.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(l.fullName)}&background=random&color=fff&size=150`;
            await l.save();
          }
        }
        console.log('✅ Avatar migration check finished!');
      } catch (err) {
        console.error(`🌱 Avatar migration error: ${err.message}`);
      }
    };
    await migrateStaticAvatars();

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
