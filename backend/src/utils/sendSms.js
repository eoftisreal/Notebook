const twilio = require('twilio');
const env = require('../config/env');

const client = env.twilioAccountSid && env.twilioAuthToken
  ? twilio(env.twilioAccountSid, env.twilioAuthToken)
  : null;

async function sendSMS(to, body) {
  if (!client) {
    return { skipped: true, reason: 'Twilio not configured', previewUrl: null };
  }

  await client.messages.create({
    body,
    from: env.twilioPhoneNumber,
    to,
  });

  return { skipped: false };
}

module.exports = { sendSMS };
