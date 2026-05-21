import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const clientSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: 'client',
    },
    avatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
    },
    idType: {
      type: String,
      default: 'Aadhaar',
    },
    idFile: {
      type: String,
      default: '',
    },
    rating: {
      type: Number,
      default: 5.0,
    },
    jobsCompleted: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: 'Client',
  }
);

// Encrypt password before saving
clientSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match entered password with hashed password in database
clientSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Client = mongoose.model('Client', clientSchema);

export default Client;
