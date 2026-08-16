import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    if (typeof document === 'undefined') return;
    document.documentElement.classList.add('public-light');
    document.documentElement.style.setProperty('--app-chrome-bg', '#f2f2f7');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#f2f2f7');
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f2f2f7] flex items-center justify-center px-4">
          <div className="max-w-md w-full rounded-[12px] bg-white p-8 text-center">
            <svg className="w-12 h-12 mx-auto text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h1 className="text-[22px] font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-[15px] text-[rgba(60,60,67,0.6)] mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: undefined });
                window.location.href = '/';
              }}
              className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 bg-brand-maroon text-white rounded-[12px] font-semibold touch-manipulation"
            >
              Go to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
