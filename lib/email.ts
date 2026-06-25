import nodemailer from 'nodemailer';

console.log('📧 Loading email module...');

// Get email credentials
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

console.log('📧 EMAIL_USER:', EMAIL_USER ? '✅ Set' : '❌ Missing');
console.log('📧 EMAIL_PASS:', EMAIL_PASS ? '✅ Set' : '❌ Missing');

if (!EMAIL_USER || !EMAIL_PASS) {
  console.error('❌ Email credentials missing in .env.local');
  console.error('📧 Please add EMAIL_USER and EMAIL_PASS');
}

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
  // Add these for better reliability
  connectionTimeout: 30000,
  greetingTimeout: 30000,
});

// Verify email configuration
transporter.verify((error) => {
  if (error) {
    console.error('❌ Email configuration error:', error.message);
    console.error('📧 Please check:');
    console.error('   1. EMAIL_USER is your Gmail address');
    console.error('   2. EMAIL_PASS is the 16-char App Password');
    console.error('   3. 2-Step Verification is enabled');
  } else {
    console.log('✅ Email server ready to send emails');
  }
});

// ============================================
// SEND OTP EMAIL (Used for Login)
// ============================================
export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  try {
    console.log(`📧 Sending OTP to: ${email}`);
    console.log(`🔑 OTP: ${otp}`);

    if (!email) {
      console.error('❌ No email provided');
      return false;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>OTP Verification - VideoStream Pro</title>
      </head>
      <body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px;">
        <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">🎬 VideoStream Pro</h1>
          </div>
          <div style="padding: 30px; text-align: center;">
            <h2 style="color: #333;">🔐 Verification Code</h2>
            <p style="color: #666;">Your OTP for login is:</p>
            <div style="background: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <span style="font-size: 42px; font-weight: bold; letter-spacing: 5px; color: #667eea;">${otp}</span>
            </div>
            <p style="color: #666; font-size: 14px;">This OTP is valid for <strong>10 minutes</strong>.</p>
            <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
          </div>
          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px; border-top: 1px solid #eee;">
            <p>&copy; ${new Date().getFullYear()} VideoStream Pro. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: `"VideoStream Pro" <${EMAIL_USER}>`,
      to: email,
      subject: '🔐 Your Login OTP - VideoStream Pro',
      html,
    });

    console.log(`✅ OTP email sent to ${email} (Message ID: ${info.messageId})`);
    return true;
  } catch (error: any) {
    console.error('❌ OTP email failed:', error.message);
    console.error('Error details:', error);
    return false;
  }
}

// ============================================
// SEND INVOICE EMAIL (Used for Plan Upgrade)
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
          .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎬 VideoStream Pro</h1>
            <p>Payment Confirmation & Invoice</p>
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
            <p>System-generated invoice. Do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: `"VideoStream Pro" <${EMAIL_USER}>`,
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
        <h2>✅ Email Configuration Test</h2>
        <p>Your email is working correctly!</p>
        <p>Sent at: ${new Date().toLocaleString()}</p>
        <p>From: ${EMAIL_USER}</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"VideoStream Pro" <${EMAIL_USER}>`,
      to: email,
      subject: '✅ Email Test - VideoStream Pro',
      html,
    });

    console.log(`✅ Test email sent to ${email}`);
    return true;
  } catch (error: any) {
    console.error('❌ Test email failed:', error.message);
    return false;
  }
}