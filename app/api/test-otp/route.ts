import { NextResponse } from 'next/server';
import { sendEmailOTP, generateOTP } from '@/lib/email';

export async function GET() {
  const testEmail = process.env.EMAIL_USER;
  const otp = generateOTP();
  
  console.log(`📧 Testing OTP to: ${testEmail}`);
  console.log(`🔑 OTP: ${otp}`);
  
  const result = await sendEmailOTP(testEmail!, otp);
  
  return NextResponse.json({
    success: result,
    message: result ? '✅ OTP test email sent' : '❌ OTP test failed',
    otp: otp,
    email: testEmail,
  });
}