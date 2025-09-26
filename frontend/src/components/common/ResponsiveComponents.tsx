
import { Card, CardContent, Accordion, Separator } from '@/components/ui/button';
/**
 * Responsive container that adapts spacing and layout based on screen size
 */
export const ResponsiveContainer: React.FC<{
  children: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
}> = ({ children, maxWidth = 'lg' }) => {
  const { getSpacing, isMobile } = useResponsive();
  return (
    <div
      className="">
      {children}
    </div>
  );
};
/**
 * Responsive card layout for mobile-first design
 */
interface ResponsiveCardProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  chips?: Array<{
    label: string;
    color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  }>;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}
export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({ 
  title,
  subtitle,
  actions,
  chips = [],
  children,
  collapsible = false,
  defaultExpanded = true
}) => {
  const { isMobile } = useResponsive();
  if (collapsible && isMobile) {
    return (
      <Accordion defaultExpanded={defaultExpanded}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <div className="">
            <div  component="div">
              {title}
            </div>
            {chips.map((chip, index) => (
              <Chip
                key={index}
                label={chip.label}
                size="small"
                color={chip.color}
                
              />
            ))}
          </div>
        </AccordionSummary>
        <AccordionDetails>
          {subtitle && (
            <div  color="text.secondary" className="">
              {subtitle}
            </div>
          )}
          {children}
          {actions && (
            <div
              className=""
            >
              {actions}
            </div>
          )}
        </AccordionDetails>
      </Accordion>
    );
  }
  return (
    <Card>
      <CardContent>
        <div
          className=""
        >
          <div className="">
            <div  component="div" gutterBottom>
              {title}
            </div>
            {subtitle && (
              <div  color="text.secondary">
                {subtitle}
              </div>
            )}
            {chips.length > 0 && (
              <div className="">
                {chips.map((chip, index) => (
                  <Chip
                    key={index}
                    label={chip.label}
                    size="small"
                    color={chip.color}
                    
                  />
                ))}
              </div>
            )}
          </div>
          {actions && !isMobile && (
            <div className="">{actions}</div>
          )}
        </div>
        {children}
      </CardContent>
      {actions && isMobile && (
        <CardActions className="">{actions}</CardActions>
      )}
    </Card>
  );
};
/**
 * Responsive list item component
 */
interface ResponsiveListItemProps {
  primary: string;
  secondary?: string;
  avatar?: React.ReactNode;
  actions?: React.ReactNode;
  chips?: Array<{
    label: string;
    color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  }>;
  onClick?: () => void;
}
export const ResponsiveListItem: React.FC<ResponsiveListItemProps> = ({ 
  primary,
  secondary,
  avatar,
  actions,
  chips = [],
  onClick
}) => {
  const { isMobile } = useResponsive();
  if (isMobile) {
    return (
      <Card
        className="">
        <CardContent className="">
          <div className="">
            {avatar && <div className="">{avatar}</div>}
            <div className="">
              <div  component="div">
                {primary}
              </div>
              {secondary && (
                <div  color="text.secondary">
                  {secondary}
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
                      
                    />
                  ))}
                </div>
              )}
            </div>
            {actions && <div className="">{actions}</div>}
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <div
      onClick={onClick}
      >
      {avatar}
      <div
        primary={primary}
        secondary={
          <>}
            {secondary}
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
                    
                  />
                ))}
              </div>
            )}
          </>
        }
      />
      <divSecondaryAction>{actions}</ListItemSecondaryAction>
    </div>
  );
};
/**
 * Responsive header component
 */
interface ResponsiveHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  backButton?: React.ReactNode;
}
export const ResponsiveHeader: React.FC<ResponsiveHeaderProps> = ({ 
  title,
  subtitle,
  actions,
  backButton
}) => {
  const { isMobile, getSpacing } = useResponsive();
  return (
    <div
      className=""
    >
      <div className="">
        {backButton}
        <div>
          <div
            variant={isMobile ? 'h5' : 'h4'}
            component="h1"
            className=""
          >
            {title}
          </div>
          {subtitle && (
            <div  color="text.secondary">
              {subtitle}
            </div>
          )}
        </div>
      </div>
      {actions && (
        <div
          className="">
          {actions}
        </div>
      )}
    </div>
  );
};
/**
 * Responsive section divider
 */
export const ResponsiveDivider: React.FC<{
  label?: string;
  spacing?: number;
}> = ({ label, spacing }) => {
  const { getSpacing } = useResponsive();
  const actualSpacing = spacing ?? getSpacing(2, 3, 4);
  return (
    <Separator
      className="">
      {label && (
        <div  color="text.secondary">
          {label}
        </div>
      )}
    </Separator>
  );
};
/**
 * Responsive grid container
 */
export const ResponsiveGrid: React.FC<{
  children: React.ReactNode;
  spacing?: number;
  columns?: { xs?: number; sm?: number; md?: number; lg?: number };
}> = ({ children, spacing = 2, columns = { xs: 1, sm: 2, md: 3, lg: 4 } }) => {
  return (
    <div
      className="">
      {children}
    </div>
  );
};
export default {
};
