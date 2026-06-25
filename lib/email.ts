import nodemailer from 'nodemailer';

// Create transporter with better configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Add these for reliability
  connectionTimeout: 30000,
  greetingTimeout: 30000,
});

// Verify email configuration on startup
transporter.verify((error) => {
  if (error) {
    console.error('❌ Email configuration error:', error);
    console.error('📧 Please check EMAIL_USER and EMAIL_PASS in .env.local');
  } else {
    console.log('✅ Email server ready to send emails');
  }
});

// ============================================
// SEND INVOICE EMAIL
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
    if (!email) {
      console.error('❌ No email address provided');
      return false;
    }

    console.log(`📧 Sending invoice to: ${email}`);
    console.log(`📄 Plan: ${data.planName}, Amount: ₹${data.amount}`);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Payment Confirmation - VideoStream Pro</title>
        <style>
          body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .header p { color: rgba(255,255,255,0.8); margin: 5px 0 0; }
          .content { padding: 30px; }
          .invoice-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e9ecef; }
          .invoice-box table { width: 100%; border-collapse: collapse; }
          .invoice-box tr { border-bottom: 1px solid #e9ecef; }
          .invoice-box td { padding: 10px 0; }
          .invoice-box td:last-child { text-align: right; font-weight: bold; }
          .btn { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .btn:hover { background: #5a6fd6; }
          .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; border-top: 1px solid #eee; }
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
            <p>Thank you for upgrading to the <strong>${data.planName}</strong>! Your payment has been successfully processed.</p>
            <div class="invoice-box">
              <h3 style="margin-top: 0;">📄 Invoice Details</h3>
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
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" class="btn">Go to VideoStream Pro</a>
            </div>
            <p style="color: #666;">Happy watching!<br><strong>The VideoStream Pro Team</strong></p>
          </div>
          <div class="footer">
            <p>This is a system-generated invoice. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} VideoStream Pro. All rights reserved.</p>
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
// SEND OTP EMAIL
// ============================================
export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  try {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; padding: 30px;">
          <div style="background: white; border-radius: 10px; padding: 30px; text-align: center;">
            <h2 style="color: #667eea;">🔐 Verification Code</h2>
            <p style="color: #333;">Your OTP for login is:</p>
            <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <span style="font-size: 36px; font-weight: bold; letter-spacing: 5px; color: #667eea;">${otp}</span>
            </div>
            <p style="color: #666; font-size: 14px;">Valid for 10 minutes.</p>
            <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"VideoStream Pro" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🔐 Your Login OTP - VideoStream Pro',
      html,
    });
    console.log(`✅ OTP email sent to ${email}`);
    return true;
  } catch (error: any) {
    console.error('❌ OTP email failed:', error.message);
    return false;
  }
}