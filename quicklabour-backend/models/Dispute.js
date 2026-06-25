import mongoose from 'mongoose';

const disputeSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    jobTitle: {
      type: String,
      required: true,
    },
    clientName: {
      type: String,
      required: true,
    },
    workerName: {
      type: String,
      required: true,
    },
    submittedBy: {
      type: String,
      enum: ['client', 'worker'],
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    photo: {
      type: String,
      default: '',
    },
    callLog: {
      type: String,
      default: '',
    },
    gpsLocation: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Pending', 'Resolved'],
      default: 'Pending',
    },
    resolutionDecision: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    collection: 'Disputes',
  }
);

const Dispute = mongoose.model('Dispute', disputeSchema);
export default Dispute;
