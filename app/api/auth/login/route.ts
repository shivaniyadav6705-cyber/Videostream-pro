import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { sendEmailOTP, sendSMSOTP, generateOTP } from '@/lib/email';
import { getLocationFromIP, getOTPMethod } from '@/lib/location';

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

    // Get location
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const location = await getLocationFromIP(ip);
    const method = getOTPMethod(location);

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = Date.now() + 10 * 60 * 1000;

    // Store OTP
    (global as any)._otps = (global as any)._otps || {};
    (global as any)._otps[user._id.toString()] = { otp, expiresAt: otpExpiry };

    // Send OTP
    if (method === 'email') {
      await sendEmailOTP(user.email, otp);
      console.log(`📧 OTP sent to email: ${user.email}`);
    } else {
      await sendSMSOTP(user.phone || '9876543210', otp);
      console.log(`📱 OTP sent to phone: ${user.phone}`);
    }

    console.log(`🔑 OTP: ${otp}`);

    return NextResponse.json({
      success: true,
      message: `OTP sent to your ${method}`,
      userId: user._id,
      method,
      theme: location.isSouthIndia ? 'light' : 'dark',
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}