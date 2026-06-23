import nodemailer from 'nodemailer';

// Email transporter configuration - Production Ready
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Production settings
  pool: true,
  maxConnections: 1,
  rateDelta: 1000,
  rateLimit: 5,
  connectionTimeout: 30000,
  greetingTimeout: 30000,
});

// Verify email configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email configuration error:', error);
    console.error('Please check EMAIL_USER and EMAIL_PASS in .env.local');
  } else {
    console.log('✅ Email server ready');
  }
});

// ============================================
// SEND INVOICE EMAIL - PRODUCTION READY
// ============================================
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
    console.log(`📧 Sending invoice to: ${email}`);

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
          .header h1 { color: white; margin: 0; }
          .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; }
          .invoice-box { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .invoice-box table { width: 100%; border-collapse: collapse; }
          .invoice-box td { padding: 8px 0; border-bottom: 1px solid #e9ecef; }
          .invoice-box td:last-child { text-align: right; font-weight: bold; }
          .btn { display: inline-block; background: #667eea; color: white; padding: 10px 25px; text-decoration: none; border-radius: 5px; }
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
                <tr><td>Valid Until</td><td>${data.validUntil}</td></tr>
              </table>
            </div>
            <div style="margin: 20px 0;">
              <h3>✨ Plan Features</h3>
              <ul>${data.features.map(f => `<li>${f}</li>`).join('')}</ul>
            </div>
            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://your-vercel-url.vercel.app'}" class="btn">Go to VideoStream Pro</a>
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

    // Add more options for production
    const mailOptions = {
      from: `"VideoStream Pro" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🎬 ${data.planName} - Payment Confirmation`,
      html,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high',
      },
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Invoice email sent to ${email}`);
    return true;
  } catch (error: any) {
    console.error('❌ Email failed:', error.message);
    return false;
  }
}