import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

declare global {
  var _otps: Map<string, { otp: string; expiresAt: number }>;
}
global._otps = global._otps || new Map();

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { userId, otp } = await req.json();

    console.log('🔐 ========================================');
    console.log(`🔐 OTP verification for user: ${userId}`);
    console.log(`🔑 OTP entered: ${otp}`);
    console.log(`📋 Total OTPs stored: ${global._otps.size}`);
    console.log('🔐 ========================================');

    if (!userId || !otp) {
      return NextResponse.json({ error: 'UserId and OTP required' }, { status: 400 });
    }

    const storedData = global._otps.get(userId);

    console.log(`📝 Stored data:`, storedData);

    if (!storedData) {
      console.log(`❌ No OTP found for user: ${userId}`);
      return NextResponse.json({ 
        error: 'No OTP found. Please login again to get a new OTP.' 
      }, { status: 401 });
    }

    if (Date.now() > storedData.expiresAt) {
      console.log(`❌ OTP expired for user: ${userId}`);
      global._otps.delete(userId);
      return NextResponse.json({ 
        error: 'OTP expired. Please login again to get a new OTP.' 
      }, { status: 401 });
    }

    if (storedData.otp !== otp) {
      console.log(`❌ Invalid OTP for user: ${userId}`);
      console.log(`🔑 Expected: ${storedData.otp}`);
      console.log(`🔑 Received: ${otp}`);
      return NextResponse.json({ 
        error: `Invalid OTP. Please try again.` 
      }, { status: 401 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    global._otps.delete(userId);
    console.log(`✅ OTP cleared for user: ${userId}`);

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