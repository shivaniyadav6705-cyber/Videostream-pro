import mongoose from 'mongoose';

const OTPSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  otp: { type: String, required: true },
  method: { type: String, enum: ['email', 'phone'], required: true },
  expiresAt: { type: Date, required: true },
  isUsed: { type: Boolean, default: false }
});

OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.OTP || mongoose.model('OTP', OTPSchema);