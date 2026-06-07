import type { ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
}

interface SceneLayerProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="relative w-screen h-screen bg-slate-950 flex overflow-hidden font-sans text-slate-300">
      {children}
    </div>
  );
}

export function SceneLayer({ children }: SceneLayerProps) {
  return <div className="absolute inset-0 z-0">{children}</div>;
}
