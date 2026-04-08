"use client";

import { Component, type ReactNode } from "react";
import Link from "next/link";

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center text-center px-6 py-24">
          <p className="font-sans text-xs tracking-[0.3em] uppercase text-gold mb-4">Something went wrong</p>
          <h2 className="font-display text-3xl text-obsidian mb-6">We ran into an issue.</h2>
          <Link href="/" className="btn-primary">Return Home</Link>
        </div>
      );
    }
    return this.props.children;
  }
}
