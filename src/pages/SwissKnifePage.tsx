import React, { useState } from 'react';
import {
  Wrench,
  Copy,
  Check,
  Code,
  Key,
  Hash,
  Binary,
  Regex,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

export const SwissKnifePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'json' | 'jwt' | 'base64' | 'hash' | 'regex'>('json');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // JSON State
  const [jsonInput, setJsonInput] = useState('{"name":"Superapps","private":true,"version":1}');
  const [jsonOutput, setJsonOutput] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  // JWT State
  const [jwtInput, setJwtInput] = useState('');
  const [jwtHeader, setJwtHeader] = useState<any>(null);
  const [jwtPayload, setJwtPayload] = useState<any>(null);
  const [jwtError, setJwtError] = useState<string | null>(null);

  // Base64 State
  const [base64Text, setBase64Text] = useState('Hello World');
  const [base64Result, setBase64Result] = useState('');

  // Hasher State
  const [hashInput, setHashInput] = useState('');
  const [hashes, setHashes] = useState<{ sha256: string; sha512: string; uuid: string }>({
    sha256: '',
    sha512: '',
    uuid: '',
  });

  // Regex State
  const [regexPattern, setRegexPattern] = useState('[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}');
  const [regexFlags, setRegexFlags] = useState('g');
  const [regexTestString, setRegexTestString] = useState('Send an email to contact@example.com or support@company.org');
  const [regexMatches, setRegexMatches] = useState<string[]>([]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // JSON actions
  const formatJson = () => {
    try {
      setJsonError(null);
      const parsed = JSON.parse(jsonInput);
      setJsonOutput(JSON.stringify(parsed, null, 2));
    } catch (err: any) {
      setJsonError(err.message);
    }
  };

  const minifyJson = () => {
    try {
      setJsonError(null);
      const parsed = JSON.parse(jsonInput);
      setJsonOutput(JSON.stringify(parsed));
    } catch (err: any) {
      setJsonError(err.message);
    }
  };

  // JWT action
  const decodeJwt = (token: string) => {
    setJwtInput(token);
    setJwtError(null);
    if (!token.trim()) {
      setJwtHeader(null);
      setJwtPayload(null);
      return;
    }

    try {
      const parts = token.split('.');
      if (parts.length < 2) throw new Error('Invalid JWT format (expected 3 dot-separated parts)');
      const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      setJwtHeader(header);
      setJwtPayload(payload);
    } catch (err: any) {
      setJwtError(err.message || 'Failed to decode JWT');
      setJwtHeader(null);
      setJwtPayload(null);
    }
  };

  // Hasher action
  const computeHashes = async (text: string) => {
    setHashInput(text);
    if (!text) {
      setHashes({ sha256: '', sha512: '', uuid: '' });
      return;
    }

    const enc = new TextEncoder();
    const data = enc.encode(text);

    const sha256Buffer = await crypto.subtle.digest('SHA-256', data);
    const sha256Array = Array.from(new Uint8Array(sha256Buffer));
    const sha256Hex = sha256Array.map((b) => b.toString(16).padStart(2, '0')).join('');

    const sha512Buffer = await crypto.subtle.digest('SHA-512', data);
    const sha512Array = Array.from(new Uint8Array(sha512Buffer));
    const sha512Hex = sha512Array.map((b) => b.toString(16).padStart(2, '0')).join('');

    setHashes({
      sha256: sha256Hex,
      sha512: sha512Hex,
      uuid: crypto.randomUUID(),
    });
  };

  // Regex action
  const testRegex = () => {
    try {
      const r = new RegExp(regexPattern, regexFlags);
      const m = regexTestString.match(r);
      setRegexMatches(m ? Array.from(m) : []);
    } catch (err) {
      setRegexMatches([]);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Wrench className="w-6 h-6 text-rose-500" />
          <span>Dev & Daily Swiss Knife</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Handy developer and productivity utilities running locally in your browser without tracking.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('json')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'json' ? 'border-rose-500 text-rose-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Code className="w-4 h-4" />
          <span>JSON Studio</span>
        </button>

        <button
          onClick={() => setActiveTab('jwt')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'jwt' ? 'border-rose-500 text-rose-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>JWT Inspector</span>
        </button>

        <button
          onClick={() => setActiveTab('base64')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'base64' ? 'border-rose-500 text-rose-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Binary className="w-4 h-4" />
          <span>Base64 / URL</span>
        </button>

        <button
          onClick={() => setActiveTab('hash')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'hash' ? 'border-rose-500 text-rose-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Hash className="w-4 h-4" />
          <span>Crypto Hasher & UUID</span>
        </button>

        <button
          onClick={() => setActiveTab('regex')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'regex' ? 'border-rose-500 text-rose-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Regex className="w-4 h-4" />
          <span>Regex Lab</span>
        </button>
      </div>

      {/* JSON TAB */}
      {activeTab === 'json' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-300 uppercase">Input JSON</span>
              <div className="flex gap-2">
                <button
                  onClick={formatJson}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-medium"
                >
                  Beautify
                </button>
                <button
                  onClick={minifyJson}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium"
                >
                  Minify
                </button>
              </div>
            </div>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              className="w-full h-80 bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-rose-500"
            />
            {jsonError && (
              <div className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/30">
                {jsonError}
              </div>
            )}
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-300 uppercase">Formatted Result</span>
              {jsonOutput && (
                <button
                  onClick={() => copyToClipboard(jsonOutput, 'json')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1"
                >
                  {copiedKey === 'json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'json' ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>
            <textarea
              readOnly
              value={jsonOutput}
              placeholder="Click Beautify or Minify to see result..."
              className="w-full h-80 bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-mono text-emerald-400 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* JWT TAB */}
      {activeTab === 'jwt' && (
        <div className="space-y-6">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <label className="block text-xs font-bold text-slate-300 uppercase">
              Paste JWT Token
            </label>
            <textarea
              value={jwtInput}
              onChange={(e) => decodeJwt(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full h-24 bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-rose-500 break-all"
            />
            {jwtError && (
              <div className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/30">
                {jwtError}
              </div>
            )}
          </div>

          {jwtPayload && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-rose-400 uppercase">Decoded Header</span>
                <pre className="p-3 bg-slate-900 rounded-xl text-xs font-mono text-slate-300 overflow-x-auto">
                  {JSON.stringify(jwtHeader, null, 2)}
                </pre>
              </div>

              <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-blue-400 uppercase">Decoded Payload Claims</span>
                <pre className="p-3 bg-slate-900 rounded-xl text-xs font-mono text-slate-300 overflow-x-auto">
                  {JSON.stringify(jwtPayload, null, 2)}
                </pre>
                {jwtPayload.exp && (
                  <div className="text-[11px] text-slate-400 pt-2">
                    Expires at: {new Date(jwtPayload.exp * 1000).toLocaleString()} (
                    {jwtPayload.exp * 1000 < Date.now() ? (
                      <span className="text-rose-400 font-bold">Expired</span>
                    ) : (
                      <span className="text-emerald-400 font-bold">Active</span>
                    )}
                    )
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* BASE64 TAB */}
      {activeTab === 'base64' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-300 uppercase">Raw Text</span>
            <textarea
              value={base64Text}
              onChange={(e) => {
                setBase64Text(e.target.value);
                try {
                  setBase64Result(btoa(e.target.value));
                } catch {
                  setBase64Result('Encoding error');
                }
              }}
              className="w-full h-56 bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200"
            />
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-300 uppercase">Base64 Encoded</span>
              <button
                onClick={() => copyToClipboard(base64Result, 'b64')}
                className="text-xs px-2.5 py-1 bg-slate-800 rounded-lg text-slate-300 flex items-center gap-1"
              >
                {copiedKey === 'b64' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy</span>
              </button>
            </div>
            <textarea
              readOnly
              value={base64Result || btoa(base64Text)}
              className="w-full h-56 bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-mono text-emerald-400"
            />
          </div>
        </div>
      )}

      {/* HASHER TAB */}
      {activeTab === 'hash' && (
        <div className="space-y-6">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <label className="block text-xs font-bold text-slate-300 uppercase">
              Input String to Hash
            </label>
            <input
              type="text"
              value={hashInput}
              onChange={(e) => computeHashes(e.target.value)}
              placeholder="Enter text here..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-mono"
            />
          </div>

          <div className="space-y-3">
            <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase">SHA-256</span>
                <div className="text-xs font-mono text-emerald-400 truncate">{hashes.sha256 || '...'}</div>
              </div>
              <button
                onClick={() => copyToClipboard(hashes.sha256, 'sha256')}
                className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs"
              >
                {copiedKey === 'sha256' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase">SHA-512</span>
                <div className="text-xs font-mono text-cyan-400 truncate">{hashes.sha512 || '...'}</div>
              </div>
              <button
                onClick={() => copyToClipboard(hashes.sha512, 'sha512')}
                className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs"
              >
                {copiedKey === 'sha512' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Generated UUID v4</span>
                <div className="text-xs font-mono text-purple-400">{hashes.uuid || crypto.randomUUID()}</div>
              </div>
              <button
                onClick={() => {
                  const uid = crypto.randomUUID();
                  copyToClipboard(uid, 'uuid');
                }}
                className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>New UUID</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REGEX TAB */}
      {activeTab === 'regex' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Regex Pattern
              </label>
              <input
                type="text"
                value={regexPattern}
                onChange={(e) => setRegexPattern(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Flags
              </label>
              <input
                type="text"
                value={regexFlags}
                onChange={(e) => setRegexFlags(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Test String
            </label>
            <textarea
              value={regexTestString}
              onChange={(e) => setRegexTestString(e.target.value)}
              className="w-full h-32 bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200"
            />
          </div>

          <button
            onClick={testRegex}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold"
          >
            Find Matches
          </button>

          {regexMatches.length > 0 && (
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-emerald-400">
                Matches ({regexMatches.length}):
              </span>
              <div className="flex flex-wrap gap-2">
                {regexMatches.map((m, idx) => (
                  <span key={idx} className="px-2 py-1 bg-emerald-500/10 text-emerald-300 rounded font-mono text-xs">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
