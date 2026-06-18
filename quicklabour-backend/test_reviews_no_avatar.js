import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Review from './models/Review.js';

dotenv.config();

const remoteUri = process.env.MONGO_URI;

const run = async () => {
  try {
    await mongoose.connect(remoteUri);
    console.log('Connected!');

    const start = Date.now();
    const reviews = await Review.find({}).select('-avatar');
    console.log(`Query completed in ${Date.now() - start}ms. Found ${reviews.length} reviews.`);
    if (reviews.length > 0) {
      console.log('First review details:', { id: reviews[0]._id, name: reviews[0].name, text: reviews[0].text });
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
