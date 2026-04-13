"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ConstellationErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[Constellation]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="glass rounded-xl border border-red-500/30 p-6 text-center">
          <p className="text-sm font-semibold text-red-400">Constellation failed to render</p>
          <p className="mt-2 text-xs text-[var(--text-muted)]">{this.state.error.message}</p>
          <button
            type="button"
            className="mt-4 rounded-lg bg-white/10 px-4 py-2 text-xs text-white hover:bg-white/15"
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
