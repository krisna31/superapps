import React, { useState, useEffect, useRef } from 'react';
import { useDb } from '../context/DbContext';
import { P2PTransferManager } from '../services/p2pTransferService';
import { uploadToLitterbox, ExpiryTime } from '../services/ephemeralUploadService';
import { generateQrCodeDataUrl } from '../services/statelessLinkService';
import {
  Share2,
  Upload,
  Radio,
  Clock,
  HardDrive,
  Copy,
  Check,
  Download,
  AlertCircle,
  File,
  Sparkles,
  QrCode,
  Trash2,
  ExternalLink,
} from 'lucide-react';

export const DropZonePage: React.FC = () => {
  const { runQuery, runMutation, refreshSignal } = useDb();
  const [activeTab, setActiveTab] = useState<'p2p' | 'ephemeral' | 'stash'>('p2p');

  // P2P State
  const [p2pRole, setP2pRole] = useState<'send' | 'receive'>('send');
  const [p2pManager, setP2pManager] = useState<P2PTransferManager | null>(null);
  const [myPeerId, setMyPeerId] = useState<string>('');
  const [targetPeerInput, setTargetPeerInput] = useState('');
  const [selectedFileForP2P, setSelectedFileForP2P] = useState<File | null>(null);
  const [p2pProgress, setP2pProgress] = useState<{ current: number; total: number; fileName?: string } | null>(null);
  const [receivedFile, setReceivedFile] = useState<{ blob: Blob; name: string } | null>(null);
  const [peerQrCode, setPeerQrCode] = useState<string | null>(null);
  const [p2pStatusText, setP2pStatusText] = useState<string>('Initializing peer engine...');

  // Ephemeral State
  const [ephemeralFile, setEphemeralFile] = useState<File | null>(null);
  const [expiryHours, setExpiryHours] = useState<ExpiryTime>('24h');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResultUrl, setUploadResultUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadHistory, setUploadHistory] = useState<any[]>([]);

  // Local Stash State
  const [stashFiles, setStashFiles] = useState<any[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Initialize P2P manager
  useEffect(() => {
    const manager = new P2PTransferManager();
    manager
      .init()
      .then(async (id) => {
        setMyPeerId(id);
        setP2pManager(manager);
        setP2pStatusText(`Ready! Your Room Code is: ${id}`);
        const qr = await generateQrCodeDataUrl(id);
        setPeerQrCode(qr);

        // Listen for incoming files
        manager.onIncomingConnection(
          (curr, tot, name) => {
            setP2pProgress({ current: curr, total: tot, fileName: name });
          },
          (blob, name) => {
            setP2pProgress(null);
            setReceivedFile({ blob, name });
          }
        );
      })
      .catch((err) => {
        console.error('Failed to init P2P', err);
        setP2pStatusText('WebRTC Peer network connection error.');
      });

    return () => {
      manager.destroy();
    };
  }, []);

  // Load Ephemeral history & Stash from SQLite
  useEffect(() => {
    const ephemRes = runQuery('SELECT id, name, size, url, expiryHours, uploadedAt FROM ephemeral_uploads ORDER BY uploadedAt DESC LIMIT 10;');
    if (ephemRes.values) {
      setUploadHistory(
        ephemRes.values.map((v) => ({
          id: v[0],
          name: v[1],
          size: v[2],
          url: v[3],
          expiryHours: v[4],
          uploadedAt: v[5],
        }))
      );
    }

    const stashRes = runQuery('SELECT id, name, size, type, createdAt FROM local_stash ORDER BY createdAt DESC;');
    if (stashRes.values) {
      setStashFiles(
        stashRes.values.map((v) => ({
          id: v[0],
          name: v[1],
          size: v[2],
          type: v[3],
          createdAt: v[4],
        }))
      );
    }
  }, [runQuery, refreshSignal]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSendP2P = async () => {
    if (!p2pManager || !selectedFileForP2P || !targetPeerInput) return;
    try {
      setP2pStatusText(`Sending ${selectedFileForP2P.name}...`);
      await p2pManager.sendFile(targetPeerInput.trim(), selectedFileForP2P, (sent, total) => {
        setP2pProgress({ current: sent, total, fileName: selectedFileForP2P.name });
      });
      setP2pStatusText(`Transfer completed successfully!`);
      setP2pProgress(null);
    } catch (err: any) {
      setP2pStatusText(`Transfer failed: ${err.message}`);
      setP2pProgress(null);
    }
  };

  const downloadReceivedFile = () => {
    if (!receivedFile) return;
    const url = URL.createObjectURL(receivedFile.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = receivedFile.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleEphemeralUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ephemeralFile) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadResultUrl(null);

    const result = await uploadToLitterbox(ephemeralFile, expiryHours);
    setIsUploading(false);

    if (result.success && result.url) {
      setUploadResultUrl(result.url);
      const hoursNum = parseInt(expiryHours) || 24;
      runMutation(
        'INSERT INTO ephemeral_uploads (id, name, size, url, expiryHours, uploadedAt) VALUES (?, ?, ?, ?, ?, ?);',
        [
          'ephem_' + Math.random().toString(36).substring(2, 9),
          ephemeralFile.name,
          ephemeralFile.size,
          result.url,
          hoursNum,
          new Date().toISOString(),
        ]
      );
      setEphemeralFile(null);
    } else {
      setUploadError(result.error || 'Upload failed');
    }
  };

  const handleSaveToStash = async (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      const id = 'stash_' + Math.random().toString(36).substring(2, 9);
      runMutation(
        'INSERT INTO local_stash (id, name, size, type, dataBase64, createdAt) VALUES (?, ?, ?, ?, ?, ?);',
        [id, file.name, file.size, file.type, base64, new Date().toISOString()]
      );
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadFromStash = (id: string, name: string, type: string) => {
    const res = runQuery('SELECT dataBase64 FROM local_stash WHERE id = ?;', [id]);
    if (res.values?.[0]?.[0]) {
      const base64 = res.values[0][0];
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleDeleteStash = (id: string) => {
    runMutation('DELETE FROM local_stash WHERE id = ?;', [id]);
  };

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Share2 className="w-6 h-6 text-purple-500" />
          <span>DropZone • Temporary File Transfer & Stash</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Zero backend required. Stream files browser-to-browser via WebRTC, upload to auto-expiring hosts, or stash in local SQLite.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('p2p')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'p2p'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>P2P Direct WebRTC Transfer (0 Bytes on Server)</span>
        </button>

        <button
          onClick={() => setActiveTab('ephemeral')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'ephemeral'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Auto-Expiring Cloud Upload (1h–72h)</span>
        </button>

        <button
          onClick={() => setActiveTab('stash')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'stash'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>Local SQLite Scratch Stash</span>
        </button>
      </div>

      {/* TAB 1: P2P TRANSFER */}
      {activeTab === 'p2p' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Your Peer Room Info */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Your Room Code
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>WebRTC Online</span>
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700/80 flex items-center justify-between">
              <div>
                <span className="text-lg font-mono font-bold text-white tracking-wider">
                  {myPeerId || 'Generating ID...'}
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Share this code with your peer to receive files directly.
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(myPeerId, 'peerId')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                {copiedKey === 'peerId' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'peerId' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {peerQrCode && (
              <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-inner max-w-xs mx-auto">
                <img src={peerQrCode} alt="Room QR Code" className="w-36 h-36" />
                <span className="text-[10px] text-slate-700 font-semibold mt-1">
                  Scan to connect directly
                </span>
              </div>
            )}

            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-300">
              💡 <strong>Wormhole-Style Direct P2P:</strong> Files stream directly from your browser memory into your recipient's browser memory over encrypted WebRTC data channels. Zero bytes stored anywhere on the web!
            </div>
          </div>

          {/* Send / Receive Action Box */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5">
            <div className="flex bg-slate-900 p-1 rounded-xl">
              <button
                onClick={() => setP2pRole('send')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  p2pRole === 'send' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Send File to Peer
              </button>
              <button
                onClick={() => setP2pRole('receive')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  p2pRole === 'receive' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Receive File
              </button>
            </div>

            {p2pRole === 'send' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Recipient Room Code
                  </label>
                  <input
                    type="text"
                    value={targetPeerInput}
                    onChange={(e) => setTargetPeerInput(e.target.value)}
                    placeholder="Enter peer's room code (e.g. super-7x9q1)..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Select File to Stream
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setSelectedFileForP2P(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-300 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-purple-400 hover:file:bg-slate-700 cursor-pointer"
                  />
                  {selectedFileForP2P && (
                    <div className="mt-2 text-[11px] text-slate-400">
                      Selected: <strong>{selectedFileForP2P.name}</strong> ({(selectedFileForP2P.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSendP2P}
                  disabled={!selectedFileForP2P || !targetPeerInput}
                  className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all"
                >
                  <Upload className="w-4 h-4" />
                  <span>Start Direct P2P Streaming</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                  <Radio className="w-8 h-8 text-purple-400 mx-auto mb-2 animate-pulse" />
                  <div className="text-xs font-semibold text-white">Listening for Peer Connections</div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Keep this tab open. When your peer connects using your code, file transfer will begin automatically.
                  </p>
                </div>

                {receivedFile && (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-emerald-400">File Received Ready!</div>
                      <span className="text-[10px] text-slate-400">{(receivedFile.blob.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                    <div className="text-xs font-medium text-white truncate">{receivedFile.name}</div>
                    <button
                      onClick={downloadReceivedFile}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download File</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Transfer Progress bar */}
            {p2pProgress && (
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 space-y-2">
                <div className="flex justify-between text-[11px] text-slate-300">
                  <span className="truncate">{p2pProgress.fileName || 'Transferring...'}</span>
                  <span>{Math.round((p2pProgress.current / p2pProgress.total) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-purple-500 h-2 rounded-full transition-all duration-150"
                    style={{ width: `${(p2pProgress.current / p2pProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <div className="text-[11px] text-slate-400 font-mono text-center">
              Status: {p2pStatusText}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EPHEMERAL AUTO-DELETING UPLOAD */}
      {activeTab === 'ephemeral' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Upload Temporary File (Auto-Delete)
            </h2>
            <p className="text-xs text-slate-400">
              Uploads client-side directly to free temporary storage (Litterbox) with a predetermined auto-deletion lifetime.
            </p>

            <form onSubmit={handleEphemeralUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Choose File
                </label>
                <input
                  type="file"
                  onChange={(e) => setEphemeralFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-300 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-purple-400 hover:file:bg-slate-700 cursor-pointer"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Lifetime Before Permanent Deletion
                </label>
                <select
                  value={expiryHours}
                  onChange={(e) => setExpiryHours(e.target.value as ExpiryTime)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="1h">1 Hour (Self-destruct in 60 mins)</option>
                  <option value="12h">12 Hours</option>
                  <option value="24h">24 Hours (1 Day)</option>
                  <option value="72h">72 Hours (3 Days)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isUploading || !ephemeralFile}
                className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all"
              >
                <Upload className="w-4 h-4" />
                <span>{isUploading ? 'Uploading to Ephemeral Host...' : 'Upload & Get Auto-Expiring Link'}</span>
              </button>
            </form>

            {uploadError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {uploadError}
              </div>
            )}

            {uploadResultUrl && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                <div className="text-xs font-bold text-emerald-400">Upload Successful!</div>
                <div className="text-xs text-slate-200 font-mono break-all">{uploadResultUrl}</div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => copyToClipboard(uploadResultUrl, 'ephemUrl')}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5"
                  >
                    {copiedKey === 'ephemUrl' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'ephemUrl' ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                  <a
                    href={uploadResultUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open</span>
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Ephemeral Upload History */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Recent Ephemeral Uploads
            </h2>
            {uploadHistory.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-500">
                No temporary files uploaded yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {uploadHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate">{item.name}</div>
                      <div className="text-[10px] text-slate-500">
                        {(item.size / 1024).toFixed(1)} KB • Expires in {item.expiryHours}h
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => copyToClipboard(item.url, item.id)}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                        title="Copy Link"
                      >
                        {copiedKey === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: LOCAL SCRATCH STASH */}
      {activeTab === 'stash' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                In-Browser Encrypted Stash
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Store temporary scratch files directly inside your browser SQLite database.
              </p>
            </div>
            <div>
              <label className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 flex items-center gap-2 cursor-pointer transition-all">
                <Upload className="w-4 h-4" />
                <span>Upload to Local Stash</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleSaveToStash(f);
                  }}
                />
              </label>
            </div>
          </div>

          {stashFiles.length === 0 ? (
            <div className="glass-panel p-12 rounded-2xl text-center text-xs text-slate-500 border border-slate-800">
              No files in local stash. Drop temporary files here to access them offline.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stashFiles.map((file) => (
                <div
                  key={file.id}
                  className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-col justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                      <File className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate">{file.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {(file.size / 1024).toFixed(1)} KB • {new Date(file.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => handleDownloadFromStash(file.id, file.name, file.type)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                    <button
                      onClick={() => handleDeleteStash(file.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
