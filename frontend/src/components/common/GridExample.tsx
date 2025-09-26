
import { Button, Card } from '@/components/ui/button';
/**
 * Example component that demonstrates how to use the GridSystem components
 */
export const GridExample: React.FC = () => {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">
        Grid System Example
      </h2>

      <divContainer spacing={3}>
        {/* Full width on xs, half width on md and up */}
        <divItem xs={12} md={6}>
          <FormField
            fullWidth
            label="First Name"
            placeholder="Enter your first name"
          />
        </GridItem>

        {/* Full width on xs, half width on md and up */}
        <divItem xs={12} md={6}>
          <FormField
            fullWidth
            label="Last Name"
            placeholder="Enter your last name"
          />
        </GridItem>

        {/* Full width */}
        <divItem xs={12}>
          <FormField fullWidth label="Email" placeholder="Enter your email" />
        </GridItem>

        {/* Nested grid example */}
        <divItem xs={12}>
          <divContainer spacing={2}>
            <divItem xs={12} md={4}>
              <FormField fullWidth label="City" placeholder="Enter your city" />
            </GridItem>
            <divItem xs={12} md={4}>
              <FormField
                fullWidth
                label="State"
                placeholder="Enter your state"
              />
            </GridItem>
            <divItem xs={12} md={4}>
              <FormField
                fullWidth
                label="Zip Code"
                placeholder="Enter your zip code"
              />
            </GridItem>
          </GridContainer>
        </GridItem>

        {/* Button row */}
        <divItem xs={12}>
          <divContainer spacing={2} justifyContent="flex-end">
            <divItem>
              <Button >Cancel</Button>
            </GridItem>
            <divItem>
              <Button >
                Submit
              </Button>
            </GridItem>
          </GridContainer>
        </GridItem>
      </GridContainer>
    </Card>
  );
};

export default GridExample;
