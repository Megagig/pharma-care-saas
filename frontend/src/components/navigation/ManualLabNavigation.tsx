/**
 * Manual Lab Navigation Integration Component
 * Adds manual lab options to existing navigation without breaking changes
 */

import { Badge, Tooltip, Separator } from '@/components/ui/button';

interface ManualLabNavigationProps {
  isCollapsed?: boolean;
  onItemClick?: () => void;
}
export const ManualLabNavigation: React.FC<ManualLabNavigationProps> = ({ 
  isCollapsed = false,
  onItemClick
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isFeatureEnabled } = useFeatureFlags();
  const [isExpanded, setIsExpanded] = React.useState(false);
  // Check if manual lab features are enabled
  const isManualLabEnabled = isFeatureEnabled('manual_lab_orders');
  const isQRScanningEnabled = isFeatureEnabled('manual_lab_qr_scanning');
  const isAnalyticsEnabled = isFeatureEnabled('manual_lab_analytics');
  const isSecurityEnabled = isFeatureEnabled('manual_lab_enhanced_security');
  // Get pending orders count for badge
  const { data: pendingOrdersCount } = useQuery({ 
    queryKey: ['manual-lab-pending-count'],
    queryFn: () => manualLabApi.getPendingOrdersCount(),
    enabled: isManualLabEnabled && !!user,
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 15000}
  });
  // Don't render if feature is disabled
  if (!isManualLabEnabled) {
    return null;
  }
  // Check if user has required permissions
  const hasLabPermissions =
    user?.role === 'pharmacist' || user?.role === 'owner';
  if (!hasLabPermissions) {
    return null;
  }
  const isActive = location.pathname.startsWith('/manual-lab');
  const handleToggle = () => setIsExpanded(!isExpanded);
  const handleNavigation = (path: string) => {
    navigate(path);
    onItemClick?.();
  };
  const navigationItems = [
    {
      key: 'create-order',
      label: 'Create Order',
      icon: <AddIcon />,
      path: '/manual-lab/create',
      enabled: true,
    },
    {
      key: 'orders-list',
      label: 'Orders List',
      icon: <ListIcon />,
      path: '/manual-lab/orders',
      enabled: true,
      badge: pendingOrdersCount?.pending || 0,
    },
    {
      key: 'qr-scanner',
      label: 'QR Scanner',
      icon: <QrCodeScannerIcon />,
      path: '/manual-lab/scan',
      enabled: isQRScanningEnabled,
    },
    {
      key: 'analytics',
      label: 'Analytics',
      icon: <AnalyticsIcon />,
      path: '/manual-lab/analytics',
      enabled: isAnalyticsEnabled,
    },
    {
      key: 'security',
      label: 'Security',
      icon: <SecurityIcon />,
      path: '/manual-lab/security',
      enabled: isSecurityEnabled && user?.role === 'owner',
    },
  ];
  const enabledItems = navigationItems.filter((item) => item.enabled);
  if (isCollapsed) {
    return (
      <Tooltip title="Manual Lab Orders" placement="right">
        <div
          button
          onClick={() => handleNavigation('/manual-lab')}
          
          className=""
        >
          <div
            className=""
          >
            <Badge
              badgeContent={pendingOrdersCount?.pending || 0}
              color="error"
              max={99}
            >
              <ScienceIcon />
            </Badge>
          </div>
        </div>
      </Tooltip>
    );
  }
  return (
    <>
      <div
        button
        onClick={handleToggle}
        
        className="">
        <div>
          <Badge
            badgeContent={pendingOrdersCount?.pending || 0}
            color="error"
            max={99}
          >
            <ScienceIcon />
          </Badge>
        </div>
        <div
          primary="Manual Lab Orders"
          secondary={`${enabledItems.length} features available`}
        />
        {isExpanded ? <ExpandLess /> : <ExpandMore />}
      </div>
      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {enabledItems.map((item) => (
            <div
              key={item.key}
              button
              onClick={() => handleNavigation(item.path)}
              
              className="">
              <div
                className=""
              >
                {item.badge ? (
                  <Badge badgeContent={item.badge} color="error" max={99}>
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </div>
              <div primary={item.label} />
            </div>
          ))}
        </List>
      </Collapse>
      {/* Feature status indicator for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="">
          <Separator className="" />
          <div  color="text.secondary">
            Manual Lab Features:
          </div>
          <div className="">
            {[
              { key: 'manual_lab_orders', label: 'Orders' },
              { key: 'manual_lab_pdf_generation', label: 'PDF' },
              { key: 'manual_lab_qr_scanning', label: 'QR' },
              { key: 'manual_lab_ai_interpretation', label: 'AI' },
              { key: 'manual_lab_fhir_integration', label: 'FHIR' },
            ].map((feature) => (
              <div
                key={feature.key}
                className=""
              >
                {feature.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};
/**
 * Hook to get manual lab navigation state
 */
export const useManualLabNavigation = () => {
  const { isFeatureEnabled } = useFeatureFlags();
  const { user } = useAuth();
  const location = useLocation();
  const isManualLabEnabled = isFeatureEnabled('manual_lab_orders');
  const hasLabPermissions =
    user?.role === 'pharmacist' || user?.role === 'owner';
  const isInManualLabSection = location.pathname.startsWith('/manual-lab');
  return {
    isEnabled: isManualLabEnabled && hasLabPermissions,
    isActive: isInManualLabSection,
    availableFeatures: {
      orders: isFeatureEnabled('manual_lab_orders'),
      pdfGeneration: isFeatureEnabled('manual_lab_pdf_generation'),
      qrScanning: isFeatureEnabled('manual_lab_qr_scanning'),
      aiInterpretation: isFeatureEnabled('manual_lab_ai_interpretation'),
      fhirIntegration: isFeatureEnabled('manual_lab_fhir_integration'),
      mobileFeatures: isFeatureEnabled('manual_lab_mobile_features'),
      enhancedSecurity: isFeatureEnabled('manual_lab_enhanced_security'),
      analytics: isFeatureEnabled('manual_lab_analytics'),
      notifications: isFeatureEnabled('manual_lab_notifications'),
    },
  };
};
export default ManualLabNavigation;
