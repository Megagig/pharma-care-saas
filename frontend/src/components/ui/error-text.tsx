export interface ErrorTextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  error?: boolean;
}

const ErrorText = React.forwardRef<HTMLParagraphElement, ErrorTextProps>(
  ({ className, error = true, children, ...props }, ref) => {
    if (!children) return null;
    
    return (
      <p
        ref={ref}
        className={cn(
          'text-xs mt-1',
          error ? 'text-destructive' : 'text-muted-foreground',
          className}
        )}
        {...props}
      >
        {children}
      </p>
    );
  }
);

ErrorText.displayName = 'ErrorText';

export { ErrorText };