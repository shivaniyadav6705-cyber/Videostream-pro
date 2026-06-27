import { NextResponse } from 'next/server';
import { sendEmailOTP, generateOTP } from '@/lib/email';

export async function GET() {
  const testEmail = process.env.EMAIL_USER;
  const otp = generateOTP();
  
  console.log(`📧 Testing email to: ${testEmail}`);
  console.log(`🔑 Test OTP: ${otp}`);
  
  const result = await sendEmailOTP(testEmail!, otp);
  
  return NextResponse.json({
    success: result,
    message: result ? '✅ Test email sent successfully' : '❌ Test email failed',
    otp: otp,
    email: testEmail,
  });
}