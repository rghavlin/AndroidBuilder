import React, { useState, useEffect } from 'react';
import { Route, Switch, Router } from 'wouter';
import Game from './pages/game';
import NotFound from './pages/not-found';
import DevConsole from './components/Game/DevConsole'; // Standard import

// Use hash-based routing for Electron
const hashLocation = () => {
  return window.location.hash.replace(/^#/, '') || '/';
};

const hashNavigate = (to: string) => {
  window.location.hash = to;
};

const useHashLocation = () => {
  const [loc, setLoc] = React.useState(hashLocation);

  React.useEffect(() => {
    const handler = () => setLoc(hashLocation());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  return [loc, hashNavigate] as const;
};

export default function App() {
  const [isDevConsoleOpen, setIsDevConsoleOpen] = useState(false);

  // Global toggle listener to decouple from complex game contexts
  useEffect(() => {
    const handleToggle = (e: any) => {
      console.log('[App] 🛰️ Global toggle-dev-console event received:', e.detail);
      setIsDevConsoleOpen(!!e.detail);
    };

    window.addEventListener('toggle-dev-console', handleToggle);
    // Legacy support for direct window call
    (window as any).toggleDevConsole = (open: boolean) => {
       window.dispatchEvent(new CustomEvent('toggle-dev-console', { detail: open }));
    };

    return () => {
      window.removeEventListener('toggle-dev-console', handleToggle);
      delete (window as any).toggleDevConsole;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <Router hook={useHashLocation}>
        <Switch>
          <Route path="/" component={Game} />
          <Route path="/game" component={Game} />
          <Route component={NotFound} />
        </Switch>
      </Router>

      {/* Global Dev Console - Completely decoupled from game logic layers */}
      {isDevConsoleOpen && (
        <DevConsole 
          onClose={() => setIsDevConsoleOpen(false)}
          onLaunch={(config) => {
             console.log('[App] 🚀 Custom launch triggered from root App');
             // Dispatch to whoever is listening (GameContext)
             window.dispatchEvent(new CustomEvent('launch-custom-game', { detail: config }));
             setIsDevConsoleOpen(false);
          }}
          isLoading={false} // Root App doesn't track loading, but console can handle its own state
        />
      )}
    </div>
  );
}
