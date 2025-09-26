
import { Button, Card, CardContent } from '@/components/ui/button';

interface Plan {
  name: string;
  price: string;
  description: string;
  popular: boolean;
  features: string[];
  notIncluded: string[];
  actionText?: string;
  onSelectPlan?: () => void;
}
interface PlanCardsProps {
  plans: Plan[];
}
const PlanCards: React.FC<PlanCardsProps> = ({ plans }) => {
  return (
    <div container spacing={4} justifyContent="center">
      {plans.map((plan, index) => (
        <div item xs={12} md={4} key={index}>
          <Card
            className="">
            {plan.popular && (
              <div
                className=""
              >
                <StarIcon fontSize="small" />
                <div  className="">
                  Most Popular
                </div>
              </div>
            )}
            <CardContent
              className=""
            >
              <div className="">
                <div
                  className=""
                >
                  {plan.name === 'Enterprise' ? (
                    <StarsIcon
                      className=""
                    />
                  ) : (
                    <BoltIcon
                      className=""
                    />
                  )}
                  <div  className="">
                    {plan.name}
                  </div>
                </div>
                <div
                  
                  color="text.secondary"
                  className=""
                >
                  {plan.description}
                </div>
                <div
                  className=""
                >
                  <div
                    
                    className=""
                  >
                    ₦{plan.price}
                  </div>
                  <div
                    
                    color="text.secondary"
                    className=""
                  >
                    /month
                  </div>
                </div>
                <div  color="text.secondary">
                  Billed monthly
                </div>
              </div>
              <Button
                variant={plan.popular ? 'contained' : 'outlined'}
                size="large"
                fullWidth
                className=""
                onClick={plan.onSelectPlan}
              >
                {plan.actionText ||
                  (plan.popular ? 'Start Free Trial' : 'Get Started')}
              </Button>
              <div className="">
                <div  className="">
                  What's included:
                </div>
                <List disablePadding>
                  {plan.features.map((feature, featureIndex) => (
                    <div
                      key={featureIndex}
                      disablePadding
                      className=""
                    >
                      <div className="">
                        <CheckIcon
                          className=""
                        />
                      </div>
                      <div
                        primary={feature}
                        
                      />
                    </div>
                  ))}
                  {plan.notIncluded.map((feature, featureIndex) => (
                    <div
                      key={featureIndex}
                      disablePadding
                      className=""
                    >
                      <div className="">
                        <CloseIcon
                          className=""
                        />
                      </div>
                      <div
                        primary={feature}
                        
                      />
                    </div>
                  ))}
                </List>
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
};
export default PlanCards;
