import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function GET() {
  try {
    const EMAIL_USER = process.env.EMAIL_USER;
    const EMAIL_PASS = process.env.EMAIL_PASS;

    console.log('📧 EMAIL_USER:', EMAIL_USER);
    console.log('📧 EMAIL_PASS exists:', !!EMAIL_PASS);

    if (!EMAIL_USER || !EMAIL_PASS) {
      return NextResponse.json({
        success: false,
        error: 'EMAIL_USER or EMAIL_PASS not set in .env.local',
        emailUser: EMAIL_USER,
        emailPassExists: !!EMAIL_PASS
      }, { status: 400 });
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });

    // Test email
    const info = await transporter.sendMail({
      from: `"VideoStream Pro" <${EMAIL_USER}>`,
      to: EMAIL_USER,
      subject: '✅ Email Test - VideoStream Pro',
      html: `
        <h2>✅ Email Working!</h2>
        <p>Your email configuration is correct.</p>
        <p>Sent at: ${new Date().toLocaleString()}</p>
        <p>From: ${EMAIL_USER}</p>
      `,
    });

    console.log('✅ Test email sent:', info.messageId);

    return NextResponse.json({
      success: true,
      message: '✅ Test email sent successfully! Check your inbox.',
      messageId: info.messageId,
      emailUser: EMAIL_USER,
    });
  } catch (error: any) {
    console.error('❌ Test email failed:', error.message);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}