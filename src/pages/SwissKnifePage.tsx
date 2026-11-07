import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  KeyRound, 
  FileCode, 
  Binary, 
  Hash, 
  Fingerprint, 
  Copy, 
  Check, 
  RefreshCw, 
  Search,
  AlertCircle
} from 'lucide-react';
import { generateSecureRandomString } from '@/utils/security';

export const SwissKnifePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'password';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  /* ================== 1. PASSWORD GENERATOR ================== */
  const [passLength, setPassLength] = useState(16);
  const [passUpper, setPassUpper] = useState(true);
  const [passLower, setPassLower] = useState(true);
  const [passNums, setPassNums] = useState(true);
  const [passSyms, setPassSyms] = useState(true);
  const [generatedPass, setGeneratedPass] = useState('');

  const generatePassword = () => {
    let chars = '';
    if (passUpper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (passLower) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (passNums) chars += '0123456789';
    if (passSyms) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    if (!chars) chars = 'abcdefghijklmnopqrstuvwxyz';

    setGeneratedPass(generateSecureRandomString(passLength, chars));
  };

  useEffect(() => {
    generatePassword();
  }, [passLength, passUpper, passLower, passNums, passSyms]);

  /* ================== 2. JSON FORMATTER ================== */
  const [jsonInput, setJsonInput] = useState('{\n  "app": "Superapps",\n  "status": "ready",\n  "version": 1\n}');
  const [jsonOutput, setJsonOutput] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  const formatJson = (spaces = 2) => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonOutput(JSON.stringify(parsed, null, spaces));
      setJsonError(null);
    } catch (err: any) {
      setJsonError(err.message || 'Invalid JSON format');
    }
  };

  const minifyJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonOutput(JSON.stringify(parsed));
      setJsonError(null);
    } catch (err: any) {
      setJsonError(err.message || 'Invalid JSON format');
    }
  };

  /* ================== 3. BASE64 CONVERTER ================== */
  const [b64Text, setB64Text] = useState('Superapps workspace');
  const [b64Result, setB64Result] = useState('');
  const [b64Mode, setB64Mode] = useState<'encode' | 'decode'>('encode');
  const [b64Error, setB64Error] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (b64Mode === 'encode') {
        const bytes = new TextEncoder().encode(b64Text);
        let binString = '';
        for (let i = 0; i < bytes.length; i++) {
          binString += String.fromCharCode(bytes[i]);
        }
        setB64Result(btoa(binString));
        setB64Error(null);
      } else {
        const binString = atob(b64Text.trim());
        const bytes = new Uint8Array(binString.length);
        for (let i = 0; i < binString.length; i++) {
          bytes[i] = binString.charCodeAt(i);
        }
        setB64Result(new TextDecoder().decode(bytes));
        setB64Error(null);
      }
    } catch {
      setB64Error('Invalid Base64 input for decoding');
    }
  }, [b64Text, b64Mode]);

  /* ================== 4. UUID GENERATOR ================== */
  const [uuidBatch, setUuidBatch] = useState<string[]>([]);
  const [uuidCount, setUuidCount] = useState(5);

  const generateUuids = () => {
    const list: string[] = [];
    for (let i = 0; i < uuidCount; i++) {
      list.push(crypto.randomUUID());
    }
    setUuidBatch(list);
  };

  useEffect(() => {
    generateUuids();
  }, [uuidCount]);

  /* ================== 5. HASH GENERATOR (Web Crypto) ================== */
  const [hashInput, setHashInput] = useState('Hello Superapps');
  const [sha256, setSha256] = useState('');
  const [sha1, setSha1] = useState('');

  useEffect(() => {
    let isCancelled = false;
    const computeHashes = async () => {
      const encoder = new TextEncoder();
      const data = encoder.encode(hashInput);

      const hash256Buffer = await crypto.subtle.digest('SHA-256', data);
      if (isCancelled) return;
      const hash256Array = Array.from(new Uint8Array(hash256Buffer));
      setSha256(hash256Array.map((b) => b.toString(16).padStart(2, '0')).join(''));

      const hash1Buffer = await crypto.subtle.digest('SHA-1', data);
      if (isCancelled) return;
      const hash1Array = Array.from(new Uint8Array(hash1Buffer));
      setSha1(hash1Array.map((b) => b.toString(16).padStart(2, '0')).join(''));
    };
    computeHashes();
    return () => {
      isCancelled = true;
    };
  }, [hashInput]);

  /* ================== 6. REGEX TESTER ================== */
  const [regexPattern, setRegexPattern] = useState('\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b');
  const [regexFlags, setRegexFlags] = useState('g');
  const [regexText, setRegexText] = useState('Contact support@example.com or sales@k31.my.id for details.');
  const [regexMatches, setRegexMatches] = useState<string[]>([]);
  const [regexError, setRegexError] = useState<string | null>(null);

  useEffect(() => {
    if (!regexPattern.trim()) {
      setRegexMatches([]);
      setRegexError(null);
      return;
    }
    if (regexText.length > 50_000) {
      setRegexError('Test string exceeds 50,000 characters limit.');
      setRegexMatches([]);
      return;
    }
    try {
      const re = new RegExp(regexPattern, regexFlags);
      const m = regexText.match(re);
      setRegexMatches(m ? m.slice(0, 200) : []);
      setRegexError(null);
    } catch (err: any) {
      setRegexError(err.message);
      setRegexMatches([]);
    }
  }, [regexPattern, regexFlags, regexText]);

  const tabs = [
    { id: 'password', label: 'Password Gen', icon: KeyRound },
    { id: 'json', label: 'JSON Formatter', icon: FileCode },
    { id: 'base64', label: 'Base64 Tool', icon: Binary },
    { id: 'uuid', label: 'UUID Generator', icon: Fingerprint },
    { id: 'hash', label: 'Hash Digest', icon: Hash },
    { id: 'regex', label: 'Regex Tester', icon: Search },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="border-b-1.5 border-border-strong pb-4">
        <div className="werkbund-coord mb-1">[MODULE-06] CLIENT-SIDE DEV UTILITIES</div>
        <h1 className="text-2xl font-display font-bold uppercase tracking-tight text-ink">
          SwissKnife Dev Tools
        </h1>
        <p className="text-xs text-ink-secondary mt-0.5">
          Client-side developer utilities for passwords, JSON formatting, Base64 conversion, UUIDs, cryptographic hashes, and regex testing.
        </p>
      </div>

      {/* Tabs navigation: Wayfinding Bar */}
      <div role="tablist" aria-label="SwissKnife developer tools" className="flex overflow-x-auto p-1 border-1.5 border-border-strong bg-subtle space-x-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider whitespace-nowrap transition-colors duration-fast border-1.5 ${
                isActive
                  ? 'bg-ink text-canvas border-border-strong font-bold'
                  : 'bg-canvas text-ink border-border-subtle hover:border-border-strong'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels: Sharp Structural Frame */}
      <div role="tabpanel" className="bg-surface border-1.5 border-border-strong p-5">
        {/* 1. PASSWORD GENERATOR */}
        {activeTab === 'password' && (
          <div className="space-y-4 max-w-xl">
            <div>
              <label className="block text-[11px] font-mono text-ink uppercase tracking-wider mb-1.5 font-bold">
                Generated Password
              </label>
              <div className="flex items-center space-x-2 p-3 bg-canvas border-1.5 border-border-strong">
                <span className="font-mono text-sm font-bold text-signal flex-1 truncate select-all tabular-nums">
                  {generatedPass}
                </span>
                <button
                  onClick={() => copyToClipboard(generatedPass, 'pass')}
                  className="p-1.5 border border-border-strong bg-surface text-ink hover:bg-ink hover:text-canvas transition-colors duration-fast"
                  title="Copy password"
                >
                  {copiedKey === 'pass' ? <Check className="w-3.5 h-3.5 text-status-success" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={generatePassword}
                  className="p-1.5 border border-border-strong bg-surface text-ink hover:bg-ink hover:text-canvas transition-colors duration-fast"
                  title="Regenerate"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Slider */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <label htmlFor="swissknife-pass-length" className="text-ink font-bold uppercase">Length</label>
                <span className="font-bold text-ink tabular-nums">{passLength} characters</span>
              </div>
              <input
                id="swissknife-pass-length"
                type="range"
                min="8"
                max="64"
                value={passLength}
                onChange={(e) => setPassLength(Number(e.target.value))}
                className="w-full accent-signal"
              />
            </div>

            {/* Checkboxes: Sharp Squares */}
            <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
              <label className="flex items-center space-x-2 cursor-pointer p-2 bg-subtle border border-border-strong">
                <input
                  type="checkbox"
                  checked={passUpper}
                  onChange={(e) => setPassUpper(e.target.checked)}
                  className="accent-signal"
                />
                <span className="uppercase font-bold">Uppercase (A-Z)</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer p-2 bg-subtle border border-border-strong">
                <input
                  type="checkbox"
                  checked={passLower}
                  onChange={(e) => setPassLower(e.target.checked)}
                  className="accent-signal"
                />
                <span className="uppercase font-bold">Lowercase (a-z)</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer p-2 bg-subtle border border-border-strong">
                <input
                  type="checkbox"
                  checked={passNums}
                  onChange={(e) => setPassNums(e.target.checked)}
                  className="accent-signal"
                />
                <span className="uppercase font-bold">Numbers (0-9)</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer p-2 bg-subtle border border-border-strong">
                <input
                  type="checkbox"
                  checked={passSyms}
                  onChange={(e) => setPassSyms(e.target.checked)}
                  className="accent-signal"
                />
                <span className="uppercase font-bold">Symbols (!@#$%)</span>
              </label>
            </div>
          </div>
        )}

        {/* 2. JSON FORMATTER */}
        {activeTab === 'json' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => formatJson(2)}
                  className="werkbund-btn werkbund-btn-signal text-xs py-1.5 px-3"
                >
                  Beautify (2 Spaces)
                </button>
                <button
                  onClick={minifyJson}
                  className="werkbund-btn werkbund-btn-outline text-xs py-1.5 px-3"
                >
                  Minify
                </button>
              </div>

              {jsonOutput && (
                <button
                  onClick={() => copyToClipboard(jsonOutput, 'json')}
                  className="flex items-center space-x-1.5 text-xs text-ink hover:text-signal font-mono uppercase font-bold"
                >
                  {copiedKey === 'json' ? <Check className="w-3.5 h-3.5 text-status-success" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Result</span>
                </button>
              )}
            </div>

            {jsonError && (
              <div className="p-3 bg-surface border-1.5 border-status-danger text-status-danger text-xs flex items-center space-x-2 font-mono">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{jsonError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="swissknife-json-input" className="block text-[11px] font-mono uppercase tracking-wider text-ink font-bold mb-1">Input JSON</label>
                <textarea
                  id="swissknife-json-input"
                  rows={10}
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  className="w-full p-3 font-mono text-xs border-1.5 border-border-strong bg-canvas text-ink focus:outline-none focus:border-signal tabular-nums leading-relaxed"
                />
              </div>

              <div>
                <label htmlFor="swissknife-json-output" className="block text-[11px] font-mono uppercase tracking-wider text-ink font-bold mb-1">Formatted Output</label>
                <textarea
                  id="swissknife-json-output"
                  readOnly
                  rows={10}
                  value={jsonOutput}
                  placeholder="Output will appear here after formatting..."
                  className="w-full p-3 font-mono text-xs border-1.5 border-border-strong bg-canvas text-signal focus:outline-none tabular-nums leading-relaxed"
                />
              </div>
            </div>
          </div>
        )}

        {/* 3. BASE64 */}
        {activeTab === 'base64' && (
          <div className="space-y-3 max-w-xl">
            <div className="flex space-x-2 font-mono">
              <button
                onClick={() => setB64Mode('encode')}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border-1.5 transition-colors duration-fast ${
                  b64Mode === 'encode'
                    ? 'bg-ink text-canvas border-border-strong'
                    : 'bg-canvas text-ink border-border-subtle hover:border-border-strong'
                }`}
              >
                Encode to Base64
              </button>
              <button
                onClick={() => setB64Mode('decode')}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border-1.5 transition-colors duration-fast ${
                  b64Mode === 'decode'
                    ? 'bg-ink text-canvas border-border-strong'
                    : 'bg-canvas text-ink border-border-subtle hover:border-border-strong'
                }`}
              >
                Decode from Base64
              </button>
            </div>

            <div>
              <label htmlFor="swissknife-b64-input" className="block text-[11px] font-mono uppercase tracking-wider text-ink font-bold mb-1">Input Text</label>
              <textarea
                id="swissknife-b64-input"
                rows={4}
                value={b64Text}
                onChange={(e) => setB64Text(e.target.value)}
                className="w-full p-3 font-mono text-xs border-1.5 border-border-strong bg-canvas text-ink focus:outline-none focus:border-signal leading-relaxed"
              />
            </div>

            {b64Error ? (
              <div className="text-xs text-status-danger font-mono uppercase font-bold">{b64Error}</div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="swissknife-b64-result" className="text-[11px] font-mono uppercase tracking-wider text-ink font-bold">Result</label>
                  <button
                    onClick={() => copyToClipboard(b64Result, 'b64')}
                    className="flex items-center space-x-1.5 text-xs text-ink hover:text-signal font-mono uppercase font-bold"
                  >
                    {copiedKey === 'b64' ? <Check className="w-3.5 h-3.5 text-status-success" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy</span>
                  </button>
                </div>
                <textarea
                  id="swissknife-b64-result"
                  readOnly
                  rows={4}
                  value={b64Result}
                  className="w-full p-3 font-mono text-xs border-1.5 border-border-strong bg-canvas text-signal focus:outline-none leading-relaxed"
                />
              </div>
            )}
          </div>
        )}

        {/* 4. UUID GENERATOR */}
        {activeTab === 'uuid' && (
          <div className="space-y-3 max-w-xl font-mono">
            <div className="flex items-center justify-between pb-2 border-b-1.5 border-border-strong">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-ink font-bold uppercase">Count:</span>
                {[1, 5, 10].map((c) => (
                  <button
                    key={c}
                    onClick={() => setUuidCount(c)}
                    className={`px-2.5 py-1 text-xs font-bold border-1.5 ${
                      uuidCount === c
                        ? 'bg-ink text-canvas border-border-strong'
                        : 'bg-canvas text-ink border-border-subtle hover:border-border-strong'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={generateUuids}
                  className="p-1.5 border-1.5 border-border-strong bg-canvas text-ink hover:bg-ink hover:text-canvas transition-colors duration-fast"
                  title="Generate new batch"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => copyToClipboard(uuidBatch.join('\n'), 'all_uuids')}
                  className="werkbund-btn werkbund-btn-signal text-xs py-1 px-2.5"
                >
                  {copiedKey === 'all_uuids' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy All</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              {uuidBatch.map((id, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2.5 bg-canvas border-1.5 border-border-strong"
                >
                  <span className="text-xs text-ink select-all tabular-nums font-bold">{id}</span>
                  <button
                    onClick={() => copyToClipboard(id, `uuid-${index}`)}
                    className="p-1 border border-border-strong bg-surface text-ink hover:bg-ink hover:text-canvas transition-colors duration-fast"
                  >
                    {copiedKey === `uuid-${index}` ? <Check className="w-3.5 h-3.5 text-status-success" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. HASH GENERATOR */}
        {activeTab === 'hash' && (
          <div className="space-y-3 max-w-xl font-mono">
            <div>
              <label htmlFor="swissknife-hash-input" className="block text-[11px] uppercase tracking-wider text-ink font-bold mb-1">Plain Text</label>
              <input
                id="swissknife-hash-input"
                type="text"
                value={hashInput}
                onChange={(e) => setHashInput(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono border-1.5 border-border-strong bg-canvas text-ink focus:outline-none focus:border-signal"
              />
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-ink font-bold uppercase tracking-wider">SHA-256 Digest</span>
                  <button
                    onClick={() => copyToClipboard(sha256, 'sha256')}
                    className="flex items-center space-x-1 text-xs text-ink hover:text-signal font-bold uppercase"
                  >
                    {copiedKey === 'sha256' ? <Check className="w-3.5 h-3.5 text-status-success" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy</span>
                  </button>
                </div>
                <div className="p-2.5 bg-canvas border-1.5 border-border-strong text-xs text-signal break-all select-all tabular-nums font-bold">
                  {sha256}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-ink font-bold uppercase tracking-wider">SHA-1 Digest</span>
                  <button
                    onClick={() => copyToClipboard(sha1, 'sha1')}
                    className="flex items-center space-x-1 text-xs text-ink hover:text-signal font-bold uppercase"
                  >
                    {copiedKey === 'sha1' ? <Check className="w-3.5 h-3.5 text-status-success" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy</span>
                  </button>
                </div>
                <div className="p-2.5 bg-canvas border-1.5 border-border-strong text-xs text-signal break-all select-all tabular-nums font-bold">
                  {sha1}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. REGEX TESTER */}
        {activeTab === 'regex' && (
          <div className="space-y-3 max-w-xl font-mono">
            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-3">
                <label htmlFor="swissknife-regex-pattern" className="block text-[11px] uppercase tracking-wider text-ink font-bold mb-1">Regular Expression</label>
                <input
                  id="swissknife-regex-pattern"
                  type="text"
                  value={regexPattern}
                  onChange={(e) => setRegexPattern(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono border-1.5 border-border-strong bg-canvas text-ink focus:outline-none focus:border-signal"
                />
              </div>
              <div>
                <label htmlFor="swissknife-regex-flags" className="block text-[11px] uppercase tracking-wider text-ink font-bold mb-1">Flags</label>
                <input
                  id="swissknife-regex-flags"
                  type="text"
                  value={regexFlags}
                  onChange={(e) => setRegexFlags(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono border-1.5 border-border-strong bg-canvas text-ink focus:outline-none focus:border-signal uppercase font-bold"
                />
              </div>
            </div>

            {regexError && (
              <div className="p-2.5 bg-surface border-1.5 border-status-danger text-status-danger text-xs font-mono">{regexError}</div>
            )}

            <div>
              <label htmlFor="swissknife-regex-text" className="block text-[11px] uppercase tracking-wider text-ink font-bold mb-1">Test String</label>
              <textarea
                id="swissknife-regex-text"
                rows={3}
                value={regexText}
                onChange={(e) => setRegexText(e.target.value)}
                className="w-full p-3 text-xs font-mono border-1.5 border-border-strong bg-canvas text-ink focus:outline-none focus:border-signal leading-relaxed"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] uppercase tracking-wider text-ink font-bold">
                  Matches ({regexMatches.length})
                </span>
              </div>
              <div className="p-3 bg-canvas border-1.5 border-border-strong space-y-1">
                {regexMatches.length === 0 ? (
                  <span className="text-xs text-ink-muted">[NULL] NO MATCHES FOUND.</span>
                ) : (
                  regexMatches.map((m, idx) => (
                    <div key={idx} className="text-xs text-signal font-bold tabular-nums">
                      [{idx + 1}] {m}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
