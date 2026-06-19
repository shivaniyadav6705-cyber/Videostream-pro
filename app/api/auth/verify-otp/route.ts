import { NextRequest, NextResponse } from 'next/server';
import { getUserLocation, getTheme } from '@/lib/location';

declare global {
  var _users: any[];
  var _otps: any[];
}
global._users = global._users || [];
global._otps = global._otps || [];

export async function POST(req: NextRequest) {
  try {
    const { userId, otp } = await req.json();
    
    const otpRecord = global._otps.find((o: any) => o.userId === userId && o.otp === otp && o.expiresAt > Date.now());
    
    if (!otpRecord) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 401 });
    }
    
    // Clear used OTP
    global._otps = global._otps.filter((o: any) => o.userId !== userId);
    
    const user = global._users.find((u: any) => u.id === userId);
    const location = await getUserLocation();
    const theme = getTheme(location);
    const token = Buffer.from(JSON.stringify({ userId: user.id, email: user.email })).toString('base64');
    
    console.log(`✅ User ${user.username} verified via ${otpRecord.method}`);
    
    return NextResponse.json({
      success: true,
      token,
      user: { id: user.id, username: user.username, email: user.email, plan: user.plan },
      theme,
    });
  } catch (error: any) {
    console.error('OTP verification error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}