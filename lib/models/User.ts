import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  password: { type: String, required: true },
  plan: { type: String, enum: ['free', 'bronze', 'silver', 'gold'], default: 'free' },
  watchTimeUsed: { type: Number, default: 0 },
  watchDate: { type: String, default: () => new Date().toDateString() },
  downloadsToday: { type: Number, default: 0 },
  downloadDate: { type: String, default: () => new Date().toDateString() },
  createdAt: { type: Date, default: Date.now }
});

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

UserSchema.methods.comparePassword = async function(password: string) {
  return await bcrypt.compare(password, this.password);
};

export default mongoose.models.User || mongoose.model('User', UserSchema);