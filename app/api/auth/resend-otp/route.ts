import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { getLocationFromIP, getOTPMethod } from '@/lib/location';
import { generateOTP, sendEmailOTP, sendSMSOTP } from '@/lib/email';

declare global {
  var _otps: Record<string, { otp: string; expiresAt: number }>;
}
global._otps = global._otps || {};

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { userId } = await req.json();

    console.log(`🔄 Resend OTP for user: ${userId}`);

    if (!userId) {
      return NextResponse.json({ error: 'UserId is required' }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get location
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const location = await getLocationFromIP(ip);
    const method = getOTPMethod(location);

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = Date.now() + 10 * 60 * 1000;

    // Store OTP - REPLACE existing
    global._otps[userId] = { otp, expiresAt: otpExpiry };

    console.log(`🔄 New OTP: ${otp}`);
    console.log(`📧 Method: ${method}`);

    // Send OTP
    if (method === 'email') {
      await sendEmailOTP(user.email, otp);
    } else {
      await sendSMSOTP(user.phone || '9876543210', otp);
    }

    return NextResponse.json({
      success: true,
      message: `New OTP sent to your ${method}`,
      otp: otp, // FOR TESTING ONLY
      expiresAt: otpExpiry,
    });
  } catch (error: any) {
    console.error('Resend OTP error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}