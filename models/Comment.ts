import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema({
  videoId: { type: String, required: true },
  userId: { type: String, required: true }, // ✅ Changed from Number to String
  username: { type: String, required: true },
  text: { type: String, required: true },
  city: { type: String, default: 'Unknown' },
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  removed: { type: Boolean, default: false },
  language: { type: String, default: 'en' },
});

export default mongoose.models.Comment || mongoose.model('Comment', CommentSchema);