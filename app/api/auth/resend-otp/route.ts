import { NextRequest, NextResponse } from 'next/server';
import { getUserLocation, getOTPMethod } from '@/lib/location';
import { generateOTP, sendEmailOTP, sendSMSOTP } from '@/lib/otp';

declare global {
  var _users: any[];
  var _otps: any[];
}
global._users = global._users || [];
global._otps = global._otps || [];

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    
    const user = global._users.find((u: any) => u.id === userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const location = await getUserLocation();
    const method = getOTPMethod(location);
    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    
    // Update OTP
    global._otps = global._otps.filter((o: any) => o.userId !== userId);
    global._otps.push({ userId, otp, method, expiresAt });
    
    // Resend OTP
    if (method === 'email') {
      await sendEmailOTP(user.email, otp);
    } else {
      await sendSMSOTP(user.phone, otp);
    }
    
    console.log(`🔄 Resent OTP to ${method === 'email' ? user.email : user.phone}: ${otp}`);
    
    return NextResponse.json({
      success: true,
      message: `New OTP sent to your ${method}`,
    });
  } catch (error: any) {
    console.error('Resend OTP error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}