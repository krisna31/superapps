import { useEffect } from 'react';

/**
 * Hook to detect and consume a deep-link query parameter `?action=<actionName>`.
 * Works reliably with HashRouter (#/route?action=...) and standard browser history
 * without requiring React Router context during unit tests.
 */
export function useActionQuery(actionName: string, onAction: () => void) {
  useEffect(() => {
    try {
      const hash = window.location.hash || '';
      const hashQuery = hash.includes('?') ? hash.split('?')[1] : '';
      const searchParams = new URLSearchParams(hashQuery || window.location.search || '');

      if (searchParams.get('action') === actionName) {
        onAction();

        // Remove the action parameter from the URL to avoid re-triggering on reload
        searchParams.delete('action');
        const remainingQuery = searchParams.toString();
        const baseHash = hash.split('?')[0];
        const newUrl = remainingQuery ? `${baseHash}?${remainingQuery}` : baseHash;
        window.history.replaceState(null, '', newUrl || window.location.pathname);
      }
    } catch {
      // Safe fallback if history state replacement is not available in environment
    }
  }, [actionName, onAction]);
}
