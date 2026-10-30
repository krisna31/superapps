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
    { id: 'uuid', label: 'UUID Generator', icon: Fingerprint },
    { id: 'hash', label: 'Hash Digest', icon: Hash },
    { id: 'regex', label: 'Regex Tester', icon: Search },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-3.5">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          SwissKnife Dev Tools
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Essential developer utilities running natively in client browser without server compute
        </p>
      </div>

      {/* Tabs navigation */}
      <div className="flex overflow-x-auto p-1 rounded-md bg-slate-100 dark:bg-slate-800 space-x-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-mono whitespace-nowrap transition ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5">
        {/* 1. PASSWORD GENERATOR */}
        {activeTab === 'password' && (
          <div className="space-y-4 max-w-xl">
            <div>
              <label className="block text-[11px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">
                Generated Password
              </label>
              <div className="flex items-center space-x-2 p-2.5 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="font-mono text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex-1 truncate select-all tabular-nums">
                  {generatedPass}
                </span>
                <button
                  onClick={() => copyToClipboard(generatedPass, 'pass')}
                  className="p-1 rounded text-slate-400 hover:text-emerald-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                  title="Copy password"
                >
                  {copiedKey === 'pass' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={generatePassword}
                  className="p-1 rounded text-slate-400 hover:text-emerald-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                  title="Regenerate"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Slider */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-500">Length</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">{passLength} characters</span>
              </div>
              <input
                type="range"
                min="8"
                max="64"
                value={passLength}
                onChange={(e) => setPassLength(Number(e.target.value))}
                className="w-full accent-slate-900 dark:accent-white"
              />
            </div>

            {/* Checkboxes */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={passUpper}
                  onChange={(e) => setPassUpper(e.target.checked)}
                  className="rounded text-slate-900 focus:ring-0"
                />
                <span>Uppercase (A-Z)</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={passLower}
                  onChange={(e) => setPassLower(e.target.checked)}
                  className="rounded text-slate-900 focus:ring-0"
                />
                <span>Lowercase (a-z)</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={passNums}
                  onChange={(e) => setPassNums(e.target.checked)}
                  className="rounded text-slate-900 focus:ring-0"
                />
                <span>Numbers (0-9)</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={passSyms}
                  onChange={(e) => setPassSyms(e.target.checked)}
                  className="rounded text-slate-900 focus:ring-0"
                />
                <span>Symbols (!@#$%)</span>
              </label>
            </div>
          </div>
        )}

        {/* 2. JSON FORMATTER */}
        {activeTab === 'json' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => formatJson(2)}
                  className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-mono font-medium transition"
                >
                  Beautify (2 Spaces)
                </button>
                <button
                  onClick={minifyJson}
                  className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-mono font-medium transition"
                >
                  Minify
                </button>
              </div>

              {jsonOutput && (
                <button
                  onClick={() => copyToClipboard(jsonOutput, 'json')}
                  className="flex items-center space-x-1 text-xs text-slate-500 hover:text-emerald-500 font-mono"
                >
                  {copiedKey === 'json' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Result</span>
                </button>
              )}
            </div>

            {jsonError && (
              <div className="p-2.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center space-x-2 font-mono">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{jsonError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-500 mb-1">Input JSON</label>
                <textarea
                  rows={10}
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  className="w-full p-2.5 font-mono text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400 tabular-nums leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-500 mb-1">Formatted Output</label>
                <textarea
                  readOnly
                  rows={10}
                  value={jsonOutput}
                  placeholder="Output will appear here after formatting..."
                  className="w-full p-2.5 font-mono text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-emerald-600 dark:text-emerald-400 focus:outline-none tabular-nums leading-relaxed"
                />
              </div>
            </div>
          </div>
        )}

        {/* 3. BASE64 */}
        {activeTab === 'base64' && (
          <div className="space-y-3 max-w-xl">
            <div className="flex space-x-1.5 font-mono">
              <button
                onClick={() => setB64Mode('encode')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  b64Mode === 'encode'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Encode to Base64
              </button>
              <button
                onClick={() => setB64Mode('decode')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  b64Mode === 'decode'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Decode from Base64
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-500 mb-1">Input Text</label>
              <textarea
                rows={4}
                value={b64Text}
                onChange={(e) => setB64Text(e.target.value)}
                className="w-full p-2.5 font-mono text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400 leading-relaxed"
              />
            </div>

            {b64Error ? (
              <div className="text-xs text-rose-500 font-mono">{b64Error}</div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-mono uppercase text-slate-500">Result</label>
                  <button
                    onClick={() => copyToClipboard(b64Result, 'b64')}
                    className="flex items-center space-x-1 text-xs text-slate-500 hover:text-emerald-500 font-mono"
                  >
                    {copiedKey === 'b64' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy</span>
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={4}
                  value={b64Result}
                  className="w-full p-2.5 font-mono text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-emerald-600 dark:text-emerald-400 focus:outline-none leading-relaxed"
                />
              </div>
            )}
          </div>
        )}

        {/* 4. UUID GENERATOR */}
        {activeTab === 'uuid' && (
          <div className="space-y-3 max-w-xl font-mono">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-500">Count:</span>
                {[1, 5, 10].map((c) => (
                  <button
                    key={c}
                    onClick={() => setUuidCount(c)}
                    className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      uuidCount === c
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  onClick={generateUuids}
                  className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  title="Generate new batch"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                </button>
                <button
                  onClick={() => copyToClipboard(uuidBatch.join('\n'), 'all_uuids')}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium"
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
                  className="flex items-center justify-between p-2 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                >
                  <span className="text-xs text-slate-800 dark:text-slate-200 select-all tabular-nums">{id}</span>
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
          <div className="space-y-3 max-w-xl font-mono">
            <div>
              <label className="block text-[11px] uppercase text-slate-500 mb-1">Plain Text</label>
              <input
                type="text"
                value={hashInput}
                onChange={(e) => setHashInput(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>

            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">SHA-256</span>
                  <button
                    onClick={() => copyToClipboard(sha256, 'sha256')}
                    className="text-slate-400 hover:text-emerald-500"
                  >
                    {copiedKey === 'sha256' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="p-2 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-emerald-600 dark:text-emerald-400 break-all select-all tabular-nums">
                  {sha256}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">SHA-1</span>
                  <button
                    onClick={() => copyToClipboard(sha1, 'sha1')}
                    className="text-slate-400 hover:text-emerald-500"
                  >
                    {copiedKey === 'sha1' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="p-2 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-emerald-600 dark:text-emerald-400 break-all select-all tabular-nums">
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
                <label className="block text-[11px] uppercase text-slate-500 mb-1">Regular Expression</label>
                <input
                  type="text"
                  value={regexPattern}
                  onChange={(e) => setRegexPattern(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase text-slate-500 mb-1">Flags</label>
                <input
                  type="text"
                  value={regexFlags}
                  onChange={(e) => setRegexFlags(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>
            </div>

            {regexError && (
              <div className="text-xs text-rose-500">{regexError}</div>
            )}

            <div>
              <label className="block text-[11px] uppercase text-slate-500 mb-1">Test String</label>
              <textarea
                rows={3}
                value={regexText}
                onChange={(e) => setRegexText(e.target.value)}
                className="w-full p-2.5 text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400 leading-relaxed"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] uppercase text-slate-500">
                  Matches ({regexMatches.length})
                </span>
              </div>
              <div className="p-2.5 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                {regexMatches.length === 0 ? (
                  <span className="text-xs text-slate-400">No matches found.</span>
                ) : (
                  regexMatches.map((m, idx) => (
                    <div key={idx} className="text-xs text-emerald-600 dark:text-emerald-400 tabular-nums">
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
