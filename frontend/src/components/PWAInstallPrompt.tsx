import { Button, Card, CardContent } from '@/components/ui/button';

interface PWAInstallPromptProps {
  onInstall?: () => void;
  onDismiss?: () => void;
  showOnMobileOnly?: boolean;
}
const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ 
  onInstall,
  onDismiss,
  showOnMobileOnly = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [pwaState, setPwaState] = useState(pwaManager.getState());
  const [showPrompt, setShowPrompt] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  useEffect(() => {
    // Subscribe to PWA state changes
    const unsubscribe = pwaManager.subscribe(setPwaState);
    // Check if we should show the prompt
    const shouldShow =
      pwaState.isInstallable &&
      !pwaState.isInstalled &&
      !isDismissed &&
      (!showOnMobileOnly || isMobile);
    setShowPrompt(shouldShow);
    return unsubscribe;
  }, [
    pwaState.isInstallable,
    pwaState.isInstalled,
    isDismissed,
    showOnMobileOnly,
    isMobile,
  ]);
  // Don't render if dismissed or conditions not met
  if (!showPrompt) {
    return null;
  }
  const handleInstall = async () => {
    try {
      const success = await pwaManager.install();
      if (success) {
        onInstall?.();
        pwaUtils.trackPWAEvent('install_accepted');
      } else {
        pwaUtils.trackPWAEvent('install_dismissed');
      }
    } catch (error) {
      console.error('Installation failed:', error);
      pwaUtils.trackPWAEvent('install_failed', { error: error.message });
    }
  };
  const handleDismiss = () => {
    setIsDismissed(true);
    setShowPrompt(false);
    onDismiss?.();
    pwaUtils.trackPWAEvent('install_prompt_dismissed');
  };
  const getDeviceIcon = () => {
    const deviceType = pwaUtils.getDeviceType();
    switch (deviceType) {
      case 'mobile':
      case 'tablet':
        return <SmartphoneIcon />;
      default:
        return <ComputerIcon />;
    }
  };
  const getInstallText = () => {
    const deviceType = pwaUtils.getDeviceType();
    switch (deviceType) {
      case 'mobile':
        return 'Install app for quick access';
      case 'tablet':
        return 'Add to home screen for better experience';
      default:
        return 'Install Clinical Interventions app';
    }
  };
  const getBenefits = () => {
    const deviceType = pwaUtils.getDeviceType();
    const commonBenefits = [
      'Work offline',
      'Faster loading',
      'Push notifications',
    ];
    if (deviceType === 'mobile' || deviceType === 'tablet') {
      return [
        ...commonBenefits,
        'Home screen access',
        'Full screen experience',
      ];
    }
    return [...commonBenefits, 'Desktop shortcut', 'Native app feel'];
  };
  return (
    <Slide direction="up" in={showPrompt} mountOnEnter unmountOnExit>
      <div
        className=""
      >
        <Card
          
          className="">
          <CardContent
            className="">
            <div className="">
              <div
                className=""
              >
                {getDeviceIcon()}
              </div>
              <div className="">
                <div
                  variant={isMobile ? 'subtitle1' : 'h6'}
                  fontWeight="bold"
                  gutterBottom
                >
                  {getInstallText()}
                </div>
                <div
                  variant={isMobile ? 'body2' : 'body1'}
                  className=""
                >
                  Get the full Clinical Interventions experience
                </div>
                {/* Benefits list */}
                <div className="">
                  {getBenefits()
                    .slice(0, isMobile ? 2 : 3)
                    .map((benefit, index) => (
                      <div
                        key={index}
                        
                        className="">
                        {benefit}
                      </div>
                    ))}
                </div>
              </div>
              <IconButton
                size="small"
                onClick={handleDismiss}
                className="">
                <CloseIcon fontSize="small" />
              </IconButton>
            </div>
            {/* Action buttons */}
            <div
              className=""
            >
              <Button
                
                startIcon={<InstallIcon />}
                onClick={handleInstall}
                className="" fullWidth={isMobile}
              >
                Install Now
              </Button>
              <Button
                
                onClick={handleDismiss}
                className="" size={isMobile ? 'small' : 'medium'}
              >
                Maybe Later
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Slide>
  );
};
// Update notification component
export const PWAUpdatePrompt: React.FC<{
  onUpdate?: () => void;
  onDismiss?: () => void;
}> = ({ onUpdate, onDismiss }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [pwaState, setPwaState] = useState(pwaManager.getState());
  const [showPrompt, setShowPrompt] = useState(false);
  useEffect(() => {
    const unsubscribe = pwaManager.subscribe(setPwaState);
    setShowPrompt(pwaState.isUpdateAvailable);
    return unsubscribe;
  }, [pwaState.isUpdateAvailable]);
  const handleUpdate = async () => {
    try {
      await pwaManager.updateApp();
      onUpdate?.();
      pwaUtils.trackPWAEvent('update_accepted');
    } catch (error) {
      console.error('Update failed:', error);
      pwaUtils.trackPWAEvent('update_failed', { error: error.message });
    }
  };
  const handleDismiss = () => {
    setShowPrompt(false);
    onDismiss?.();
    pwaUtils.trackPWAEvent('update_dismissed');
  };
  if (!showPrompt) {
    return null;
  }
  return (
    <Slide direction="down" in={showPrompt} mountOnEnter unmountOnExit>
      <div
        className=""
      >
        <Card
          
          className="">
          <CardContent
            className="">
            <div className="">
              <div
                className=""
              >
                <UpdateIcon />
              </div>
              <div className="">
                <div
                  variant={isMobile ? 'subtitle1' : 'h6'}
                  fontWeight="bold"
                  gutterBottom
                >
                  Update Available
                </div>
                <div
                  variant={isMobile ? 'body2' : 'body1'}
                  className=""
                >
                  A new version with improvements and bug fixes is ready
                </div>
              </div>
              <IconButton
                size="small"
                onClick={handleDismiss}
                className="">
                <CloseIcon fontSize="small" />
              </IconButton>
            </div>
            <div
              className=""
            >
              <Button
                
                startIcon={<UpdateIcon />}
                onClick={handleUpdate}
                className="" fullWidth={isMobile}
              >
                Update Now
              </Button>
              <Button
                
                onClick={handleDismiss}
                className="" size={isMobile ? 'small' : 'medium'}
              >
                Later
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Slide>
  );
};
export default PWAInstallPrompt;
