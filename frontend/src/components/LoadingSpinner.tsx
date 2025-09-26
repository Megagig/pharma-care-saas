import { Loader2 } from 'lucide-react';


interface LoadingSpinnerProps {
  message?: string;
  size?: number;
  fullScreen?: boolean;
}
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Loading...',
  size = 40,
  fullScreen = false 
}) => {
  const containerStyle = fullScreen
    ? {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        zIndex: 9999,
      }
    : {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column' as const,
        padding: 2,
      };
  return (
    <div style={containerStyle}>
      <Loader2 className="animate-spin" size={size} />
      {message && (
        <div className="mt-2 text-sm text-gray-600">
          {message}
        </div>
      )}
    </div>
  );
};
export default LoadingSpinner;