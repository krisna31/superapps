import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Application ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = (): void => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleGoHome = (): void => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="min-h-[60vh] flex items-center justify-center p-6 text-ink"
        >
          <div className="max-w-md w-full bg-elevated border-1.5 border-border-strong p-6 space-y-4 text-center">
            <div className="w-12 h-12 bg-surface border-1.5 border-status-danger text-status-danger flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <div className="werkbund-coord text-status-danger">
                [ERR-500] UNCAUGHT RUNTIME EXCEPTION
              </div>
              <h2 className="text-base font-display font-bold uppercase tracking-tight text-ink">
                Something went wrong in this module
              </h2>
              <p className="text-xs text-ink-secondary">
                An unexpected runtime or network chunk error occurred. Your workspace data remains safe in local persistence.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 bg-subtle border-1.5 border-border-strong text-[11px] font-mono text-status-danger break-words text-left">
                {this.state.error.message}
              </div>
            )}

            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="werkbund-btn werkbund-btn-signal text-xs py-2 px-3"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Module</span>
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="werkbund-btn werkbund-btn-outline text-xs py-2 px-3"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
