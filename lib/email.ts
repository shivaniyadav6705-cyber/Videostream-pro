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
    console.log('✅ Email server ready to send invoices');
  }
});

// Send Invoice Email after successful upgrade
export async function sendInvoiceEmail(
  email: string,
  data: {
    username: string;
    planName: string;
    planPrice: number;
    planType: string;
    paymentId: string;
    orderId: string;
    amount: number;
    watchTime: string;
    features: string[];
    validUntil: string;
  }
): Promise<boolean> {
  try {
    const featuresList = data.features.map(f => `• ${f}`).join('\n');
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Payment Confirmation - VideoStream Pro</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .header p { color: rgba(255,255,255,0.8); margin: 5px 0 0; }
          .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; }
          .invoice-box { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .invoice-box table { width: 100%; border-collapse: collapse; }
          .invoice-box td { padding: 8px 0; border-bottom: 1px solid #e9ecef; }
          .invoice-box td:last-child { text-align: right; font-weight: bold; }
          .plan-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-weight: bold; font-size: 14px; }
          .plan-badge.gold { background: #ffd700; color: #000; }
          .plan-badge.silver { background: #c0c0c0; color: #000; }
          .plan-badge.bronze { background: #cd7f32; color: #fff; }
          .features { background: #f8f9fa; border-radius: 8px; padding: 15px; margin: 15px 0; }
          .features li { padding: 5px 0; color: #333; }
          .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
          .btn { display: inline-block; background: #667eea; color: white; padding: 10px 25px; text-decoration: none; border-radius: 5px; }
          .btn:hover { background: #5a6fd6; }
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
              <h3 style="margin-top: 0; color: #333;">📄 Invoice Details</h3>
              <table>
                <tr>
                  <td><strong>Invoice Number</strong></td>
                  <td>#INV-${Date.now().toString().slice(-8)}</td>
                </tr>
                <tr>
                  <td><strong>Date</strong></td>
                  <td>${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                </tr>
                <tr>
                  <td><strong>Plan</strong></td>
                  <td>${data.planName}</td>
                </tr>
                <tr>
                  <td><strong>Plan Type</strong></td>
                  <td><span class="plan-badge ${data.planType}">${data.planType.toUpperCase()}</span></td>
                </tr>
                <tr>
                  <td><strong>Amount Paid</strong></td>
                  <td>₹${data.amount}</td>
                </tr>
                <tr>
                  <td><strong>Payment ID</strong></td>
                  <td style="font-size: 12px; font-family: monospace;">${data.paymentId}</td>
                </tr>
                <tr>
                  <td><strong>Order ID</strong></td>
                  <td style="font-size: 12px; font-family: monospace;">${data.orderId}</td>
                </tr>
                <tr>
                  <td><strong>Watch Time</strong></td>
                  <td>${data.watchTime}</td>
                </tr>
                <tr>
                  <td><strong>Valid Until</strong></td>
                  <td>${data.validUntil}</td>
                </tr>
              </table>
            </div>
            
            <div class="features">
              <h3 style="margin-top: 0; color: #333;">✨ Plan Features</h3>
              <ul style="list-style: none; padding: 0;">
                ${data.features.map(f => `<li style="padding: 4px 0; color: #333;">✅ ${f}</li>`).join('')}
              </ul>
            </div>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" class="btn">🎬 Go to VideoStream Pro</a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              You can now enjoy all the premium features of your ${data.planName}. 
              If you have any questions, feel free to contact our support team.
            </p>
            
            <p style="color: #666; font-size: 14px;">
              Happy watching!<br>
              <strong>The VideoStream Pro Team</strong>
            </p>
          </div>
          
          <div class="footer">
            <p>This is a system-generated invoice. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} VideoStream Pro. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Plain text version
    const text = `
      VideoStream Pro - Payment Confirmation & Invoice

      Hello ${data.username},

      Thank you for upgrading to the ${data.planName}! Your payment has been successfully processed.

      Invoice Details:
      -----------------
      Invoice Number: #INV-${Date.now().toString().slice(-8)}
      Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
      Plan: ${data.planName}
      Plan Type: ${data.planType.toUpperCase()}
      Amount Paid: ₹${data.amount}
      Payment ID: ${data.paymentId}
      Order ID: ${data.orderId}
      Watch Time: ${data.watchTime}
      Valid Until: ${data.validUntil}

      Plan Features:
      ${data.features.map(f => `✅ ${f}`).join('\n')}

      You can now enjoy all the premium features of your ${data.planName}.

      Visit: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}

      Happy watching!
      The VideoStream Pro Team

      This is a system-generated invoice. Please do not reply to this email.
    `;
    
    const info = await transporter.sendMail({
      from: `"VideoStream Pro" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🎬 ${data.planName} - Payment Confirmation & Invoice`,
      html,
      text,
    });
    
    console.log(`✅ Invoice email sent to ${email} (Message ID: ${info.messageId})`);
    return true;
  } catch (error: any) {
    console.error('❌ Invoice email failed:', error.message);
    return false;
  }
}

// Send OTP Email (existing function)
export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  try {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
        <div style="background: white; padding: 30px; border-radius: 10px; text-align: center;">
          <h2 style="color: #667eea;">🔐 Verification Code</h2>
          <p style="color: #333; font-size: 16px;">Your OTP for login is:</p>
          <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 5px; color: #667eea;">${otp}</span>
          </div>
          <p style="color: #666; font-size: 14px;">This OTP is valid for 10 minutes.</p>
          <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
        </div>
      </div>
    `;
    
    await transporter.sendMail({
      from: `"VideoStream Pro" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🔐 Your Login OTP - VideoStream Pro',
      html,
    });
    console.log(`✅ Email OTP sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ OTP email failed:', error);
    return false;
  }
}