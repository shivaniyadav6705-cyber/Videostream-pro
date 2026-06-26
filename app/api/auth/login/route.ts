import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { sendEmailOTP, sendSMSOTP, generateOTP } from '@/lib/email';
import { getLocationFromIP, getOTPMethod } from '@/lib/location';

declare global {
  var _otps: Record<string, { otp: string; expiresAt: number }>;
}
global._otps = global._otps || {};

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { emailOrPhone, password } = await req.json();

    if (!emailOrPhone || !password) {
      return NextResponse.json({ error: 'Email/Phone and password required' }, { status: 400 });
    }

    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phone: emailOrPhone }],
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found. Please register first.' }, { status: 401 });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const location = await getLocationFromIP(ip);
    const method = getOTPMethod(location);

    const otp = generateOTP();
    const userId = user._id.toString();
    global._otps[userId] = { otp, expiresAt: Date.now() + 10 * 60 * 1000 };

    console.log(`🔐 Login: ${emailOrPhone}`);
    console.log(`📍 Location: ${location.city}, ${location.state}`);
    console.log(`📧 Method: ${method}`);
    console.log(`🔑 OTP: ${otp}`);

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
      otp: otp,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}