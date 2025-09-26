interface AnimatedProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export const FadeIn: React.FC<AnimatedProps> = ({ 
  children,
  delay = 0,
  duration = 0.5,
  className = ''}
}) => (
  <motion.div
    
    
    
    className={className}
  >
    {children}
  </motion.div>
);

export const SlideUp: React.FC<AnimatedProps> = ({ 
  children,
  delay = 0,
  duration = 0.5,
  className = ''}
}) => (
  <motion.div
    
    
    
    className={className}
  >
    {children}
  </motion.div>
);

export const SlideIn: React.FC<AnimatedProps> = ({ 
  children,
  delay = 0,
  duration = 0.5,
  className = ''}
}) => (
  <motion.div
    
    
    
    className={className}
  >
    {children}
  </motion.div>
);

export const ScaleIn: React.FC<AnimatedProps> = ({ 
  children,
  delay = 0,
  duration = 0.5,
  className = ''}
}) => (
  <motion.div
    
    
    
    className={className}
  >
    {children}
  </motion.div>
);

export const AnimatedCard: React.FC<AnimatedProps> = ({ 
  children,
  delay = 0,
  className = ''}
}) => (
  <motion.div
    className={`dashboard-card ${className}`}
    
    
    >
    {children}
  </motion.div>
);

export const AnimateList: React.FC<{
  children: ReactNode[];
  staggerDelay?: number;
}> = ({ children, staggerDelay = 0.1 }) => (
  <>
    {React.Children.map(children, (child, index) => (
      <SlideUp key={index} delay={index * staggerDelay}>
        {child}
      </SlideUp>
    ))}
  </>
);
