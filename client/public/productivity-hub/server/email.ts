import { Resend } from 'resend';

// Email configuration - Use Resend's onboarding domain for testing
const VERIFIED_SENDER = process.env.VERIFIED_SENDER_EMAIL || 'delivered@resend.dev';
const DOMAIN = process.env.EMAIL_DOMAIN || 'resend.dev';

let resend: Resend | null = null;

if (!process.env.RESEND_API_KEY) {
  console.warn('⚠️ RESEND_API_KEY not found. Email functionality will be disabled.');
  console.warn('📧 In development mode, emails will be logged to console instead.');
} else {
  resend = new Resend(process.env.RESEND_API_KEY);
  console.log('✅ Resend initialized with verified sender:', VERIFIED_SENDER);
}

export interface EmailData {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

// Helper functions for generating email addresses
export function getEmailAddress(type: 'noreply' | 'welcome' | 'support' | 'team'): string {
  // Always use verified sender in production, but show semantic addresses in templates
  return VERIFIED_SENDER;
}

export function getDisplayFromAddress(type: 'noreply' | 'welcome' | 'support' | 'team'): string {
  // These are the display names that show in email clients
  const addresses = {
    noreply: `Productivity Hub <${VERIFIED_SENDER}>`,
    welcome: `Productivity Hub Welcome <${VERIFIED_SENDER}>`,
    support: `Productivity Hub Support <${VERIFIED_SENDER}>`,
    team: `Productivity Hub Teams <${VERIFIED_SENDER}>`
  };
  return addresses[type];
}

export async function sendEmail(emailData: EmailData): Promise<boolean> {
  if (!resend) {
    console.log('📧 DEVELOPMENT MODE: Email would be sent');
    console.log('   To:', emailData.to);
    console.log('   From:', emailData.from);
    console.log('   Subject:', emailData.subject);
    console.log('   Content:', emailData.text || emailData.html?.substring(0, 200) + '...');
    return true; // Return true in development without Resend
  }

  try {
    // Preserve display name if provided, but use verified sender for email address
    let fromAddress;
    if (emailData.from.includes('<') && emailData.from.includes('>')) {
      // Extract display name from "Display Name <email@domain.com>" format
      const displayName = emailData.from.split('<')[0].trim();
      fromAddress = `${displayName} <${VERIFIED_SENDER}>`;
    } else {
      // Use verified sender with default display name
      fromAddress = `Productivity Hub <${VERIFIED_SENDER}>`;
    }
    
    console.log('Attempting to send email via Resend:', {
      to: emailData.to,
      from: fromAddress,
      subject: emailData.subject
    });
    
    const emailPayload: any = {
      from: fromAddress,
      to: emailData.to,
      subject: emailData.subject
    };

    // Resend requires either text OR html content
    if (emailData.html) {
      emailPayload.html = emailData.html;
    } else if (emailData.text) {
      emailPayload.text = emailData.text;
    } else {
      // Fallback to a basic text message
      emailPayload.text = 'This is a notification from Productivity Hub.';
    }

    const result = await resend.emails.send(emailPayload);
    
    if (result.error) {
      console.error('❌ Resend API error:', result.error);
      return false;
    }
    
    console.log('✅ Email sent successfully via Resend to:', emailData.to, 'ID:', result.data?.id);
    return true;
  } catch (error: any) {
    console.error('❌ Failed to send email via Resend:', error);
    
    // For development, continue without throwing error
    console.log('⚠️ Continuing without email verification due to Resend error');
    return false; // Return false to indicate email failed but don't crash
  }
}