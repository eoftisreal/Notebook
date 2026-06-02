const { Resend } = require('resend');
const env = require('../config/env');

const resend = env.resendApiKey ? new Resend(env.resendApiKey) : null;

async function sendEmail({ to, subject, html }) {
  if (!resend) {
    console.log(`[Resend Skipped] To: ${to} | Subject: ${subject}`);
    console.log(`[Content] ${html}`);
    return { skipped: true, reason: 'RESEND_API_KEY not configured' };
  }

  try {
    await resend.emails.send({
      from: env.emailFrom,
      to,
      subject,
      html,
    });
    return { skipped: false };
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

async function sendVerificationEmail(email, verifyUrl) {
  return sendEmail({
    to: email,
    subject: 'Verify your KapdaKraft account',
    html: `<p>Welcome to KapdaKraft! Click below to verify your email address:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
  });
}

async function sendMagicLinkEmail(email, magicUrl) {
  return sendEmail({
    to: email,
    subject: 'Your KapdaKraft Magic Login Link',
    html: `<p>Click the link below to sign in instantly:</p><p><a href="${magicUrl}">${magicUrl}</a></p><p>This link expires in 15 minutes.</p>`,
  });
}

async function sendPasswordResetEmail(email, resetUrl) {
  return sendEmail({
    to: email,
    subject: 'Reset your KapdaKraft password',
    html: `<p>Click below to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you didn't request this, you can ignore this email.</p>`,
  });
}

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendMagicLinkEmail,
  sendPasswordResetEmail,
};
