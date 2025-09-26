
import { Card, CardContent } from '@/components/ui/card';
const ModulePage: React.FC<ModulePageProps> = ({ 
  moduleInfo,
  icon: IconComponent,
  gradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  children,
  hideModuleInfo = false
}) => {
  // No need for navigation function since we're not using it

  return (
    <div maxWidth="lg" className="">
      {/* Module Header */}
      <div
        className=""
      >
        <div
          className=""
        >
          <div
            className=""
          >
            {IconComponent && <IconComponent className="" />}
          </div>
          <div>
            <div  component="h1" className="">
              {moduleInfo.title}
            </div>
            <div  className="">
              {moduleInfo.purpose}
            </div>
          </div>
        </div>
      </div>

      {/* Module Information Section */}
      {!hideModuleInfo && (
        <div className="">
          <div
            className=""
          >
            {/* Workflow Section */}
            <Card
              className=""
            >
              <CardContent className="">
                <div
                  className=""
                >
                  <div
                    className=""
                  >
                    <ScheduleIcon className="" />
                  </div>
                  <div
                    
                    component="h2"
                    className=""
                  >
                    Workflow
                  </div>
                </div>

                <div
                  
                  color="text.secondary"
                  className=""
                >
                  {moduleInfo.workflow.description}
                </div>

                <div
                  
                  className=""
                >
                  Process Steps:
                </div>

                <List className="">
                  {moduleInfo.workflow.steps.map((step, index) => (
                    <div
                      key={index}
                      className="">
                      <div
                        className=""
                      >
                        <div
                          className=""
                        >
                          {index + 1}
                        </div>
                      </div>
                      <div primary={step} />
                    </div>
                  ))}
                </List>
              </CardContent>
            </Card>
          </div>
          
          <div
            className=""
          >
            {/* Key Features Section */}
            <Card
              className=""
            >
              <CardContent className="">
                <div
                  className=""
                >
                  <div
                    className=""
                  >
                    <CheckCircleIcon className="" />
                  </div>
                  <div
                    
                    component="h2"
                    className=""
                  >
                    Key Features
                  </div>
                </div>

                <List className="">
                  {moduleInfo.keyFeatures.map((feature, index) => (
                    <div
                      key={index}
                      className=""
                    >
                      <div
                        className=""
                      >
                        <CheckCircleIcon
                          color="success"
                          fontSize="small"
                          className=""
                        />
                      </div>
                      <div primary={feature} />
                    </div>
                  ))}
                </List>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Main Content Section */}
      <div mt={hideModuleInfo ? 0 : 4}>{children}</div>
    </div>
  );
};

export default ModulePage;
