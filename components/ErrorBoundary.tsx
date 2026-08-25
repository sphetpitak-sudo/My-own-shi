"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-4">
          <div className="card p-8 text-center max-w-md">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-[var(--yellow)]" />
            <h2 className="text-lg font-semibold text-[var(--text)] mb-2">Something went wrong</h2>
            <p className="text-sm text-[var(--muted)] mb-4">{this.state.error?.message}</p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
              className="btn-primary"
            >
              <RefreshCcw className="w-4 h-4 mr-2" /> Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
