import React, { useState, useEffect, useRef } from 'react';
import { 
  CloudUpload, 
  Trash2, 
  Download, 
  Copy, 
  Check, 
  File, 
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { dataService } from '@/services/dataService';
import { DropzoneItem } from '@/types';

export const DropZonePage: React.FC = () => {
  const { user, isFirebaseConfigured } = useAuth();
  const userId = user?.uid || 'guest-default';

  const [files, setFiles] = useState<DropzoneItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFiles = async () => {
    const data = await dataService.getDropzoneItems(userId);
    setFiles(data);
  };

  useEffect(() => {
    loadFiles();
  }, [userId]);

  const handleFileUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);

    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const newItem = await dataService.uploadFile(userId, file);
        setFiles((prev) => [newItem, ...prev]);
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      alert(err.message || 'File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (item: DropzoneItem) => {
    await dataService.deleteDropzoneItem(userId, item);
    setFiles((prev) => prev.filter((f) => f.id !== item.id));
  };

  const copyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Dropzone File Sharing
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Upload and share files via Firebase Storage (5 GB Free Tier)
          </p>
        </div>

        {!isFirebaseConfigured && (
          <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs flex items-center space-x-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Using Local Blob Storage Fallback</span>
          </div>
        )}
      </div>

      {/* Drag & Drop Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFileUpload(e.dataTransfer.files);
        }}
        className={`group p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center ${
          uploading
            ? 'border-emerald-500 bg-emerald-500/5 cursor-wait'
            : 'border-slate-300 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 bg-white/50 dark:bg-slate-900/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files)}
        />

        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3 group-hover:scale-110 transition">
          <CloudUpload className="w-7 h-7" />
        </div>

        <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
          {uploading ? 'Uploading your files...' : 'Click to upload or drag & drop files here'}
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          Images, documents, archives, or code files. All files are securely scoped in your Firebase Storage folder.
        </p>
      </div>

      {/* Uploaded Files Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="font-semibold text-xs text-slate-500 uppercase tracking-wider">
            Uploaded Files ({files.length})
          </span>
          <span className="text-xs text-slate-400">
            Total: {formatSize(files.reduce((acc, f) => acc + f.fileSize, 0))}
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {files.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No files uploaded yet. Drop a file above to begin.
            </div>
          ) : (
            files.map((item) => (
              <div
                key={item.id}
                className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition"
              >
                <div className="flex items-center space-x-3 truncate pr-4">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center flex-shrink-0">
                    <File className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {item.fileName}
                    </h4>
                    <div className="flex items-center space-x-2 mt-0.5 text-[11px] text-slate-400">
                      <span>{formatSize(item.fileSize)}</span>
                      <span>•</span>
                      <span>{new Date(item.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 flex-shrink-0">
                  <button
                    onClick={() => copyUrl(item.id, item.downloadUrl)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Copy download link"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  <a
                    href={item.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Open / Download"
                  >
                    <Download className="w-4 h-4" />
                  </a>

                  <button
                    onClick={() => handleDeleteFile(item)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Delete file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
