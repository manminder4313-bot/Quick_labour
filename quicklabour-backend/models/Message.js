import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: String,
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    senderRole: {
      type: String,
      enum: ['client', 'worker', 'admin'],
      required: true,
    },
    senderAvatar: {
      type: String,
      default: '',
    },
    receiverId: {
      type: String,
      required: true,
    },
    receiverName: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'Messages',
  }
);

const Message = mongoose.model('Message', messageSchema);
export default Message;
