"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

function ErrorFallback({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg)" }}>
      <div className="card p-10 text-center max-w-md">
        {/* Decorative element */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-8 h-px" style={{ background: "linear-gradient(90deg, transparent, var(--gold))" }} />
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--gold)" }} />
          <div className="w-8 h-px" style={{ background: "linear-gradient(90deg, var(--gold), transparent)" }} />
        </div>

        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: "var(--amber-soft)" }}
        >
          <AlertTriangle className="w-7 h-7" style={{ color: "var(--gold)" }} />
        </div>

        <h2 className="text-lg font-bold mb-2" style={{ color: "var(--text)", letterSpacing: "-0.01em" }}>
          เกิดข้อผิดพลาด
        </h2>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>{error.message}</p>
        <button
          onClick={onRetry}
          className="btn btn-primary"
        >
          <RefreshCcw className="w-4 h-4 mr-2" /> ลองใหม่
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
