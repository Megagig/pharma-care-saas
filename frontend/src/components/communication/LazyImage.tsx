import { Spinner, Skeleton } from '@/components/ui/button';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  maxWidth?: number | string;
  maxHeight?: number | string;
  placeholder?: React.ReactNode;
  fallback?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
  className?: string;
  style?: React.CSSProperties;
  progressive?: boolean;
  downloadable?: boolean;
  onDownload?: () => void;
}
/**
 * Lazy loading image component with progressive enhancement
 */
const LazyImage: React.FC<LazyImageProps> = ({ 
  src,
  alt,
  width = '100%',
  height = 'auto',
  maxWidth = '100%',
  maxHeight = '400px',
  placeholder,
  fallback,
  onLoad,
  onError,
  className,
  style,
  progressive = true,
  downloadable = false,
  onDownload
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [lowResLoaded, setLowResLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Generate low-resolution version URL for progressive loading
  const getLowResUrl = (originalUrl: string): string => {
    if (!progressive) return originalUrl;
    // For demonstration - in real implementation, you'd have a service
    // that generates low-res versions or use URL parameters
    const url = new URL(originalUrl);
    url.searchParams.set('w', '50');
    url.searchParams.set('q', '30');
    return url.toString();
  };
  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before the image enters viewport
        threshold: 0.1,
      }
    );
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);
  // Handle image load
  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };
  // Handle image error
  const handleError = () => {
    setIsError(true);
    onError?.();
  };
  // Handle low-res image load
  const handleLowResLoad = () => {
    setLowResLoaded(true);
  };
  // Handle download
  const handleDownload = async () => {
    if (onDownload) {
      onDownload();
      return;
    }
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = alt || 'image';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };
  const containerStyle: React.CSSProperties = {
    width,
    height,
    maxWidth,
    maxHeight,
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    ...style,
  };
  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'opacity 0.3s ease',
  };
  // Show placeholder while not visible
  if (!isVisible) {
    return (
      <div ref={containerRef} className="" className={className}>
        {placeholder || (
          <Skeleton
            
            width="100%"
            height="100%"
            animation="wave"
          />
        )}
      </div>
    );
  }
  // Show error fallback
  if (isError) {
    return (
      <div className="" className={className}>
        {fallback || (
          <div
            className=""
          >
            <VisibilityOff className="" />
            <div className="">
              Failed to load image
            </div>
          </div>
        )}
      </div>
    );
  }
  return (
    <div ref={containerRef} className="" className={className}>
      {/* Progressive loading: Low-res image first */}
      {progressive && !isLoaded && (
        <img
          src={getLowResUrl(src)}
          alt={alt}
          
          onLoad={handleLowResLoad}
           // Ignore low-res errors
        />
      )}
      {/* High-res image */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy" // Native lazy loading as fallback
      />
      {/* Loading indicator */}
      {!isLoaded && !isError && (
        <div
          className=""
        >
          <Spinner size={24} />
        </div>
      )}
      {/* Download button */}
      {downloadable && isLoaded && (
        <div
          className="">
          <IconButton
            size="small"
            onClick={handleDownload}
            className="">
            <Download fontSize="small" />
          </IconButton>
        </div>
      )}
    </div>
  );
};
export default LazyImage;
