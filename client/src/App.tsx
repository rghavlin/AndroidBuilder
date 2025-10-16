
import React from 'react';
import { Route, Switch, Router } from 'wouter';
import Game from './pages/game';
import NotFound from './pages/not-found';

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
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Router hook={useHashLocation}>
        <Switch>
          <Route path="/" component={Game} />
          <Route path="/game" component={Game} />
          <Route component={NotFound} />
        </Switch>
      </Router>
    </div>
  );
}
