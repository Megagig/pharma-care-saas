
import { Tooltip } from '@/components/ui/button';
const FloatingToggle: React.FC = () => {
  const theme = useTheme();
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  return (
    <Tooltip
      title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      placement="right"
    >
      <Fab
        color="primary"
        size="medium"
        onClick={toggleSidebar}
        className="">
        {sidebarOpen ? (
          <MenuOpenIcon className="" />
        ) : (
          <MenuIcon className="" />
        )}
      </Fab>
    </Tooltip>
  );
};
export default FloatingToggle;
