import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { userId, otp } = await req.json();

    console.log(`🔐 OTP verification for user: ${userId}`);
    console.log(`🔑 OTP entered: ${otp}`);

    // Get stored OTP
    const storedOTP = (global as any)._otps?.[userId];
    
    if (!storedOTP) {
      console.log(`❌ No OTP found for user: ${userId}`);
      return NextResponse.json({ error: 'No OTP requested' }, { status: 401 });
    }

    if (Date.now() > storedOTP.expiresAt) {
      console.log(`❌ OTP expired for user: ${userId}`);
      delete (global as any)._otps[userId];
      return NextResponse.json({ error: 'OTP expired' }, { status: 401 });
    }

    if (storedOTP.otp !== otp) {
      console.log(`❌ Invalid OTP for user: ${userId}`);
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 401 });
    }

    // OTP verified - generate token
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Clear OTP
    delete (global as any)._otps[userId];

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    console.log(`✅ User logged in: ${user.username}`);

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        plan: user.plan,
      },
    });
  } catch (error: any) {
    console.error('OTP verification error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}