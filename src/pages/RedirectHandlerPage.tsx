import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ShieldAlert } from 'lucide-react';
import { dataService } from '@/services/dataService';
import { sanitizeRedirectUrl } from '@/utils/security';

export const RedirectHandlerPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [targetUrl, setTargetUrl] = useState<string | null>(null);
  const [securityBlocked, setSecurityBlocked] = useState(false);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    let redirectTimer: ReturnType<typeof setTimeout> | null = null;
    let isCancelled = false;

    const resolveLink = async () => {
      try {
        const item = await dataService.resolveShortlink(slug);
        if (isCancelled) return;
        if (item && item.originalUrl) {
          const safeUrl = sanitizeRedirectUrl(item.originalUrl);
          if (!safeUrl) {
            console.warn('Security blocked unsafe shortlink target protocol:', item.originalUrl);
            setSecurityBlocked(true);
            setLoading(false);
            return;
          }

          setTargetUrl(safeUrl);
          // Safe browser redirection strictly to validated HTTP/HTTPS URL
          redirectTimer = setTimeout(() => {
            if (!isCancelled) {
              window.location.replace(safeUrl);
            }
          }, 600);
        } else {
          setLoading(false);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Failed to resolve shortlink:', err);
          setLoading(false);
        }
      }
    };

    resolveLink();
    return () => {
      isCancelled = true;
      if (redirectTimer !== null) {
        clearTimeout(redirectTimer);
      }
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col items-center justify-center p-4 font-mono">
        <div className="w-8 h-8 border-2 border-[var(--border-strong)] border-t-[var(--color-primary)] animate-spin mb-4 rounded-none" />
        <div className="text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-widest mb-1">
          [ROUTING]
        </div>
        <h2 className="text-base font-display font-black uppercase tracking-tight">Redirecting safely...</h2>
        <p className="text-xs text-[var(--text-muted)] mt-1 font-mono truncate max-w-sm">
          Taking you to {targetUrl || 'destination'}
        </p>
      </div>
    );
  }

  if (securityBlocked) {
    return (
      <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col items-center justify-center p-4 text-center font-mono">
        <div className="w-12 h-12 rounded-none bg-[var(--bg-surface)] text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3 border-[1.5px] border-rose-500/40 shadow-none">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-1">
          [SECURITY BLOCKED]
        </div>
        <h1 className="text-xl font-display font-black uppercase tracking-tight">Unsafe URL Blocked</h1>
        <p className="text-xs text-[var(--text-muted)] mt-2 max-w-md font-mono leading-relaxed">
          The shortlink <code className="text-rose-500 font-mono font-bold">/r/{slug}</code> was blocked because its destination contains an unsafe or unauthorized protocol. Only validated HTTP and HTTPS destinations are permitted.
        </p>

        <Link
          to="/"
          className="mt-5 flex items-center space-x-1.5 px-4 py-2 rounded-none bg-[var(--color-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-canvas)] text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors duration-100 ease-linear border-[1.5px] border-[var(--border-strong)] shadow-none"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Superapps Home</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col items-center justify-center p-4 text-center font-mono">
      <div className="w-12 h-12 rounded-none bg-[var(--bg-surface)] text-[var(--color-primary)] flex items-center justify-center mb-3 border-[1.5px] border-[var(--border-strong)] shadow-none">
        <AlertCircle className="w-6 h-6" />
      </div>
      <div className="text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-widest mb-1">
        [HTTP-404]
      </div>
      <h1 className="text-xl font-display font-black uppercase tracking-tight">Shortlink Not Found</h1>
      <p className="text-xs text-[var(--text-muted)] mt-2 max-w-sm font-mono leading-relaxed">
        The shortlink <code className="text-[var(--color-primary)] font-mono font-bold">/r/{slug}</code> does not exist or has expired.
      </p>

      <Link
        to="/"
        className="mt-5 flex items-center space-x-1.5 px-4 py-2 rounded-none bg-[var(--color-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-canvas)] text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors duration-100 ease-linear border-[1.5px] border-[var(--border-strong)] shadow-none"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Superapps Home</span>
      </Link>
    </div>
  );
};
