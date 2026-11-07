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
    { id: 'password', label: 'Password', icon: KeyRound },
    { id: 'json', label: 'JSON Formatter', icon: FileCode },
    { id: 'base64', label: 'Base64 Tool', icon: Binary },
    { id: 'uuid', label: 'UUID Gen', icon: Fingerprint },
    { id: 'hash', label: 'Hash Digest', icon: Hash },
    { id: 'regex', label: 'Regex Tester', icon: Search },
  ];

  return (
    <div className="space-y-4 font-sans">
      {/* Header */}
      <div className="pb-3 border-b border-border-subtle">
        <div className="text-xs font-semibold text-accent-primary uppercase tracking-wider mb-0.5">Client-Side Utilities</div>
        <h1 className="text-2xl font-display font-bold text-ink tracking-tight">
          SwissKnife Dev Tools
        </h1>
        <p className="text-xs text-ink-secondary mt-0.5">
          Client-side developer utilities for passwords, JSON formatting, Base64 conversion, UUIDs, cryptographic hashes, and regex testing.
        </p>
      </div>

      {/* Tabs navigation: iOS Segmented Control */}
      <div role="tablist" aria-label="SwissKnife developer tools" className="ios-segmented p-1 bg-subtle/80 rounded-[12px] border border-border-subtle flex overflow-x-auto gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-1.5 px-3 py-2 text-xs rounded-[8px] whitespace-nowrap transition-all duration-150 min-h-[36px] font-medium ${
                isActive
                  ? 'bg-surface text-ink shadow-ios-sm font-semibold'
                  : 'text-ink-secondary hover:text-ink hover:bg-surface/50'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-accent-primary' : 'text-ink-muted'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels: Inset Grouped Section */}
      <div role="tabpanel" className="ios-inset-grouped bg-surface shadow-sm p-5 border border-border-subtle">
        {/* 1. PASSWORD GENERATOR */}
        {activeTab === 'password' && (
          <div className="space-y-4 max-w-xl">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Generated Password
              </label>
              <div className="flex items-center space-x-2 p-3 bg-canvas border border-border-subtle rounded-[12px]">
                <span className="font-mono text-sm font-semibold text-accent-primary flex-1 truncate select-all tabular-nums">
                  {generatedPass}
                </span>
                <button
                  onClick={() => copyToClipboard(generatedPass, 'pass')}
                  className="p-2 rounded-[8px] bg-surface border border-border-subtle text-ink-secondary hover:text-ink hover:bg-subtle transition-all"
                  title="Copy password"
                >
                  {copiedKey === 'pass' ? <Check className="w-4 h-4 text-status-success" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={generatePassword}
                  className="p-2 rounded-[8px] bg-surface border border-border-subtle text-ink-secondary hover:text-ink hover:bg-subtle transition-all"
                  title="Regenerate"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Slider */}
            <div className="p-3.5 bg-subtle/30 rounded-[12px] border border-border-subtle">
              <div className="flex justify-between text-xs mb-2">
                <label htmlFor="swissknife-pass-length" className="text-ink font-semibold">Length</label>
                <span className="font-bold text-accent-primary tabular-nums font-mono">{passLength} characters</span>
              </div>
              <input
                id="swissknife-pass-length"
                type="range"
                min="8"
                max="64"
                value={passLength}
                onChange={(e) => setPassLength(Number(e.target.value))}
                className="w-full accent-accent-primary cursor-pointer"
              />
            </div>

            {/* Checkboxes: iOS Grouped List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label className="flex items-center space-x-2.5 cursor-pointer p-3 bg-subtle/40 hover:bg-subtle/70 rounded-[10px] border border-border-subtle transition-colors">
                <input
                  type="checkbox"
                  checked={passUpper}
                  onChange={(e) => setPassUpper(e.target.checked)}
                  className="w-4 h-4 accent-accent-primary rounded"
                />
                <span className="font-medium text-ink">Uppercase (A-Z)</span>
              </label>
              <label className="flex items-center space-x-2.5 cursor-pointer p-3 bg-subtle/40 hover:bg-subtle/70 rounded-[10px] border border-border-subtle transition-colors">
                <input
                  type="checkbox"
                  checked={passLower}
                  onChange={(e) => setPassLower(e.target.checked)}
                  className="w-4 h-4 accent-accent-primary rounded"
                />
                <span className="font-medium text-ink">Lowercase (a-z)</span>
              </label>
              <label className="flex items-center space-x-2.5 cursor-pointer p-3 bg-subtle/40 hover:bg-subtle/70 rounded-[10px] border border-border-subtle transition-colors">
                <input
                  type="checkbox"
                  checked={passNums}
                  onChange={(e) => setPassNums(e.target.checked)}
                  className="w-4 h-4 accent-accent-primary rounded"
                />
                <span className="font-medium text-ink">Numbers (0-9)</span>
              </label>
              <label className="flex items-center space-x-2.5 cursor-pointer p-3 bg-subtle/40 hover:bg-subtle/70 rounded-[10px] border border-border-subtle transition-colors">
                <input
                  type="checkbox"
                  checked={passSyms}
                  onChange={(e) => setPassSyms(e.target.checked)}
                  className="w-4 h-4 accent-accent-primary rounded"
                />
                <span className="font-medium text-ink">Symbols (!@#$%)</span>
              </label>
            </div>
          </div>
        )}

        {/* 2. JSON FORMATTER */}
        {activeTab === 'json' && (
          <div className="space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => formatJson(2)}
                  className="ios-btn ios-btn-primary rounded-[10px] text-xs font-semibold py-2 px-3.5 min-h-[36px]"
                >
                  Beautify (2 Spaces)
                </button>
                <button
                  onClick={minifyJson}
                  className="ios-btn ios-btn-secondary rounded-[10px] text-xs font-medium py-2 px-3.5 min-h-[36px]"
                >
                  Minify
                </button>
              </div>

              {jsonOutput && (
                <button
                  onClick={() => copyToClipboard(jsonOutput, 'json')}
                  className="flex items-center space-x-1.5 text-xs text-accent-primary hover:opacity-80 font-semibold px-2 py-1 rounded-[8px]"
                >
                  {copiedKey === 'json' ? <Check className="w-3.5 h-3.5 text-status-success" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Result</span>
                </button>
              )}
            </div>

            {jsonError && (
              <div className="p-3 bg-status-danger/10 border border-status-danger/30 rounded-[10px] text-status-danger text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">{jsonError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="swissknife-json-input" className="block text-xs font-semibold text-ink mb-1.5">Input JSON</label>
                <textarea
                  id="swissknife-json-input"
                  rows={10}
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  className="w-full p-3 font-mono text-xs bg-canvas border border-border-subtle rounded-[12px] text-ink focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary tabular-nums leading-relaxed"
                />
              </div>

              <div>
                <label htmlFor="swissknife-json-output" className="block text-xs font-semibold text-ink mb-1.5">Formatted Output</label>
                <textarea
                  id="swissknife-json-output"
                  readOnly
                  rows={10}
                  value={jsonOutput}
                  placeholder="Output will appear here after formatting..."
                  className="w-full p-3 font-mono text-xs bg-canvas/70 border border-border-subtle rounded-[12px] text-accent-primary focus:outline-none tabular-nums leading-relaxed"
                />
              </div>
            </div>
          </div>
        )}

        {/* 3. BASE64 */}
        {activeTab === 'base64' && (
          <div className="space-y-3.5 max-w-xl">
            <div className="ios-segmented p-1 bg-subtle/80 rounded-[10px] border border-border-subtle inline-flex gap-1">
              <button
                onClick={() => setB64Mode('encode')}
                className={`px-3 py-1.5 text-xs rounded-[6px] font-medium transition-all ${
                  b64Mode === 'encode'
                    ? 'bg-surface text-ink shadow-ios-sm font-semibold'
                    : 'text-ink-secondary hover:text-ink'
                }`}
              >
                Encode to Base64
              </button>
              <button
                onClick={() => setB64Mode('decode')}
                className={`px-3 py-1.5 text-xs rounded-[6px] font-medium transition-all ${
                  b64Mode === 'decode'
                    ? 'bg-surface text-ink shadow-ios-sm font-semibold'
                    : 'text-ink-secondary hover:text-ink'
                }`}
              >
                Decode from Base64
              </button>
            </div>

            <div>
              <label htmlFor="swissknife-b64-input" className="block text-xs font-semibold text-ink mb-1.5">Input Text</label>
              <textarea
                id="swissknife-b64-input"
                rows={4}
                value={b64Text}
                onChange={(e) => setB64Text(e.target.value)}
                className="w-full p-3 font-mono text-xs bg-canvas border border-border-subtle rounded-[12px] text-ink focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary leading-relaxed"
              />
            </div>

            {b64Error ? (
              <div className="text-xs text-status-danger font-medium p-2.5 bg-status-danger/10 border border-status-danger/20 rounded-[10px]">{b64Error}</div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label htmlFor="swissknife-b64-result" className="text-xs font-semibold text-ink">Result</label>
                  <button
                    onClick={() => copyToClipboard(b64Result, 'b64')}
                    className="flex items-center space-x-1.5 text-xs text-accent-primary hover:opacity-80 font-semibold"
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
                  className="w-full p-3 font-mono text-xs bg-canvas/70 border border-border-subtle rounded-[12px] text-accent-primary focus:outline-none leading-relaxed"
                />
              </div>
            )}
          </div>
        )}

        {/* 4. UUID GENERATOR */}
        {activeTab === 'uuid' && (
          <div className="space-y-3.5 max-w-xl">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-ink font-semibold">Count:</span>
                <div className="ios-segmented p-0.5 bg-subtle/80 rounded-[8px] border border-border-subtle flex gap-1">
                  {[1, 5, 10].map((c) => (
                    <button
                      key={c}
                      onClick={() => setUuidCount(c)}
                      className={`px-3 py-1 text-xs rounded-[6px] font-medium transition-all ${
                        uuidCount === c
                          ? 'bg-surface text-ink shadow-ios-sm font-semibold'
                          : 'text-ink-secondary hover:text-ink'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={generateUuids}
                  className="p-2 rounded-[8px] bg-surface border border-border-subtle text-ink-secondary hover:text-ink hover:bg-subtle transition-all"
                  title="Generate new batch"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => copyToClipboard(uuidBatch.join('\n'), 'all_uuids')}
                  className="ios-btn ios-btn-primary rounded-[8px] text-xs font-semibold py-1.5 px-3 min-h-[32px]"
                >
                  {copiedKey === 'all_uuids' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy All</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {uuidBatch.map((id, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-canvas border border-border-subtle rounded-[10px]"
                >
                  <span className="text-xs font-mono text-ink select-all tabular-nums font-semibold">{id}</span>
                  <button
                    onClick={() => copyToClipboard(id, `uuid-${index}`)}
                    className="p-1.5 rounded-[6px] bg-surface border border-border-subtle text-ink-secondary hover:text-ink hover:bg-subtle transition-all"
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
          <div className="space-y-4 max-w-xl">
            <div>
              <label htmlFor="swissknife-hash-input" className="block text-xs font-semibold text-ink mb-1.5">Plain Text</label>
              <input
                id="swissknife-hash-input"
                type="text"
                value={hashInput}
                onChange={(e) => setHashInput(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-canvas border border-border-subtle rounded-[10px] text-ink focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary min-h-[38px]"
              />
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs text-ink font-semibold">SHA-256 Digest</span>
                  <button
                    onClick={() => copyToClipboard(sha256, 'sha256')}
                    className="flex items-center space-x-1 text-xs text-accent-primary hover:opacity-80 font-semibold"
                  >
                    {copiedKey === 'sha256' ? <Check className="w-3.5 h-3.5 text-status-success" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy</span>
                  </button>
                </div>
                <div className="p-3 bg-canvas border border-border-subtle rounded-[10px] text-xs font-mono text-accent-primary break-all select-all tabular-nums font-medium">
                  {sha256}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs text-ink font-semibold">SHA-1 Digest</span>
                  <button
                    onClick={() => copyToClipboard(sha1, 'sha1')}
                    className="flex items-center space-x-1 text-xs text-accent-primary hover:opacity-80 font-semibold"
                  >
                    {copiedKey === 'sha1' ? <Check className="w-3.5 h-3.5 text-status-success" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy</span>
                  </button>
                </div>
                <div className="p-3 bg-canvas border border-border-subtle rounded-[10px] text-xs font-mono text-accent-primary break-all select-all tabular-nums font-medium">
                  {sha1}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. REGEX TESTER */}
        {activeTab === 'regex' && (
          <div className="space-y-3.5 max-w-xl">
            <div className="grid grid-cols-4 gap-2.5">
              <div className="col-span-3">
                <label htmlFor="swissknife-regex-pattern" className="block text-xs font-semibold text-ink mb-1.5">Regular Expression</label>
                <input
                  id="swissknife-regex-pattern"
                  type="text"
                  value={regexPattern}
                  onChange={(e) => setRegexPattern(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-canvas border border-border-subtle rounded-[10px] text-ink focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary min-h-[38px]"
                />
              </div>
              <div>
                <label htmlFor="swissknife-regex-flags" className="block text-xs font-semibold text-ink mb-1.5">Flags</label>
                <input
                  id="swissknife-regex-flags"
                  type="text"
                  value={regexFlags}
                  onChange={(e) => setRegexFlags(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-canvas border border-border-subtle rounded-[10px] text-ink focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary min-h-[38px] font-semibold"
                />
              </div>
            </div>

            {regexError && (
              <div className="p-3 bg-status-danger/10 border border-status-danger/30 rounded-[10px] text-status-danger text-xs font-medium">{regexError}</div>
            )}

            <div>
              <label htmlFor="swissknife-regex-text" className="block text-xs font-semibold text-ink mb-1.5">Test String</label>
              <textarea
                id="swissknife-regex-text"
                rows={3}
                value={regexText}
                onChange={(e) => setRegexText(e.target.value)}
                className="w-full p-3 text-xs font-mono bg-canvas border border-border-subtle rounded-[10px] text-ink focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary leading-relaxed"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-semibold text-ink">
                  Matches ({regexMatches.length})
                </span>
              </div>
              <div className="p-3.5 bg-canvas border border-border-subtle rounded-[10px] space-y-1.5">
                {regexMatches.length === 0 ? (
                  <span className="text-xs text-ink-muted">No matches found.</span>
                ) : (
                  regexMatches.map((m, idx) => (
                    <div key={idx} className="text-xs font-mono text-accent-primary font-medium tabular-nums">
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
