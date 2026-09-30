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
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin mb-4" />
        <h2 className="text-lg font-bold">Redirecting...</h2>
        <p className="text-xs text-slate-400 mt-1">
          Taking you to {targetUrl || 'your destination'}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold">Shortlink Not Found</h1>
      <p className="text-xs text-slate-400 mt-1 max-w-sm">
        The shortlink <code className="text-emerald-400 font-mono">/r/{slug}</code> does not exist or has expired.
      </p>

      <Link
        to="/"
        className="mt-6 flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-md transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Superapps Home</span>
      </Link>
    </div>
  );
};
