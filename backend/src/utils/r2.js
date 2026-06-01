const env = require('../config/env');

function normalizeObjectKey(objectKey) {
  return String(objectKey || '')
    .trim()
    .replace(/^\/+/, '')
    .replace(/\/+/g, '/');
}

function getR2BaseUrl() {
  if (env.r2PublicBaseUrl) {
    return env.r2PublicBaseUrl.replace(/\/$/, '');
  }

  if (env.r2Bucket && env.r2AccountId) {
    return `https://${env.r2Bucket}.${env.r2AccountId}.r2.cloudflarestorage.com`;
  }

  return '';
}

function isR2Configured() {
  return Boolean(getR2BaseUrl());
}

function getObjectUrl(objectKey) {
  const key = normalizeObjectKey(objectKey);
  if (!key) {
    throw new Error('R2 object key is required');
  }

  const baseUrl = getR2BaseUrl();
  if (!baseUrl) {
    throw new Error('Cloudflare R2 is not configured');
  }

  return `${baseUrl}/${encodeURI(key)}`;
}

module.exports = {
  normalizeObjectKey,
  getR2BaseUrl,
  isR2Configured,
  getObjectUrl,
};
