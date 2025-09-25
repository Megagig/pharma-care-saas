/**
 * IconMapper utility component for mapping MUI icons to Lucide React equivalents
 * This component provides a consistent way to replace MUI icons during migration
 */

import React from 'react';
import {
  // Navigation & Actions
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Download,
  Upload,
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  
  // Status & Feedback
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  X,
  Clock,
  
  // Medical & Healthcare
  Stethoscope,
  Flask,
  Pill,
  FileText,
  Calendar,
  Phone,
  
  // Business & Admin
  LayoutDashboard,
  Users,
  Settings,
  Shield,
  BarChart3,
  TrendingUp,
  TrendingDown,
  
  // Communication
  MessageSquare,
  Send,
  Mail,
  
  // File & Document
  File,
  FileImage,
  FileType,
  Save,
  
  // Interface
  Menu,
  Home,
  HelpCircle,
  Refresh,
  Sync,
  
  // Additional icons
  Star,
  Zap,
  Target,
  Activity,
  Archive,
  BookOpen,
  Brain,
  Building,
  Camera,
  Copy,
  ExternalLink,
  Folder,
  Globe,
  Hash,
  Image,
  Link,
  Lock,
  Map,
  Paperclip,
  Play,
  Power,
  Printer,
  Share,
  Smartphone,
  Tag,
  Timer,
  Trash,
  Unlock,
  User,
  Video,
  Wifi,
  Zap as Lightning,
  
  // Additional icons for comprehensive coverage
  ArrowLeft,
  ArrowRight,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Flag,
  History,
  Lightbulb,
  MapPin,
  Cake,
  School,
  Receipt,
  Pause,
  Reply,
  Bug,
  Wrench,
  Smile,
  Trophy,
  Package,
  DollarSign,
  BarChart,
  PieChart,
  WifiOff,
  Cloud,
  CloudOff,
} from 'lucide-react';

// Type definitions for icon mapping
export interface IconMappingConfig {
  muiIconName: string;
  lucideIcon: React.ComponentType<any>;
  size?: number;
  className?: string;
  fallbackIcon?: React.ComponentType<any>;
}

// Comprehensive MUI to Lucide icon mapping
export const MUI_TO_LUCIDE_MAPPING: Record<string, IconMappingConfig> = {
  // Navigation & Actions
  'Add': { muiIconName: 'Add', lucideIcon: Plus },
  'AddIcon': { muiIconName: 'AddIcon', lucideIcon: Plus },
  'Edit': { muiIconName: 'Edit', lucideIcon: Edit },
  'EditIcon': { muiIconName: 'EditIcon', lucideIcon: Edit },
  'Delete': { muiIconName: 'Delete', lucideIcon: Trash2 },
  'DeleteIcon': { muiIconName: 'DeleteIcon', lucideIcon: Trash2 },
  'Remove': { muiIconName: 'Remove', lucideIcon: Trash2 },
  'RemoveIcon': { muiIconName: 'RemoveIcon', lucideIcon: Trash2 },
  'Visibility': { muiIconName: 'Visibility', lucideIcon: Eye },
  'VisibilityIcon': { muiIconName: 'VisibilityIcon', lucideIcon: Eye },
  'VisibilityOff': { muiIconName: 'VisibilityOff', lucideIcon: EyeOff },
  'Download': { muiIconName: 'Download', lucideIcon: Download },
  'DownloadIcon': { muiIconName: 'DownloadIcon', lucideIcon: Download },
  'FileDownload': { muiIconName: 'FileDownload', lucideIcon: Download },
  'FileDownloadIcon': { muiIconName: 'FileDownloadIcon', lucideIcon: Download },
  'Upload': { muiIconName: 'Upload', lucideIcon: Upload },
  'UploadIcon': { muiIconName: 'UploadIcon', lucideIcon: Upload },
  'Search': { muiIconName: 'Search', lucideIcon: Search },
  'SearchIcon': { muiIconName: 'SearchIcon', lucideIcon: Search },
  'Filter': { muiIconName: 'Filter', lucideIcon: Filter },
  'FilterList': { muiIconName: 'FilterList', lucideIcon: Filter },
  'FilterListIcon': { muiIconName: 'FilterListIcon', lucideIcon: Filter },
  'Sort': { muiIconName: 'Sort', lucideIcon: ArrowUpDown },
  'SortIcon': { muiIconName: 'SortIcon', lucideIcon: ArrowUpDown },
  'NavigateNext': { muiIconName: 'NavigateNext', lucideIcon: ChevronRight },
  'NavigateNextIcon': { muiIconName: 'NavigateNextIcon', lucideIcon: ChevronRight },
  'NavigateBefore': { muiIconName: 'NavigateBefore', lucideIcon: ChevronLeft },
  'NavigateBeforeIcon': { muiIconName: 'NavigateBeforeIcon', lucideIcon: ChevronLeft },
  'ExpandMore': { muiIconName: 'ExpandMore', lucideIcon: ChevronDown },
  'ExpandMoreIcon': { muiIconName: 'ExpandMoreIcon', lucideIcon: ChevronDown },
  'ExpandLess': { muiIconName: 'ExpandLess', lucideIcon: ChevronUp },
  'ExpandLessIcon': { muiIconName: 'ExpandLessIcon', lucideIcon: ChevronUp },
  'MoreHoriz': { muiIconName: 'MoreHoriz', lucideIcon: MoreHorizontal },
  'MoreVert': { muiIconName: 'MoreVert', lucideIcon: MoreHorizontal },
  
  // Status & Feedback
  'Warning': { muiIconName: 'Warning', lucideIcon: AlertTriangle },
  'WarningIcon': { muiIconName: 'WarningIcon', lucideIcon: AlertTriangle },
  'Error': { muiIconName: 'Error', lucideIcon: AlertCircle },
  'ErrorIcon': { muiIconName: 'ErrorIcon', lucideIcon: AlertCircle },
  'Info': { muiIconName: 'Info', lucideIcon: Info },
  'InfoIcon': { muiIconName: 'InfoIcon', lucideIcon: Info },
  'CheckCircle': { muiIconName: 'CheckCircle', lucideIcon: CheckCircle },
  'CheckCircleIcon': { muiIconName: 'CheckCircleIcon', lucideIcon: CheckCircle },
  'CheckCircleOutlined': { muiIconName: 'CheckCircleOutlined', lucideIcon: CheckCircle },
  'Check': { muiIconName: 'Check', lucideIcon: CheckCircle },
  'CheckIcon': { muiIconName: 'CheckIcon', lucideIcon: CheckCircle },
  'Close': { muiIconName: 'Close', lucideIcon: X },
  'CloseIcon': { muiIconName: 'CloseIcon', lucideIcon: X },
  'Cancel': { muiIconName: 'Cancel', lucideIcon: X },
  'CancelIcon': { muiIconName: 'CancelIcon', lucideIcon: X },
  'Pending': { muiIconName: 'Pending', lucideIcon: Clock },
  'PendingIcon': { muiIconName: 'PendingIcon', lucideIcon: Clock },
  'Schedule': { muiIconName: 'Schedule', lucideIcon: Clock },
  'ScheduleIcon': { muiIconName: 'ScheduleIcon', lucideIcon: Clock },
  
  // Medical & Healthcare
  'MedicalServices': { muiIconName: 'MedicalServices', lucideIcon: Stethoscope },
  'Science': { muiIconName: 'Science', lucideIcon: Flask },
  'ScienceIcon': { muiIconName: 'ScienceIcon', lucideIcon: Flask },
  'Medication': { muiIconName: 'Medication', lucideIcon: Pill },
  'MedicationIcon': { muiIconName: 'MedicationIcon', lucideIcon: Pill },
  'LocalPharmacy': { muiIconName: 'LocalPharmacy', lucideIcon: Pill },
  'Assignment': { muiIconName: 'Assignment', lucideIcon: FileText },
  'AssignmentIcon': { muiIconName: 'AssignmentIcon', lucideIcon: FileText },
  'Assessment': { muiIconName: 'Assessment', lucideIcon: BarChart3 },
  'AssessmentIcon': { muiIconName: 'AssessmentIcon', lucideIcon: BarChart3 },
  'Psychology': { muiIconName: 'Psychology', lucideIcon: Brain },
  'PsychologyIcon': { muiIconName: 'PsychologyIcon', lucideIcon: Brain },
  'Phone': { muiIconName: 'Phone', lucideIcon: Phone },
  'PhoneIcon': { muiIconName: 'PhoneIcon', lucideIcon: Phone },
  'CalendarToday': { muiIconName: 'CalendarToday', lucideIcon: Calendar },
  'Event': { muiIconName: 'Event', lucideIcon: Calendar },
  
  // Business & Admin
  'Dashboard': { muiIconName: 'Dashboard', lucideIcon: LayoutDashboard },
  'DashboardIcon': { muiIconName: 'DashboardIcon', lucideIcon: LayoutDashboard },
  'People': { muiIconName: 'People', lucideIcon: Users },
  'PeopleIcon': { muiIconName: 'PeopleIcon', lucideIcon: Users },
  'Person': { muiIconName: 'Person', lucideIcon: User },
  'PersonIcon': { muiIconName: 'PersonIcon', lucideIcon: User },
  'AdminPanelSettings': { muiIconName: 'AdminPanelSettings', lucideIcon: Shield },
  'Security': { muiIconName: 'Security', lucideIcon: Shield },
  'SecurityIcon': { muiIconName: 'SecurityIcon', lucideIcon: Shield },
  'Analytics': { muiIconName: 'Analytics', lucideIcon: BarChart3 },
  'AnalyticsIcon': { muiIconName: 'AnalyticsIcon', lucideIcon: BarChart3 },
  'TrendingUp': { muiIconName: 'TrendingUp', lucideIcon: TrendingUp },
  'TrendingUpIcon': { muiIconName: 'TrendingUpIcon', lucideIcon: TrendingUp },
  'TrendingDown': { muiIconName: 'TrendingDown', lucideIcon: TrendingDown },
  'TrendingDownIcon': { muiIconName: 'TrendingDownIcon', lucideIcon: TrendingDown },
  'SupervisorAccount': { muiIconName: 'SupervisorAccount', lucideIcon: Users },
  'Settings': { muiIconName: 'Settings', lucideIcon: Settings },
  'SettingsIcon': { muiIconName: 'SettingsIcon', lucideIcon: Settings },
  'Tune': { muiIconName: 'Tune', lucideIcon: Settings },
  'TuneIcon': { muiIconName: 'TuneIcon', lucideIcon: Settings },
  
  // Communication
  'Forum': { muiIconName: 'Forum', lucideIcon: MessageSquare },
  'Send': { muiIconName: 'Send', lucideIcon: Send },
  'SendIcon': { muiIconName: 'SendIcon', lucideIcon: Send },
  'Email': { muiIconName: 'Email', lucideIcon: Mail },
  'EmailIcon': { muiIconName: 'EmailIcon', lucideIcon: Mail },
  'Message': { muiIconName: 'Message', lucideIcon: MessageSquare },
  'Chat': { muiIconName: 'Chat', lucideIcon: MessageSquare },
  
  // File & Document
  'InsertDriveFile': { muiIconName: 'InsertDriveFile', lucideIcon: File },
  'Description': { muiIconName: 'Description', lucideIcon: FileText },
  'PictureAsPdf': { muiIconName: 'PictureAsPdf', lucideIcon: FileType },
  'Image': { muiIconName: 'Image', lucideIcon: FileImage },
  'ImageIcon': { muiIconName: 'ImageIcon', lucideIcon: FileImage },
  'Save': { muiIconName: 'Save', lucideIcon: Save },
  'SaveIcon': { muiIconName: 'SaveIcon', lucideIcon: Save },
  'Notes': { muiIconName: 'Notes', lucideIcon: FileText },
  'NotesIcon': { muiIconName: 'NotesIcon', lucideIcon: FileText },
  'Link': { muiIconName: 'Link', lucideIcon: Link },
  'LinkIcon': { muiIconName: 'LinkIcon', lucideIcon: Link },
  
  // Interface
  'Menu': { muiIconName: 'Menu', lucideIcon: Menu },
  'MenuIcon': { muiIconName: 'MenuIcon', lucideIcon: Menu },
  'Home': { muiIconName: 'Home', lucideIcon: Home },
  'HomeIcon': { muiIconName: 'HomeIcon', lucideIcon: Home },
  'Help': { muiIconName: 'Help', lucideIcon: HelpCircle },
  'HelpIcon': { muiIconName: 'HelpIcon', lucideIcon: HelpCircle },
  'Refresh': { muiIconName: 'Refresh', lucideIcon: Refresh },
  'RefreshIcon': { muiIconName: 'RefreshIcon', lucideIcon: Refresh },
  'Sync': { muiIconName: 'Sync', lucideIcon: Sync },
  'SyncIcon': { muiIconName: 'SyncIcon', lucideIcon: Sync },
  'ChevronLeft': { muiIconName: 'ChevronLeft', lucideIcon: ChevronLeft },
  'ChevronLeftIcon': { muiIconName: 'ChevronLeftIcon', lucideIcon: ChevronLeft },
  'ArrowForward': { muiIconName: 'ArrowForward', lucideIcon: ChevronRight },
  'ArrowForwardIcon': { muiIconName: 'ArrowForwardIcon', lucideIcon: ChevronRight },
  
  // Additional Business Icons
  'Reviews': { muiIconName: 'Reviews', lucideIcon: Star },
  'MenuBook': { muiIconName: 'MenuBook', lucideIcon: BookOpen },
  'Business': { muiIconName: 'Business', lucideIcon: Building },
  'BusinessIcon': { muiIconName: 'BusinessIcon', lucideIcon: Building },
  'Storage': { muiIconName: 'Storage', lucideIcon: Archive },
  'StorageIcon': { muiIconName: 'StorageIcon', lucideIcon: Archive },
  'Timeline': { muiIconName: 'Timeline', lucideIcon: Activity },
  'TimelineIcon': { muiIconName: 'TimelineIcon', lucideIcon: Activity },
  'List': { muiIconName: 'List', lucideIcon: FileText },
  'ListIcon': { muiIconName: 'ListIcon', lucideIcon: FileText },
  'ViewList': { muiIconName: 'ViewList', lucideIcon: FileText },
  'ViewListIcon': { muiIconName: 'ViewListIcon', lucideIcon: FileText },
  
  // Subscription & Payment
  'SubscriptionsTwoTone': { muiIconName: 'SubscriptionsTwoTone', lucideIcon: Star },
  'Star': { muiIconName: 'Star', lucideIcon: Star },
  'StarIcon': { muiIconName: 'StarIcon', lucideIcon: Star },
  'Bolt': { muiIconName: 'Bolt', lucideIcon: Zap },
  'BoltIcon': { muiIconName: 'BoltIcon', lucideIcon: Zap },
  'Stars': { muiIconName: 'Stars', lucideIcon: Star },
  'StarsIcon': { muiIconName: 'StarsIcon', lucideIcon: Star },
  
  // Media & Content
  'PlayArrow': { muiIconName: 'PlayArrow', lucideIcon: Play },
  'PlayArrowIcon': { muiIconName: 'PlayArrowIcon', lucideIcon: Play },
  'Tour': { muiIconName: 'Tour', lucideIcon: Map },
  'TourIcon': { muiIconName: 'TourIcon', lucideIcon: Map },
  'Preview': { muiIconName: 'Preview', lucideIcon: Eye },
  'PreviewIcon': { muiIconName: 'PreviewIcon', lucideIcon: Eye },
  'Print': { muiIconName: 'Print', lucideIcon: Printer },
  'PrintIcon': { muiIconName: 'PrintIcon', lucideIcon: Printer },
  'Share': { muiIconName: 'Share', lucideIcon: Share },
  'ShareIcon': { muiIconName: 'ShareIcon', lucideIcon: Share },
  
  // Import/Export
  'ImportExport': { muiIconName: 'ImportExport', lucideIcon: ArrowUpDown },
  'ImportIcon': { muiIconName: 'ImportIcon', lucideIcon: Upload },
  'ExportIcon': { muiIconName: 'ExportIcon', lucideIcon: Download },
  
  // Network & Connectivity
  'CloudOff': { muiIconName: 'CloudOff', lucideIcon: CloudOff },
  'CloudOffIcon': { muiIconName: 'CloudOffIcon', lucideIcon: CloudOff },
  
  // Additional Missing Icons from Analysis
  'AccessTime': { muiIconName: 'AccessTime', lucideIcon: Clock },
  'AccessTimeIcon': { muiIconName: 'AccessTimeIcon', lucideIcon: Clock },
  'AccountBox': { muiIconName: 'AccountBox', lucideIcon: User },
  'AccountBoxIcon': { muiIconName: 'AccountBoxIcon', lucideIcon: User },
  'AccountCircle': { muiIconName: 'AccountCircle', lucideIcon: User },
  'AccountCircleIcon': { muiIconName: 'AccountCircleIcon', lucideIcon: User },
  'Api': { muiIconName: 'Api', lucideIcon: Server },
  'ApiIcon': { muiIconName: 'ApiIcon', lucideIcon: Server },
  'ArrowBack': { muiIconName: 'ArrowBack', lucideIcon: ArrowLeft },
  'ArrowBackIcon': { muiIconName: 'ArrowBackIcon', lucideIcon: ArrowLeft },
  'Article': { muiIconName: 'Article', lucideIcon: FileText },
  'ArticleIcon': { muiIconName: 'ArticleIcon', lucideIcon: FileText },
  'AttachFile': { muiIconName: 'AttachFile', lucideIcon: Paperclip },
  'AttachFileIcon': { muiIconName: 'AttachFileIcon', lucideIcon: Paperclip },
  'AttachMoney': { muiIconName: 'AttachMoney', lucideIcon: DollarSign },
  'AttachMoneyIcon': { muiIconName: 'AttachMoneyIcon', lucideIcon: DollarSign },
  'AudioFile': { muiIconName: 'AudioFile', lucideIcon: File },
  'AudioFileIcon': { muiIconName: 'AudioFileIcon', lucideIcon: File },
  'BarChart': { muiIconName: 'BarChart', lucideIcon: BarChart },
  'BarChartIcon': { muiIconName: 'BarChartIcon', lucideIcon: BarChart },
  'Biotech': { muiIconName: 'Biotech', lucideIcon: Flask },
  'BiotechIcon': { muiIconName: 'BiotechIcon', lucideIcon: Flask },
  'Block': { muiIconName: 'Block', lucideIcon: X },
  'BlockIcon': { muiIconName: 'BlockIcon', lucideIcon: X },
  'Book': { muiIconName: 'Book', lucideIcon: BookOpen },
  'BookIcon': { muiIconName: 'BookIcon', lucideIcon: BookOpen },
  'BugReport': { muiIconName: 'BugReport', lucideIcon: Bug },
  'BugReportIcon': { muiIconName: 'BugReportIcon', lucideIcon: Bug },
  'Build': { muiIconName: 'Build', lucideIcon: Wrench },
  'BuildIcon': { muiIconName: 'BuildIcon', lucideIcon: Wrench },
  'BusinessOutlined': { muiIconName: 'BusinessOutlined', lucideIcon: Building },
  'BusinessOutlinedIcon': { muiIconName: 'BusinessOutlinedIcon', lucideIcon: Building },
  'Cake': { muiIconName: 'Cake', lucideIcon: Cake },
  'CakeIcon': { muiIconName: 'CakeIcon', lucideIcon: Cake },
  'Calendar': { muiIconName: 'Calendar', lucideIcon: Calendar },
  'CalendarIcon': { muiIconName: 'CalendarIcon', lucideIcon: Calendar },
  'CalendarToday': { muiIconName: 'CalendarToday', lucideIcon: Calendar },
  'CalendarTodayIcon': { muiIconName: 'CalendarTodayIcon', lucideIcon: Calendar },
  'Chat': { muiIconName: 'Chat', lucideIcon: MessageSquare },
  'ChatIcon': { muiIconName: 'ChatIcon', lucideIcon: MessageSquare },
  'CheckCircleOutline': { muiIconName: 'CheckCircleOutline', lucideIcon: CheckCircle },
  'CheckCircleOutlineIcon': { muiIconName: 'CheckCircleOutlineIcon', lucideIcon: CheckCircle },
  'Clear': { muiIconName: 'Clear', lucideIcon: X },
  'ClearIcon': { muiIconName: 'ClearIcon', lucideIcon: X },
  'CloudDone': { muiIconName: 'CloudDone', lucideIcon: Cloud },
  'CloudDoneIcon': { muiIconName: 'CloudDoneIcon', lucideIcon: Cloud },
  'Completed': { muiIconName: 'Completed', lucideIcon: CheckCircle },
  'CompletedIcon': { muiIconName: 'CompletedIcon', lucideIcon: CheckCircle },
  'Contacts': { muiIconName: 'Contacts', lucideIcon: Users },
  'ContactsIcon': { muiIconName: 'ContactsIcon', lucideIcon: Users },
  'ContentCopy': { muiIconName: 'ContentCopy', lucideIcon: Copy },
  'ContentCopyIcon': { muiIconName: 'ContentCopyIcon', lucideIcon: Copy },
  'CreditCard': { muiIconName: 'CreditCard', lucideIcon: CreditCard },
  'CreditCardIcon': { muiIconName: 'CreditCardIcon', lucideIcon: CreditCard },
  'Description': { muiIconName: 'Description', lucideIcon: FileText },
  'DescriptionIcon': { muiIconName: 'DescriptionIcon', lucideIcon: FileText },
  'EditNote': { muiIconName: 'EditNote', lucideIcon: Edit },
  'EditNoteIcon': { muiIconName: 'EditNoteIcon', lucideIcon: Edit },
  'EmojiEmotions': { muiIconName: 'EmojiEmotions', lucideIcon: Smile },
  'EmojiEmotionsIcon': { muiIconName: 'EmojiEmotionsIcon', lucideIcon: Smile },
  'EmojiEvents': { muiIconName: 'EmojiEvents', lucideIcon: Trophy },
  'EmojiEventsIcon': { muiIconName: 'EmojiEventsIcon', lucideIcon: Trophy },
  'ErrorOutline': { muiIconName: 'ErrorOutline', lucideIcon: AlertCircle },
  'ErrorOutlineIcon': { muiIconName: 'ErrorOutlineIcon', lucideIcon: AlertCircle },
  'Favorite': { muiIconName: 'Favorite', lucideIcon: Heart },
  'FavoriteIcon': { muiIconName: 'FavoriteIcon', lucideIcon: Heart },
  'Feedback': { muiIconName: 'Feedback', lucideIcon: MessageSquare },
  'FeedbackIcon': { muiIconName: 'FeedbackIcon', lucideIcon: MessageSquare },
  'Flag': { muiIconName: 'Flag', lucideIcon: Flag },
  'FlagIcon': { muiIconName: 'FlagIcon', lucideIcon: Flag },
  'GetApp': { muiIconName: 'GetApp', lucideIcon: Download },
  'GetAppIcon': { muiIconName: 'GetAppIcon', lucideIcon: Download },
  'GitHub': { muiIconName: 'GitHub', lucideIcon: ExternalLink },
  'GitHubIcon': { muiIconName: 'GitHubIcon', lucideIcon: ExternalLink },
  'Group': { muiIconName: 'Group', lucideIcon: Users },
  'GroupIcon': { muiIconName: 'GroupIcon', lucideIcon: Users },
  'History': { muiIconName: 'History', lucideIcon: History },
  'HistoryIcon': { muiIconName: 'HistoryIcon', lucideIcon: History },
  'Inventory': { muiIconName: 'Inventory', lucideIcon: Package },
  'InventoryIcon': { muiIconName: 'InventoryIcon', lucideIcon: Package },
  'Lightbulb': { muiIconName: 'Lightbulb', lucideIcon: Lightbulb },
  'LightbulbIcon': { muiIconName: 'LightbulbIcon', lucideIcon: Lightbulb },
  'LinkedIn': { muiIconName: 'LinkedIn', lucideIcon: ExternalLink },
  'LinkedInIcon': { muiIconName: 'LinkedInIcon', lucideIcon: ExternalLink },
  'LocalHospital': { muiIconName: 'LocalHospital', lucideIcon: Stethoscope },
  'LocalHospitalIcon': { muiIconName: 'LocalHospitalIcon', lucideIcon: Stethoscope },
  'Location': { muiIconName: 'Location', lucideIcon: MapPin },
  'LocationIcon': { muiIconName: 'LocationIcon', lucideIcon: MapPin },
  'LocationOn': { muiIconName: 'LocationOn', lucideIcon: MapPin },
  'LocationOnIcon': { muiIconName: 'LocationOnIcon', lucideIcon: MapPin },
  'Logout': { muiIconName: 'Logout', lucideIcon: Power },
  'LogoutIcon': { muiIconName: 'LogoutIcon', lucideIcon: Power },
  'MTR': { muiIconName: 'MTR', lucideIcon: FileText },
  'MTRIcon': { muiIconName: 'MTRIcon', lucideIcon: FileText },
  'MenuOpen': { muiIconName: 'MenuOpen', lucideIcon: Menu },
  'MenuOpenIcon': { muiIconName: 'MenuOpenIcon', lucideIcon: Menu },
  'MonitorHeart': { muiIconName: 'MonitorHeart', lucideIcon: Activity },
  'MonitorHeartIcon': { muiIconName: 'MonitorHeartIcon', lucideIcon: Activity },
  'MoreVert': { muiIconName: 'MoreVert', lucideIcon: MoreHorizontal },
  'MoreVertIcon': { muiIconName: 'MoreVertIcon', lucideIcon: MoreHorizontal },
  'NotFound': { muiIconName: 'NotFound', lucideIcon: AlertCircle },
  'NotFoundIcon': { muiIconName: 'NotFoundIcon', lucideIcon: AlertCircle },
  'Note': { muiIconName: 'Note', lucideIcon: FileText },
  'NoteIcon': { muiIconName: 'NoteIcon', lucideIcon: FileText },
  'Notifications': { muiIconName: 'Notifications', lucideIcon: Info },
  'NotificationsIcon': { muiIconName: 'NotificationsIcon', lucideIcon: Info },
  'Offline': { muiIconName: 'Offline', lucideIcon: WifiOff },
  'OfflineIcon': { muiIconName: 'OfflineIcon', lucideIcon: WifiOff },
  'PauseCircle': { muiIconName: 'PauseCircle', lucideIcon: Pause },
  'PauseCircleIcon': { muiIconName: 'PauseCircleIcon', lucideIcon: Pause },
  'Payment': { muiIconName: 'Payment', lucideIcon: CreditCard },
  'PaymentIcon': { muiIconName: 'PaymentIcon', lucideIcon: CreditCard },
  'PersonAdd': { muiIconName: 'PersonAdd', lucideIcon: User },
  'PersonAddIcon': { muiIconName: 'PersonAddIcon', lucideIcon: User },
  'PersonOutline': { muiIconName: 'PersonOutline', lucideIcon: User },
  'PersonOutlineIcon': { muiIconName: 'PersonOutlineIcon', lucideIcon: User },
  'Permission': { muiIconName: 'Permission', lucideIcon: Shield },
  'PermissionIcon': { muiIconName: 'PermissionIcon', lucideIcon: Shield },
  'PieChart': { muiIconName: 'PieChart', lucideIcon: PieChart },
  'PieChartIcon': { muiIconName: 'PieChartIcon', lucideIcon: PieChart },
  'Play': { muiIconName: 'Play', lucideIcon: Play },
  'PlayIcon': { muiIconName: 'PlayIcon', lucideIcon: Play },
  'PlaylistAddCheck': { muiIconName: 'PlaylistAddCheck', lucideIcon: CheckCircle },
  'PlaylistAddCheckIcon': { muiIconName: 'PlaylistAddCheckIcon', lucideIcon: CheckCircle },
  'QuestionAnswer': { muiIconName: 'QuestionAnswer', lucideIcon: MessageSquare },
  'QuestionAnswerIcon': { muiIconName: 'QuestionAnswerIcon', lucideIcon: MessageSquare },
  'Receipt': { muiIconName: 'Receipt', lucideIcon: Receipt },
  'ReceiptIcon': { muiIconName: 'ReceiptIcon', lucideIcon: Receipt },
  'RemoveCircle': { muiIconName: 'RemoveCircle', lucideIcon: X },
  'RemoveCircleIcon': { muiIconName: 'RemoveCircleIcon', lucideIcon: X },
  'Report': { muiIconName: 'Report', lucideIcon: FileText },
  'ReportIcon': { muiIconName: 'ReportIcon', lucideIcon: FileText },
  'ReportProblem': { muiIconName: 'ReportProblem', lucideIcon: AlertTriangle },
  'ReportProblemIcon': { muiIconName: 'ReportProblemIcon', lucideIcon: AlertTriangle },
  'Savings': { muiIconName: 'Savings', lucideIcon: DollarSign },
  'SavingsIcon': { muiIconName: 'SavingsIcon', lucideIcon: DollarSign },
  'School': { muiIconName: 'School', lucideIcon: School },
  'SchoolIcon': { muiIconName: 'SchoolIcon', lucideIcon: School },
  'SchoolOutlined': { muiIconName: 'SchoolOutlined', lucideIcon: School },
  'SchoolOutlinedIcon': { muiIconName: 'SchoolOutlinedIcon', lucideIcon: School },
  'ServerError': { muiIconName: 'ServerError', lucideIcon: AlertCircle },
  'ServerErrorIcon': { muiIconName: 'ServerErrorIcon', lucideIcon: AlertCircle },
  'Shield': { muiIconName: 'Shield', lucideIcon: Shield },
  'ShieldIcon': { muiIconName: 'ShieldIcon', lucideIcon: Shield },
  'Speed': { muiIconName: 'Speed', lucideIcon: Zap },
  'SpeedIcon': { muiIconName: 'SpeedIcon', lucideIcon: Zap },
  'StarBorder': { muiIconName: 'StarBorder', lucideIcon: Star },
  'StarBorderIcon': { muiIconName: 'StarBorderIcon', lucideIcon: Star },
  'Start': { muiIconName: 'Start', lucideIcon: Play },
  'StartIcon': { muiIconName: 'StartIcon', lucideIcon: Play },
  'Success': { muiIconName: 'Success', lucideIcon: CheckCircle },
  'SuccessIcon': { muiIconName: 'SuccessIcon', lucideIcon: CheckCircle },
  'Support': { muiIconName: 'Support', lucideIcon: HelpCircle },
  'SupportIcon': { muiIconName: 'SupportIcon', lucideIcon: HelpCircle },
  'SwapVert': { muiIconName: 'SwapVert', lucideIcon: ArrowUpDown },
  'SwapVertIcon': { muiIconName: 'SwapVertIcon', lucideIcon: ArrowUpDown },
  'Template': { muiIconName: 'Template', lucideIcon: FileText },
  'TemplateIcon': { muiIconName: 'TemplateIcon', lucideIcon: FileText },
  'ThumbDown': { muiIconName: 'ThumbDown', lucideIcon: ThumbsDown },
  'ThumbDownIcon': { muiIconName: 'ThumbDownIcon', lucideIcon: ThumbsDown },
  'ThumbUp': { muiIconName: 'ThumbUp', lucideIcon: ThumbsUp },
  'ThumbUpIcon': { muiIconName: 'ThumbUpIcon', lucideIcon: ThumbsUp },
  'Twitter': { muiIconName: 'Twitter', lucideIcon: ExternalLink },
  'TwitterIcon': { muiIconName: 'TwitterIcon', lucideIcon: ExternalLink },
  'Upgrade': { muiIconName: 'Upgrade', lucideIcon: TrendingUp },
  'UpgradeIcon': { muiIconName: 'UpgradeIcon', lucideIcon: TrendingUp },
  'Video': { muiIconName: 'Video', lucideIcon: Video },
  'VideoIcon': { muiIconName: 'VideoIcon', lucideIcon: Video },
  'View': { muiIconName: 'View', lucideIcon: Eye },
  'ViewIcon': { muiIconName: 'ViewIcon', lucideIcon: Eye },
  'Webhook': { muiIconName: 'Webhook', lucideIcon: ExternalLink },
  'WebhookIcon': { muiIconName: 'WebhookIcon', lucideIcon: ExternalLink },
  'WhatsApp': { muiIconName: 'WhatsApp', lucideIcon: MessageSquare },
  'WhatsAppIcon': { muiIconName: 'WhatsAppIcon', lucideIcon: MessageSquare },
  'WorkOutline': { muiIconName: 'WorkOutline', lucideIcon: Building },
  'WorkOutlineIcon': { muiIconName: 'WorkOutlineIcon', lucideIcon: Building },
};

// Props interface for the IconMapper component
export interface IconMapperProps {
  muiIconName: string;
  size?: number;
  className?: string;
  color?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/**
 * IconMapper component that renders the appropriate Lucide icon for a given MUI icon name
 */
export const IconMapper: React.FC<IconMapperProps> = ({
  muiIconName,
  size = 24,
  className = '',
  color,
  onClick,
  style,
}) => {
  const mapping = MUI_TO_LUCIDE_MAPPING[muiIconName];
  
  if (!mapping) {
    console.warn(`No Lucide equivalent found for MUI icon: ${muiIconName}`);
    // Return a fallback icon (Info icon)
    const FallbackIcon = Info;
    return (
      <FallbackIcon
        size={size}
        className={`${className} text-muted-foreground`}
        color={color}
        onClick={onClick}
        style={style}
      />
    );
  }
  
  const LucideIcon = mapping.lucideIcon;
  
  return (
    <LucideIcon
      size={mapping.size || size}
      className={`${mapping.className || ''} ${className}`.trim()}
      color={color}
      onClick={onClick}
      style={style}
    />
  );
};

/**
 * Utility function to get the Lucide icon component for a MUI icon name
 */
export const getLucideIcon = (muiIconName: string): React.ComponentType<any> | null => {
  const mapping = MUI_TO_LUCIDE_MAPPING[muiIconName];
  return mapping ? mapping.lucideIcon : null;
};

/**
 * Utility function to check if a MUI icon has a Lucide equivalent
 */
export const hasLucideEquivalent = (muiIconName: string): boolean => {
  return muiIconName in MUI_TO_LUCIDE_MAPPING;
};

/**
 * Get all MUI icon names that have Lucide equivalents
 */
export const getSupportedMuiIcons = (): string[] => {
  return Object.keys(MUI_TO_LUCIDE_MAPPING);
};

/**
 * Get mapping statistics for reporting
 */
export const getMappingStats = () => {
  const totalMappings = Object.keys(MUI_TO_LUCIDE_MAPPING).length;
  const uniqueLucideIcons = new Set(
    Object.values(MUI_TO_LUCIDE_MAPPING).map(mapping => mapping.lucideIcon.name)
  ).size;
  
  return {
    totalMappings,
    uniqueLucideIcons,
    mappingRatio: (uniqueLucideIcons / totalMappings * 100).toFixed(1) + '%'
  };
};

export default IconMapper;