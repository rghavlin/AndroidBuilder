import React, { useState, useEffect } from 'react';
import { Route, Switch, Router } from 'wouter';
import Game from './pages/game';
import MapEditor from './pages/editor';
import NotFound from './pages/not-found';
import DevConsole from './components/Game/DevConsole'; // Standard import
import ScreenScaler from './components/Game/ScreenScaler';
import { Toaster } from './components/ui/toaster';

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

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '`' || e.key === '~' || e.code === 'Backquote') {
        e.preventDefault();
        setIsDevConsoleOpen(prev => !prev);
      }
    };

    window.addEventListener('toggle-dev-console', handleToggle);
    window.addEventListener('keydown', handleKeyDown);
    // Legacy support for direct window call
    (window as any).toggleDevConsole = (open: boolean) => {
       window.dispatchEvent(new CustomEvent('toggle-dev-console', { detail: open }));
    };

    return () => {
      window.removeEventListener('toggle-dev-console', handleToggle);
      window.removeEventListener('keydown', handleKeyDown);
      delete (window as any).toggleDevConsole;
    };
  }, []);

  return (
    <div className="min-h-full h-full w-full bg-background text-foreground relative">
      <ScreenScaler>
        <Router hook={useHashLocation}>
          <Switch>
            <Route path="/" component={Game} />
            <Route path="/game" component={Game} />
            <Route path="/editor" component={MapEditor} />
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

        {/* Portal root containers nested inside the scaling boundary */}
        <div id="modal-root" className="absolute inset-0 pointer-events-none z-40"></div>
        <div id="drag-root" className="absolute inset-0 pointer-events-none z-50"></div>
        <div id="tooltip-root" className="absolute inset-0 pointer-events-none z-[60]"></div>
        
        <Toaster />
      </ScreenScaler>
    </div>
  );
}

