iact';
import userEvent';
imp
import { BrowserRouter } fm';
impor'vitest';
import ClinicalInterven;
import InterventionForm from '../../components/In
import * as clinicalInterventionService from '../../services';
import * as patientService from '../../services/patientService';

// Mock the services
');
vi.mock('../../services/patientService');


vi.({
    useAuth: () => ({
        user: {
            id: 'user-1',
            firstName: 'Test',
            lastName: 'Pharmacist',
            role: 'pharmaist'
        },
d: true
    })
}));

// Test wrappent
const TestWrapper = ({ children }: { children: Reae }) => {
    const queryClient = new QueryClient({
        defaultOptions: {
         ,
            mutations:
        }
    });

    return (
        <QueryProvider clienient}>
            <BrowserRouter>
                {children}
            </>
>
    );
};


    co
        {
            _id: 'patient-1',
            firstName: 'John',
            lastName: 'Doe',
',
            dob: '1980-01-01',
            pho78'
        }
    ];

    const mockInterventions = [
        {
            _id: 'intervention-1',
',
            category: 'drug_therapy_problem',
            priority: 'high',
s',
            issueDescription: 'Patient experiencing side effects',
,
            identi
            identifiedDate: '2024-12-01T10:00:00Z',
            patient: mockPatients[0]
     }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        

        vi.mocked(patientService.getPatients).mockResvedValue({
            data: mockPatients,
         {
            e: 1,
                limit: 100,
                total: 1,
1,
                hasNext: false,
                hasPrev: false
            }
        });

({
            data: ns,
            pagination: {
                page: 1,
      

                pages: 1,
                hasNext: false,
                hasPrev: false
            }


({
            totalInterv,
            activeIn
            completed
            overdueInterventions: 2,
            successRa.5,
            averageResolutionTime: 3.2,
            totalCo00,
            categoryDistribution: [],
            priorityDistrib
            monthlyTrends: []
        });
});

    describe('Complete Intervention Creation () => {
        it('should create intervention successfully', async ()
            const user = userEvent.setup();

            // Mock successful creation
            vi.mocked(clinicalInter
                _id: 'intervention-
                interventionNumber: 'CI-202,
                category: 'drug_therapy_problem',
                priority: 'high',
                status: 'identified',
                issueDescript test',
                patientId: 'patient-1',
                identifiedBy: 'user-1'


      
            const mockOnCancel = vi.fn();

            render(
                <TestWrapper>
>
                </TestWrapper>
            );

            // Wait for patients to load
(() => {
                expect(patieed();
            });


            await u
            await user.sele');
            await user.selectOptions(screen.getByLabelTeigh');
            await user.te(
                screen.gettion/i),
                'Patient experiencing significant side imen'
            );

            // Submit the form
            const submitButton = screen.getB
            await user.click(submitButton);

            // Verify service was called
            await waitF{
With({
                    patientId: 'patient-1',
                   blem',
                  
                    issueDescription: 'Patient experiencing significant side 
                    strategies: []
                });
 });

            // Verify success callback was called
            expect(mockO
 });

        it('should hand => {
            const user = userEvent.setup();

            rend

                    <InterventionForm>
                </TestWrapper>
            );

           elds
         
            await user.click(submitButton);

rors
          => {
                expect(screen.getByText(/patient is required/i)).toBeInTheDocument();
            });


            lled();
        });
    });

    describe('Das => {
     
            const 

          render(
                <TestWrapper>
                    <>
                </TestWrappe>
            );

            await waitFor(() => {
                expect(screen.getByText('Clinical Interventionst();
);

            /r
            const statusFilter = screen.getByLabelText(/status/i);
            fireEvent.change(stat' } });

   > {
                expect(clinicalInterventionSh(
            
                  d'
     })
                );
            });
        });

        it('should handl
            const user = userEvent.setu();

            render(
                <TestWrapper>
                    <ClinicalInterventionDashboard />
                </TestWrapper>


            await waitFor(() => {
                expect(scre


            // Perform search
            const searchInput = screen.getBytions/i);
            await user.type(searchInput,

            // Sebounced)
            await wa{
                expect(clinicalInterventionService.getInterventioh(
                    expeg({
                fects'
  })
                );
            }, { timeout: 1000 });
        });
    });

    describe('Error Handling W
        it('should handle network errors gracefully', async () => {
            // Mock network error
            vi
      or')
  ;

          
                <TestWrapper>
                    <ClinicalIn
                </TestWrapper>
            );

            /message
            await waitFor(() => {
                expect(screen.getment();
            });
        });

       {
            c

            // Mock service to r
            vi.mocked(dValue(
                new Error('Server error: Failed ton')
            );

           render(
                <TestWrapper>
                    <InterventionForm onSuccess={vi.fn()} onCancel={vi.fn() />
                </Te
     );

            // Fill and submit form
            await user.selectOp-1');

            await uigh');
            await us
                screen.getByLabelText(/issue description/i),
                'Test interventiscription'
          

          ion/i });
            aw

            // Should show errorsage
            await waitFor(() => {
                expect(screen.ge;
            });
        });
    });

    describe('Accessibility Workflow', () => {
        it('should support keyboard nav> {


            render(
            r>
  d />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByText('Clinical
            });

            // Tab through interactive ele

            const firstFocusableElement = document.act
            expect(firstFocusableElement).toBeInTheDocument();

            ;
            const secon
            expect(secondFocu);
        });

        it('should provide proper AR() => {
            render(
                <TestWrapper>
                    <ClinicalInterventionDa
           pper>
            );

            await waitFor(() => {
           t();
   ;

            // Check for properes
);
            expecent();
        });
    });
});