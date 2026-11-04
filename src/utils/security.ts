/**
 * Security and Sanitization Utilities
 * Protects against XSS, Open Redirects, Protocol Smuggling, and Path Traversal.
 */

/**
 * Validates that a string is a strictly safe HTTP or HTTPS URL.
 * Rejects javascript:, data:, file:, vbscript:, and malformed protocol schemes.
 */
export function isValidHttpUrl(rawUrl: string): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  const trimmed = rawUrl.trim();
  
  // Fast regex rejection for known dangerous schemes
  if (/^(javascript|data|vbscript|file|blob|about):/i.test(trimmed)) {
    return false;
  }

  // Reject CRLF or carriage return injections
  if (/[\r\n\t]/.test(trimmed)) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    // Enforce protocol is strictly http: or https:
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    // Reject embedded credentials (https://trusted.com@evil.com phishing/confusion)
    if (parsed.username || parsed.password) {
      return false;
    }
    // Must have a valid non-empty hostname
    if (!parsed.hostname || parsed.hostname.trim() === '') {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely validates and formats a destination redirect URL.
 * Returns the sanitized URL or null if unsafe.
 */
export function sanitizeRedirectUrl(rawUrl: string): string | null {
  if (!isValidHttpUrl(rawUrl)) {
    return null;
  }
  try {
    const parsed = new URL(rawUrl.trim());
    return parsed.href;
  } catch {
    return null;
  }
}

/**
 * Safely validates a download/media URL.
 * Allows http:, https:, origin-scoped blob:https?://, and an explicit allowlist of non-executable data: MIME types.
 */
export function sanitizeDownloadUrl(rawUrl: string): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (/[\r\n\t]/.test(trimmed)) return null;

  if (isValidHttpUrl(trimmed)) {
    return sanitizeRedirectUrl(trimmed);
  }
  if (/^blob:https?:\/\/[^\s]+$/i.test(trimmed)) {
    return trimmed;
  }
  if (/^data:/i.test(trimmed)) {
    // Allowlist strictly non-active media, document, and plain-text data URLs
    const safeDataUrlPattern =
      /^data:(image\/(png|jpeg|jpg|gif|webp|bmp|ico)|application\/(pdf|json|zip|octet-stream)|text\/(plain|csv|markdown)|audio\/[a-z0-9.+-]+|video\/[a-z0-9.+-]+)(;[a-z0-9=._-]+)*,/i;
    if (safeDataUrlPattern.test(trimmed)) {
      return trimmed;
    }
    return null;
  }
  return null;
}

/**
 * Validates that a shortlink slug is strictly URL- and Firestore-path-safe (1..100 chars, alphanumeric, hyphen, underscore).
 */
export function isValidSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') return false;
  return /^[a-zA-Z0-9_-]{1,100}$/.test(slug.trim());
}

/**
 * Validates a Firestore / localStorage document ID against path traversal (/ or ..) and control characters.
 * Returns the trimmed ID if valid, or generates a fresh CSPRNG ID with fallbackPrefix.
 */
export function sanitizeDocId(rawId: unknown, fallbackPrefix = 'id'): string {
  if (typeof rawId === 'string') {
    const trimmed = rawId.trim();
    if (
      trimmed.length >= 1 &&
      trimmed.length <= 128 &&
      trimmed !== '.' &&
      trimmed !== '..' &&
      !trimmed.includes('..') &&
      /^[a-zA-Z0-9_.-]+$/.test(trimmed)
    ) {
      return trimmed;
    }
  }
  return generateSecureId(fallbackPrefix, 10);
}

/**
 * Sanitizes uploaded file names to prevent path traversal (../, ..\\)
 * and storage bucket key manipulation.
 */
export function sanitizeFileName(name: string): string {
  if (!name || typeof name !== 'string') return 'unnamed_file';
  
  // Remove directory paths and path traversal sequences
  const baseName = name.replace(/^.*[\\/]/, '');
  
  // Replace unsafe characters, keeping only alphanumerics, dots, hyphens, and underscores
  const clean = baseName.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // Avoid leading dots (hidden files or .htaccess)
  const noLeadingDot = clean.replace(/^\.+/, '');
  
  // Truncate to reasonable safe length (max 180 chars)
  const safeName = noLeadingDot.substring(0, 180);
  
  return safeName || 'uploaded_file';
}

/**
 * Validates that a file extension is not an executable, dangerous script, or active web document.
 */
export function isDangerousFileExtension(fileName: string): boolean {
  if (!fileName || typeof fileName !== 'string') return false;
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1) return false;
  const ext = fileName.substring(lastDot).toLowerCase();
  const dangerous = [
    '.exe', '.bat', '.cmd', '.sh', '.bash', '.vbs', 
    '.vbe', '.js', '.jse', '.wsf', '.wsh', '.msc',
    '.ps1', '.ps1xml', '.ps2', '.ps2xml', '.psc1', '.psc2',
    '.scr', '.pif', '.application', '.gadget', '.msi', '.msp', '.com',
    '.html', '.htm', '.svg', '.xhtml', '.xml'
  ];
  return dangerous.includes(ext);
}

/**
 * Safely escapes a string argument for POSIX/Windows shell commands (e.g. yt-dlp CLI).
 * Strips control characters (\r, \n, \0) and neutralizes shell metacharacters ($, `, ", \, !, %VAR%).
 */
export function escapeShellArg(raw: string): string {
  if (!raw || typeof raw !== 'string') return '""';
  // Strip control characters and newlines first
  const cleaned = raw.replace(/[\r\n\0]/g, '').trim();
  // Escape backslashes, double quotes, dollar signs, backticks, and exclamation marks
  const escaped = cleaned
    .replace(/(["\\$`!])/g, '\\$1')
    // Neutralize Windows cmd.exe %VAR% expansion while keeping valid URL percent-encodings intact
    .replace(/%([A-Za-z_][A-Za-z0-9_]*)%/g, '%%$1%%');
  return `"${escaped}"`;
}

/**
 * Masks the last octet of an IPv4 address (e.g., 114.122.104.xxx)
 * or the tail of an IPv6 address for visitor privacy compliance.
 */
export function maskIpAddress(ip?: string | null): string {
  if (!ip || typeof ip !== 'string') return 'Unknown';
  const trimmed = ip.trim();
  if (!trimmed || trimmed.toLowerCase() === 'unknown') return 'Unknown';

  // IPv4: a.b.c.d -> a.b.c.xxx
  const ipv4Parts = trimmed.split('.');
  if (ipv4Parts.length === 4) {
    return `${ipv4Parts[0]}.${ipv4Parts[1]}.${ipv4Parts[2]}.xxx`;
  }

  // IPv6: keep first 3 groups and mask the rest
  if (trimmed.includes(':')) {
    const ipv6Parts = trimmed.split(':').filter(Boolean);
    if (ipv6Parts.length >= 3) {
      return `${ipv6Parts.slice(0, 3).join(':')}::xxx`;
    }
    return 'xxxx:xxxx::xxx';
  }

  return 'Unknown';
}

/**
 * Generates a cryptographically secure random alphanumeric string without modulo bias.
 */
export function generateSecureRandomString(
  length = 8,
  charset = 'abcdefghijklmnopqrstuvwxyz0123456789'
): string {
  if (length <= 0 || !charset.length) return '';
  const charsLen = charset.length;
  // Rejection sampling threshold to eliminate modulo bias
  const maxValidByte = 256 - (256 % charsLen);
  let result = '';
  const buf = new Uint8Array(length * 2);

  while (result.length < length) {
    crypto.getRandomValues(buf);
    for (let i = 0; i < buf.length && result.length < length; i++) {
      if (buf[i] < maxValidByte) {
        result += charset[buf[i] % charsLen];
      }
    }
  }
  return result;
}

/**
 * Generates a cryptographically strong unique identifier with an optional prefix.
 */
export function generateSecureId(prefix = 'id', length = 10): string {
  const randomPart = generateSecureRandomString(length, 'abcdefghijklmnopqrstuvwxyz0123456789');
  return prefix ? `${prefix}-${randomPart}` : randomPart;
}

