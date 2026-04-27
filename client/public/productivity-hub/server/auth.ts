import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { storage } from './storage';
import { sendEmail, getDisplayFromAddress } from './email';

// JWT_SECRET is required - no fallback to prevent security issues
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error(
    'FATAL: JWT_SECRET environment variable is required. ' +
    'Set JWT_SECRET before starting the server. ' +
    'Generate a secure random value: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
  );
}

const FRONTEND_URL = process.env.FRONTEND_URL || (process.env.REPLIT_DEV_DOMAIN
  ? `https://${process.env.REPLIT_DEV_DOMAIN}`
  : 'http://localhost:5000');

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  isVerified: boolean;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      name: user.name,
      isVerified: user.isVerified 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function generateVerificationToken(email: string): string {
  return jwt.sign({ email, type: 'verification' }, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function sendVerificationEmail(email: string, name: string): Promise<{ token: string; success: boolean }> {
  const token = generateVerificationToken(email);

  const emailContent = {
    to: email,
    from: getDisplayFromAddress('noreply'),
    subject: 'Welcome to Flowsstate - Verify Your Email',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3b82f6; margin: 0;">Flowsstate</h1>
          <p style="color: #64748b; margin: 5px 0;">Your Personal Productivity Platform</p>
        </div>

        <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
          <h2 style="color: white; margin: 0 0 15px 0;">Welcome to Flowsstate, ${name}!</h2>
          <p style="color: #e0e7ff; margin: 0;">Thank you for joining our community of productivity enthusiasts.</p>
        </div>

        <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
          <h3 style="color: #1e293b; margin: 0 0 15px 0;">Verify Your Email Address</h3>
          <p style="color: #475569; margin: 0 0 20px 0;">
            To get started with your productivity journey, please verify your email address:
          </p>

          <div style="background: #e0f2fe; padding: 20px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #0284c7;">
            <p style="color: #0c4a6e; margin: 0 0 10px 0; font-weight: bold;">Your Verification Code:</p>
            <p style="color: #0284c7; margin: 0; font-size: 24px; letter-spacing: 2px; font-weight: bold; font-family: monospace; word-break: break-all;">
              ${token.substring(0, 32)}...
            </p>
          </div>

          <p style="color: #64748b; font-size: 13px; margin: 15px 0;">
            Copy the code above and paste it in the verification page, or click the button below:
          </p>

          <div style="text-align: center;">
            <a href="${FRONTEND_URL}/verify-email"
               style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold;">
              Go to Verification Page
            </a>
          </div>
        </div>

        <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <h4 style="color: #1e293b; margin: 0 0 10px 0;">What's Next?</h4>
          <ul style="color: #475569; margin: 0; padding-left: 20px;">
            <li>Set up your first productivity goals</li>
            <li>Create daily habits to track</li>
            <li>Organize tasks with our Kanban boards</li>
            <li>Use the Pomodoro timer for focused work</li>
            <li>Invite team members to collaborate</li>
          </ul>
        </div>

        <div style="text-align: center; padding: 20px; color: #64748b; font-size: 14px;">
          <p>If you didn't create this account, please ignore this email.</p>
          <p>This verification code will expire in 24 hours.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
          <p>© 2025 Flowsstate. Built for modern professionals.</p>
        </div>
      </div>
    `
  };

  const success = await sendEmail(emailContent);
  return { token, success };
}

export async function sendWelcomeEmail(email: string, name: string): Promise<boolean> {
  const emailContent = {
    to: email,
    from: getDisplayFromAddress('welcome'),
    subject: '🎉 Welcome to Flowsstate - Let\'s Get Started!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3b82f6; margin: 0;">🎉 Welcome Aboard, ${name}!</h1>
        </div>
        
        <div style="background: linear-gradient(135deg, #10b981, #3b82f6); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
          <h2 style="color: white; margin: 0 0 15px 0;">Your Account is Ready!</h2>
          <p style="color: #e0f2fe; margin: 0;">Start building better productivity habits today.</p>
        </div>
        
        <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
          <h3 style="color: #1e293b; margin: 0 0 15px 0;">Quick Start Guide</h3>
          <div style="margin-bottom: 15px;">
            <h4 style="color: #3b82f6; margin: 0 0 5px 0;">1. Create Your First Task</h4>
            <p style="color: #475569; margin: 0;">Use our Kanban board to organize your work into clear, actionable tasks.</p>
          </div>
          <div style="margin-bottom: 15px;">
            <h4 style="color: #8b5cf6; margin: 0 0 5px 0;">2. Set Up Daily Habits</h4>
            <p style="color: #475569; margin: 0;">Track daily habits and build consistent routines for long-term success.</p>
          </div>
          <div>
            <h4 style="color: #f59e0b; margin: 0 0 5px 0;">3. Start a Focus Session</h4>
            <p style="color: #475569; margin: 0;">Use our built-in Pomodoro timer for distraction-free work periods.</p>
          </div>
        </div>
        
        <div style="text-align: center; margin-bottom: 25px;">
          <a href="${FRONTEND_URL}" 
             style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">
            Launch Flowsstate
          </a>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #64748b; font-size: 14px;">
          <p>Need help? Reply to this email and our team will assist you.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
          <p>© 2025 Flowsstate. Empowering productivity, one task at a time.</p>
        </div>
      </div>
    `
  };
  
  return await sendEmail(emailContent);
}