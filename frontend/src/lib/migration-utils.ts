import { 
  Plus, 
  Trash2, 
  Edit, 
  Eye, 
  EyeOff, 
  Download, 
  Upload, 
  Search, 
  Filter, 
  ArrowUpDown, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle, 
  LayoutDashboard, 
  FileText, 
  Flask, 
  Stethoscope,
  Settings,
  User,
  Users,
  Calendar,
  Clock,
  Mail,
  Phone,
  MapPin,
  Home,
  Building,
  Pill,
  Activity,
  Heart,
  Shield,
  Lock,
  Unlock,
  Save,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  MoreVertical,
  Refresh,
  Copy,
  Share,
  ExternalLink,
  Menu,
  Bell,
  HelpCircle,
  Star,
  Bookmark,
  Tag,
  Folder,
  File,
  Image,
  Video,
  Music,
  Archive,
  Printer,
  Wifi,
  WifiOff,
  Battery,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  CloudRain,
  Zap,
  Truck,
  Package,
  ShoppingCart,
  CreditCard,
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  LineChart,
  Target,
  Award,
  Flag,
  Bookmark as BookmarkIcon,
  type LucideIcon
} from 'lucide-react';

/**
 * Comprehensive mapping from MUI icons to Lucide React equivalents
 * This mapping ensures visual consistency during migration
 */
export const MUI_TO_LUCIDE_ICON_MAP: Record<string, LucideIcon> = {
  // Basic Actions
  'Add': Plus,
  'AddCircle': Plus,
  'AddCircleOutline': Plus,
  'Delete': Trash2,
  'DeleteOutline': Trash2,
  'Edit': Edit,
  'EditOutlined': Edit,
  'Visibility': Eye,
  'VisibilityOff': EyeOff,
  'Download': Download,
  'Upload': Upload,
  'Save': Save,
  'SaveOutlined': Save,
  'Close': X,
  'Clear': X,
  'Check': Check,
  'CheckCircle': CheckCircle,
  'CheckCircleOutline': CheckCircle,
  
  // Search and Filter
  'Search': Search,
  'SearchOutlined': Search,
  'Filter': Filter,
  'FilterList': Filter,
  'Sort': ArrowUpDown,
  'SortByAlpha': ArrowUpDown,
  
  // Status and Feedback
  'Warning': AlertTriangle,
  'WarningAmber': AlertTriangle,
  'Error': AlertCircle,
  'ErrorOutline': AlertCircle,
  'Info': Info,
  'InfoOutlined': Info,
  'Success': CheckCircle,
  'CheckCircleOutlined': CheckCircle,
  
  // Navigation and Layout
  'Dashboard': LayoutDashboard,
  'DashboardOutlined': LayoutDashboard,
  'Menu': Menu,
  'MenuOpen': Menu,
  'MoreHoriz': MoreHorizontal,
  'MoreVert': MoreVertical,
  'ExpandMore': ChevronDown,
  'ExpandLess': ChevronUp,
  'ChevronLeft': ChevronLeft,
  'ChevronRight': ChevronRight,
  'KeyboardArrowDown': ChevronDown,
  'KeyboardArrowUp': ChevronUp,
  'KeyboardArrowLeft': ChevronLeft,
  'KeyboardArrowRight': ChevronRight,
  
  // Medical and Healthcare
  'MedicalServices': Stethoscope,
  'LocalHospital': Heart,
  'Healing': Heart,
  'Science': Flask,
  'Biotech': Flask,
  'Medication': Pill,
  'Pills': Pill,
  'MonitorHeart': Activity,
  'FavoriteOutlined': Heart,
  'Favorite': Heart,
  
  // User and People
  'Person': User,
  'PersonOutline': User,
  'People': Users,
  'PeopleOutline': Users,
  'AccountCircle': User,
  'AccountBox': User,
  
  // Communication
  'Email': Mail,
  'EmailOutlined': Mail,
  'Phone': Phone,
  'PhoneOutlined': Phone,
  'Call': Phone,
  'Notifications': Bell,
  'NotificationsOutlined': Bell,
  
  // Location and Places
  'LocationOn': MapPin,
  'LocationCity': Building,
  'Home': Home,
  'HomeOutlined': Home,
  'Business': Building,
  'Store': Building,
  
  // Time and Calendar
  'Schedule': Clock,
  'AccessTime': Clock,
  'Today': Calendar,
  'DateRange': Calendar,
  'CalendarToday': Calendar,
  'Event': Calendar,
  
  // Settings and Configuration
  'Settings': Settings,
  'SettingsOutlined': Settings,
  'Tune': Settings,
  'Build': Settings,
  
  // Security
  'Security': Shield,
  'Lock': Lock,
  'LockOutlined': Lock,
  'LockOpen': Unlock,
  'VpnKey': Lock,
  
  // Files and Documents
  'Description': FileText,
  'Article': FileText,
  'Assignment': FileText,
  'Folder': Folder,
  'FolderOutlined': Folder,
  'InsertDriveFile': File,
  'FileCopy': Copy,
  'ContentCopy': Copy,
  
  // Media
  'Image': Image,
  'Photo': Image,
  'VideoLibrary': Video,
  'MusicNote': Music,
  'AudioFile': Music,
  
  // System and Utilities
  'Refresh': Refresh,
  'Sync': Refresh,
  'Share': Share,
  'OpenInNew': ExternalLink,
  'Launch': ExternalLink,
  'Print': Printer,
  'Archive': Archive,
  
  // Connectivity
  'Wifi': Wifi,
  'WifiOff': WifiOff,
  'SignalWifi4Bar': Wifi,
  'SignalWifiOff': WifiOff,
  
  // Audio and Visual
  'VolumeUp': Volume2,
  'VolumeOff': VolumeX,
  'VolumeMute': VolumeX,
  'Brightness7': Sun,
  'Brightness4': Moon,
  'WbSunny': Sun,
  'NightsStay': Moon,
  
  // Weather and Environment
  'Cloud': CloudRain,
  'WbCloudy': CloudRain,
  'Flash': Zap,
  'Bolt': Zap,
  
  // Commerce and Business
  'ShoppingCart': ShoppingCart,
  'ShoppingCartOutlined': ShoppingCart,
  'Payment': CreditCard,
  'CreditCard': CreditCard,
  'AttachMoney': DollarSign,
  'MonetizationOn': DollarSign,
  'LocalShipping': Truck,
  'Inventory': Package,
  
  // Analytics and Charts
  'TrendingUp': TrendingUp,
  'TrendingDown': TrendingDown,
  'Assessment': BarChart3,
  'BarChart': BarChart3,
  'PieChart': PieChart,
  'ShowChart': LineChart,
  'Timeline': LineChart,
  
  // Achievements and Goals
  'EmojiEvents': Award,
  'Star': Star,
  'StarOutline': Star,
  'Flag': Flag,
  'Bookmark': BookmarkIcon,
  'BookmarkBorder': BookmarkIcon,
  'Label': Tag,
  'LocalOffer': Tag,
  'GpsFixed': Target,
  
  // Battery and Power
  'Battery90': Battery,
  'BatteryFull': Battery,
  'BatteryAlert': Battery,
  'Power': Zap,
  'PowerOff': Zap,
  
  // Help and Support
  'Help': HelpCircle,
  'HelpOutline': HelpCircle,
  'ContactSupport': HelpCircle,
  'LiveHelp': HelpCircle,
};

/**
 * IconMapper utility class for converting MUI icons to Lucide equivalents
 */
export class IconMapper {
  private static iconMap = MUI_TO_LUCIDE_ICON_MAP;
  
  /**
   * Get Lucide icon component for a given MUI icon name
   */
  static getLucideIcon(muiIconName: string): LucideIcon | null {
    return this.iconMap[muiIconName] || null;
  }
  
  /**
   * Check if a MUI icon has a Lucide equivalent
   */
  static hasMapping(muiIconName: string): boolean {
    return muiIconName in this.iconMap;
  }
  
  /**
   * Get all available MUI icon names that have mappings
   */
  static getAvailableMuiIcons(): string[] {
    return Object.keys(this.iconMap);
  }
  
  /**
   * Get mapping statistics
   */
  static getMappingStats() {
    return {
      totalMappings: Object.keys(this.iconMap).length,
      categories: {
        actions: Object.keys(this.iconMap).filter(key => 
          ['Add', 'Delete', 'Edit', 'Save', 'Close', 'Check'].some(action => key.includes(action))
        ).length,
        navigation: Object.keys(this.iconMap).filter(key => 
          ['Dashboard', 'Menu', 'Chevron', 'Arrow'].some(nav => key.includes(nav))
        ).length,
        medical: Object.keys(this.iconMap).filter(key => 
          ['Medical', 'Health', 'Science', 'Medication', 'Heart'].some(med => key.includes(med))
        ).length,
        communication: Object.keys(this.iconMap).filter(key => 
          ['Email', 'Phone', 'Notifications'].some(comm => key.includes(comm))
        ).length,
      }
    };
  }
  
  /**
   * Suggest alternative icons if exact match not found
   */
  static suggestAlternatives(muiIconName: string): string[] {
    const suggestions: string[] = [];
    const lowerName = muiIconName.toLowerCase();
    
    // Find similar icon names
    Object.keys(this.iconMap).forEach(iconName => {
      if (iconName.toLowerCase().includes(lowerName) || 
          lowerName.includes(iconName.toLowerCase())) {
        suggestions.push(iconName);
      }
    });
    
    return suggestions.slice(0, 5); // Return top 5 suggestions
  }
}

/**
 * Component prop mapping utilities for MUI to shadcn conversions
 */
export class PropMapper {
  /**
   * Map MUI Button props to shadcn Button props
   */
  static mapButtonProps(muiProps: any) {
    const { variant, color, size, disabled, onClick, children, ...rest } = muiProps;
    
    // Map MUI variants to shadcn variants
    const variantMap: Record<string, string> = {
      'contained': 'default',
      'outlined': 'outline',
      'text': 'ghost',
    };
    
    // Map MUI sizes to shadcn sizes
    const sizeMap: Record<string, string> = {
      'small': 'sm',
      'medium': 'default',
      'large': 'lg',
    };
    
    return {
      variant: variantMap[variant] || 'default',
      size: sizeMap[size] || 'default',
      disabled,
      onClick,
      children,
      ...rest,
    };
  }
  
  /**
   * Map MUI TextField props to shadcn Input props
   */
  static mapInputProps(muiProps: any) {
    const { 
      variant, 
      size, 
      error, 
      helperText, 
      label, 
      placeholder, 
      value, 
      onChange, 
      disabled,
      fullWidth,
      ...rest 
    } = muiProps;
    
    return {
      placeholder: placeholder || label,
      value,
      onChange,
      disabled,
      className: `${fullWidth ? 'w-full' : ''} ${error ? 'border-destructive' : ''}`,
      'aria-invalid': error ? 'true' : 'false',
      'aria-describedby': helperText ? `${rest.id}-helper` : undefined,
      ...rest,
    };
  }
  
  /**
   * Map MUI Card props to shadcn Card props
   */
  static mapCardProps(muiProps: any) {
    const { elevation, variant, className, ...rest } = muiProps;
    
    // Map elevation to shadow classes
    const shadowMap: Record<number, string> = {
      0: '',
      1: 'shadow-sm',
      2: 'shadow',
      3: 'shadow-md',
      4: 'shadow-lg',
      8: 'shadow-xl',
      12: 'shadow-2xl',
    };
    
    const shadowClass = shadowMap[elevation] || 'shadow';
    
    return {
      ...rest,
      className: `${shadowClass} ${className || ''}`.trim(),
    };
  }
  
  /**
   * Map MUI Chip props to shadcn Badge props
   */
  static mapBadgeProps(muiProps: any) {
    const { variant, color, size, onDelete, deleteIcon, label, ...rest } = muiProps;
    
    // Map MUI variants to shadcn variants
    const variantMap: Record<string, string> = {
      'filled': 'default',
      'outlined': 'outline',
    };
    
    return {
      variant: variantMap[variant] || 'default',
      children: label,
      ...rest,
    };
  }
  
  /**
   * Map MUI Typography props to Tailwind classes
   */
  static mapTypographyProps(muiProps: any) {
    const { variant, color, align, gutterBottom, className, ...rest } = muiProps;
    
    // Map MUI typography variants to Tailwind classes
    const variantMap: Record<string, string> = {
      'h1': 'text-4xl font-bold',
      'h2': 'text-3xl font-bold',
      'h3': 'text-2xl font-bold',
      'h4': 'text-xl font-bold',
      'h5': 'text-lg font-bold',
      'h6': 'text-base font-bold',
      'subtitle1': 'text-lg font-medium',
      'subtitle2': 'text-base font-medium',
      'body1': 'text-base',
      'body2': 'text-sm',
      'caption': 'text-xs',
      'overline': 'text-xs uppercase tracking-wide',
    };
    
    // Map text alignment
    const alignMap: Record<string, string> = {
      'left': 'text-left',
      'center': 'text-center',
      'right': 'text-right',
      'justify': 'text-justify',
    };
    
    const classes = [
      variantMap[variant] || 'text-base',
      alignMap[align] || '',
      gutterBottom ? 'mb-4' : '',
    ].filter(Boolean).join(' ');
    
    return {
      ...rest,
      className: `${classes} ${className || ''}`.trim(),
    };
  }
}

/**
 * Migration progress tracking utilities
 */
export class MigrationTracker {
  private static readonly STORAGE_KEY = 'mui-shadcn-migration-progress';
  
  /**
   * Track migration progress for a component
   */
  static trackComponent(componentName: string, status: 'pending' | 'in-progress' | 'completed' | 'failed') {
    const progress = this.getProgress();
    progress[componentName] = {
      status,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(progress));
    } catch (error) {
      console.warn('Failed to save migration progress:', error);
    }
  }
  
  /**
   * Get migration progress for all components
   */
  static getProgress(): Record<string, any> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.warn('Failed to load migration progress:', error);
      return {};
    }
  }
  
  /**
   * Get migration statistics
   */
  static getStats() {
    const progress = this.getProgress();
    const components = Object.values(progress);
    
    return {
      total: components.length,
      completed: components.filter((c: any) => c.status === 'completed').length,
      inProgress: components.filter((c: any) => c.status === 'in-progress').length,
      failed: components.filter((c: any) => c.status === 'failed').length,
      pending: components.filter((c: any) => c.status === 'pending').length,
    };
  }
  
  /**
   * Clear migration progress
   */
  static clearProgress() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear migration progress:', error);
    }
  }
  
  /**
   * Export migration progress as JSON
   */
  static exportProgress(): string {
    return JSON.stringify(this.getProgress(), null, 2);
  }
  
  /**
   * Import migration progress from JSON
   */
  static importProgress(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Failed to import migration progress:', error);
      return false;
    }
  }
}

/**
 * Utility functions for common migration tasks
 */
export class MigrationUtils {
  /**
   * Convert MUI sx prop to Tailwind classes
   */
  static sxToTailwind(sx: any): string {
    if (!sx) return '';
    
    const classes: string[] = [];
    
    // Handle common sx properties
    if (sx.p !== undefined) classes.push(`p-${sx.p}`);
    if (sx.px !== undefined) classes.push(`px-${sx.px}`);
    if (sx.py !== undefined) classes.push(`py-${sx.py}`);
    if (sx.m !== undefined) classes.push(`m-${sx.m}`);
    if (sx.mx !== undefined) classes.push(`mx-${sx.mx}`);
    if (sx.my !== undefined) classes.push(`my-${sx.my}`);
    
    if (sx.width !== undefined) {
      if (sx.width === '100%') classes.push('w-full');
      else if (typeof sx.width === 'string') classes.push(`w-[${sx.width}]`);
    }
    
    if (sx.height !== undefined) {
      if (sx.height === '100%') classes.push('h-full');
      else if (typeof sx.height === 'string') classes.push(`h-[${sx.height}]`);
    }
    
    if (sx.display !== undefined) {
      const displayMap: Record<string, string> = {
        'flex': 'flex',
        'block': 'block',
        'inline': 'inline',
        'inline-block': 'inline-block',
        'none': 'hidden',
      };
      classes.push(displayMap[sx.display] || '');
    }
    
    if (sx.justifyContent !== undefined) {
      const justifyMap: Record<string, string> = {
        'center': 'justify-center',
        'flex-start': 'justify-start',
        'flex-end': 'justify-end',
        'space-between': 'justify-between',
        'space-around': 'justify-around',
      };
      classes.push(justifyMap[sx.justifyContent] || '');
    }
    
    if (sx.alignItems !== undefined) {
      const alignMap: Record<string, string> = {
        'center': 'items-center',
        'flex-start': 'items-start',
        'flex-end': 'items-end',
        'stretch': 'items-stretch',
      };
      classes.push(alignMap[sx.alignItems] || '');
    }
    
    return classes.filter(Boolean).join(' ');
  }
  
  /**
   * Generate migration report for a component
   */
  static generateComponentReport(componentName: string, beforeCode: string, afterCode: string) {
    return {
      component: componentName,
      timestamp: new Date().toISOString(),
      changes: {
        linesRemoved: beforeCode.split('\n').length,
        linesAdded: afterCode.split('\n').length,
        sizeReduction: beforeCode.length - afterCode.length,
      },
      muiImportsRemoved: (beforeCode.match(/@mui\/[^'"]*/g) || []).length,
      shadcnImportsAdded: (afterCode.match(/@\/components\/ui\/[^'"]*/g) || []).length,
    };
  }
  
  /**
   * Validate that a component migration is complete
   */
  static validateMigration(code: string): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Check for remaining MUI imports
    const muiImports = code.match(/@mui\/[^'"]*|from ['"]@mui/g);
    if (muiImports) {
      issues.push(`Found remaining MUI imports: ${muiImports.join(', ')}`);
    }
    
    // Check for MUI component usage - only flag if there are MUI imports
    if (muiImports) {
      const muiComponents = code.match(/\b(Button|TextField|Card|Typography|Box|Paper|Chip|Dialog|Select)\b/g);
      if (muiComponents) {
        const uniqueComponents = [...new Set(muiComponents)];
        issues.push(`Found potential MUI components: ${uniqueComponents.join(', ')}`);
      }
    }
    
    // Check for sx prop usage
    const sxUsage = code.match(/\bsx\s*=/g);
    if (sxUsage) {
      issues.push('Found sx prop usage - should be converted to className with Tailwind');
    }
    
    return {
      isValid: issues.length === 0,
      issues,
    };
  }
}