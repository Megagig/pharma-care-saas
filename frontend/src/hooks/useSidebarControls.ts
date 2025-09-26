import { useState, useCallback } from 'react';

interface UseSidebarControlsReturn {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useSidebarControls = (): UseSidebarControlsReturn => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  return {
    sidebarOpen,
    toggleSidebar,
    setSidebarOpen,
  };
};

export default useSidebarControls;