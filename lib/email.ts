import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export async function sendOTPEmail(email: string, otp: string) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
      <div style="background: white; padding: 30px; border-radius: 10px; text-align: center;">
        <h2 style="color: #667eea;">🔐 Verification Code</h2>
        <p>Your OTP for login is:</p>
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 5px; color: #667eea; padding: 15px; background: #f0f0f0; border-radius: 8px; margin: 20px 0;">
          ${otp}
        </div>
        <p>Valid for 10 minutes.</p>
      </div>
    </div>
  `;
  
  await transporter.sendMail({
    from: `"VideoStream Pro" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your Login OTP',
    html
  });
}

export async function sendInvoiceEmail(email: string, data: { planName: string; amount: number; paymentId: string }) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white;">Payment Confirmation</h1>
      </div>
      <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px;">
        <h2>Thank you for your purchase!</h2>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Plan:</strong> ${data.planName}</p>
          <p><strong>Amount:</strong> ₹${data.amount}</p>
          <p><strong>Payment ID:</strong> ${data.paymentId}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <p>Your plan has been activated. Enjoy!</p>
      </div>
    </div>
  `;
  
  await transporter.sendMail({
    from: `"VideoStream Pro" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Payment Confirmation & Invoice',
    html
  });
}