import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { dataService } from '@/services/dataService';

export const RedirectHandlerPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [targetUrl, setTargetUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    const resolveLink = async () => {
      try {
        const item = await dataService.resolveShortlink(slug);
        if (item && item.originalUrl) {
          setTargetUrl(item.originalUrl);
          // Redirect browser
          setTimeout(() => {
            window.location.replace(item.originalUrl);
          }, 600);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to resolve shortlink:', err);
        setLoading(false);
      }
    };

    resolveLink();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin mb-3" />
        <h2 className="text-base font-semibold">Redirecting...</h2>
        <p className="text-xs text-slate-400 mt-0.5 font-mono">
          Taking you to {targetUrl || 'destination'}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 text-center">
      <div className="w-12 h-12 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center mb-3 border border-rose-500/20">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h1 className="text-xl font-bold">Shortlink Not Found</h1>
      <p className="text-xs text-slate-400 mt-1 max-w-sm font-mono">
        The shortlink <code className="text-emerald-400 font-mono">/r/{slug}</code> does not exist or has expired.
      </p>

      <Link
        to="/"
        className="mt-4 flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-slate-100 text-slate-900 text-xs font-medium transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Superapps Home</span>
      </Link>
    </div>
  );
};
