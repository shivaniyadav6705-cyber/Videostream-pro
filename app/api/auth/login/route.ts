import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { sendEmailOTP, sendSMSOTP, generateOTP } from '@/lib/email';
import { getLocationFromIP, getOTPMethod, getTheme } from '@/lib/location';

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
    const theme = getTheme(location);

    const otp = generateOTP();
    const otpExpiry = Date.now() + 10 * 60 * 1000;
    const userId = user._id.toString();

    global._otps[userId] = { otp, expiresAt: otpExpiry };

    console.log(`🔑 OTP: ${otp}`);
    console.log(`📧 Method: ${method}`);
    console.log(`⏰ Expires at: ${new Date(otpExpiry).toLocaleString()}`);

    let otpSent = false;
    if (method === 'email') {
      otpSent = await sendEmailOTP(user.email, otp);
    } else {
      otpSent = await sendSMSOTP(user.phone || '9876543210', otp);
    }

    console.log(`📧 OTP sent: ${otpSent}`);

    return NextResponse.json({
      success: true,
      message: `OTP sent to your ${method}`,
      userId: userId,
      method,
      theme,
      otp: otp,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}