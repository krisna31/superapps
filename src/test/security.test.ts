import { describe, it, expect } from 'vitest';
import { 
  isValidHttpUrl, 
  sanitizeRedirectUrl, 
  sanitizeFileName, 
  isDangerousFileExtension 
} from '@/utils/security';

describe('Security & Sanitization Utilities', () => {
  describe('isValidHttpUrl Protocol Enforcement', () => {
    it('accepts valid HTTP and HTTPS URLs', () => {
      expect(isValidHttpUrl('https://example.com')).toBe(true);
      expect(isValidHttpUrl('http://example.com/path?query=1')).toBe(true);
      expect(isValidHttpUrl('https://apps.k31.my.id/dashboard')).toBe(true);
    });

    it('strictly blocks javascript: URI protocol smuggling / stored XSS', () => {
      expect(isValidHttpUrl('javascript:alert(document.cookie)')).toBe(false);
      expect(isValidHttpUrl('JAVASCRIPT:alert(1)')).toBe(false);
      expect(isValidHttpUrl('javascript://alert(1)')).toBe(false);
    });

    it('strictly blocks data: URI scheme injection', () => {
      expect(isValidHttpUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
      expect(isValidHttpUrl('data:image/svg+xml;base64,PHN2Z...')).toBe(false);
    });

    it('strictly blocks file:, vbscript:, and about: schemes', () => {
      expect(isValidHttpUrl('file:///etc/passwd')).toBe(false);
      expect(isValidHttpUrl('file:///C:/Windows/System32')).toBe(false);
      expect(isValidHttpUrl('vbscript:msgbox(1)')).toBe(false);
      expect(isValidHttpUrl('about:blank')).toBe(false);
    });

    it('rejects CRLF and header injection attempts', () => {
      expect(isValidHttpUrl('https://example.com\r\nSet-Cookie:evil=1')).toBe(false);
      expect(isValidHttpUrl('https://example.com\nBad-Header')).toBe(false);
    });

    it('rejects empty, malformed, or relative strings', () => {
      expect(isValidHttpUrl('')).toBe(false);
      expect(isValidHttpUrl('   ')).toBe(false);
      expect(isValidHttpUrl('not a url')).toBe(false);
      expect(isValidHttpUrl('/local/path')).toBe(false);
    });
  });

  describe('sanitizeRedirectUrl', () => {
    it('returns normalized href for safe URLs', () => {
      expect(sanitizeRedirectUrl('https://google.com')).toBe('https://google.com/');
      expect(sanitizeRedirectUrl('https://github.com/krisna31/superapps')).toBe('https://github.com/krisna31/superapps');
    });

    it('returns null for malicious or unparseable URLs', () => {
      expect(sanitizeRedirectUrl('javascript:alert(1)')).toBeNull();
      expect(sanitizeRedirectUrl('data:text/html,evil')).toBeNull();
      expect(sanitizeRedirectUrl('invalid')).toBeNull();
    });
  });

  describe('sanitizeFileName Path Traversal Protection', () => {
    it('strips directory traversal prefixes (../ and ..\\)', () => {
      expect(sanitizeFileName('../../etc/passwd')).toBe('passwd');
      expect(sanitizeFileName('..\\..\\Windows\\System32\\cmd.exe')).toBe('cmd.exe');
      expect(sanitizeFileName('folder/subfolder/document.pdf')).toBe('document.pdf');
    });

    it('replaces dangerous and illegal characters with underscores', () => {
      expect(sanitizeFileName('my file (1) [final] <test>.png')).toBe('my_file__1___final___test_.png');
      expect(sanitizeFileName('photo;rm -rf;.jpg')).toBe('photo_rm_-rf_.jpg');
    });

    it('removes leading dots to prevent hidden/system file creation', () => {
      expect(sanitizeFileName('.env')).toBe('env');
      expect(sanitizeFileName('...htaccess')).toBe('htaccess');
    });

    it('provides fallback name if input is empty or invalid', () => {
      expect(sanitizeFileName('')).toBe('unnamed_file');
    });
  });

  describe('isDangerousFileExtension Executable Blocking', () => {
    it('flags executable and dangerous script extensions', () => {
      expect(isDangerousFileExtension('payload.exe')).toBe(true);
      expect(isDangerousFileExtension('script.bat')).toBe(true);
      expect(isDangerousFileExtension('installer.sh')).toBe(true);
      expect(isDangerousFileExtension('exploit.vbs')).toBe(true);
      expect(isDangerousFileExtension('script.ps1')).toBe(true);
      expect(isDangerousFileExtension('evil.scr')).toBe(true);
    });

    it('allows safe document, media, and archive extensions', () => {
      expect(isDangerousFileExtension('image.png')).toBe(false);
      expect(isDangerousFileExtension('photo.jpg')).toBe(false);
      expect(isDangerousFileExtension('document.pdf')).toBe(false);
      expect(isDangerousFileExtension('notes.txt')).toBe(false);
      expect(isDangerousFileExtension('video.mp4')).toBe(false);
      expect(isDangerousFileExtension('backup.zip')).toBe(false);
    });
  });
});
