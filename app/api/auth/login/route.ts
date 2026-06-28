import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { sendEmailOTP, sendSMSOTP, generateOTP } from '@/lib/email';
import { getLocationFromIP, getOTPMethod } from '@/lib/location';

declare global {
  var _otps: Map<string, { otp: string; expiresAt: number }>;
}
global._otps = global._otps || new Map();

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { emailOrPhone, password } = await req.json();

    console.log(`🔐 Login attempt: ${emailOrPhone}`);

    if (!emailOrPhone || !password) {
      return NextResponse.json({ error: 'Email/Phone and password required' }, { status: 400 });
    }

    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phone: emailOrPhone }],
    });

    if (!user) {
      console.log(`❌ User not found: ${emailOrPhone}`);
      return NextResponse.json({ error: 'User not found. Please register first.' }, { status: 401 });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log(`❌ Invalid password for: ${emailOrPhone}`);
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const location = await getLocationFromIP(ip);
    const method = getOTPMethod(location);

    console.log(`📍 Location: ${location.city}, ${location.state}`);
    console.log(`📧 OTP Method: ${method}`);

    const otp = generateOTP();
    const userId = user._id.toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    // Clear existing OTP and store new one
    if (global._otps.has(userId)) {
      global._otps.delete(userId);
    }
    global._otps.set(userId, { otp, expiresAt });

    console.log(`📝 OTP stored for user: ${userId}`);
    console.log(`🔑 OTP: ${otp}`);
    console.log(`⏰ Expires at: ${new Date(expiresAt).toLocaleString()}`);
    console.log(`📋 Total OTPs stored: ${global._otps.size}`);

    if (method === 'email') {
      await sendEmailOTP(user.email, otp);
    } else {
      await sendSMSOTP(user.phone || '9876543210', otp);
    }

    return NextResponse.json({
      success: true,
      message: `OTP sent to your ${method}`,
      userId: userId,
      method,
      otp: otp, // FOR TESTING ONLY
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}