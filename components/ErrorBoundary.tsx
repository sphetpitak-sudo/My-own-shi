"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { useLang } from "@/lib/i18n";

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

function ErrorFallback({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const { t, lang } = useLang();
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-4">
      <div className="card p-8 text-center max-w-md">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-[var(--amber)]" />
        <h2 className="text-lg font-semibold text-[var(--text)] mb-2">
          {t.error_occurred}
        </h2>
        <p className="text-sm text-[var(--text-muted)] mb-4">{error.message}</p>
        <button
          onClick={onRetry}
          className="btn btn-primary"
        >
          <RefreshCcw className="w-4 h-4 mr-2" /> {t.try_again}
        </button>
      </div>
    </div>
  );
}

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
        <ErrorFallback
          error={this.state.error!}
          onRetry={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
        />
      );
    }
    return this.props.children;
  }
}
