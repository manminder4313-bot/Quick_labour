import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const labourSchema = new mongoose.Schema(
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
    plainPassword: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    role: {
      type: String,
      default: 'worker',
    },
    occupation: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&q=80',
    },
    idType: {
      type: String,
      default: 'Aadhaar',
    },
    idFile: {
      type: String,
      default: '',
    },
    isOnline: {
      type: Boolean,
      default: true,
    },
    rating: {
      type: Number,
      default: 4.9,
    },
    jobsCompleted: {
      type: Number,
      default: 0,
    },
    acceptedJobsCount: {
      type: Number,
      default: 0,
    },
    points: {
      type: Number,
      default: 0,
    },
    skills: {
      type: [String],
      default: [],
    },
    walletBalance: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: 'Labour',
  }
);

// Encrypt password before saving
labourSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match entered password with hashed password in database
labourSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Labour = mongoose.model('Labour', labourSchema);

export default Labour;
