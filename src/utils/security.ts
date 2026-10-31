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
 * Validates that a file extension is not an executable or dangerous script.
 */
export function isDangerousFileExtension(fileName: string): boolean {
  if (!fileName || typeof fileName !== 'string') return false;
  const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
  const dangerous = [
    '.exe', '.bat', '.cmd', '.sh', '.bash', '.vbs', 
    '.vbe', '.js', '.jse', '.wsf', '.wsh', '.msc',
    '.ps1', '.ps1xml', '.ps2', '.ps2xml', '.psc1', '.psc2',
    '.scr', '.pif', '.application', '.gadget', '.msi', '.msp', '.com'
  ];
  return dangerous.includes(ext);
}
