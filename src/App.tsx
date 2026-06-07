import { useState } from 'react';
import Scene from './components/canvas/Scene';
import { AppShell, SceneLayer } from './components/layout/AppShell';
import { CameraControlBar } from './components/layout/CameraControlBar';
import { LeftToolbar } from './components/layout/LeftToolbar';
import { RightSidebar } from './components/layout/RightSidebar';
import { SidebarToggleButton } from './components/layout/SidebarToggleButton';
import { TopHud } from './components/layout/TopHud';

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <AppShell>
      <SceneLayer>
        <Scene />
      </SceneLayer>

      <TopHud isSidebarOpen={isSidebarOpen} />
      <CameraControlBar />
      <SidebarToggleButton isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen((isOpen) => !isOpen)} />
      <LeftToolbar />
      <RightSidebar isOpen={isSidebarOpen} />
    </AppShell>
  );
}
