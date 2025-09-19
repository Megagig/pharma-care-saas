"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MTRAuditService = exports.DrugInteractionService = exports.MTRWorkflowService = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
const MedicationTherapyReview_1 = __importDefault(require("../models/MedicationTherapyReview"));
const DrugTherapyProblem_1 = __importDefault(require("../models/DrugTherapyProblem"));
const MTRIntervention_1 = __importDefault(require("../models/MTRIntervention"));
const MTRFollowUp_1 = __importDefault(require("../models/MTRFollowUp"));
const Patient_1 = __importDefault(require("../models/Patient"));
const responseHelpers_1 = require("../utils/responseHelpers");
class MTRWorkflowService {
    static getWorkflowSteps() {
        return this.WORKFLOW_STEPS;
    }
    static getNextStep(currentSteps) {
        for (const step of this.WORKFLOW_STEPS) {
            if (!currentSteps[step.name]?.completed) {
                return step.name;
            }
        }
        return null;
    }
    static async validateStep(stepName, session, data) {
        const step = this.WORKFLOW_STEPS.find(s => s.name === stepName);
        if (!step) {
            return {
                isValid: false,
                errors: [`Invalid step name: ${stepName}`],
                warnings: [],
                canProceed: false
            };
        }
        const result = {
            isValid: true,
            errors: [],
            warnings: [],
            canProceed: true
        };
        for (const dependency of step.dependencies) {
            if (!session.steps[dependency]?.completed) {
                result.errors.push(`Dependency not met: ${dependency} must be completed first`);
                result.isValid = false;
                result.canProceed = false;
            }
        }
        switch (stepName) {
            case 'patientSelection':
                await this.validatePatientSelection(session, result);
                break;
            case 'medicationHistory':
                await this.validateMedicationHistory(session, result);
                break;
            case 'therapyAssessment':
                await this.validateTherapyAssessment(session, result);
                break;
            case 'planDevelopment':
                await this.validatePlanDevelopment(session, result);
                break;
            case 'interventions':
                await this.validateInterventions(session, result);
                break;
            case 'followUp':
                await this.validateFollowUp(session, result);
                break;
        }
        return result;
    }
    static async validatePatientSelection(session, result) {
        const patient = await Patient_1.default.findById(session.patientId);
        if (!patient) {
            result.errors.push('Patient not found');
            result.isValid = false;
            result.canProceed = false;
        }
        if (!session.patientConsent) {
            result.errors.push('Patient consent is required');
            result.isValid = false;
            result.canProceed = false;
        }
        if (!session.confidentialityAgreed) {
            result.errors.push('Confidentiality agreement is required');
            result.isValid = false;
            result.canProceed = false;
        }
        const activeSessions = await MedicationTherapyReview_1.default.countDocuments({
            patientId: session.patientId,
            status: { $in: ['in_progress', 'on_hold'] },
            _id: { $ne: session._id }
        });
        if (activeSessions > 0) {
            result.warnings.push('Patient has other active MTR sessions');
        }
    }
    static async validateMedicationHistory(session, result) {
        if (!session.medications || session.medications.length === 0) {
            result.errors.push('At least one medication must be recorded');
            result.isValid = false;
            result.canProceed = false;
        }
        for (const [index, medication] of session.medications.entries()) {
            if (!medication.drugName?.trim()) {
                result.errors.push(`Medication ${index + 1}: Drug name is required`);
                result.isValid = false;
            }
            if (!medication.indication?.trim()) {
                result.errors.push(`Medication ${index + 1}: Indication is required`);
                result.isValid = false;
            }
            if (!medication.instructions?.dose?.trim()) {
                result.errors.push(`Medication ${index + 1}: Dose is required`);
                result.isValid = false;
            }
            if (!medication.instructions?.frequency?.trim()) {
                result.errors.push(`Medication ${index + 1}: Frequency is required`);
                result.isValid = false;
            }
        }
        const drugNames = session.medications.map(m => m.drugName.toLowerCase());
        const duplicates = drugNames.filter((name, index) => drugNames.indexOf(name) !== index);
        if (duplicates.length > 0) {
            result.warnings.push(`Potential duplicate medications detected: ${duplicates.join(', ')}`);
        }
    }
    static async validateTherapyAssessment(session, result) {
        if (!session.steps.therapyAssessment?.data?.interactionsChecked) {
            result.warnings.push('Drug interactions should be checked');
        }
        const problemCount = await DrugTherapyProblem_1.default.countDocuments({
            reviewId: session._id,
            isDeleted: { $ne: true }
        });
        if (problemCount === 0 && !session.steps.therapyAssessment?.data?.noProblemsConfirmed) {
            result.warnings.push('No drug therapy problems identified - please confirm this is correct');
        }
    }
    static async validatePlanDevelopment(session, result) {
        if (!session.plan) {
            result.errors.push('Therapy plan must be created');
            result.isValid = false;
            result.canProceed = false;
            return;
        }
        const problemCount = await DrugTherapyProblem_1.default.countDocuments({
            reviewId: session._id,
            isDeleted: { $ne: true }
        });
        if (problemCount > 0 && (!session.plan.recommendations || session.plan.recommendations.length === 0)) {
            result.errors.push('Plan must include recommendations for identified problems');
            result.isValid = false;
        }
        if (session.plan.recommendations) {
            for (const [index, recommendation] of session.plan.recommendations.entries()) {
                if (!recommendation.rationale?.trim()) {
                    result.errors.push(`Recommendation ${index + 1}: Rationale is required`);
                    result.isValid = false;
                }
                if (!recommendation.expectedOutcome?.trim()) {
                    result.errors.push(`Recommendation ${index + 1}: Expected outcome is required`);
                    result.isValid = false;
                }
            }
        }
    }
    static async validateInterventions(session, result) {
        const interventionCount = await MTRIntervention_1.default.countDocuments({
            reviewId: session._id,
            isDeleted: { $ne: true }
        });
        if (interventionCount === 0 && session.plan?.recommendations && session.plan.recommendations.length > 0) {
            result.warnings.push('No interventions recorded for therapy plan recommendations');
        }
    }
    static async validateFollowUp(session, result) {
        const followUpCount = await MTRFollowUp_1.default.countDocuments({
            reviewId: session._id,
            isDeleted: { $ne: true }
        });
        const interventionCount = await MTRIntervention_1.default.countDocuments({
            reviewId: session._id,
            followUpRequired: true,
            isDeleted: { $ne: true }
        });
        if (interventionCount > 0 && followUpCount === 0) {
            result.warnings.push('Some interventions require follow-up but none scheduled');
        }
    }
    static async canCompleteWorkflow(session) {
        const result = {
            isValid: true,
            errors: [],
            warnings: [],
            canProceed: true
        };
        for (const step of this.WORKFLOW_STEPS) {
            if (step.required && !session.steps[step.name]?.completed) {
                result.errors.push(`Required step not completed: ${step.title}`);
                result.isValid = false;
                result.canProceed = false;
            }
        }
        if (!session.plan) {
            result.errors.push('Therapy plan is required for completion');
            result.isValid = false;
            result.canProceed = false;
        }
        return result;
    }
}
exports.MTRWorkflowService = MTRWorkflowService;
MTRWorkflowService.WORKFLOW_STEPS = [
    {
        name: 'patientSelection',
        title: 'Patient Selection',
        description: 'Select and verify patient for MTR',
        required: true,
        dependencies: [],
        validationRules: ['patientExists', 'patientConsent', 'confidentialityAgreed']
    },
    {
        name: 'medicationHistory',
        title: 'Medication History Collection',
        description: 'Collect comprehensive medication history',
        required: true,
        dependencies: ['patientSelection'],
        validationRules: ['hasMedications', 'medicationDetailsComplete']
    },
    {
        name: 'therapyAssessment',
        title: 'Therapy Assessment',
        description: 'Assess therapy for drug-related problems',
        required: true,
        dependencies: ['medicationHistory'],
        validationRules: ['interactionsChecked', 'problemsIdentified']
    },
    {
        name: 'planDevelopment',
        title: 'Plan Development',
        description: 'Develop therapy optimization plan',
        required: true,
        dependencies: ['therapyAssessment'],
        validationRules: ['planCreated', 'recommendationsProvided']
    },
    {
        name: 'interventions',
        title: 'Interventions & Documentation',
        description: 'Record interventions and outcomes',
        required: true,
        dependencies: ['planDevelopment'],
        validationRules: ['interventionsRecorded']
    },
    {
        name: 'followUp',
        title: 'Follow-Up & Monitoring',
        description: 'Schedule follow-up and monitoring',
        required: false,
        dependencies: ['interventions'],
        validationRules: ['followUpScheduled']
    }
];
class DrugInteractionService {
    static async checkInteractions(medications) {
        const result = {
            hasInteractions: false,
            interactions: [],
            duplicateTherapies: [],
            contraindications: [],
            severity: 'none'
        };
        if (!medications || medications.length < 2) {
            return result;
        }
        const mockInteractions = await this.getMockInteractions();
        const mockDuplicates = await this.getMockDuplicateTherapies();
        const mockContraindications = await this.getMockContraindications();
        for (let i = 0; i < medications.length; i++) {
            for (let j = i + 1; j < medications.length; j++) {
                const drug1 = medications[i]?.drugName?.toLowerCase();
                const drug2 = medications[j]?.drugName?.toLowerCase();
                if (!drug1 || !drug2)
                    continue;
                const interaction = mockInteractions.find(int => (int.drug1.toLowerCase() === drug1 && int.drug2.toLowerCase() === drug2) ||
                    (int.drug1.toLowerCase() === drug2 && int.drug2.toLowerCase() === drug1));
                if (interaction) {
                    result.interactions.push(interaction);
                    result.hasInteractions = true;
                }
            }
        }
        const drugClasses = this.groupMedicationsByClass(medications);
        for (const [therapeuticClass, drugs] of Object.entries(drugClasses)) {
            if (drugs.length > 1) {
                const duplicate = mockDuplicates.find(dup => dup.therapeuticClass.toLowerCase() === therapeuticClass.toLowerCase());
                if (duplicate) {
                    result.duplicateTherapies.push({
                        ...duplicate,
                        medications: drugs.map(d => d.drugName)
                    });
                    result.hasInteractions = true;
                }
            }
        }
        for (const medication of medications) {
            const contraindication = mockContraindications.find(contra => contra.medication.toLowerCase() === medication.drugName.toLowerCase());
            if (contraindication) {
                result.contraindications.push(contraindication);
                result.hasInteractions = true;
            }
        }
        result.severity = this.calculateOverallSeverity(result);
        return result;
    }
    static async getMockInteractions() {
        return [
            {
                drug1: 'Warfarin',
                drug2: 'Aspirin',
                severity: 'major',
                mechanism: 'Additive anticoagulant effects',
                clinicalEffect: 'Increased risk of bleeding',
                management: 'Monitor INR closely, consider dose adjustment',
                references: ['Lexicomp Drug Interactions']
            },
            {
                drug1: 'Metformin',
                drug2: 'Contrast Media',
                severity: 'major',
                mechanism: 'Increased risk of lactic acidosis',
                clinicalEffect: 'Potential kidney damage and lactic acidosis',
                management: 'Discontinue metformin 48 hours before contrast procedure',
                references: ['FDA Drug Safety Communication']
            },
            {
                drug1: 'Simvastatin',
                drug2: 'Clarithromycin',
                severity: 'major',
                mechanism: 'CYP3A4 inhibition',
                clinicalEffect: 'Increased risk of myopathy and rhabdomyolysis',
                management: 'Avoid combination or reduce simvastatin dose',
                references: ['Product Labeling']
            },
            {
                drug1: 'Digoxin',
                drug2: 'Furosemide',
                severity: 'moderate',
                mechanism: 'Hypokalemia increases digoxin toxicity',
                clinicalEffect: 'Increased risk of digoxin toxicity',
                management: 'Monitor potassium levels and digoxin levels',
                references: ['Clinical Pharmacology']
            },
            {
                drug1: 'ACE Inhibitor',
                drug2: 'Potassium Supplement',
                severity: 'moderate',
                mechanism: 'Additive hyperkalemic effects',
                clinicalEffect: 'Risk of hyperkalemia',
                management: 'Monitor serum potassium regularly',
                references: ['Drug Interaction Database']
            }
        ];
    }
    static async getMockDuplicateTherapies() {
        return [
            {
                medications: [],
                therapeuticClass: 'ACE Inhibitors',
                reason: 'Multiple ACE inhibitors prescribed',
                recommendation: 'Use single ACE inhibitor, discontinue duplicates'
            },
            {
                medications: [],
                therapeuticClass: 'Proton Pump Inhibitors',
                reason: 'Multiple PPIs prescribed',
                recommendation: 'Consolidate to single PPI therapy'
            },
            {
                medications: [],
                therapeuticClass: 'Statins',
                reason: 'Multiple statin medications',
                recommendation: 'Use single statin, adjust dose as needed'
            },
            {
                medications: [],
                therapeuticClass: 'Beta Blockers',
                reason: 'Multiple beta blockers prescribed',
                recommendation: 'Consolidate to single beta blocker therapy'
            }
        ];
    }
    static async getMockContraindications() {
        return [
            {
                medication: 'Metformin',
                condition: 'Severe kidney disease (eGFR < 30)',
                severity: 'absolute',
                reason: 'Risk of lactic acidosis',
                alternatives: ['Insulin', 'DPP-4 inhibitors', 'SGLT-2 inhibitors']
            },
            {
                medication: 'NSAIDs',
                condition: 'Heart failure',
                severity: 'relative',
                reason: 'May worsen heart failure and kidney function',
                alternatives: ['Acetaminophen', 'Topical analgesics']
            },
            {
                medication: 'Beta Blockers',
                condition: 'Severe asthma',
                severity: 'absolute',
                reason: 'May cause bronchospasm',
                alternatives: ['Calcium channel blockers', 'ACE inhibitors']
            }
        ];
    }
    static groupMedicationsByClass(medications) {
        const classes = {};
        const classMapping = {
            'lisinopril': 'ACE Inhibitors',
            'enalapril': 'ACE Inhibitors',
            'captopril': 'ACE Inhibitors',
            'omeprazole': 'Proton Pump Inhibitors',
            'lansoprazole': 'Proton Pump Inhibitors',
            'pantoprazole': 'Proton Pump Inhibitors',
            'simvastatin': 'Statins',
            'atorvastatin': 'Statins',
            'rosuvastatin': 'Statins',
            'metoprolol': 'Beta Blockers',
            'propranolol': 'Beta Blockers',
            'atenolol': 'Beta Blockers'
        };
        for (const medication of medications) {
            const drugName = medication.drugName.toLowerCase();
            const therapeuticClass = classMapping[drugName] || 'Other';
            if (!classes[therapeuticClass]) {
                classes[therapeuticClass] = [];
            }
            classes[therapeuticClass].push(medication);
        }
        return classes;
    }
    static calculateOverallSeverity(result) {
        if (!result.hasInteractions)
            return 'none';
        const severities = [
            ...result.interactions.map(i => i.severity),
            ...result.contraindications.map(c => c.severity === 'absolute' ? 'critical' : 'major')
        ];
        if (severities.includes('critical'))
            return 'critical';
        if (severities.includes('major'))
            return 'major';
        if (severities.includes('moderate'))
            return 'moderate';
        return 'minor';
    }
    static async generateProblemsFromInteractions(interactions, reviewId, patientId, workplaceId, identifiedBy) {
        const problems = [];
        for (const interaction of interactions.interactions) {
            const problem = new DrugTherapyProblem_1.default({
                workplaceId,
                patientId,
                reviewId,
                category: 'safety',
                subcategory: 'Drug Interaction',
                type: 'interaction',
                severity: interaction.severity,
                description: `Drug interaction between ${interaction.drug1} and ${interaction.drug2}: ${interaction.clinicalEffect}`,
                clinicalSignificance: `${interaction.mechanism}. ${interaction.management}`,
                affectedMedications: [interaction.drug1, interaction.drug2],
                evidenceLevel: 'definite',
                identifiedBy,
                createdBy: identifiedBy
            });
            problems.push(problem);
        }
        for (const duplicate of interactions.duplicateTherapies) {
            const problem = new DrugTherapyProblem_1.default({
                workplaceId,
                patientId,
                reviewId,
                category: 'indication',
                subcategory: 'Duplicate Therapy',
                type: 'duplication',
                severity: 'moderate',
                description: `Duplicate therapy in ${duplicate.therapeuticClass}: ${duplicate.reason}`,
                clinicalSignificance: duplicate.recommendation,
                affectedMedications: duplicate.medications,
                evidenceLevel: 'definite',
                identifiedBy,
                createdBy: identifiedBy
            });
            problems.push(problem);
        }
        for (const contraindication of interactions.contraindications) {
            const problem = new DrugTherapyProblem_1.default({
                workplaceId,
                patientId,
                reviewId,
                category: 'safety',
                subcategory: 'Contraindication',
                type: 'contraindication',
                severity: contraindication.severity === 'absolute' ? 'critical' : 'major',
                description: `Contraindication: ${contraindication.medication} in patient with ${contraindication.condition}`,
                clinicalSignificance: `${contraindication.reason}. Consider alternatives: ${contraindication.alternatives.join(', ')}`,
                affectedMedications: [contraindication.medication],
                relatedConditions: [contraindication.condition],
                evidenceLevel: 'definite',
                identifiedBy,
                createdBy: identifiedBy
            });
            problems.push(problem);
        }
        return problems;
    }
}
exports.DrugInteractionService = DrugInteractionService;
class MTRAuditService {
    static async logActivity(action, resourceType, resourceId, userId, workplaceId, details, ipAddress, userAgent) {
        const auditEntry = {
            action,
            resourceType,
            resourceId,
            userId,
            workplaceId,
            timestamp: new Date(),
            details,
            ipAddress,
            userAgent
        };
        this.auditLogs.push(auditEntry);
        logger_1.default.info('MTR Audit Log', {
            ...auditEntry,
            service: 'mtr-audit'
        });
    }
    static async getAuditLogs(workplaceId, userId, resourceType, action, startDate, endDate, limit = 100) {
        let filteredLogs = [...this.auditLogs];
        if (workplaceId) {
            filteredLogs = filteredLogs.filter(log => log.workplaceId.equals(workplaceId));
        }
        if (userId) {
            filteredLogs = filteredLogs.filter(log => log.userId.equals(userId));
        }
        if (resourceType) {
            filteredLogs = filteredLogs.filter(log => log.resourceType === resourceType);
        }
        if (action) {
            filteredLogs = filteredLogs.filter(log => log.action === action);
        }
        if (startDate) {
            filteredLogs = filteredLogs.filter(log => log.timestamp >= startDate);
        }
        if (endDate) {
            filteredLogs = filteredLogs.filter(log => log.timestamp <= endDate);
        }
        return filteredLogs
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }
    static async logSessionCreation(sessionId, patientId, userId, workplaceId, sessionData, ipAddress, userAgent) {
        await this.logActivity('MTR_SESSION_CREATED', 'MedicationTherapyReview', sessionId, userId, workplaceId, {
            patientId,
            reviewType: sessionData.reviewType,
            priority: sessionData.priority,
            reviewNumber: sessionData.reviewNumber
        }, ipAddress, userAgent);
    }
    static async logStepCompletion(sessionId, stepName, userId, workplaceId, stepData, ipAddress, userAgent) {
        await this.logActivity('MTR_STEP_COMPLETED', 'MedicationTherapyReview', sessionId, userId, workplaceId, {
            stepName,
            stepData,
            completedAt: new Date()
        }, ipAddress, userAgent);
    }
    static async logProblemIdentification(problemId, sessionId, userId, workplaceId, problemData, ipAddress, userAgent) {
        await this.logActivity('DTP_IDENTIFIED', 'DrugTherapyProblem', problemId, userId, workplaceId, {
            sessionId,
            type: problemData.type,
            severity: problemData.severity,
            category: problemData.category,
            affectedMedications: problemData.affectedMedications
        }, ipAddress, userAgent);
    }
    static async logInterventionRecording(interventionId, sessionId, userId, workplaceId, interventionData, ipAddress, userAgent) {
        await this.logActivity('MTR_INTERVENTION_RECORDED', 'MTRIntervention', interventionId, userId, workplaceId, {
            sessionId,
            type: interventionData.type,
            category: interventionData.category,
            targetAudience: interventionData.targetAudience,
            communicationMethod: interventionData.communicationMethod
        }, ipAddress, userAgent);
    }
    static async logSessionCompletion(sessionId, userId, workplaceId, completionData, ipAddress, userAgent) {
        await this.logActivity('MTR_SESSION_COMPLETED', 'MedicationTherapyReview', sessionId, userId, workplaceId, {
            completedAt: new Date(),
            duration: completionData.duration,
            problemsIdentified: completionData.problemsIdentified,
            interventionsRecorded: completionData.interventionsRecorded,
            followUpsScheduled: completionData.followUpsScheduled
        }, ipAddress, userAgent);
    }
    static async logDataAccess(resourceType, resourceId, userId, workplaceId, accessType, ipAddress, userAgent) {
        await this.logActivity(`DATA_${accessType}`, resourceType, resourceId, userId, workplaceId, {
            accessType,
            accessedAt: new Date()
        }, ipAddress, userAgent);
    }
    static async generateComplianceReport(workplaceId, startDate, endDate) {
        const logs = await this.getAuditLogs(workplaceId, undefined, undefined, undefined, startDate, endDate, 10000);
        const report = {
            period: {
                startDate,
                endDate
            },
            summary: {
                totalActivities: logs.length,
                sessionsCreated: logs.filter(l => l.action === 'MTR_SESSION_CREATED').length,
                sessionsCompleted: logs.filter(l => l.action === 'MTR_SESSION_COMPLETED').length,
                problemsIdentified: logs.filter(l => l.action === 'DTP_IDENTIFIED').length,
                interventionsRecorded: logs.filter(l => l.action === 'MTR_INTERVENTION_RECORDED').length,
                dataAccesses: logs.filter(l => l.action.startsWith('DATA_')).length
            },
            userActivity: this.aggregateUserActivity(logs),
            dailyActivity: this.aggregateDailyActivity(logs, startDate, endDate),
            riskEvents: this.identifyRiskEvents(logs)
        };
        return report;
    }
    static aggregateUserActivity(logs) {
        const userStats = {};
        for (const log of logs) {
            const userId = log.userId.toString();
            if (!userStats[userId]) {
                userStats[userId] = {
                    userId,
                    totalActivities: 0,
                    sessionsCreated: 0,
                    sessionsCompleted: 0,
                    problemsIdentified: 0,
                    interventionsRecorded: 0,
                    lastActivity: log.timestamp
                };
            }
            userStats[userId].totalActivities++;
            switch (log.action) {
                case 'MTR_SESSION_CREATED':
                    userStats[userId].sessionsCreated++;
                    break;
                case 'MTR_SESSION_COMPLETED':
                    userStats[userId].sessionsCompleted++;
                    break;
                case 'DTP_IDENTIFIED':
                    userStats[userId].problemsIdentified++;
                    break;
                case 'MTR_INTERVENTION_RECORDED':
                    userStats[userId].interventionsRecorded++;
                    break;
            }
            if (log.timestamp > userStats[userId].lastActivity) {
                userStats[userId].lastActivity = log.timestamp;
            }
        }
        return Object.values(userStats);
    }
    static aggregateDailyActivity(logs, startDate, endDate) {
        const dailyStats = {};
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dateKey = currentDate.toISOString().split('T')[0];
            if (dateKey) {
                dailyStats[dateKey] = {
                    date: dateKey,
                    totalActivities: 0,
                    sessionsCreated: 0,
                    sessionsCompleted: 0,
                    problemsIdentified: 0,
                    interventionsRecorded: 0
                };
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        for (const log of logs) {
            const dateKey = log.timestamp.toISOString().split('T')[0];
            if (dateKey && dailyStats[dateKey]) {
                dailyStats[dateKey].totalActivities++;
                switch (log.action) {
                    case 'MTR_SESSION_CREATED':
                        dailyStats[dateKey].sessionsCreated++;
                        break;
                    case 'MTR_SESSION_COMPLETED':
                        dailyStats[dateKey].sessionsCompleted++;
                        break;
                    case 'DTP_IDENTIFIED':
                        dailyStats[dateKey].problemsIdentified++;
                        break;
                    case 'MTR_INTERVENTION_RECORDED':
                        dailyStats[dateKey].interventionsRecorded++;
                        break;
                }
            }
        }
        return Object.values(dailyStats);
    }
    static identifyRiskEvents(logs) {
        const riskEvents = [];
        const criticalProblems = logs.filter(l => l.action === 'DTP_IDENTIFIED' && l.details.severity === 'critical');
        for (const problem of criticalProblems) {
            riskEvents.push({
                type: 'CRITICAL_DTP_IDENTIFIED',
                timestamp: problem.timestamp,
                userId: problem.userId,
                details: problem.details,
                riskLevel: 'HIGH'
            });
        }
        const sessionCreations = logs.filter(l => l.action === 'MTR_SESSION_CREATED');
        const sessionCompletions = logs.filter(l => l.action === 'MTR_SESSION_COMPLETED');
        for (const creation of sessionCreations) {
            const completion = sessionCompletions.find(c => c.resourceId === creation.resourceId);
            if (!completion) {
                const daysSinceCreation = Math.floor((Date.now() - creation.timestamp.getTime()) / (1000 * 60 * 60 * 24));
                if (daysSinceCreation > 7) {
                    riskEvents.push({
                        type: 'INCOMPLETE_SESSION',
                        timestamp: creation.timestamp,
                        userId: creation.userId,
                        details: {
                            sessionId: creation.resourceId,
                            daysSinceCreation
                        },
                        riskLevel: 'MEDIUM'
                    });
                }
            }
        }
        return riskEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
}
exports.MTRAuditService = MTRAuditService;
MTRAuditService.auditLogs = [];
class MTRService {
    static async createSession(patientId, pharmacistId, workplaceId, sessionData, context) {
        const patient = await Patient_1.default.findById(patientId);
        if (!patient) {
            throw (0, responseHelpers_1.createNotFoundError)('Patient', patientId.toString());
        }
        const activeSession = await MedicationTherapyReview_1.default.findOne({
            patientId,
            status: { $in: ['in_progress', 'on_hold'] }
        });
        if (activeSession) {
            throw (0, responseHelpers_1.createBusinessRuleError)('Patient already has an active MTR session');
        }
        const reviewNumber = await MedicationTherapyReview_1.default.generateNextReviewNumber(workplaceId);
        const session = new MedicationTherapyReview_1.default({
            workplaceId,
            patientId,
            pharmacistId,
            reviewNumber,
            ...sessionData,
            createdBy: pharmacistId,
            clinicalOutcomes: {
                problemsResolved: 0,
                medicationsOptimized: 0,
                adherenceImproved: false,
                adverseEventsReduced: false,
            }
        });
        await session.save();
        session.markStepComplete('patientSelection', {
            patientId,
            selectedAt: new Date()
        });
        await session.save();
        await MTRAuditService.logSessionCreation(session._id.toString(), patientId.toString(), pharmacistId, workplaceId, sessionData, context?.ipAddress, context?.userAgent);
        return session;
    }
    static async completeStep(sessionId, stepName, stepData, userId, context) {
        const session = await MedicationTherapyReview_1.default.findById(sessionId);
        if (!session) {
            throw (0, responseHelpers_1.createNotFoundError)('MTR Session', sessionId.toString());
        }
        const validation = await MTRWorkflowService.validateStep(stepName, session, stepData);
        if (!validation.canProceed) {
            throw (0, responseHelpers_1.createValidationError)(`Cannot complete step: ${validation.errors.join(', ')}`);
        }
        session.markStepComplete(stepName, stepData);
        session.updatedBy = userId;
        await session.save();
        await MTRAuditService.logStepCompletion(sessionId.toString(), stepName, userId, session.workplaceId, stepData, context?.ipAddress, context?.userAgent);
        return { session, validation };
    }
    static async runInteractionAssessment(sessionId, userId, context) {
        const session = await MedicationTherapyReview_1.default.findById(sessionId);
        if (!session) {
            throw (0, responseHelpers_1.createNotFoundError)('MTR Session', sessionId.toString());
        }
        if (!session.medications || session.medications.length === 0) {
            throw (0, responseHelpers_1.createValidationError)('No medications available for interaction checking');
        }
        const interactions = await DrugInteractionService.checkInteractions(session.medications);
        const problems = await DrugInteractionService.generateProblemsFromInteractions(interactions, session._id, session.patientId, session.workplaceId, userId);
        const savedProblems = [];
        for (const problem of problems) {
            await problem.save();
            savedProblems.push(problem);
            session.problems.push(problem._id);
            await MTRAuditService.logProblemIdentification(problem._id.toString(), sessionId.toString(), userId, session.workplaceId, problem.toObject(), context?.ipAddress, context?.userAgent);
        }
        session.updatedBy = userId;
        await session.save();
        return { interactions, problems: savedProblems };
    }
    static async completeSession(sessionId, userId, context) {
        const session = await MedicationTherapyReview_1.default.findById(sessionId);
        if (!session) {
            throw (0, responseHelpers_1.createNotFoundError)('MTR Session', sessionId.toString());
        }
        const validation = await MTRWorkflowService.canCompleteWorkflow(session);
        if (!validation.canProceed) {
            throw (0, responseHelpers_1.createValidationError)(`Cannot complete session: ${validation.errors.join(', ')}`);
        }
        session.status = 'completed';
        session.completedAt = new Date();
        session.updatedBy = userId;
        await session.save();
        const problemCount = await DrugTherapyProblem_1.default.countDocuments({
            reviewId: sessionId,
            isDeleted: { $ne: true }
        });
        const interventionCount = await MTRIntervention_1.default.countDocuments({
            reviewId: sessionId,
            isDeleted: { $ne: true }
        });
        const followUpCount = await MTRFollowUp_1.default.countDocuments({
            reviewId: sessionId,
            isDeleted: { $ne: true }
        });
        await MTRAuditService.logSessionCompletion(sessionId.toString(), userId, session.workplaceId, {
            duration: session.completedAt.getTime() - session.startedAt.getTime(),
            problemsIdentified: problemCount,
            interventionsRecorded: interventionCount,
            followUpsScheduled: followUpCount
        }, context?.ipAddress, context?.userAgent);
        return session;
    }
}
//# sourceMappingURL=mtrService.js.map