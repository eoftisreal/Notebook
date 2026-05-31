const sendgrid = require('@sendgrid/mail');
const env = require('../config/env');

if (env.sendgridApiKey) {
  sendgrid.setApiKey(env.sendgridApiKey);
}

async function sendMagicLinkEmail(email, magicUrl) {
  if (!env.sendgridApiKey) {
    return { skipped: true, reason: 'SENDGRID_API_KEY not configured', previewUrl: magicUrl };
  }

  await sendgrid.send({
    to: email,
    from: env.emailFrom,
    subject: 'Your secure magic sign-in link',
    html: `<p>Click to sign in:</p><p><a href="${magicUrl}">${magicUrl}</a></p><p>This link expires in 15 minutes.</p>`,
  });

  return { skipped: false };
}

module.exports = { sendMagicLinkEmail };
