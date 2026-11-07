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
          className="min-h-[60vh] flex items-center justify-center p-6 text-ink font-sans"
        >
          <div className="max-w-md w-full bg-elevated rounded-[20px] border border-border-subtle p-6 space-y-4 text-center shadow-lg">
            <div className="w-12 h-12 rounded-[14px] bg-status-danger/10 text-status-danger flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-status-danger">
                System Exception
              </span>
              <h2 className="text-lg font-display font-bold text-ink">
                Something went wrong in this module
              </h2>
              <p className="text-xs text-ink-secondary leading-relaxed">
                An unexpected runtime or network chunk error occurred. Your workspace data remains safe in local persistence.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 bg-subtle/80 rounded-[10px] border border-border-subtle text-xs font-mono text-status-danger break-words text-left">
                {this.state.error.message}
              </div>
            )}

            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="ios-btn ios-btn-primary rounded-[10px] text-xs font-semibold px-4 py-2 min-h-[40px]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Module</span>
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="ios-btn ios-btn-secondary rounded-[10px] text-xs font-semibold px-4 py-2 min-h-[40px]"
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
