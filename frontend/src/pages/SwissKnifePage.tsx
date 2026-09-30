import React, { useState, useEffect, useMemo } from 'react';
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
  KeyRound,
  ShieldCheck,
  Dice5,
  History,
  Sliders,
  AlertTriangle,
} from 'lucide-react';
import { soundService } from '../services/soundService';

const DICEWARE_WORDS = [
  'ability', 'absorb', 'abstract', 'access', 'account', 'acoustic', 'action', 'actor',
  'actress', 'adapter', 'advance', 'afford', 'airport', 'alarm', 'album', 'alcohol',
  'alien', 'almond', 'alpine', 'aluminum', 'amateur', 'amber', 'anchor', 'angel',
  'animal', 'antenna', 'antique', 'anvil', 'apology', 'apple', 'apron', 'arcade',
  'arch', 'arctic', 'arena', 'armor', 'arrow', 'aspect', 'asset', 'athlete',
  'atlas', 'atom', 'audio', 'august', 'aurora', 'autumn', 'avocado', 'axis',
  'bacon', 'badge', 'bagel', 'baker', 'balcony', 'bamboo', 'banana', 'banner',
  'barber', 'barrel', 'basket', 'battery', 'beacon', 'bear', 'beauty', 'beaver',
  'beetle', 'beloved', 'bench', 'bicycle', 'binary', 'biology', 'biscuit', 'bison',
  'blade', 'blanket', 'blender', 'blossom', 'blueberry', 'board', 'breeze', 'bridge',
  'bronze', 'bubble', 'bucket', 'buffalo', 'bullet', 'bundle', 'burger', 'butterfly',
  'cabin', 'cable', 'cactus', 'camera', 'campfire', 'candle', 'canvas', 'canyon',
  'captain', 'caravan', 'carpet', 'castle', 'catalyst', 'cathedral', 'cedar', 'celestial',
  'century', 'cereal', 'champion', 'chapter', 'charcoal', 'cheetah', 'cherry', 'chestnut',
  'chimney', 'circuit', 'citadel', 'claw', 'cliff', 'climate', 'clover', 'cluster',
  'cobalt', 'coconut', 'coffee', 'comet', 'compass', 'copper', 'coral', 'cosmos',
  'cotton', 'cradle', 'crater', 'crystal', 'cube', 'current', 'cushion', 'cyber',
  'cylinder', 'dancer', 'dawn', 'daylight', 'delta', 'dentist', 'desert', 'diamond',
  'dinosaur', 'diploma', 'disco', 'dolphin', 'dragon', 'drawer', 'driftwood', 'drum',
  'dune', 'dynamo', 'eagle', 'echo', 'eclipse', 'elastic', 'elephant', 'emerald',
  'engine', 'epoch', 'erosion', 'escape', 'espresso', 'eternal', 'falcon', 'feather',
  'fern', 'festival', 'fiber', 'field', 'firewall', 'fission', 'flamingo', 'flint',
  'forest', 'fountain', 'fox', 'fragment', 'frost', 'galaxy', 'garden', 'garlic',
  'gemstone', 'geyser', 'glacier', 'glider', 'glow', 'granite', 'gravity', 'grove',
  'harbor', 'harmony', 'harvest', 'hawk', 'horizon', 'icicle', 'impact', 'indigo',
  'island', 'jaguar', 'javelin', 'jellyfish', 'jungle', 'jupiter', 'kernel', 'keyboard',
  'kite', 'koala', 'lagoon', 'lantern', 'laser', 'lava', 'legacy', 'leopard',
  'lighthouse', 'lightning', 'lion', 'lizard', 'lotus', 'lunar', 'magnet', 'mango',
  'mantis', 'maple', 'marble', 'matrix', 'meadow', 'mercury', 'meteor', 'mineral',
  'monarch', 'mountain', 'nebula', 'neon', 'nest', 'neutron', 'ninja', 'nitrogen',
  'nomad', 'nova', 'oasis', 'obsidian', 'ocean', 'olive', 'omega', 'onyx',
  'orbit', 'orchid', 'origami', 'osprey', 'oxygen', 'panda', 'panther', 'paradox',
  'peacock', 'pearl', 'pebble', 'pelican', 'penguin', 'phoenix', 'photon', 'piano',
  'pillar', 'pilot', 'pioneer', 'planet', 'plasma', 'platinum', 'polar', 'polygon',
  'prairie', 'prism', 'proton', 'pulsar', 'pyramid', 'quantum', 'quartz', 'radar',
  'radiance', 'rainbow', 'ranger', 'raven', 'reef', 'reservoir', 'ripple', 'river',
  'rocket', 'ruby', 'safari', 'sakura', 'sapphire', 'satellite', 'saturn', 'savanna',
  'shadow', 'shield', 'sierra', 'silver', 'solar', 'sonic', 'spectrum', 'spiral',
  'summit', 'sunflower', 'supernova', 'timber', 'titan', 'topaz', 'tornado', 'tundra',
  'turbine', 'twilight', 'typhoon', 'unicorn', 'uranium', 'valley', 'velocity', 'venture',
  'vessel', 'vortex', 'voyage', 'vulcan', 'walrus', 'waterfall', 'whisper', 'willow',
  'wizard', 'zenith', 'zephyr', 'zodiac',
];

export const SwissKnifePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'json' | 'jwt' | 'base64' | 'hash' | 'regex' | 'password'>('json');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Password Generator State
  const [passMode, setPassMode] = useState<'password' | 'diceware'>('password');
  const [passLength, setPassLength] = useState(20);
  const [includeUpper, setIncludeUpper] = useState(true);
  const [includeLower, setIncludeLower] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);

  // Diceware State
  const [dicewareWordsCount, setDicewareWordsCount] = useState(5);
  const [dicewareSeparator, setDicewareSeparator] = useState('-');
  const [dicewareCapitalize, setDicewareCapitalize] = useState(true);
  const [dicewareIncludeNumber, setDicewareIncludeNumber] = useState(true);

  // Password output & history
  const [generatedPass, setGeneratedPass] = useState('');
  const [passHistory, setPassHistory] = useState<string[]>([]);


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
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
    soundService.playSuccess();
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Password Generator Actions
  const generateRandomPassword = () => {
    let pool = '';
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (includeUpper) pool += upper;
    if (includeLower) pool += lower;
    if (includeNumbers) pool += numbers;
    if (includeSymbols) pool += symbols;

    if (excludeAmbiguous) {
      pool = pool.replace(/[l1IO0o]/g, '');
    }

    if (!pool) pool = lower;

    const randomValues = new Uint32Array(passLength);
    crypto.getRandomValues(randomValues);

    let result = '';
    for (let i = 0; i < passLength; i++) {
      result += pool[randomValues[i] % pool.length];
    }
    return result;
  };

  const generateDicewarePassphrase = () => {
    const words: string[] = [];
    const randomValues = new Uint32Array(dicewareWordsCount);
    crypto.getRandomValues(randomValues);

    for (let i = 0; i < dicewareWordsCount; i++) {
      let word = DICEWARE_WORDS[randomValues[i] % DICEWARE_WORDS.length];
      if (dicewareCapitalize) {
        word = word.charAt(0).toUpperCase() + word.slice(1);
      }
      words.push(word);
    }

    let phrase = words.join(dicewareSeparator);
    if (dicewareIncludeNumber) {
      const numVal = new Uint32Array(1);
      crypto.getRandomValues(numVal);
      const digit = (numVal[0] % 900) + 100;
      phrase += dicewareSeparator + digit;
    }
    return phrase;
  };

  const generateNewSecret = (overrideMode?: 'password' | 'diceware') => {
    const mode = overrideMode || passMode;
    const secret = mode === 'password' ? generateRandomPassword() : generateDicewarePassphrase();
    setGeneratedPass(secret);
    setPassHistory((prev) => [secret, ...prev.filter((p) => p !== secret)].slice(0, 5));
    soundService.playClick();
  };

  const handleSwitchMode = (mode: 'password' | 'diceware') => {
    setPassMode(mode);
    generateNewSecret(mode);
  };

  // Generate on first mount
  useEffect(() => {
    if (!generatedPass) {
      const secret = passMode === 'password' ? generateRandomPassword() : generateDicewarePassphrase();
      setGeneratedPass(secret);
      setPassHistory([secret]);
    }
  }, []);

  // Entropy Calculation
  const entropyInfo = useMemo(() => {
    if (!generatedPass) return { bits: 0, label: 'Unknown', color: 'text-slate-400', barWidth: '0%', crackTime: 'Instant' };

    let bits = 0;
    if (passMode === 'password') {
      let poolSize = 0;
      if (includeUpper) poolSize += 26;
      if (includeLower) poolSize += 26;
      if (includeNumbers) poolSize += 10;
      if (includeSymbols) poolSize += 28;
      if (excludeAmbiguous) poolSize -= 6;
      if (poolSize < 2) poolSize = 26;
      bits = Math.round(passLength * Math.log2(poolSize));
    } else {
      const wordEntropy = dicewareWordsCount * Math.log2(DICEWARE_WORDS.length);
      const capEntropy = dicewareCapitalize ? dicewareWordsCount * Math.log2(2) : 0;
      const numEntropy = dicewareIncludeNumber ? Math.log2(1000) : 0;
      bits = Math.round(wordEntropy + capEntropy + numEntropy);
    }

    if (bits < 40) {
      return { bits, label: 'Very Weak', color: 'text-rose-400', barWidth: '20%', crackTime: 'Seconds' };
    } else if (bits < 60) {
      return { bits, label: 'Weak', color: 'text-orange-400', barWidth: '40%', crackTime: 'Days to Weeks' };
    } else if (bits < 80) {
      return { bits, label: 'Good', color: 'text-amber-400', barWidth: '65%', crackTime: 'Centuries' };
    } else if (bits < 110) {
      return { bits, label: 'Strong', color: 'text-emerald-400', barWidth: '85%', crackTime: 'Trillions of Years' };
    } else {
      return { bits, label: 'Cryptographically Hardened', color: 'text-cyan-400', barWidth: '100%', crackTime: 'Uncrackable' };
    }
  }, [passMode, generatedPass, passLength, includeUpper, includeLower, includeNumbers, includeSymbols, excludeAmbiguous, dicewareWordsCount, dicewareCapitalize, dicewareIncludeNumber]);


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

        <button
          onClick={() => setActiveTab('password')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'password' ? 'border-rose-500 text-rose-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Password & Diceware</span>
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

      {/* PASSWORD & DICEWARE TAB */}
      {activeTab === 'password' && (
        <div className="space-y-6">
          {/* Mode Switcher */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSwitchMode('password')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                passMode === 'password'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>Random Password</span>
            </button>

            <button
              onClick={() => handleSwitchMode('diceware')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                passMode === 'diceware'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Dice5 className="w-4 h-4" />
              <span>Diceware Passphrase</span>
            </button>
          </div>

          {/* Primary Password Display & Copy Card */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Generated Secret</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => generateNewSecret()}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700/60"
                  title="Generate new secret"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Regenerate</span>
                </button>

                <button
                  onClick={() => copyToClipboard(generatedPass, 'generated_pass')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm ${
                    copiedKey === 'generated_pass'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-600 hover:bg-rose-500 text-white'
                  }`}
                  title="Copy to clipboard"
                >
                  {copiedKey === 'generated_pass' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Secret</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Secret String Box */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 font-mono text-sm sm:text-base text-white break-all tracking-wide select-all leading-relaxed">
              {generatedPass}
            </div>

            {/* Entropy & Strength Meter */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Strength:</span>
                  <span className={`font-bold ${entropyInfo.color}`}>{entropyInfo.label}</span>
                  <span className="text-slate-500 font-mono text-[11px]">
                    ({entropyInfo.bits} bits of entropy)
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  <span>Crack Time: </span>
                  <strong className="text-slate-200">{entropyInfo.crackTime}</strong>
                </div>
              </div>

              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-300 ${
                    entropyInfo.bits < 40
                      ? 'bg-rose-500'
                      : entropyInfo.bits < 60
                      ? 'bg-orange-500'
                      : entropyInfo.bits < 80
                      ? 'bg-amber-500'
                      : entropyInfo.bits < 110
                      ? 'bg-emerald-500'
                      : 'bg-cyan-400'
                  }`}
                  style={{ width: entropyInfo.barWidth }}
                />
              </div>
            </div>
          </div>

          {/* Configuration Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {passMode === 'password' ? (
              /* Random Password Configuration */
              <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-rose-400" />
                  <span>Password Settings</span>
                </h3>

                {/* Length Slider */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-300">Password Length</span>
                    <span className="font-mono text-rose-400 font-bold">{passLength} characters</span>
                  </div>
                  <input
                    type="range"
                    min={8}
                    max={64}
                    value={passLength}
                    onChange={(e) => {
                      setPassLength(Number(e.target.value));
                    }}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                    <span>8</span>
                    <span>20 (Recommended)</span>
                    <span>64</span>
                  </div>
                </div>

                {/* Character Pool Toggles */}
                <div className="space-y-2 pt-2">
                  <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeUpper}
                      onChange={(e) => setIncludeUpper(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-rose-500 focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                    <span>Uppercase Letters (A-Z)</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeLower}
                      onChange={(e) => setIncludeLower(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-rose-500 focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                    <span>Lowercase Letters (a-z)</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeNumbers}
                      onChange={(e) => setIncludeNumbers(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-rose-500 focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                    <span>Numbers (0-9)</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeSymbols}
                      onChange={(e) => setIncludeSymbols(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-rose-500 focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                    <span>Special Symbols (!@#$%^&*...)</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={excludeAmbiguous}
                      onChange={(e) => setExcludeAmbiguous(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-rose-500 focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                    <span>Exclude Ambiguous Characters (l, 1, I, O, 0)</span>
                  </label>
                </div>
              </div>
            ) : (
              /* Diceware Configuration */
              <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Dice5 className="w-4 h-4 text-rose-400" />
                  <span>Diceware Settings</span>
                </h3>

                {/* Word Count Slider */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-300">Word Count</span>
                    <span className="font-mono text-rose-400 font-bold">{dicewareWordsCount} words</span>
                  </div>
                  <input
                    type="range"
                    min={3}
                    max={8}
                    value={dicewareWordsCount}
                    onChange={(e) => {
                      setDicewareWordsCount(Number(e.target.value));
                    }}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                    <span>3 (Fast)</span>
                    <span>5 (Standard)</span>
                    <span>8 (Maximum)</span>
                  </div>
                </div>

                {/* Separator selector */}
                <div>
                  <label className="block text-xs text-slate-300 mb-1.5">
                    Word Separator
                  </label>
                  <select
                    value={dicewareSeparator}
                    onChange={(e) => setDicewareSeparator(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none"
                  >
                    <option value="-">Hyphen (-)</option>
                    <option value="_">Underscore (_)</option>
                    <option value=" ">Space ( )</option>
                    <option value=".">Period (.)</option>
                    <option value="/">Slash (/)</option>
                  </select>
                </div>

                {/* Diceware Options */}
                <div className="space-y-2 pt-2">
                  <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dicewareCapitalize}
                      onChange={(e) => setDicewareCapitalize(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-rose-500 focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                    <span>Capitalize Words (TitleCase)</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dicewareIncludeNumber}
                      onChange={(e) => setDicewareIncludeNumber(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-rose-500 focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                    <span>Append Random 3-Digit Number</span>
                  </label>
                </div>
              </div>
            )}

            {/* Session History Card */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-4 h-4 text-blue-400" />
                  <span>Session History (Recent 5)</span>
                </h3>
                {passHistory.length > 0 && (
                  <button
                    onClick={() => setPassHistory([])}
                    className="text-[10px] text-slate-500 hover:text-slate-300"
                  >
                    Clear History
                  </button>
                )}
              </div>

              {passHistory.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No generated secrets yet in this session.
                </div>
              ) : (
                <div className="space-y-2">
                  {passHistory.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 font-mono"
                    >
                      <span className="truncate max-w-[200px] sm:max-w-xs">{item}</span>
                      <button
                        onClick={() => copyToClipboard(item, `hist_${idx}`)}
                        className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors ml-2 shrink-0"
                        title="Copy to clipboard"
                      >
                        {copiedKey === `hist_${idx}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
