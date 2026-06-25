import mongoose from 'mongoose';

const sosAlertSchema = new mongoose.Schema(
  {
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Labour',
      required: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    emergencyType: {
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
    status: {
      type: String,
      enum: ['Pending', 'Verified', 'Incorrect'],
      default: 'Pending',
    },
    refundStatus: {
      type: String,
      enum: ['Pending', 'Refunded', 'No Refund'],
      default: 'Pending',
    },
    refundAmount: {
      type: Number,
      required: true,
    },
    claimRefund: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'SosAlerts',
  }
);

const SosAlert = mongoose.model('SosAlert', sosAlertSchema);
export default SosAlert;
