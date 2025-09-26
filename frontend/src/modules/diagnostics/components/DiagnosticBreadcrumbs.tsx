
interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: React.ReactNode;
}
interface DiagnosticBreadcrumbsProps {
  customItems?: BreadcrumbItem[];
}
export const DiagnosticBreadcrumbs: React.FC<DiagnosticBreadcrumbsProps> = ({ 
  customItems = []
}) => {
  const location = useLocation();
  const params = useParams();
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const baseBreadcrumbs: BreadcrumbItem[] = [
      {
        label: 'Dashboard',
        path: '/dashboard',
      },
      {
        label: 'AI Diagnostics & Therapeutics',
        path: '/pharmacy/diagnostics',
        icon: <ScienceIcon className="" />,
      },
    ];
    // Add path-specific breadcrumbs
    const pathSegments = location.pathname.split('/').filter(Boolean);
    if (pathSegments.includes('case')) {
      if (pathSegments.includes('new')) {
        baseBreadcrumbs.push({ 
          label: 'New Case',
          path: '/pharmacy/diagnostics/case/new'}
        });
      } else if (params.requestId) {
        baseBreadcrumbs.push({ 
          label: 'Cases',
          path: '/pharmacy/diagnostics'}
        });
        baseBreadcrumbs.push({  })
          label: `Case ${params.requestId.slice(-8)}`,
          path: `/pharmacy/diagnostics/case/${params.requestId}`}
      }
    } else if (pathSegments.includes('demo')) {
      baseBreadcrumbs.push({ 
        label: 'Component Demo',
        path: '/pharmacy/diagnostics/demo'}
      });
    }
    // Add any custom items
    return [...baseBreadcrumbs, ...customItems];
  };
  const breadcrumbs = generateBreadcrumbs();
  return (
    <div className="">
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="diagnostic navigation breadcrumb"
        className="">
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;
          if (isLast || !item.path) {
            return (
              <div
                key={index}
                color="text.primary"
                className=""
              >
                {item.icon}
                {item.label}
              </div>
            );
          }
          return (
            <Link
              key={index}
              
              to={item.path}
              underline="hover"
              color="inherit"
              className="">
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </Breadcrumbs>
    </div>
  );
};
export default DiagnosticBreadcrumbs;
