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
import { sanitizeDownloadUrl, sanitizeFileName } from '@/utils/security';

export const DropZonePage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.uid || 'guest-default';

  const [files, setFiles] = useState<DropzoneItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    currentFileIndex: number;
    totalFiles: number;
    fileName: string;
    loaded: number;
    total: number;
    percent: number;
  } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
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
    setUploadProgress({
      currentFileIndex: 1,
      totalFiles: fileList.length,
      fileName: fileList[0].name,
      loaded: 0,
      total: fileList[0].size,
      percent: 0,
    });

    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        setUploadProgress({
          currentFileIndex: i + 1,
          totalFiles: fileList.length,
          fileName: file.name,
          loaded: 0,
          total: file.size,
          percent: 0,
        });

        await dataService.uploadFile(userId, file, (prog) => {
          setUploadProgress({
            currentFileIndex: i + 1,
            totalFiles: fileList.length,
            fileName: file.name,
            loaded: prog.loaded,
            total: prog.total,
            percent: prog.percent,
          });
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'File upload failed';
      setError(message);
    } finally {
      setUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
    <div className="space-y-4 font-sans">
      {/* Top Header */}
      <div className="pb-3 border-b border-border-subtle">
        <div className="text-xs font-semibold text-accent-primary uppercase tracking-wider mb-0.5">Cloud Storage & Sharing</div>
        <h1 className="text-2xl font-display font-bold text-ink tracking-tight">
          Dropzone File Sharing
        </h1>
        <p className="text-xs text-ink-secondary mt-0.5">
          AirDrop & iCloud Drive inspired document vault backed by Firebase Storage or local persistence.
        </p>
      </div>

      {!isFirebaseConfigured && (
        <div className="p-3.5 bg-status-warning/10 border border-status-warning/30 rounded-[12px] text-status-warning text-xs flex items-center space-x-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium text-[12px]">
            Firebase Storage requires configured credentials. Files dropped currently run in local demo mode.
          </span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-status-danger/10 border border-status-danger/30 rounded-[12px] text-status-danger text-xs flex items-center space-x-2.5 font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Drop Zone: Apple AirDrop Style */}
      <div
        role="button"
        tabIndex={uploading ? -1 : 0}
        aria-label="Upload files to Dropzone"
        onClick={() => !uploading && fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (!uploading && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          if (!uploading) setIsDraggingOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!uploading && !isDraggingOver) setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDraggingOver(false);
          if (!uploading) handleFileUpload(e.dataTransfer.files);
        }}
        className={`p-8 sm:p-10 rounded-[18px] border-2 border-dashed transition-all duration-fast cursor-pointer flex flex-col items-center justify-center text-center shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary ${
          uploading
            ? 'border-accent-primary bg-accent-primary/5 cursor-wait'
            : isDraggingOver
            ? 'border-accent-primary bg-accent-primary/10 scale-[1.01]'
            : 'border-border-default bg-surface hover:bg-subtle/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          disabled={uploading}
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files)}
        />

        <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3.5 shadow-sm transition-all ${
          uploading 
            ? 'bg-accent-primary text-white animate-pulse'
            : 'bg-accent-primary/10 text-accent-primary'
        }`}>
          <CloudUpload className="w-7 h-7" />
        </div>

        <h3 className="font-display font-semibold text-sm text-ink">
          {uploading ? (
            uploadProgress ? (
              <span>Uploading {uploadProgress.currentFileIndex} of {uploadProgress.totalFiles}: <span className="font-semibold text-accent-primary">{uploadProgress.fileName}</span></span>
            ) : 'Processing upload...'
          ) : (
            'Click or drag and drop files here to upload'
          )}
        </h3>

        {uploading && uploadProgress ? (
          <div className="w-full max-w-sm mt-3.5 space-y-2">
            <div className="w-full bg-subtle rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-accent-primary h-full rounded-full transition-all duration-fast"
                style={{ width: `${Math.max(5, uploadProgress.percent)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-ink-muted">
              <span>{formatSize(uploadProgress.loaded)} / {formatSize(uploadProgress.total)}</span>
              <span className="font-semibold text-accent-primary tabular-nums">{uploadProgress.percent}%</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-ink-muted mt-1 max-w-sm">
            Directly stored to your workspace private storage vault.
          </p>
        )}
      </div>

      {/* Uploaded Files Table */}
      <div className="ios-inset-grouped bg-surface shadow-sm overflow-hidden">
        <div className="p-3.5 border-b border-border-subtle flex items-center justify-between text-xs bg-subtle/50">
          <span className="font-semibold text-ink">
            Uploaded Files ({files.length})
          </span>
          <span className="text-ink-muted tabular-nums font-medium">
            Total: {formatSize(files.reduce((acc, f) => acc + f.fileSize, 0))}
          </span>
        </div>

        <div className="divide-y divide-border-subtle">
          {files.length === 0 ? (
            <div className="py-12 text-center text-xs text-ink-muted">
              No files uploaded yet. Drop files in the area above.
            </div>
          ) : (
            files.map((item) => (
              <div
                key={item.id}
                className="py-3 px-4 flex items-center justify-between hover:bg-subtle/40 transition-colors duration-fast min-h-[52px]"
              >
                <div className="flex items-center space-x-3.5 truncate pr-3">
                  <div className="w-9 h-9 rounded-[10px] bg-accent-primary/10 text-accent-primary flex items-center justify-center flex-shrink-0">
                    <File className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <h4 className="text-xs font-semibold text-ink truncate">
                      {item.fileName}
                    </h4>
                    <div className="flex items-center space-x-2 text-[11px] text-ink-muted tabular-nums mt-0.5">
                      <span>{formatSize(item.fileSize)}</span>
                      <span>•</span>
                      <span>{new Date(item.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 flex-shrink-0">
                  <button
                    onClick={() => copyUrl(item.id, item.downloadUrl)}
                    className="p-2 rounded-lg border border-border-subtle bg-surface text-ink hover:bg-subtle transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                    title="Copy download link"
                    aria-label={`Copy download link for ${item.fileName}`}
                  >
                    {copiedId === item.id ? (
                      <Check className="w-4 h-4 text-status-success" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  {sanitizeDownloadUrl(item.downloadUrl) && (
                    <a
                      href={sanitizeDownloadUrl(item.downloadUrl)!}
                      download={sanitizeFileName(item.fileName)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg border border-border-subtle bg-surface text-ink hover:bg-subtle hover:text-accent-primary transition-colors inline-flex items-center justify-center min-h-[36px] min-w-[36px]"
                      title="Open / Download"
                      aria-label={`Download ${item.fileName}`}
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}

                  <button
                    onClick={() => handleDeleteFile(item)}
                    className="p-2 rounded-lg border border-border-subtle bg-surface text-ink-muted hover:text-status-danger hover:bg-status-danger/10 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                    title="Delete file"
                    aria-label={`Delete ${item.fileName}`}
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
