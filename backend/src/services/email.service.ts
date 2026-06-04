// =============================================================================
// EMAIL SERVICE — Phase 7
// Delivers transactional emails via the Resend SDK.
// All templates are inline HTML — no external template engine dependency.
// =============================================================================

import { Resend } from 'resend';
import logger from '../utils/logger';

// ─── Client (lazy singleton) ──────────────────────────────────────────────────
function getResendClient(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key || key === 're_YOUR_API_KEY') {
    throw new Error(
      '[Email] RESEND_API_KEY is not configured. ' +
      'Get your key at https://resend.com and add it to .env'
    );
  }
  return new Resend(key);
}

const FROM_ADDRESS = process.env.EMAIL_FROM ?? 'CarbonTrack <onboarding@resend.dev>';
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:3000';

// ─── Shared HTML shell ────────────────────────────────────────────────────────
function emailShell(bodyContent: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>CarbonTrack</title>
</head>
<body style="margin:0;padding:0;background-color:#0b1326;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0b1326;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
               style="background-color:#171f33;border-radius:16px;border:1px solid #1e2d4a;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#064e3b,#065f46);padding:32px 40px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:rgba(52,211,153,0.15);border-radius:10px;padding:8px 10px;margin-right:12px;">
                    <span style="font-size:20px;">🌿</span>
                  </td>
                  <td style="padding-left:12px;">
                    <span style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">CarbonTrack</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              ${bodyContent}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 32px;border-top:1px solid #1e2d4a;">
              <p style="margin:0;font-size:12px;color:#475569;line-height:1.6;">
                This email was sent by CarbonTrack. If you didn't expect it, you can safely ignore it.<br/>
                © ${new Date().getFullYear()} CarbonTrack · Enterprise Carbon Intelligence
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── CTA Button helper ────────────────────────────────────────────────────────
function ctaButton(href: string, label: string, color = '#10b981'): string {
  return `
<table cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
  <tr>
    <td style="border-radius:12px;background-color:${color};">
      <a href="${href}"
         style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;
                color:#0b1326;text-decoration:none;border-radius:12px;letter-spacing:0.2px;">
        ${label}
      </a>
    </td>
  </tr>
</table>`;
}

// =============================================================================
// sendInvitationEmail
// Sent to a new team member when an Admin invites them to their company workspace.
// =============================================================================
export async function sendInvitationEmail(
  toEmail: string,
  recipientName: string,
  companyName: string,
  inviteToken: string
): Promise<void> {
  const resend = getResendClient();
  const activationLink = `${FRONTEND_URL}/accept-invite?token=${inviteToken}`;

  const body = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#ffffff;line-height:1.3;">
      You've been invited to join ${companyName}
    </h1>
    <p style="margin:0 0 24px;font-size:16px;color:#94a3b8;line-height:1.6;">
      Hi ${recipientName},<br/><br/>
      <strong style="color:#cbd5e1;">${companyName}</strong> has invited you to their
      CarbonTrack workspace as a team member.
      Click the button below to set your password and activate your account.
    </p>

    <div style="background-color:#0f1624;border:1px solid #1e2d4a;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
      <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#475569;font-weight:600;">Your workspace</p>
      <p style="margin:0;font-size:16px;font-weight:600;color:#10b981;">${companyName}</p>
    </div>

    ${ctaButton(activationLink, 'Activate Account & Set Password')}

    <p style="margin:20px 0 0;font-size:13px;color:#475569;line-height:1.6;">
      This invitation link expires in <strong style="color:#94a3b8;">48 hours</strong>.<br/>
      If you can't click the button, paste this link into your browser:<br/>
      <a href="${activationLink}" style="color:#10b981;word-break:break-all;">${activationLink}</a>
    </p>`;

  const { error } = await resend.emails.send({
    from:    FROM_ADDRESS,
    to:      toEmail,
    subject: `You're invited to join ${companyName} on CarbonTrack`,
    html:    emailShell(body),
  });

  if (error) {
    logger.error(`[Email] sendInvitationEmail failed for ${toEmail}: ${JSON.stringify(error)}`);
    throw new Error(`Email delivery failed: ${error.message}`);
  }

  logger.info(`[Email] Invitation sent → ${toEmail} (company: ${companyName})`);
}

// =============================================================================
// sendPasswordResetEmail
// Sent when an existing user requests a password reset.
// =============================================================================
export async function sendPasswordResetEmail(
  toEmail: string,
  resetToken: string
): Promise<void> {
  const resend = getResendClient();
  const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

  const body = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#ffffff;line-height:1.3;">
      Reset your password
    </h1>
    <p style="margin:0 0 24px;font-size:16px;color:#94a3b8;line-height:1.6;">
      We received a request to reset the password for your CarbonTrack account
      associated with <strong style="color:#cbd5e1;">${toEmail}</strong>.<br/><br/>
      Click the button below to choose a new password.
    </p>

    ${ctaButton(resetLink, 'Reset Password', '#8b5cf6')}

    <p style="margin:20px 0 0;font-size:13px;color:#475569;line-height:1.6;">
      This link expires in <strong style="color:#94a3b8;">1 hour</strong> for security.<br/>
      If you didn't request a password reset, you can safely ignore this email —
      your account remains secure.<br/><br/>
      If you can't click the button, copy this URL into your browser:<br/>
      <a href="${resetLink}" style="color:#8b5cf6;word-break:break-all;">${resetLink}</a>
    </p>`;

  const { error } = await resend.emails.send({
    from:    FROM_ADDRESS,
    to:      toEmail,
    subject: 'Reset your CarbonTrack password',
    html:    emailShell(body),
  });

  if (error) {
    logger.error(`[Email] sendPasswordResetEmail failed for ${toEmail}: ${JSON.stringify(error)}`);
    throw new Error(`Email delivery failed: ${error.message}`);
  }

  logger.info(`[Email] Password reset email sent → ${toEmail}`);
}
