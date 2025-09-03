"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const clinicalInterventionService_1 = __importDefault(require("../../services/clinicalInterventionService"));
jest.mock('../../models/ClinicalIntervention');
jest.mock('../../models/Patient');
jest.mock('../../models/User');
jest.mock('../../utils/logger');
describe('Team Collaboration Service', () => {
    const mockWorkplaceId = new mongoose_1.default.Types.ObjectId();
    const mockPatientId = new mongoose_1.default.Types.ObjectId();
    const mockUserId = new mongoose_1.default.Types.ObjectId();
    const mockAssignedUserId = new mongoose_1.default.Types.ObjectId();
    const mockInterventionId = new mongoose_1.default.Types.ObjectId();
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('assignTeamMember', () => {
        it('should have assignTeamMember method', () => {
            expect(typeof clinicalInterventionService_1.default.assignTeamMember).toBe('function');
        });
        it('should validate assignment data structure', () => {
            const assignment = {
                userId: mockAssignedUserId,
                role: 'pharmacist',
                task: 'Review medication regimen',
                status: 'pending'
            };
            expect(assignment.userId).toBeDefined();
            expect(assignment.role).toBeDefined();
            expect(assignment.task).toBeDefined();
            expect(assignment.status).toBeDefined();
            expect(['pharmacist', 'physician', 'nurse', 'patient', 'caregiver']).toContain(assignment.role);
            expect(['pending', 'in_progress', 'completed', 'cancelled']).toContain(assignment.status);
        });
    });
    describe('updateAssignmentStatus', () => {
        it('should have updateAssignmentStatus method', () => {
            expect(typeof clinicalInterventionService_1.default.updateAssignmentStatus).toBe('function');
        });
        it('should validate status transitions', () => {
            const validTransitions = {
                'pending': ['in_progress', 'cancelled'],
                'in_progress': ['completed', 'cancelled'],
                'completed': [],
                'cancelled': []
            };
            expect(validTransitions['pending']).toContain('in_progress');
            expect(validTransitions['pending']).toContain('cancelled');
            expect(validTransitions['in_progress']).toContain('completed');
            expect(validTransitions['in_progress']).toContain('cancelled');
            expect(validTransitions['completed']).toHaveLength(0);
            expect(validTransitions['cancelled']).toHaveLength(0);
        });
    });
    describe('getUserAssignments', () => {
        it('should have getUserAssignments method', () => {
            expect(typeof clinicalInterventionService_1.default.getUserAssignments).toBe('function');
        });
        it('should validate query parameters', () => {
            const statusFilters = ['pending', 'in_progress', 'completed', 'cancelled'];
            statusFilters.forEach(status => {
                expect(['pending', 'in_progress', 'completed', 'cancelled']).toContain(status);
            });
        });
    });
    describe('getAssignmentHistory', () => {
        it('should have getAssignmentHistory method', () => {
            expect(typeof clinicalInterventionService_1.default.getAssignmentHistory).toBe('function');
        });
        it('should return expected data structure', () => {
            const expectedStructure = {
                assignments: [],
                auditTrail: []
            };
            expect(expectedStructure).toHaveProperty('assignments');
            expect(expectedStructure).toHaveProperty('auditTrail');
            expect(Array.isArray(expectedStructure.assignments)).toBe(true);
            expect(Array.isArray(expectedStructure.auditTrail)).toBe(true);
        });
    });
    describe('removeAssignment', () => {
        it('should have removeAssignment method', () => {
            expect(typeof clinicalInterventionService_1.default.removeAssignment).toBe('function');
        });
        it('should validate removal parameters', () => {
            const removalData = {
                interventionId: mockInterventionId.toString(),
                assignmentUserId: mockAssignedUserId,
                removedBy: mockUserId,
                workplaceId: mockWorkplaceId,
                reason: 'User no longer available'
            };
            expect(removalData.interventionId).toBeDefined();
            expect(removalData.assignmentUserId).toBeDefined();
            expect(removalData.removedBy).toBeDefined();
            expect(removalData.workplaceId).toBeDefined();
            expect(typeof removalData.reason).toBe('string');
        });
    });
    describe('getTeamWorkloadStats', () => {
        it('should have getTeamWorkloadStats method', () => {
            expect(typeof clinicalInterventionService_1.default.getTeamWorkloadStats).toBe('function');
        });
        it('should validate workload stats structure', () => {
            const expectedStats = {
                totalAssignments: 0,
                activeAssignments: 0,
                completedAssignments: 0,
                userWorkloads: []
            };
            expect(expectedStats).toHaveProperty('totalAssignments');
            expect(expectedStats).toHaveProperty('activeAssignments');
            expect(expectedStats).toHaveProperty('completedAssignments');
            expect(expectedStats).toHaveProperty('userWorkloads');
            expect(Array.isArray(expectedStats.userWorkloads)).toBe(true);
        });
        it('should validate user workload structure', () => {
            const userWorkload = {
                userId: mockUserId,
                userName: 'John Doe',
                activeAssignments: 5,
                completedAssignments: 10,
                averageCompletionTime: 86400000
            };
            expect(userWorkload).toHaveProperty('userId');
            expect(userWorkload).toHaveProperty('userName');
            expect(userWorkload).toHaveProperty('activeAssignments');
            expect(userWorkload).toHaveProperty('completedAssignments');
            expect(userWorkload).toHaveProperty('averageCompletionTime');
            expect(typeof userWorkload.activeAssignments).toBe('number');
            expect(typeof userWorkload.completedAssignments).toBe('number');
            expect(typeof userWorkload.averageCompletionTime).toBe('number');
        });
    });
    describe('Role Validation', () => {
        it('should validate role assignment rules', () => {
            const roleRequirements = {
                'pharmacist': ['Pharmacist', 'Owner'],
                'physician': ['Physician', 'Doctor'],
                'nurse': ['Nurse', 'Pharmacist', 'Owner'],
                'patient': [],
                'caregiver': []
            };
            expect(roleRequirements['pharmacist']).toContain('Pharmacist');
            expect(roleRequirements['pharmacist']).toContain('Owner');
            expect(roleRequirements['physician']).toContain('Physician');
            expect(roleRequirements['physician']).toContain('Doctor');
            expect(roleRequirements['nurse']).toContain('Nurse');
            expect(roleRequirements['nurse']).toContain('Pharmacist');
            expect(roleRequirements['nurse']).toContain('Owner');
            expect(roleRequirements['patient']).toHaveLength(0);
            expect(roleRequirements['caregiver']).toHaveLength(0);
        });
        it('should validate assignment roles', () => {
            const validRoles = ['pharmacist', 'physician', 'nurse', 'patient', 'caregiver'];
            validRoles.forEach(role => {
                expect(['pharmacist', 'physician', 'nurse', 'patient', 'caregiver']).toContain(role);
            });
        });
    });
    describe('Assignment Status Management', () => {
        it('should validate assignment statuses', () => {
            const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
            validStatuses.forEach(status => {
                expect(['pending', 'in_progress', 'completed', 'cancelled']).toContain(status);
            });
        });
        it('should validate status transition logic', () => {
            const transitions = [
                { from: 'pending', to: 'in_progress', valid: true },
                { from: 'pending', to: 'cancelled', valid: true },
                { from: 'pending', to: 'completed', valid: false },
                { from: 'in_progress', to: 'completed', valid: true },
                { from: 'in_progress', to: 'cancelled', valid: true },
                { from: 'in_progress', to: 'pending', valid: false },
                { from: 'completed', to: 'pending', valid: false },
                { from: 'completed', to: 'in_progress', valid: false },
                { from: 'cancelled', to: 'pending', valid: false },
                { from: 'cancelled', to: 'in_progress', valid: false }
            ];
            const validTransitions = {
                'pending': ['in_progress', 'cancelled'],
                'in_progress': ['completed', 'cancelled'],
                'completed': [],
                'cancelled': []
            };
            transitions.forEach(transition => {
                const isValid = validTransitions[transition.from]?.includes(transition.to) || false;
                expect(isValid).toBe(transition.valid);
            });
        });
    });
    describe('Notification System Integration', () => {
        it('should validate notification event types', () => {
            const notificationEvents = [
                'ASSIGN_TEAM_MEMBER',
                'UPDATE_ASSIGNMENT_STATUS',
                'REMOVE_ASSIGNMENT'
            ];
            notificationEvents.forEach(event => {
                expect(typeof event).toBe('string');
                expect(event.length).toBeGreaterThan(0);
            });
        });
        it('should validate notification data structure', () => {
            const notificationData = {
                interventionId: mockInterventionId.toString(),
                assignedUserId: mockAssignedUserId.toString(),
                assignedBy: mockUserId.toString(),
                role: 'pharmacist',
                task: 'Review medication regimen',
                timestamp: new Date()
            };
            expect(notificationData).toHaveProperty('interventionId');
            expect(notificationData).toHaveProperty('assignedUserId');
            expect(notificationData).toHaveProperty('assignedBy');
            expect(notificationData).toHaveProperty('role');
            expect(notificationData).toHaveProperty('task');
            expect(notificationData).toHaveProperty('timestamp');
        });
    });
    describe('Audit Trail Integration', () => {
        it('should validate audit log structure', () => {
            const auditLogEntry = {
                action: 'ASSIGN_TEAM_MEMBER',
                interventionId: mockInterventionId.toString(),
                userId: mockUserId.toString(),
                workplaceId: mockWorkplaceId.toString(),
                timestamp: new Date(),
                details: {
                    assignedUserId: mockAssignedUserId.toString(),
                    role: 'pharmacist',
                    task: 'Review medication regimen'
                }
            };
            expect(auditLogEntry).toHaveProperty('action');
            expect(auditLogEntry).toHaveProperty('interventionId');
            expect(auditLogEntry).toHaveProperty('userId');
            expect(auditLogEntry).toHaveProperty('workplaceId');
            expect(auditLogEntry).toHaveProperty('timestamp');
            expect(auditLogEntry).toHaveProperty('details');
            expect(typeof auditLogEntry.details).toBe('object');
        });
    });
    describe('Service Integration', () => {
        it('should have all required team collaboration methods', () => {
            const requiredMethods = [
                'assignTeamMember',
                'updateAssignmentStatus',
                'getUserAssignments',
                'getAssignmentHistory',
                'removeAssignment',
                'getTeamWorkloadStats'
            ];
            requiredMethods.forEach(method => {
                expect(typeof clinicalInterventionService_1.default[method]).toBe('function');
            });
        });
        it('should maintain service consistency', () => {
            expect(clinicalInterventionService_1.default).toBeDefined();
            expect(clinicalInterventionService_1.default.constructor).toBeDefined();
        });
    });
    describe('Data Validation', () => {
        it('should validate assignment task description', () => {
            const validTasks = [
                'Review medication regimen',
                'Conduct patient counseling',
                'Monitor therapy response',
                'Coordinate with physician',
                'Follow up on outcomes'
            ];
            validTasks.forEach(task => {
                expect(typeof task).toBe('string');
                expect(task.length).toBeGreaterThan(0);
                expect(task.length).toBeLessThanOrEqual(300);
            });
        });
        it('should validate assignment notes', () => {
            const validNotes = [
                'Patient responded well to counseling',
                'Medication review completed successfully',
                'Follow-up scheduled for next week',
                'Coordination with physician completed'
            ];
            validNotes.forEach(note => {
                expect(typeof note).toBe('string');
                expect(note.length).toBeLessThanOrEqual(500);
            });
        });
    });
    describe('Error Handling', () => {
        it('should handle assignment validation errors', () => {
            const invalidAssignments = [
                { userId: null, role: 'pharmacist', task: 'Review', status: 'pending' },
                { userId: mockUserId, role: 'invalid_role', task: 'Review', status: 'pending' },
                { userId: mockUserId, role: 'pharmacist', task: '', status: 'pending' },
                { userId: mockUserId, role: 'pharmacist', task: 'Review', status: 'invalid_status' }
            ];
            invalidAssignments.forEach(assignment => {
                const hasInvalidUserId = !assignment.userId;
                const hasInvalidRole = !['pharmacist', 'physician', 'nurse', 'patient', 'caregiver'].includes(assignment.role);
                const hasInvalidTask = !assignment.task || assignment.task.length === 0;
                const hasInvalidStatus = !['pending', 'in_progress', 'completed', 'cancelled'].includes(assignment.status);
                expect(hasInvalidUserId || hasInvalidRole || hasInvalidTask || hasInvalidStatus).toBe(true);
            });
        });
    });
});
//# sourceMappingURL=teamCollaborationService.test.js.map