import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { decodeStatelessLink } from '../services/statelessLinkService';
import { ExternalLink, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import { SuperappsLogo } from '../components/brand/SuperappsLogo';

export const RedirectHandlerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [targetUrl, setTargetUrl] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(2);

  useEffect(() => {
    const data = searchParams.get('d');
    if (!data) {
      setError('No destination link data found in URL parameters.');
      return;
    }

    const payload = decodeStatelessLink(data);
    if (!payload || !payload.url) {
      setError('Unable to decode destination URL. The link may be malformed or truncated.');
      return;
    }

    setTargetUrl(payload.url);
    if (payload.title) setTitle(payload.title);

    // Auto-redirect timer
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          window.location.replace(payload.url);
          return 0;
        }
        return prev - 1;
      });
    }, 800);

    return () => clearInterval(interval);
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-panel p-8 rounded-3xl border border-slate-800 text-center shadow-2xl relative overflow-hidden">
        <div className="absolute -inset-1 rounded-3xl bg-blue-600/10 blur-xl pointer-events-none" />

        <div className="flex justify-center mb-4">
          <SuperappsLogo size={42} variant="badge" />
        </div>

        {error ? (
          <div>
            <div className="w-14 h-14 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Redirect Failed</h2>
            <p className="text-xs text-slate-400 mb-6">{error}</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
            >
              <span>Return to Superapps</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : targetUrl ? (
          <div>
            <div className="w-14 h-14 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto mb-4 animate-bounce">
              <ExternalLink className="w-7 h-7" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-400 mb-3">
              <ShieldCheck className="w-3 h-3" />
              <span>SUPERAPPS CLIENT-SIDE FORWARDER</span>
            </div>

            <h2 className="text-xl font-bold text-white mb-1">
              {title ? title : 'Redirecting you...'}
            </h2>
            <p className="text-xs text-slate-400 font-mono break-all line-clamp-2 mb-6">
              {targetUrl}
            </p>

            <div className="space-y-3">
              <a
                href={targetUrl}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
              >
                <span>Continue Now ({countdown}s)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>

              <Link
                to="/"
                className="block text-[11px] text-slate-500 hover:text-slate-300 transition-colors pt-2"
              >
                Hosted on Superapps OS • GitHub Pages
              </Link>
            </div>
          </div>
        ) : (
          <div className="py-8 text-xs text-slate-400 animate-pulse">
            Processing link payload...
          </div>
        )}
      </div>
    </div>
  );
};
