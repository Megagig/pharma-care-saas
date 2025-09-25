import React from 'react';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Card } from '@/components/ui/card';
import { GridItem, GridContainer } from './GridSystem';

/**
 * Example component that demonstrates how to use the GridSystem components
 */
export const GridExample: React.FC = () => {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">
        Grid System Example
      </h2>

      <GridContainer spacing={3}>
        {/* Full width on xs, half width on md and up */}
        <GridItem xs={12} md={6}>
          <FormField
            fullWidth
            label="First Name"
            placeholder="Enter your first name"
          />
        </GridItem>

        {/* Full width on xs, half width on md and up */}
        <GridItem xs={12} md={6}>
          <FormField
            fullWidth
            label="Last Name"
            placeholder="Enter your last name"
          />
        </GridItem>

        {/* Full width */}
        <GridItem xs={12}>
          <FormField fullWidth label="Email" placeholder="Enter your email" />
        </GridItem>

        {/* Nested grid example */}
        <GridItem xs={12}>
          <GridContainer spacing={2}>
            <GridItem xs={12} md={4}>
              <FormField fullWidth label="City" placeholder="Enter your city" />
            </GridItem>
            <GridItem xs={12} md={4}>
              <FormField
                fullWidth
                label="State"
                placeholder="Enter your state"
              />
            </GridItem>
            <GridItem xs={12} md={4}>
              <FormField
                fullWidth
                label="Zip Code"
                placeholder="Enter your zip code"
              />
            </GridItem>
          </GridContainer>
        </GridItem>

        {/* Button row */}
        <GridItem xs={12}>
          <GridContainer spacing={2} justifyContent="flex-end">
            <GridItem>
              <Button variant="outline">Cancel</Button>
            </GridItem>
            <GridItem>
              <Button variant="default">
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
