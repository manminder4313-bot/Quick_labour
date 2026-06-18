import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    fullAddress: {
      type: String,
      default: '',
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    repair: {
      type: String,
      required: true,
    },
    money: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['Waiting...', 'Accepted', 'Completed', 'Rejected'],
      default: 'Waiting...',
    },
    hiredWorker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Labour',
      default: null,
    },
    workersNeeded: {
      type: Number,
      default: 1,
    },
    invitedWorkers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Labour',
      }
    ],
    bidders: [
      {
        worker: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Labour',
        },
        rate: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isFree: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'Jobs',
  }
);

const Job = mongoose.model('Job', jobSchema);

export default Job;
