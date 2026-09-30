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

    let pass = '';
    const array = new Uint32Array(passLength);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < passLength; i++) {
      pass += chars[array[i] % chars.length];
    }
    setGeneratedPass(pass);
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
        setB64Result(btoa(unescape(encodeURIComponent(b64Text))));
        setB64Error(null);
      } else {
        setB64Result(decodeURIComponent(escape(atob(b64Text))));
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
    const computeHashes = async () => {
      const encoder = new TextEncoder();
      const data = encoder.encode(hashInput);

      const hash256Buffer = await crypto.subtle.digest('SHA-256', data);
      const hash256Array = Array.from(new Uint8Array(hash256Buffer));
      setSha256(hash256Array.map((b) => b.toString(16).padStart(2, '0')).join(''));

      const hash1Buffer = await crypto.subtle.digest('SHA-1', data);
      const hash1Array = Array.from(new Uint8Array(hash1Buffer));
      setSha1(hash1Array.map((b) => b.toString(16).padStart(2, '0')).join(''));
    };
    computeHashes();
  }, [hashInput]);

  /* ================== 6. REGEX TESTER ================== */
  const [regexPattern, setRegexPattern] = useState('\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b');
  const [regexFlags, setRegexFlags] = useState('g');
  const [regexText, setRegexText] = useState('Contact support@example.com or sales@k31.my.id for details.');
  const [regexMatches, setRegexMatches] = useState<string[]>([]);
  const [regexError, setRegexError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const re = new RegExp(regexPattern, regexFlags);
      const m = regexText.match(re);
      setRegexMatches(m || []);
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
    { id: 'uuid', label: 'UUID v4 Generator', icon: Fingerprint },
    { id: 'hash', label: 'Hash Digest', icon: Hash },
    { id: 'regex', label: 'Regex Tester', icon: Search },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          SwissKnife Developer Utilities
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Essential offline developer tools running natively in your browser
        </p>
      </div>

      {/* Tabs navigation */}
      <div className="flex overflow-x-auto p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-x-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        {/* 1. PASSWORD GENERATOR */}
        {activeTab === 'password' && (
          <div className="space-y-6 max-w-xl">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Generated Password
              </label>
              <div className="flex items-center space-x-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="font-mono text-base font-semibold text-emerald-600 dark:text-emerald-400 flex-1 truncate select-all">
                  {generatedPass}
                </span>
                <button
                  onClick={() => copyToClipboard(generatedPass, 'pass')}
                  className="p-2 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                  title="Copy password"
                >
                  {copiedKey === 'pass' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={generatePassword}
                  className="p-2 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                  title="Regenerate"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Slider */}
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span>Length</span>
                <span className="font-mono font-bold">{passLength} characters</span>
              </div>
              <input
                type="range"
                min="8"
                max="64"
                value={passLength}
                onChange={(e) => setPassLength(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>

            {/* Checkboxes */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={passUpper}
                  onChange={(e) => setPassUpper(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Uppercase (A-Z)</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={passLower}
                  onChange={(e) => setPassLower(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Lowercase (a-z)</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={passNums}
                  onChange={(e) => setPassNums(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Numbers (0-9)</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={passSyms}
                  onChange={(e) => setPassSyms(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Symbols (!@#$%)</span>
              </label>
            </div>
          </div>
        )}

        {/* 2. JSON FORMATTER */}
        {activeTab === 'json' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => formatJson(2)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition"
                >
                  Beautify (2 Spaces)
                </button>
                <button
                  onClick={minifyJson}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition"
                >
                  Minify
                </button>
              </div>

              {jsonOutput && (
                <button
                  onClick={() => copyToClipboard(jsonOutput, 'json')}
                  className="flex items-center space-x-1 text-xs text-slate-500 hover:text-emerald-500"
                >
                  {copiedKey === 'json' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Result</span>
                </button>
              )}
            </div>

            {jsonError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{jsonError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Input JSON</label>
                <textarea
                  rows={12}
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Formatted Output</label>
                <textarea
                  readOnly
                  rows={12}
                  value={jsonOutput}
                  placeholder="Output will appear here after formatting..."
                  className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-emerald-600 dark:text-emerald-400 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* 3. BASE64 */}
        {activeTab === 'base64' && (
          <div className="space-y-4 max-w-xl">
            <div className="flex space-x-2">
              <button
                onClick={() => setB64Mode('encode')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  b64Mode === 'encode'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Encode to Base64
              </button>
              <button
                onClick={() => setB64Mode('decode')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  b64Mode === 'decode'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Decode from Base64
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Input Text</label>
              <textarea
                rows={4}
                value={b64Text}
                onChange={(e) => setB64Text(e.target.value)}
                className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {b64Error ? (
              <div className="text-xs text-rose-500">{b64Error}</div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-medium text-slate-500">Result</label>
                  <button
                    onClick={() => copyToClipboard(b64Result, 'b64')}
                    className="flex items-center space-x-1 text-xs text-slate-500 hover:text-emerald-500"
                  >
                    {copiedKey === 'b64' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy</span>
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={4}
                  value={b64Result}
                  className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-emerald-600 dark:text-emerald-400 focus:outline-none"
                />
              </div>
            )}
          </div>
        )}

        {/* 4. UUID GENERATOR */}
        {activeTab === 'uuid' && (
          <div className="space-y-4 max-w-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-xs text-slate-500">Count:</span>
                {[1, 5, 10].map((c) => (
                  <button
                    key={c}
                    onClick={() => setUuidCount(c)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                      uuidCount === c
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={generateUuids}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  title="Generate new batch"
                >
                  <RefreshCw className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                </button>
                <button
                  onClick={() => copyToClipboard(uuidBatch.join('\n'), 'all_uuids')}
                  className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-medium"
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
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                >
                  <span className="font-mono text-xs text-slate-800 dark:text-slate-200">{id}</span>
                  <button
                    onClick={() => copyToClipboard(id, `uuid-${index}`)}
                    className="p-1 text-slate-400 hover:text-emerald-500"
                  >
                    {copiedKey === `uuid-${index}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
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
              <label className="block text-xs font-medium text-slate-500 mb-1">Plain Text</label>
              <input
                type="text"
                value={hashInput}
                onChange={(e) => setHashInput(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">SHA-256</span>
                  <button
                    onClick={() => copyToClipboard(sha256, 'sha256')}
                    className="text-slate-400 hover:text-emerald-500"
                  >
                    {copiedKey === 'sha256' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-emerald-600 dark:text-emerald-400 break-all select-all">
                  {sha256}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">SHA-1</span>
                  <button
                    onClick={() => copyToClipboard(sha1, 'sha1')}
                    className="text-slate-400 hover:text-emerald-500"
                  >
                    {copiedKey === 'sha1' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-emerald-600 dark:text-emerald-400 break-all select-all">
                  {sha1}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. REGEX TESTER */}
        {activeTab === 'regex' && (
          <div className="space-y-4 max-w-xl">
            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-3">
                <label className="block text-xs font-medium text-slate-500 mb-1">Regular Expression</label>
                <input
                  type="text"
                  value={regexPattern}
                  onChange={(e) => setRegexPattern(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Flags</label>
                <input
                  type="text"
                  value={regexFlags}
                  onChange={(e) => setRegexFlags(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>
            </div>

            {regexError && (
              <div className="text-xs text-rose-500">{regexError}</div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Test String</label>
              <textarea
                rows={4}
                value={regexText}
                onChange={(e) => setRegexText(e.target.value)}
                className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-slate-500">
                  Matches ({regexMatches.length})
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                {regexMatches.length === 0 ? (
                  <span className="text-xs text-slate-400">No matches found.</span>
                ) : (
                  regexMatches.map((m, idx) => (
                    <div key={idx} className="font-mono text-xs text-emerald-600 dark:text-emerald-400">
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
