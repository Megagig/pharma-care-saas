import { Button, Card, CardContent } from '@/components/ui/button';
/**
 * Mobile-optimized layout component for MTR components
 * Provides consistent mobile UX patterns
 */
interface MobileCardProps {
  title: string;
  subtitle?: string;
  avatar?: React.ReactNode;
  chips?: Array<{
    label: string;
    color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
    variant?: 'filled' | 'outlined';
  }>;
  actions?: Array<{
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    color?: 'primary' | 'secondary' | 'error' | 'warning';
  }>;
  children?: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onLongPress?: () => void;
  selected?: boolean;
  disabled?: boolean;
}
export const MobileCard: React.FC<MobileCardProps> = ({ 
  title,
  subtitle,
  avatar,
  chips = [],
  actions = [],
  children,
  collapsible = false,
  defaultExpanded = false,
  onSwipeLeft,
  onSwipeRight,
  onLongPress,
  selected = false,
  disabled = false
}) => {
  const { isMobile } = useResponsive();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [showActions, setShowActions] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  // Swipe gesture
  const swipeRef = useSwipeGesture(
    (result) => {
      if (result.direction === 'left' && onSwipeLeft) {
        onSwipeLeft();
      } else if (result.direction === 'right' && onSwipeRight) {
        onSwipeRight();
      }
      setSwipeOffset(0);
    },
    { threshold: 80, preventScroll: false }
  );
  // Long press gesture
  const longPressRef = useLongPress(
    () => {
      if (onLongPress) {
        onLongPress();
      } else if (actions.length > 0) {
        setShowActions(true);
      }
    },
    { delay: 500 }
  );
  // Combine refs
  const combinedRef = (element: HTMLElement | null) => {
    if (swipeRef.current !== element) {
      swipeRef.current = element;
    }
    if (longPressRef.current !== element) {
      longPressRef.current = element;
    }
  };
  if (!isMobile) {
    // Desktop fallback - simple card
    return (
      <Card className="">
        <CardContent>
          <div className="">
            {avatar && <div className="">{avatar}</div>}
            <div className="">
              <div  component="div">
                {title}
              </div>
              {subtitle && (
                <div  color="text.secondary">
                  {subtitle}
                </div>
              )}
              {chips.length > 0 && (
                <div
                  className=""
                >
                  {chips.map((chip, index) => (
                    <Chip
                      key={index}
                      label={chip.label}
                      size="small"
                      color={chip.color}
                      variant={chip.variant || 'outlined'}
                    />
                  ))}
                </div>
              )}
              {children && <div className="">{children}</div>}
            </div>
            {actions.length > 0 && (
              <div className="">
                {actions.map((action, index) => (
                  <IconButton
                    key={index}
                    size="small"
                    onClick={action.onClick}
                    color={action.color}
                  >
                    {action.icon}
                  </IconButton>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <>
      <Card
        ref={combinedRef}
        className="">
        <CardContent className="">
          <div className="">
            {avatar && <div className="">{avatar}</div>}
            <div className="">
              <div
                className=""
              >
                <div
                  
                  component="div"
                  className=""
                >
                  {title}
                </div>
                {(collapsible || actions.length > 0) && (
                  <IconButton
                    size="small"
                    onClick={() => {
                      if (collapsible) {
                        setExpanded(!expanded);}
                      } else {
                        setShowActions(true);
                      }>
                    {collapsible ? (
                      expanded ? (
                        <ExpandLessIcon />
                      ) : (
                        <ExpandMoreIcon />
                      )
                    ) : (
                      <MoreVertIcon />
                    )}
                  </IconButton>
                )}
              </div>
              {subtitle && (
                <div
                  
                  color="text.secondary"
                  className=""
                >
                  {subtitle}
                </div>
              )}
              {chips.length > 0 && (
                <div
                  className=""
                >
                  {chips.map((chip, index) => (
                    <Chip
                      key={index}
                      label={chip.label}
                      size="small"
                      color={chip.color}
                      variant={chip.variant || 'outlined'}
                    />
                  ))}
                </div>
              )}
              {children && (
                <Collapse in={!collapsible || expanded}>
                  <div className="">{children}</div>
                </Collapse>
              )}
            </div>
          </div>
        </CardContent>
        {actions.length > 0 && !collapsible && (
          <CardActions className="">
            {actions.slice(0, 2).map((action, index) => (
              <Button
                key={index}
                size="small"
                startIcon={action.icon}
                onClick={action.onClick}
                color={action.color}
              >
                {action.label}
              </Button>
            ))}
            {actions.length > 2 && (
              <IconButton size="small" onClick={() => setShowActions(true)}>
                <MoreVertIcon />
              </IconButton>
            )}
          </CardActions>
        )}
      </Card>
      {/* Actions drawer */}
      <SwipeableDrawer
        anchor="bottom"
        open={showActions}
        onClose={() => setShowActions(false)}
        onOpen={() => setShowActions(true)}
        disableSwipeToOpen
        slotProps={{
          paper: {
            sx: {
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,}
            },
          },>
        <div className="">
          <div  className="">
            Actions
          </div>
          <List>
            {actions.map((action, index) => (
              <Button
                key={index}
                
                className=""
              >
                <div>{action.icon}</div>
                <div primary={action.label} />
              </ListItemButton>
            ))}
          </List>
        </div>
      </SwipeableDrawer>
    </>
  );
};
interface MobileListProps {
  items: Array<{
    id: string;
    title: string;
    subtitle?: string;
    avatar?: React.ReactNode;
    chips?: Array<{
      label: string;
      color?:
        | 'primary'
        | 'secondary'
        | 'success'
        | 'error'
        | 'warning'
        | 'info';
    }>;
    actions?: Array<{
      label: string;
      icon: React.ReactNode;
      onClick: () => void;
      color?: 'primary' | 'secondary' | 'error' | 'warning';
    }>;
    children?: React.ReactNode;
    selected?: boolean;
    disabled?: boolean;
  }>;
  onItemClick?: (id: string) => void;
  onItemSwipeLeft?: (id: string) => void;
  onItemSwipeRight?: (id: string) => void;
  onItemLongPress?: (id: string) => void;
  emptyState?: React.ReactNode;
  loading?: boolean;
}
export const MobileList: React.FC<MobileListProps> = ({ 
  items,
  onItemSwipeLeft,
  onItemSwipeRight,
  onItemLongPress,
  emptyState,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="">
        <div  color="text.secondary">
          Loading...
        </div>
      </div>
    );
  }
  if (items.length === 0 && emptyState) {
    return <div>{emptyState}</div>;
  }
  return (
    <div>
      {items.map((item) => (
        <MobileCard
          key={item.id}
          title={item.title}
          subtitle={item.subtitle}
          avatar={item.avatar}
          chips={item.chips}
          actions={item.actions}
          
          disabled={item.disabled}
          onSwipeLeft={() => onItemSwipeLeft?.(item.id)}
          onSwipeRight={() => onItemSwipeRight?.(item.id)}
          onLongPress={() => onItemLongPress?.(item.id)}
        >
          {item.children}
        </MobileCard>
      ))}
    </div>
  );
};
interface MobileFabProps {
  icon: React.ReactNode;
  label?: string;
  onClick: () => void;
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  size?: 'small' | 'medium' | 'large';
  extended?: boolean;
}
export const MobileFab: React.FC<MobileFabProps> = ({ 
  icon,
  label,
  onClick,
  color = 'primary',
  position = 'bottom-right',
  size = 'large',
  extended = false
}) => {
  const { isMobile } = useResponsive();
  if (!isMobile) return null;
  const getPosition = () => {
    const base = { position: 'fixed' as const, zIndex: 1000 };
    switch (position) {
      case 'bottom-right':
        return { ...base, bottom: 16, right: 16 };
      case 'bottom-left':
        return { ...base, bottom: 16, left: 16 };
      case 'bottom-center':
        return {
          ...base,
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
        };
      default:
        return { ...base, bottom: 16, right: 16 };
    }
  };
  return (
    <Zoom in={true}>
      <Fab
        color={color}
        size={size}
        onClick={onClick}
        variant={extended && label ? 'extended' : 'circular'}
        className=""
      >
        {icon}
        {extended && label && <div className="">{label}</div>}
      </Fab>
    </Zoom>
  );
};
export default {
};
