import mongoose from 'mongoose';

const connectDB = async () => {
  try {

    const remoteUri = process.env.MONGO_URI;
    console.log(remoteUri);
    if (!remoteUri) {
      throw new Error('No MONGO_URI specified in environment');
    }
    const conn = await mongoose.connect(remoteUri);
    console.log(`📡 MongoDB Atlas Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Remote MongoDB Atlas connection error: ${error.message}`);
    console.log('⚠️ Attempting seamless local fallback (mongodb://127.0.0.1:27017/quicklabour)...');
    try {
      const localConn = await mongoose.connect('mongodb://127.0.0.1:27017/quicklabour');
      console.log(`📡 Local MongoDB Connected Successfully: ${localConn.connection.host}`);
    } catch (localError) {
      console.error(`❌ Local MongoDB fallback also failed: ${localError.message}`);
      console.log('⚠️ Server running, but Mongoose is disconnected. Please check your database configurations.');
    }
  }
};

export default connectDB;
