import sgMail from '@sendgrid/mail';
import { EmailService, EmailVerificationData, PasswordResetData } from '../../domain/services/EmailService';

export class SendGridEmailService implements EmailService {
  private readonly fromEmail: string;

  constructor(apiKey: string, fromEmail: string) {
    // Validate API key
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('SendGrid API key is required');
    }
    
    if (!apiKey.startsWith('SG.')) {
      console.warn('⚠️  SendGrid API key format may be incorrect (should start with SG.)');
    }

    // Validate from email
    if (!fromEmail || fromEmail.trim() === '') {
      throw new Error('SendGrid from email is required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(fromEmail)) {
      throw new Error(`Invalid email format for SENDGRID_FROM_EMAIL: ${fromEmail}`);
    }

    try {
      sgMail.setApiKey(apiKey);
      this.fromEmail = fromEmail;
      console.log(`✅ SendGrid email service initialized with sender: ${fromEmail}`);
    } catch (error) {
      throw new Error(`Failed to initialize SendGrid: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async sendVerificationEmail(data: EmailVerificationData): Promise<void> {
    const msg = {
      to: data.email,
      from: this.fromEmail,
      subject: 'Verify your email address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to our E-commerce Platform!</h2>
          <p>Hi ${data.name},</p>
          <p>Thank you for registering. Please verify your email address by clicking the link below:</p>
          <p style="margin: 30px 0;">
            <a href="${data.verificationUrl}" 
               style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Verify Email
            </a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${data.verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account, please ignore this email.</p>
        </div>
      `
    };

    try {
      console.log(`📧 Sending verification email to: ${data.email}`);
      await sgMail.send(msg);
      console.log(`✅ Verification email sent successfully to: ${data.email}`);
    } catch (error: any) {
      console.error('❌ Error sending verification email:', error);
      
      if (error.response) {
        const statusCode = error.response.statusCode || error.code;
        const errorBody = error.response.body;
        const errorMessage = errorBody?.errors?.[0]?.message || error.message;
        
        console.error(`SendGrid API Error (Status: ${statusCode}):`, JSON.stringify(errorBody, null, 2));
        
        // Provide helpful error messages based on status code
        if (statusCode === 403 || error.code === 403) {
          throw new Error(
            `SendGrid Forbidden Error: ${errorMessage}\n` +
            `This usually means:\n` +
            `1. The sender email (${this.fromEmail}) is not verified in SendGrid\n` +
            `2. The API key doesn't have Mail Send permissions\n` +
            `3. The API key is invalid or revoked\n` +
            `Please check your SendGrid configuration.`
          );
        } else if (statusCode === 401) {
          throw new Error(
            `SendGrid Unauthorized Error: ${errorMessage}\n` +
            `The API key is invalid or doesn't have the required permissions.`
          );
        } else {
          throw new Error(`Failed to send verification email: ${errorMessage}`);
        }
      }
      
      throw new Error(`Failed to send verification email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async sendPasswordResetEmail(data: PasswordResetData): Promise<void> {
    const msg = {
      to: data.email,
      from: this.fromEmail,
      subject: 'Reset your password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Hi ${data.name},</p>
          <p>We received a request to reset your password. Click the link below to reset it:</p>
          <p style="margin: 30px 0;">
            <a href="${data.resetUrl}" 
               style="background-color: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Reset Password
            </a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${data.resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, please ignore this email.</p>
        </div>
      `
    };

    try {
      console.log(`📧 Sending password reset email to: ${data.email}`);
      await sgMail.send(msg);
      console.log(`✅ Password reset email sent successfully to: ${data.email}`);
    } catch (error: any) {
      console.error('❌ Error sending password reset email:', error);
      
      if (error.response) {
        const statusCode = error.response.statusCode || error.code;
        const errorBody = error.response.body;
        const errorMessage = errorBody?.errors?.[0]?.message || error.message;
        
        console.error(`SendGrid API Error (Status: ${statusCode}):`, JSON.stringify(errorBody, null, 2));
        
        if (statusCode === 403 || error.code === 403) {
          throw new Error(
            `SendGrid Forbidden Error: ${errorMessage}\n` +
            `This usually means:\n` +
            `1. The sender email (${this.fromEmail}) is not verified in SendGrid\n` +
            `2. The API key doesn't have Mail Send permissions\n` +
            `3. The API key is invalid or revoked\n` +
            `Please check your SendGrid configuration.`
          );
        } else if (statusCode === 401) {
          throw new Error(
            `SendGrid Unauthorized Error: ${errorMessage}\n` +
            `The API key is invalid or doesn't have the required permissions.`
          );
        } else {
          throw new Error(`Failed to send password reset email: ${errorMessage}`);
        }
      }
      
      throw new Error(`Failed to send password reset email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async sendPasswordResetConfirmation(email: string, name: string): Promise<void> {
    const msg = {
      to: email,
      from: this.fromEmail,
      subject: 'Password reset successful',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Successful</h2>
          <p>Hi ${name},</p>
          <p>Your password has been successfully reset.</p>
          <p>If you didn't make this change, please contact us immediately.</p>
        </div>
      `
    };

    try {
      console.log(`📧 Sending password reset confirmation to: ${email}`);
      await sgMail.send(msg);
      console.log(`✅ Password reset confirmation sent successfully to: ${email}`);
    } catch (error: any) {
      console.error('⚠️  Error sending password reset confirmation (non-critical):', error);
      if (error.response) {
        console.error('SendGrid API Error:', error.response.body);
      }
      // Don't throw here - confirmation email failure shouldn't break the flow
    }
  }
}

