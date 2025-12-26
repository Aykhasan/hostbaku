import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendOTPEmail(
  email: string,
  code: string,
  name: string
): Promise<void> {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@hostbaku.com',
    to: email,
    subject: 'Your HostBaku Login Code',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
          <div style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #267a54; font-size: 28px; margin: 0; font-weight: 600;">HostBaku</h1>
            </div>
            
            <p style="color: #333; font-size: 16px; margin-bottom: 24px;">
              Hi ${name},
            </p>
            
            <p style="color: #666; font-size: 15px; margin-bottom: 24px;">
              Your login verification code is:
            </p>
            
            <div style="background-color: #f0f9f4; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
              <span style="font-size: 36px; font-weight: bold; color: #267a54; letter-spacing: 8px;">${code}</span>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-bottom: 24px;">
              This code will expire in 10 minutes. If you didn't request this code, please ignore this email.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              HostBaku Property Management<br>
              Baku, Azerbaijan
            </p>
          </div>
        </body>
      </html>
    `,
    text: `Hi ${name},\n\nYour HostBaku login code is: ${code}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.\n\nHostBaku Property Management`,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendNotificationEmail(
  email: string,
  subject: string,
  content: string
): Promise<void> {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@hostbaku.com',
    to: email,
    subject,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #267a54; font-size: 28px; margin: 0; font-weight: 600;">HostBaku</h1>
            </div>
            
            ${content}
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              HostBaku Property Management<br>
              Baku, Azerbaijan
            </p>
          </div>
        </body>
      </html>
    `,
    text: content.replace(/<[^>]*>/g, ''),
  };

  await transporter.sendMail(mailOptions);
}
