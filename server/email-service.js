import nodemailer from "nodemailer";

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // For development, use Ethereal email (test account)
    if (process.env.NODE_ENV === 'development') {
      // Create test account if no real email credentials are provided
      if (!process.env.EMAIL_HOST) {
        console.log("No email configuration found. Using test mode for development.");
        return;
      }
    }

    // Configure with environment variables for production
    this.transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async send2FACode(email, code) {
    const subject = "InCloud - Two-Factor Authentication Code";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">InCloud Inventory</h1>
        </div>
        
        <div style="padding: 30px; background-color: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Two-Factor Authentication Code</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            Someone is trying to sign in to your InCloud account. If this was you, please use the verification code below:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; display: inline-block;">
              <span style="font-size: 32px; font-weight: bold; color: #1976d2; letter-spacing: 4px; font-family: 'Courier New', monospace;">
                ${code}
              </span>
            </div>
          </div>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              <strong>Security Notice:</strong> This code will expire in 10 minutes. If you didn't request this code, please ignore this email or contact support if you have concerns about your account security.
            </p>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Best regards,<br>
            The InCloud Team
          </p>
        </div>
        
        <div style="background-color: #e9ecef; padding: 15px; text-align: center; font-size: 12px; color: #6c757d;">
          <p style="margin: 0;">This is an automated message from InCloud Inventory Management System.</p>
        </div>
      </div>
    `;

    return this.sendEmail(email, subject, html);
  }

  async sendPasswordReset(email, code) {
    const subject = "InCloud - Password Reset Code";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">InCloud Inventory</h1>
        </div>
        
        <div style="padding: 30px; background-color: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            We received a request to reset your InCloud account password. Use the verification code below to proceed with resetting your password:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; display: inline-block; border: 2px solid #ffc107;">
              <span style="font-size: 28px; font-weight: bold; color: #856404; letter-spacing: 3px; font-family: 'Courier New', monospace;">
                ${code}
              </span>
            </div>
          </div>
          
          <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #721c24; font-size: 14px;">
              <strong>Important:</strong> This reset code will expire in 15 minutes. If you didn't request a password reset, please ignore this email. Your account remains secure.
            </p>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            For security reasons, never share this code with anyone. InCloud support will never ask for your verification codes.
          </p>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Best regards,<br>
            The InCloud Team
          </p>
        </div>
        
        <div style="background-color: #e9ecef; padding: 15px; text-align: center; font-size: 12px; color: #6c757d;">
          <p style="margin: 0;">This is an automated message from InCloud Inventory Management System.</p>
        </div>
      </div>
    `;

    return this.sendEmail(email, subject, html);
  }

  async sendEmail(to, subject, html) {
    try {
      if (!this.transporter) {
        console.log(`[DEV MODE] Email would be sent to: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`HTML content prepared`);
        return { success: true, messageId: 'dev-mode' };
      }

      const info = await this.transporter.sendMail({
        from: `"InCloud Inventory" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to: to,
        subject: subject,
        html: html,
      });

      console.log(`Email sent successfully: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Email sending failed:', error);
      return { success: false, error: error.message };
    }
  }
}

export const emailService = new EmailService();