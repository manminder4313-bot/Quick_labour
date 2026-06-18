import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Review from './models/Review.js';

dotenv.config();

const remoteUri = process.env.MONGO_URI;

const run = async () => {
  try {
    await mongoose.connect(remoteUri);
    console.log('Connected!');

    const reviews = await Review.find({});
    console.log('--- Review Sizes ---');
    for (let r of reviews) {
      const avatarLen = r.avatar ? r.avatar.length : 0;
      console.log(`Review ID: ${r._id} | Author: ${r.name} | Text: ${r.text.substring(0, 30)} | Avatar Len: ${avatarLen}`);
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
