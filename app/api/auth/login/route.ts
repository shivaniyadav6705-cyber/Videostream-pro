import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { sendOTPEmail } from '@/lib/email';
import jwt from 'jsonwebtoken';

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { emailOrPhone, password } = await req.json();

    console.log(`🔐 Login attempt: ${emailOrPhone}`);

    if (!emailOrPhone || !password) {
      return NextResponse.json({ error: 'Email/Phone and password required' }, { status: 400 });
    }

    // Find user
    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phone: emailOrPhone }],
    });

    if (!user) {
      console.log(`❌ User not found: ${emailOrPhone}`);
      return NextResponse.json({ error: 'User not found. Please register first.' }, { status: 401 });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log(`❌ Invalid password for: ${emailOrPhone}`);
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP in user document or separate collection
    // For simplicity, we'll store it in a global variable (use Redis/DB in production)
    (global as any)._otps = (global as any)._otps || {};
    (global as any)._otps[user._id.toString()] = { otp, expiresAt: otpExpiry };

    // Send OTP via Email
    console.log(`📧 Sending OTP to: ${user.email}`);
    console.log(`🔑 OTP: ${otp}`);

    const emailSent = await sendOTPEmail(user.email, otp);

    if (!emailSent) {
      console.error(`❌ Failed to send OTP email to ${user.email}`);
      return NextResponse.json({ 
        error: 'Failed to send OTP. Please check your email configuration.' 
      }, { status: 500 });
    }

    console.log(`✅ OTP sent to ${user.email}`);

    return NextResponse.json({
      success: true,
      message: `OTP sent to your email`,
      userId: user._id,
      method: 'email',
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}