import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { sendEmailOTP, sendSMSOTP, generateOTP } from '@/lib/email';
import { getLocationFromIP, getOTPMethod } from '@/lib/location';

// Store OTPs globally (use Redis in production)
declare global {
  var _otps: Record<string, { otp: string; expiresAt: number }>;
}
global._otps = global._otps || {};

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

    // Get location and determine OTP method
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const location = await getLocationFromIP(ip);
    const method = getOTPMethod(location);

    console.log(`📍 Location: ${location.city}, ${location.state}`);
    console.log(`📧 OTP Method: ${method}`);

    // Generate OTP
    const otp = generateOTP();
    const userId = user._id.toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP
    global._otps[userId] = { otp, expiresAt };

    console.log(`🔑 OTP: ${otp}`);
    console.log(`⏰ Expires at: ${new Date(expiresAt).toLocaleString()}`);

    // Send OTP based on location
    let otpSent = false;
    if (method === 'email') {
      otpSent = await sendEmailOTP(user.email, otp);
    } else {
      otpSent = await sendSMSOTP(user.phone || '9876543210', otp);
    }

    return NextResponse.json({
      success: true,
      message: `OTP sent to your ${method}`,
      userId: userId,
      method,
      otp: otp, // FOR TESTING ONLY - REMOVE IN PRODUCTION
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}