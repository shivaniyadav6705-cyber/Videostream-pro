import { NextRequest, NextResponse } from 'next/server';
import { getUserLocation, getOTPMethod, getTheme } from '@/lib/location';
import { generateOTP, sendEmailOTP, sendSMSOTP } from '@/lib/otp';

declare global {
  var _users: any[];
  var _otps: any[];
}
global._users = global._users || [];
global._otps = global._otps || [];

export async function POST(req: NextRequest) {
  try {
    const { emailOrPhone, password } = await req.json();
    
    const user = global._users.find((u: any) => u.email === emailOrPhone || u.phone === emailOrPhone);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }
    
    if (user.password !== password) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }
    
    // Get user location
    const location = await getUserLocation();
    const method = getOTPMethod(location);
    const theme = getTheme(location);
    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    
    // Store OTP
    global._otps = global._otps.filter((o: any) => o.userId !== user.id);
    global._otps.push({
      userId: user.id,
      otp,
      method,
      expiresAt,
    });
    
    // Send OTP via Email or SMS
    let otpSent = false;
    let contactInfo = '';
    
    if (method === 'email') {
      otpSent = await sendEmailOTP(user.email, otp);
      contactInfo = user.email;
    } else {
      otpSent = await sendSMSOTP(user.phone, otp);
      contactInfo = user.phone;
    }
    
    console.log(`\n🔐 OTP Details:`);
    console.log(`📍 Location: ${location.city}, ${location.state}`);
    console.log(`📱 Method: ${method.toUpperCase()}`);
    console.log(`📧 Contact: ${contactInfo}`);
    console.log(`🔢 OTP: ${otp}`);
    console.log(`⏰ Expires in: 10 minutes\n`);
    
    return NextResponse.json({
      success: true,
      message: `OTP sent to your ${method}`,
      userId: user.id,
      method,
      theme,
      location: { city: location.city, state: location.state, isSouthIndia: location.isSouthIndia },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}