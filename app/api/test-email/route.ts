import { NextRequest, NextResponse } from 'next/server';
import { testEmail } from '@/lib/email';

export async function GET(req: NextRequest) {
  try {
    // Get email from query parameter or use default
    const url = new URL(req.url);
    const email = url.searchParams.get('email') || process.env.EMAIL_USER;

    if (!email) {
      return NextResponse.json({ 
        error: 'No email provided. Use: /api/test-email?email=your@email.com' 
      }, { status: 400 });
    }

    console.log(`📧 Testing email to: ${email}`);
    
    const result = await testEmail(email);

    return NextResponse.json({
      success: result,
      message: result ? '✅ Test email sent successfully' : '❌ Test email failed',
      email: email,
      environment: process.env.VERCEL ? 'Vercel' : 'Local',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Test error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}