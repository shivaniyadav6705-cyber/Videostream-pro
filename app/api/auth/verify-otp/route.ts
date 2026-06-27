import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

declare global {
  var _otps: Record<string, { otp: string; expiresAt: number }>;
}
global._otps = global._otps || {};

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { userId, otp } = await req.json();

    if (!userId || !otp) {
      return NextResponse.json({ error: 'UserId and OTP required' }, { status: 400 });
    }

    const storedData = global._otps[userId];

    if (!storedData) {
      return NextResponse.json({ error: 'No OTP found. Please login again.' }, { status: 401 });
    }

    if (Date.now() > storedData.expiresAt) {
      delete global._otps[userId];
      return NextResponse.json({ error: 'OTP expired. Please login again.' }, { status: 401 });
    }

    if (storedData.otp !== otp) {
      return NextResponse.json({ error: 'Invalid OTP. Please try again.' }, { status: 401 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    delete global._otps[userId];

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '7d' });

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
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}