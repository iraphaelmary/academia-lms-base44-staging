// OWASP Top 10 & ISO 27001 Security Utilities
// A01:2021 - Broken Access Control
// A02:2021 - Cryptographic Failures
// A03:2021 - Injection
// A07:2021 - Identification and Authentication Failures

import DOMPurify from 'dompurify';

// Input Sanitization - Prevents XSS (A03)
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'a', 'code', 'pre'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false
  });
};

// Plain text sanitization (no HTML allowed)
export const sanitizePlainText = (input) => {
  if (typeof input !== 'string') return input;
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
};

// URL Validation - Prevents SSRF and Open Redirect
export const validateUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    const allowedProtocols = ['https:', 'http:'];
    const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
    
    if (!allowedProtocols.includes(parsed.protocol)) return false;
    if (blockedHosts.some(h => parsed.hostname.includes(h))) return false;
    if (/^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/.test(parsed.hostname)) return false;
    
    return true;
  } catch {
    return false;
  }
};

// Email Validation
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 254;
};

// Input Length Validation
export const validateLength = (input, min = 0, max = Infinity) => {
  if (typeof input !== 'string') return false;
  return input.length >= min && input.length <= max;
};

// Rate Limiting Helper (client-side tracking)
const rateLimitStore = new Map();

export const checkRateLimit = (action, maxAttempts = 5, windowMs = 60000) => {
  const now = Date.now();
  const key = action;
  const record = rateLimitStore.get(key) || { count: 0, resetAt: now + windowMs };
  
  if (now > record.resetAt) {
    record.count = 0;
    record.resetAt = now + windowMs;
  }
  
  record.count++;
  rateLimitStore.set(key, record);
  
  return {
    allowed: record.count <= maxAttempts,
    remaining: Math.max(0, maxAttempts - record.count),
    resetAt: record.resetAt
  };
};

// Content Security Policy helpers
export const escapeHtml = (str) => {
  if (typeof str !== 'string') return str;
  const htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };
  return str.replace(/[&<>"'/]/g, char => htmlEscapes[char]);
};

// File Upload Validation
export const validateFileUpload = (file, options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'application/pdf'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.pdf']
  } = options;
  
  const errors = [];
  
  if (file.size > maxSize) {
    errors.push(`File size exceeds maximum allowed (${Math.round(maxSize / 1024 / 1024)}MB)`);
  }
  
  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type "${file.type}" is not allowed`);
  }
  
  const extension = '.' + file.name.split('.').pop().toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    errors.push(`File extension "${extension}" is not allowed`);
  }
  
  // Check for double extensions (malicious files)
  const nameParts = file.name.split('.');
  if (nameParts.length > 2) {
    const suspiciousExtensions = ['.exe', '.js', '.php', '.asp', '.jsp', '.sh', '.bat'];
    if (nameParts.some((part, i) => i < nameParts.length - 1 && suspiciousExtensions.includes('.' + part.toLowerCase()))) {
      errors.push('Suspicious file name detected');
    }
  }
  
  return { valid: errors.length === 0, errors };
};

// Session Activity Tracking (ISO 27001 - A.9.4.2)
export const trackUserActivity = () => {
  let lastActivity = Date.now();
  
  const updateActivity = () => {
    lastActivity = Date.now();
  };
  
  if (typeof window !== 'undefined') {
    ['click', 'keydown', 'scroll', 'mousemove'].forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true });
    });
  }
  
  return {
    getLastActivity: () => lastActivity,
    isIdle: (timeoutMs = 30 * 60 * 1000) => Date.now() - lastActivity > timeoutMs
  };
};

// Password Strength Validation
export const validatePasswordStrength = (password) => {
  const checks = {
    minLength: password.length >= 12,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    noCommonPatterns: !/^(password|123456|qwerty|abc123)/i.test(password)
  };
  
  const score = Object.values(checks).filter(Boolean).length;
  
  return {
    valid: score >= 5,
    score,
    checks,
    strength: score < 3 ? 'weak' : score < 5 ? 'medium' : 'strong'
  };
};

// CSRF Token Generation (client-side helper)
export const generateNonce = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Audit Log Helper
export const createAuditEntry = (action, resourceType, resourceId, details = {}) => {
  return {
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    details: {
      ...details,
      client_timestamp: new Date().toISOString(),
      page_url: typeof window !== 'undefined' ? window.location.pathname : null
    },
    timestamp: new Date().toISOString(),
    severity: getSeverity(action)
  };
};

const getSeverity = (action) => {
  const critical = ['delete_course', 'permission_change', 'failed_login', 'suspicious_activity'];
  const warning = ['payment', 'update_course', 'password_change'];
  
  if (critical.includes(action)) return 'critical';
  if (warning.includes(action)) return 'warning';
  return 'info';
};

// Data Masking (ISO 27001 - A.8.11)
export const maskEmail = (email) => {
  if (!email) return '';
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const maskedLocal = local.charAt(0) + '***' + (local.length > 1 ? local.charAt(local.length - 1) : '');
  return `${maskedLocal}@${domain}`;
};

export const maskPhoneNumber = (phone) => {
  if (!phone) return '';
  return phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2');
};

// Secure JSON Parse (prevents prototype pollution)
export const secureJsonParse = (jsonString) => {
  const obj = JSON.parse(jsonString);
  
  const sanitize = (item) => {
    if (typeof item !== 'object' || item === null) return item;
    
    const clean = Array.isArray(item) ? [] : Object.create(null);
    
    for (const key of Object.keys(item)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      clean[key] = sanitize(item[key]);
    }
    
    return clean;
  };
  
  return sanitize(obj);
};

export default {
  sanitizeInput,
  sanitizePlainText,
  validateUrl,
  validateEmail,
  validateLength,
  checkRateLimit,
  escapeHtml,
  validateFileUpload,
  trackUserActivity,
  validatePasswordStrength,
  generateNonce,
  createAuditEntry,
  maskEmail,
  maskPhoneNumber,
  secureJsonParse
};