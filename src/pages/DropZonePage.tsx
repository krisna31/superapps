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
    <div className="space-y-4">
      {/* Top Header */}
      <div className="border-b-1.5 border-border-strong pb-4">
        <div className="werkbund-coord mb-1">[MODULE-07] DISTRIBUTED FILE SHARING & STORAGE</div>
        <h1 className="text-2xl font-display font-bold uppercase tracking-tight text-ink">
          Dropzone File Sharing
        </h1>
        <p className="text-xs text-ink-secondary mt-0.5">
          Upload and share documents backed by Firebase Cloud Storage or local browser persistence.
        </p>
      </div>

      {!isFirebaseConfigured && (
        <div className="p-3 bg-surface border-1.5 border-status-warning text-status-warning text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="font-mono uppercase font-bold text-[11px]">
            Firebase Storage requires configured credentials. Files dropped currently run in local demo mode.
          </span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-surface border-1.5 border-status-danger text-status-danger text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="font-mono text-[11px]">{error}</span>
        </div>
      )}

      {/* Upload Drop Zone: 1.5px Dashed Grid Frame */}
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
        className={`p-8 border-1.5 border-dashed transition-colors duration-fast cursor-pointer flex flex-col items-center justify-center text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal ${
          uploading
            ? 'border-signal bg-signal-tint cursor-wait'
            : isDraggingOver
            ? 'border-signal bg-signal-tint'
            : 'border-border-strong bg-surface hover:bg-subtle'
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

        <div className={`w-10 h-10 border-1.5 border-border-strong flex items-center justify-center mb-3 ${
          uploading 
            ? 'bg-signal text-canvas animate-pulse'
            : 'bg-subtle text-ink'
        }`}>
          <CloudUpload className="w-5 h-5" />
        </div>

        <h3 className="font-display font-bold text-sm uppercase text-ink">
          {uploading ? (
            uploadProgress ? (
              <span>Uploading {uploadProgress.currentFileIndex} of {uploadProgress.totalFiles}: <span className="font-mono text-signal">{uploadProgress.fileName}</span></span>
            ) : 'Processing upload...'
          ) : (
            'Click or drag and drop files here to upload'
          )}
        </h3>

        {uploading && uploadProgress ? (
          <div className="w-full max-w-sm mt-3 space-y-1.5">
            <div className="w-full bg-subtle border-1.5 border-border-strong h-3 p-0.5">
              <div 
                className="bg-signal h-full transition-all duration-fast"
                style={{ width: `${Math.max(5, uploadProgress.percent)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-ink-muted">
              <span>{formatSize(uploadProgress.loaded)} / {formatSize(uploadProgress.total)}</span>
              <span className="font-bold text-signal tabular-nums">{uploadProgress.percent}%</span>
            </div>
          </div>
        ) : (
          <p className="werkbund-coord mt-1 max-w-sm">
            SCOPED DIRECTLY TO PRIVATE WORKSPACE STORAGE BUCKET
          </p>
        )}
      </div>

      {/* Uploaded Files Table */}
      <div className="bg-surface border-1.5 border-border-strong overflow-hidden">
        <div className="p-3 border-b-1.5 border-border-strong flex items-center justify-between text-xs font-mono bg-subtle">
          <span className="font-bold text-ink uppercase tracking-wider">
            Uploaded Files ({files.length})
          </span>
          <span className="text-ink-muted tabular-nums">
            Total: {formatSize(files.reduce((acc, f) => acc + f.fileSize, 0))}
          </span>
        </div>

        <div className="divide-y-1.5 divide-border-strong">
          {files.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-ink-muted">
              [NULL] NO FILES UPLOADED YET. DROP FILES IN THE BOUNDARY ABOVE.
            </div>
          ) : (
            files.map((item) => (
              <div
                key={item.id}
                className="py-2.5 px-4 flex items-center justify-between hover:bg-subtle transition-colors duration-fast"
              >
                <div className="flex items-center space-x-3 truncate pr-3">
                  <div className="w-7 h-7 bg-subtle border-1.5 border-border-strong text-ink flex items-center justify-center flex-shrink-0">
                    <File className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <h4 className="text-xs font-bold text-ink truncate uppercase">
                      {item.fileName}
                    </h4>
                    <div className="flex items-center space-x-2 text-[10px] font-mono text-ink-muted tabular-nums">
                      <span>{formatSize(item.fileSize)}</span>
                      <span>•</span>
                      <span>{new Date(item.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 flex-shrink-0">
                  <button
                    onClick={() => copyUrl(item.id, item.downloadUrl)}
                    className="p-1.5 border border-border-strong bg-canvas text-ink hover:bg-ink hover:text-canvas transition-colors duration-fast"
                    title="Copy download link"
                    aria-label={`Copy download link for ${item.fileName}`}
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3.5 h-3.5 text-status-success" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {sanitizeDownloadUrl(item.downloadUrl) && (
                    <a
                      href={sanitizeDownloadUrl(item.downloadUrl)!}
                      download={sanitizeFileName(item.fileName)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 border border-border-strong bg-canvas text-ink hover:bg-signal hover:text-canvas transition-colors duration-fast inline-flex items-center"
                      title="Open / Download"
                      aria-label={`Download ${item.fileName}`}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  )}

                  <button
                    onClick={() => handleDeleteFile(item)}
                    className="p-1.5 border border-border-strong bg-canvas text-ink hover:bg-status-danger hover:text-white transition-colors duration-fast"
                    title="Delete file"
                    aria-label={`Delete ${item.fileName}`}
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
