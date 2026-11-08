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
      <div className="min-h-screen bg-canvas text-ink flex flex-col items-center justify-center p-4 font-sans">
        <div className="ios-inset-grouped bg-surface shadow-ios-md border border-border-subtle p-8 rounded-[20px] max-w-sm w-full text-center flex flex-col items-center animate-fade-in">
          <div className="w-9 h-9 border-3 border-accent-primary/20 border-t-accent-primary rounded-full animate-spin mb-4" />
          <div className="text-[11px] font-semibold text-accent-primary uppercase tracking-wider mb-1">
            Safe Routing
          </div>
          <h2 className="text-lg font-display font-bold text-ink tracking-tight">Redirecting safely...</h2>
          <p className="text-xs text-ink-secondary mt-1 truncate max-w-xs">
            Taking you to {targetUrl || 'destination'}
          </p>
        </div>
      </div>
    );
  }

  if (securityBlocked) {
    return (
      <div className="min-h-screen bg-canvas text-ink flex flex-col items-center justify-center p-4 font-sans">
        <div className="ios-inset-grouped bg-surface shadow-ios-md border border-status-danger/30 p-8 rounded-[20px] max-w-md w-full text-center flex flex-col items-center animate-fade-in">
          <div className="w-14 h-14 rounded-full bg-status-danger/10 text-status-danger flex items-center justify-center mb-4 border border-status-danger/20">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div className="text-[11px] font-semibold text-status-danger uppercase tracking-wider mb-1">
            Security Blocked
          </div>
          <h1 className="text-xl font-display font-bold tracking-tight text-ink">Unsafe URL Blocked</h1>
          <p className="text-xs text-ink-secondary mt-2 leading-relaxed">
            The shortlink <code className="text-status-danger font-mono font-semibold">/r/{slug}</code> was blocked because its destination contains an unsafe or unauthorized protocol. Only validated HTTP and HTTPS destinations are permitted.
          </p>

          <Link
            to="/"
            className="mt-6 ios-btn ios-btn-primary rounded-[10px] text-xs font-semibold px-4 min-h-[44px] flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Superapps Home</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col items-center justify-center p-4 font-sans">
      <div className="ios-inset-grouped bg-surface shadow-ios-md border border-border-subtle p-8 rounded-[20px] max-w-md w-full text-center flex flex-col items-center animate-fade-in">
        <div className="w-14 h-14 rounded-full bg-subtle text-accent-primary flex items-center justify-center mb-4 border border-border-subtle">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div className="text-[11px] font-semibold text-accent-primary uppercase tracking-wider mb-1">
          HTTP 404
        </div>
        <h1 className="text-xl font-display font-bold tracking-tight text-ink">Shortlink Not Found</h1>
        <p className="text-xs text-ink-secondary mt-2 leading-relaxed">
          The shortlink <code className="text-accent-primary font-mono font-semibold">/r/{slug}</code> does not exist or has expired.
        </p>

        <Link
          to="/"
          className="mt-6 ios-btn ios-btn-primary rounded-[10px] text-xs font-semibold px-4 min-h-[44px] flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Superapps Home</span>
        </Link>
      </div>
    </div>
  );
};
