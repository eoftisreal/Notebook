const { isR2Configured } = require('./r2');

function isAdminUser(user) {
  return Boolean(user && (user.isAdmin === true || user.role === 'admin'));
}

function assertAdmin(user) {
  if (!isAdminUser(user)) {
    const error = new Error('Admin access required');
    error.statusCode = 403;
    throw error;
  }
}

function getAdminSettings() {
  return {
    cloudflareR2Enabled: isR2Configured(),
    paymentGateway: 'upi',
    upiId: '',
    upiPayeeName: '',
    qrExpiryMinutes: 10,
    verificationTimeout: 60,
    utrEnabled: true,
    screenshotEnabled: true,
    authMode: 'magic-link',
  };
}

module.exports = {
  isAdminUser,
  assertAdmin,
  getAdminSettings,
};
