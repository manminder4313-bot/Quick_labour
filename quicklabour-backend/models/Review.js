import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    sub: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: 'https://randomuser.me/api/portraits/men/32.jpg',
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    workerType: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'Review',
  }
);

const Review = mongoose.model('Review', reviewSchema);

export default Review;
