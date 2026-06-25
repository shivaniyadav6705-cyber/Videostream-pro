import nodemailer from 'nodemailer';

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify email configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email configuration error:', error);
  } else {
    console.log('✅ Email server ready to send OTPs');
  }
});

// Generate 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP via Email
export async function sendEmailOTP(email: string, otp: string): Promise<boolean> {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>VideoStream Pro OTP</title>
      </head>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f4f4f4;">
        <div style="max-width: 500px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; padding: 30px;">
            <div style="background: white; border-radius: 10px; padding: 30px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 20px;">🎬</div>
              <h2 style="color: #667eea; margin-bottom: 10px;">VideoStream Pro</h2>
              <h3 style="color: #333;">Login Verification</h3>
              <p style="color: #666; margin: 20px 0;">Your One-Time Password (OTP) is:</p>
              <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <span style="font-size: 42px; font-weight: bold; letter-spacing: 8px; color: #667eea;">${otp}</span>
              </div>
              <p style="color: #666; font-size: 14px;">This OTP is valid for <strong>10 minutes</strong>.</p>
              <p style="color: #999; font-size: 12px; margin-top: 20px;">If you didn't request this, please ignore this email.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="color: #999; font-size: 11px;">&copy; 2025 VideoStream Pro. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const info = await transporter.sendMail({
      from: `"VideoStream Pro" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🔐 Your Login OTP - VideoStream Pro',
      html,
    });
    
    console.log(`✅ Email OTP sent to ${email}: ${otp} (Message ID: ${info.messageId})`);
    return true;
  } catch (error: any) {
    console.error('❌ Email send failed:', error.message);
    return false;
  }
}

// Send OTP via SMS (Console for demo)
export async function sendSMSOTP(phone: string, otp: string): Promise<boolean> {
  console.log('\n' + '='.repeat(50));
  console.log(`📱 SMS OTP (DEMO MODE)`);
  console.log(`📱 To: ${phone}`);
  console.log(`📱 Your OTP is: ${otp}`);
  console.log(`📱 Valid for 10 minutes`);
  console.log('='.repeat(50) + '\n');
  return true;
}

// ============================================
// SEND INVOICE EMAIL (For Plan Upgrade)
// ============================================
export async function sendInvoiceEmail(
  email: string,
  data: {
    username: string;
    planName: string;
    planType: string;
    paymentId: string;
    amount: number;
    watchTime: string;
    features: string[];
    startDate: string;
    endDate: string;
  }
): Promise<boolean> {
  try {
    console.log(`📧 Sending invoice to: ${email}`);
    console.log(`📄 Plan: ${data.planName}, Amount: ₹${data.amount}`);

    if (!email) {
      console.error('❌ No email provided');
      return false;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Payment Confirmation - VideoStream Pro</title>
        <style>
          body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; }
          .content { padding: 30px; }
          .invoice-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .invoice-box table { width: 100%; border-collapse: collapse; }
          .invoice-box td { padding: 8px 0; border-bottom: 1px solid #e9ecef; }
          .invoice-box td:last-child { text-align: right; font-weight: bold; }
          .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎬 VideoStream Pro</h1>
            <p style="color: rgba(255,255,255,0.8);">Payment Confirmation</p>
          </div>
          <div class="content">
            <h2>Hello ${data.username},</h2>
            <p>Thank you for upgrading to <strong>${data.planName}</strong>!</p>
            <div class="invoice-box">
              <h3>📄 Invoice Details</h3>
              <table>
                <tr><td>Invoice Number</td><td>#INV-${Date.now().toString().slice(-8)}</td></tr>
                <tr><td>Date</td><td>${new Date().toLocaleDateString()}</td></tr>
                <tr><td>Plan</td><td>${data.planName}</td></tr>
                <tr><td>Amount Paid</td><td>₹${data.amount}</td></tr>
                <tr><td>Payment ID</td><td>${data.paymentId}</td></tr>
                <tr><td>Watch Time</td><td>${data.watchTime}</td></tr>
                <tr><td>Start Date</td><td>${data.startDate}</td></tr>
                <tr><td>Valid Until</td><td>${data.endDate}</td></tr>
              </table>
            </div>
            <div style="margin: 20px 0;">
              <h3>✨ Plan Features</h3>
              <ul>${data.features.map(f => `<li>${f}</li>`).join('')}</ul>
            </div>
            <div style="text-align: center; margin: 20px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" style="background: #667eea; color: white; padding: 10px 25px; text-decoration: none; border-radius: 5px;">Go to VideoStream Pro</a>
            </div>
            <p>Happy watching!<br><strong>The VideoStream Pro Team</strong></p>
          </div>
          <div class="footer">
            <p>System-generated invoice. Do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: `"VideoStream Pro" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🎬 ${data.planName} - Payment Confirmation & Invoice`,
      html,
    });

    console.log(`✅ Invoice email sent to ${email} (Message ID: ${info.messageId})`);
    return true;
  } catch (error: any) {
    console.error('❌ Invoice email failed:', error.message);
    return false;
  }
}

// ============================================
// TEST EMAIL FUNCTION
// ============================================
export async function testEmail(email: string): Promise<boolean> {
  try {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h2>✅ Email Test</h2>
        <p>Your email is working!</p>
        <p>Sent at: ${new Date().toLocaleString()}</p>
        <p>From: ${process.env.EMAIL_USER}</p>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"VideoStream Pro" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '✅ Email Test - VideoStream Pro',
      html,
    });

    console.log(`✅ Test email sent to ${email} (Message ID: ${info.messageId})`);
    return true;
  } catch (error: any) {
    console.error('❌ Test email failed:', error.message);
    return false;
  }
}