
import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GameErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('[GameErrorBoundary] Game error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center h-full p-4 bg-red-50 border border-red-200 rounded">
          <h2 className="text-xl font-bold text-red-800 mb-2">Game Error</h2>
          <p className="text-red-600 mb-4 text-center">
            The game encountered an error and needs to restart.
          </p>
          <pre className="text-sm bg-red-100 p-2 rounded max-w-full overflow-auto mb-4">
            {this.state.error?.toString()}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Restart Game
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
