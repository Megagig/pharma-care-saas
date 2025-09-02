"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.drugInteractionService = exports.DrugInteractionService = void 0;
const logger_1 = require("../utils/logger");
const drugInteractionDatabase_1 = require("../data/drugInteractionDatabase");
class DrugInteractionService {
    constructor() {
        this.interactionDB = new drugInteractionDatabase_1.DrugInteractionDB();
    }
    async checkDrugInteractions(medications) {
        try {
            const interactions = [];
            for (let i = 0; i < medications.length; i++) {
                for (let j = i + 1; j < medications.length; j++) {
                    const interaction = await this.checkPairwiseInteraction(medications[i], medications[j]);
                    if (interaction) {
                        interactions.push(interaction);
                    }
                }
            }
            interactions.sort((a, b) => {
                const severityOrder = { critical: 4, major: 3, moderate: 2, minor: 1 };
                return severityOrder[b.severity] - severityOrder[a.severity];
            });
            logger_1.logger.info(`Checked ${medications.length} medications, found ${interactions.length} interactions`);
            return interactions;
        }
        catch (error) {
            logger_1.logger.error('Error checking drug interactions:', error);
            throw error;
        }
    }
    async checkTherapeuticDuplications(medications) {
        try {
            const duplications = [];
            const classGroups = new Map();
            for (const med of medications) {
                const therapeuticClass = await this.getTherapeuticClass(med.activeIngredient);
                if (!classGroups.has(therapeuticClass)) {
                    classGroups.set(therapeuticClass, []);
                }
                classGroups.get(therapeuticClass).push(med);
            }
            for (const [therapeuticClass, drugs] of classGroups) {
                if (drugs.length > 1) {
                    const duplication = await this.evaluateTherapeuticDuplication(therapeuticClass, drugs);
                    if (duplication) {
                        duplications.push(duplication);
                    }
                }
            }
            return duplications;
        }
        catch (error) {
            logger_1.logger.error('Error checking therapeutic duplications:', error);
            throw error;
        }
    }
    async checkContraindications(medications, patientConditions) {
        try {
            const contraindications = [];
            for (const med of medications) {
                for (const condition of patientConditions) {
                    const contraindication = await this.checkDrugConditionContraindication(med, condition);
                    if (contraindication) {
                        contraindications.push(contraindication);
                    }
                }
            }
            return contraindications;
        }
        catch (error) {
            logger_1.logger.error('Error checking contraindications:', error);
            throw error;
        }
    }
    async getInteractionReport(medications, patientConditions = []) {
        try {
            const [interactions, duplications, contraindications] = await Promise.all([
                this.checkDrugInteractions(medications),
                this.checkTherapeuticDuplications(medications),
                this.checkContraindications(medications, patientConditions),
            ]);
            const criticalIssues = [
                ...interactions.filter((i) => i.severity === 'critical'),
                ...duplications.filter((d) => d.severity === 'major'),
                ...contraindications.filter((c) => c.severity === 'absolute'),
            ];
            const summary = {
                totalMedications: medications.length,
                totalInteractions: interactions.length,
                criticalInteractions: interactions.filter((i) => i.severity === 'critical').length,
                majorInteractions: interactions.filter((i) => i.severity === 'major')
                    .length,
                therapeuticDuplications: duplications.length,
                contraindications: contraindications.length,
                overallRiskLevel: this.calculateOverallRisk(interactions, duplications, contraindications),
            };
            return {
                summary,
                interactions,
                therapeuticDuplications: duplications,
                contraindications,
                criticalIssues,
                recommendations: this.generateRecommendations(interactions, duplications, contraindications),
            };
        }
        catch (error) {
            logger_1.logger.error('Error generating interaction report:', error);
            throw error;
        }
    }
    async checkPairwiseInteraction(drug1, drug2) {
        const interaction = await this.interactionDB.findInteraction(drug1.activeIngredient, drug2.activeIngredient);
        if (interaction) {
            return {
                drug1: drug1.drugName,
                drug2: drug2.drugName,
                severity: interaction.severity,
                mechanism: interaction.mechanism,
                clinicalEffect: interaction.clinicalEffect,
                recommendation: interaction.recommendation,
                monitoringParameters: interaction.monitoringParameters,
                alternativeTherapies: interaction.alternativeTherapies,
                onsetTime: interaction.onsetTime,
                documentation: interaction.documentation,
                references: interaction.references,
            };
        }
        return null;
    }
    async getTherapeuticClass(activeIngredient) {
        return await this.interactionDB.getTherapeuticClass(activeIngredient);
    }
    async evaluateTherapeuticDuplication(therapeuticClass, drugs) {
        const validCombination = await this.interactionDB.isValidCombination(therapeuticClass, drugs.map((d) => d.activeIngredient));
        if (validCombination) {
            return null;
        }
        return {
            drugs: drugs.map((d) => d.drugName),
            therapeuticClass,
            severity: this.calculateDuplicationSeverity(therapeuticClass),
            recommendation: this.getDuplicationRecommendation(therapeuticClass, drugs),
            clinicalRisk: this.getDuplicationRisk(therapeuticClass),
        };
    }
    async checkDrugConditionContraindication(medication, condition) {
        const contraindication = await this.interactionDB.findContraindication(medication.activeIngredient, condition);
        if (contraindication) {
            return {
                drug: medication.drugName,
                contraindication: contraindication.type,
                condition,
                severity: contraindication.severity,
                reason: contraindication.reason,
            };
        }
        return null;
    }
    calculateDuplicationSeverity(therapeuticClass) {
        const highRiskClasses = [
            'anticoagulants',
            'antiarrhythmics',
            'cns_depressants',
            'cardiovascular',
        ];
        if (highRiskClasses.includes(therapeuticClass.toLowerCase())) {
            return 'major';
        }
        return 'moderate';
    }
    getDuplicationRecommendation(therapeuticClass, drugs) {
        const drugNames = drugs.map((d) => d.drugName).join(', ');
        return (`Multiple ${therapeuticClass} agents detected (${drugNames}). ` +
            `Consider consolidating therapy or verifying clinical indication for combination.`);
    }
    getDuplicationRisk(therapeuticClass) {
        const riskProfiles = {
            anticoagulants: 'Increased bleeding risk',
            antihypertensives: 'Risk of hypotension and electrolyte imbalance',
            cns_depressants: 'Increased sedation and respiratory depression risk',
            nsaids: 'Increased GI bleeding and kidney injury risk',
            default: 'Potential for additive effects and adverse reactions',
        };
        return riskProfiles[therapeuticClass.toLowerCase()] || riskProfiles.default;
    }
    calculateOverallRisk(interactions, duplications, contraindications) {
        const criticalCount = interactions.filter((i) => i.severity === 'critical').length +
            contraindications.filter((c) => c.severity === 'absolute').length;
        const majorCount = interactions.filter((i) => i.severity === 'major').length +
            duplications.filter((d) => d.severity === 'major').length;
        if (criticalCount > 0)
            return 'critical';
        if (majorCount >= 2)
            return 'high';
        if (majorCount >= 1 || interactions.length >= 3)
            return 'moderate';
        return 'low';
    }
    generateRecommendations(interactions, duplications, contraindications) {
        const recommendations = [];
        const criticalInteractions = interactions.filter((i) => i.severity === 'critical');
        if (criticalInteractions.length > 0) {
            recommendations.push('⚠️ CRITICAL: Immediate review required for critical drug interactions. ' +
                'Consider discontinuation or alternative therapy.');
        }
        const absoluteContraindications = contraindications.filter((c) => c.severity === 'absolute');
        if (absoluteContraindications.length > 0) {
            recommendations.push('🚫 CONTRAINDICATION: Absolute contraindications detected. ' +
                'Discontinue contraindicated medications immediately.');
        }
        const majorInteractions = interactions.filter((i) => i.severity === 'major');
        if (majorInteractions.length > 0) {
            recommendations.push('⚡ MAJOR INTERACTIONS: Enhanced monitoring and possible dose adjustments required.');
        }
        if (duplications.length > 0) {
            recommendations.push('🔄 THERAPEUTIC DUPLICATIONS: Review for redundant therapy. ' +
                'Consider consolidating or verifying clinical need.');
        }
        if (interactions.length > 5) {
            recommendations.push('📊 COMPLEX REGIMEN: Consider medication reconciliation and simplification.');
        }
        return recommendations;
    }
}
exports.DrugInteractionService = DrugInteractionService;
exports.drugInteractionService = new DrugInteractionService();
//# sourceMappingURL=drugInteractionService.js.map