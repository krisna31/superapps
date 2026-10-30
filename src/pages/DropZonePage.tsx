import React, { useState, useEffect, useRef } from 'react';
import { 
  CloudUpload, 
  File, 
  Trash2, 
  Copy, 
  Check, 
  Download, 
  AlertCircle 
} from 'lucide-react';
import { dataService } from '@/services/dataService';
import { DropzoneItem } from '@/types';
import { isFirebaseConfigured } from '@/firebase/config';
import { useAuth } from '@/context/AuthContext';

export const DropZonePage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.uid || 'vault-owner';

  const [files, setFiles] = useState<DropzoneItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = dataService.subscribeToDropzone(userId, (items) => {
      setFiles(items);
    });
    return () => unsubscribe();
  }, [userId]);

  const handleFileUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setError(null);
    setUploading(true);

    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        await dataService.uploadFile(userId, file);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'File upload failed';
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (file: DropzoneItem) => {
    if (confirm(`Delete file "${file.fileName}" permanently?`)) {
      await dataService.deleteDropzoneItem(userId, file);
    }
  };

  const copyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-3.5">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Dropzone File Sharing
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Secure private object storage hosted on Firebase Storage Spark tier
        </p>
      </div>

      {!isFirebaseConfigured && (
        <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>
            Firebase Storage requires configured credentials. Files dropped currently run in local demo mode.
          </span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Drop Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFileUpload(e.dataTransfer.files);
        }}
        className={`p-6 rounded-lg border border-dashed transition-colors cursor-pointer flex flex-col items-center justify-center text-center ${
          uploading
            ? 'border-emerald-500 bg-emerald-500/5 cursor-wait'
            : 'border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files)}
        />

        <div className="w-9 h-9 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center mb-2">
          <CloudUpload className="w-4 h-4" />
        </div>

        <h3 className="font-semibold text-xs text-slate-800 dark:text-slate-200">
          {uploading ? 'Uploading your files...' : 'Click or drag and drop files here to upload'}
        </h3>
        <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm font-mono">
          Scoped directly to your private workspace storage bucket
        </p>
      </div>

      {/* Uploaded Files Table */}
      <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-2.5 px-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono">
          <span className="font-semibold text-slate-500 uppercase tracking-wider">
            Uploaded Files ({files.length})
          </span>
          <span className="text-slate-400 tabular-nums">
            Total: {formatSize(files.reduce((acc, f) => acc + f.fileSize, 0))}
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {files.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 font-mono">
              No files uploaded yet. Drop a file above to begin.
            </div>
          ) : (
            files.map((item) => (
              <div
                key={item.id}
                className="py-2 px-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center space-x-2.5 truncate pr-3">
                  <div className="w-7 h-7 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center flex-shrink-0">
                    <File className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <h4 className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                      {item.fileName}
                    </h4>
                    <div className="flex items-center space-x-1.5 text-[10px] font-mono text-slate-400 tabular-nums">
                      <span>{formatSize(item.fileSize)}</span>
                      <span>•</span>
                      <span>{new Date(item.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1 flex-shrink-0">
                  <button
                    onClick={() => copyUrl(item.id, item.downloadUrl)}
                    className="p-1 rounded text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Copy download link"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <a
                    href={item.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded text-slate-400 hover:text-sky-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Open / Download"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={() => handleDeleteFile(item)}
                    className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Delete file"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
