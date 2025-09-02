"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DrugInteractionDB = void 0;
class DrugInteractionDB {
    constructor() {
        this.interactions = new Map();
        this.therapeuticClasses = new Map();
        this.contraindications = new Map();
        this.initializeDatabase();
    }
    initializeDatabase() {
        this.loadTherapeuticClasses();
        this.loadDrugInteractions();
        this.loadContraindications();
    }
    loadTherapeuticClasses() {
        const classes = [
            {
                activeIngredient: 'amlodipine',
                therapeuticClass: 'calcium_channel_blockers',
                mechanism: 'L-type calcium channel blocker',
            },
            {
                activeIngredient: 'nifedipine',
                therapeuticClass: 'calcium_channel_blockers',
                mechanism: 'L-type calcium channel blocker',
            },
            {
                activeIngredient: 'felodipine',
                therapeuticClass: 'calcium_channel_blockers',
                mechanism: 'L-type calcium channel blocker',
            },
            {
                activeIngredient: 'lisinopril',
                therapeuticClass: 'ace_inhibitors',
                mechanism: 'ACE inhibitor',
            },
            {
                activeIngredient: 'enalapril',
                therapeuticClass: 'ace_inhibitors',
                mechanism: 'ACE inhibitor',
            },
            {
                activeIngredient: 'captopril',
                therapeuticClass: 'ace_inhibitors',
                mechanism: 'ACE inhibitor',
            },
            {
                activeIngredient: 'losartan',
                therapeuticClass: 'arb',
                mechanism: 'Angiotensin receptor blocker',
            },
            {
                activeIngredient: 'valsartan',
                therapeuticClass: 'arb',
                mechanism: 'Angiotensin receptor blocker',
            },
            {
                activeIngredient: 'irbesartan',
                therapeuticClass: 'arb',
                mechanism: 'Angiotensin receptor blocker',
            },
            {
                activeIngredient: 'atenolol',
                therapeuticClass: 'beta_blockers',
                mechanism: 'Beta-1 selective blocker',
            },
            {
                activeIngredient: 'propranolol',
                therapeuticClass: 'beta_blockers',
                mechanism: 'Non-selective beta blocker',
            },
            {
                activeIngredient: 'metoprolol',
                therapeuticClass: 'beta_blockers',
                mechanism: 'Beta-1 selective blocker',
            },
            {
                activeIngredient: 'furosemide',
                therapeuticClass: 'loop_diuretics',
                mechanism: 'Loop diuretic',
            },
            {
                activeIngredient: 'hydrochlorothiazide',
                therapeuticClass: 'thiazide_diuretics',
                mechanism: 'Thiazide diuretic',
            },
            {
                activeIngredient: 'spironolactone',
                therapeuticClass: 'potassium_sparing_diuretics',
                mechanism: 'Aldosterone antagonist',
            },
            {
                activeIngredient: 'warfarin',
                therapeuticClass: 'anticoagulants',
                mechanism: 'Vitamin K antagonist',
            },
            {
                activeIngredient: 'heparin',
                therapeuticClass: 'anticoagulants',
                mechanism: 'Antithrombin activator',
            },
            {
                activeIngredient: 'aspirin',
                therapeuticClass: 'antiplatelets',
                mechanism: 'COX-1 inhibitor',
            },
            {
                activeIngredient: 'clopidogrel',
                therapeuticClass: 'antiplatelets',
                mechanism: 'P2Y12 inhibitor',
            },
            {
                activeIngredient: 'metformin',
                therapeuticClass: 'biguanides',
                mechanism: 'Glucose uptake enhancer',
            },
            {
                activeIngredient: 'glipizide',
                therapeuticClass: 'sulfonylureas',
                mechanism: 'K-ATP channel closer',
            },
            {
                activeIngredient: 'glyburide',
                therapeuticClass: 'sulfonylureas',
                mechanism: 'K-ATP channel closer',
            },
            {
                activeIngredient: 'glimepiride',
                therapeuticClass: 'sulfonylureas',
                mechanism: 'K-ATP channel closer',
            },
            {
                activeIngredient: 'insulin',
                therapeuticClass: 'insulin',
                mechanism: 'Insulin receptor agonist',
            },
            {
                activeIngredient: 'atorvastatin',
                therapeuticClass: 'statins',
                mechanism: 'HMG-CoA reductase inhibitor',
            },
            {
                activeIngredient: 'simvastatin',
                therapeuticClass: 'statins',
                mechanism: 'HMG-CoA reductase inhibitor',
            },
            {
                activeIngredient: 'pravastatin',
                therapeuticClass: 'statins',
                mechanism: 'HMG-CoA reductase inhibitor',
            },
            {
                activeIngredient: 'amoxicillin',
                therapeuticClass: 'penicillins',
                mechanism: 'Beta-lactam antibiotic',
            },
            {
                activeIngredient: 'ciprofloxacin',
                therapeuticClass: 'fluoroquinolones',
                mechanism: 'DNA gyrase inhibitor',
            },
            {
                activeIngredient: 'azithromycin',
                therapeuticClass: 'macrolides',
                mechanism: '50S ribosomal subunit inhibitor',
            },
            {
                activeIngredient: 'doxycycline',
                therapeuticClass: 'tetracyclines',
                mechanism: '30S ribosomal subunit inhibitor',
            },
            {
                activeIngredient: 'ibuprofen',
                therapeuticClass: 'nsaids',
                mechanism: 'COX-1/COX-2 inhibitor',
            },
            {
                activeIngredient: 'diclofenac',
                therapeuticClass: 'nsaids',
                mechanism: 'COX-1/COX-2 inhibitor',
            },
            {
                activeIngredient: 'naproxen',
                therapeuticClass: 'nsaids',
                mechanism: 'COX-1/COX-2 inhibitor',
            },
            {
                activeIngredient: 'paracetamol',
                therapeuticClass: 'analgesics',
                mechanism: 'COX-3 inhibitor',
            },
            {
                activeIngredient: 'diazepam',
                therapeuticClass: 'benzodiazepines',
                mechanism: 'GABA-A receptor modulator',
            },
            {
                activeIngredient: 'lorazepam',
                therapeuticClass: 'benzodiazepines',
                mechanism: 'GABA-A receptor modulator',
            },
            {
                activeIngredient: 'phenytoin',
                therapeuticClass: 'anticonvulsants',
                mechanism: 'Sodium channel blocker',
            },
            {
                activeIngredient: 'carbamazepine',
                therapeuticClass: 'anticonvulsants',
                mechanism: 'Sodium channel blocker',
            },
        ];
        classes.forEach((cls) => {
            this.therapeuticClasses.set(cls.activeIngredient.toLowerCase(), cls);
        });
    }
    loadDrugInteractions() {
        const interactions = [
            {
                drug1: 'warfarin',
                drug2: 'aspirin',
                severity: 'critical',
                mechanism: 'Synergistic anticoagulant and antiplatelet effects',
                clinicalEffect: 'Significantly increased bleeding risk',
                recommendation: 'Avoid combination. If necessary, use lowest effective doses with intensive monitoring.',
                monitoringParameters: ['INR', 'CBC', 'Signs of bleeding'],
                alternativeTherapies: [
                    'Consider single agent therapy',
                    'PPI prophylaxis if combination necessary',
                ],
                onsetTime: 'immediate',
                documentation: 'established',
                references: ['Holbrook AM et al. Arch Intern Med 2005'],
            },
            {
                drug1: 'warfarin',
                drug2: 'ciprofloxacin',
                severity: 'major',
                mechanism: 'CYP450 inhibition increases warfarin levels',
                clinicalEffect: 'Increased INR and bleeding risk',
                recommendation: 'Monitor INR closely. Consider dose reduction of warfarin by 25-50%.',
                monitoringParameters: ['INR', 'Signs of bleeding'],
                alternativeTherapies: [
                    'Use alternative antibiotic with less CYP interaction',
                ],
                onsetTime: 'rapid',
                documentation: 'established',
            },
            {
                drug1: 'digoxin',
                drug2: 'furosemide',
                severity: 'major',
                mechanism: 'Furosemide-induced hypokalemia increases digoxin toxicity risk',
                clinicalEffect: 'Increased risk of digoxin toxicity and arrhythmias',
                recommendation: 'Monitor potassium levels and digoxin concentrations regularly.',
                monitoringParameters: [
                    'Serum potassium',
                    'Digoxin level',
                    'ECG',
                    'Renal function',
                ],
                alternativeTherapies: [
                    'Potassium supplementation',
                    'Potassium-sparing diuretic',
                ],
                onsetTime: 'delayed',
                documentation: 'established',
            },
            {
                drug1: 'amlodipine',
                drug2: 'atenolol',
                severity: 'moderate',
                mechanism: 'Additive hypotensive effects',
                clinicalEffect: 'Enhanced blood pressure lowering, possible hypotension',
                recommendation: 'Monitor blood pressure regularly. Start with low doses.',
                monitoringParameters: ['Blood pressure', 'Heart rate'],
                alternativeTherapies: [],
                onsetTime: 'rapid',
                documentation: 'established',
            },
            {
                drug1: 'lisinopril',
                drug2: 'spironolactone',
                severity: 'major',
                mechanism: 'Both drugs increase potassium retention',
                clinicalEffect: 'Risk of hyperkalemia, especially in elderly or with kidney disease',
                recommendation: 'Monitor serum potassium and renal function closely.',
                monitoringParameters: ['Serum potassium', 'Creatinine', 'BUN'],
                alternativeTherapies: ['Consider thiazide diuretic instead'],
                onsetTime: 'delayed',
                documentation: 'established',
            },
            {
                drug1: 'glipizide',
                drug2: 'ciprofloxacin',
                severity: 'moderate',
                mechanism: 'Ciprofloxacin may enhance hypoglycemic effect',
                clinicalEffect: 'Increased risk of hypoglycemia',
                recommendation: 'Monitor blood glucose closely. Educate patient on hypoglycemia signs.',
                monitoringParameters: ['Blood glucose', 'HbA1c'],
                alternativeTherapies: [
                    'Use alternative antibiotic',
                    'Temporary dose reduction',
                ],
                onsetTime: 'rapid',
                documentation: 'probable',
            },
            {
                drug1: 'simvastatin',
                drug2: 'amlodipine',
                severity: 'moderate',
                mechanism: 'CYP3A4 inhibition by amlodipine increases simvastatin levels',
                clinicalEffect: 'Increased risk of myopathy and rhabdomyolysis',
                recommendation: 'Limit simvastatin dose to 20mg daily when used with amlodipine.',
                monitoringParameters: ['CK levels', 'Liver enzymes', 'Muscle symptoms'],
                alternativeTherapies: [
                    'Use pravastatin or atorvastatin',
                    'Reduce simvastatin dose',
                ],
                onsetTime: 'delayed',
                documentation: 'established',
            },
            {
                drug1: 'ibuprofen',
                drug2: 'lisinopril',
                severity: 'moderate',
                mechanism: 'NSAIDs antagonize ACE inhibitor effects',
                clinicalEffect: 'Reduced antihypertensive effect, increased kidney injury risk',
                recommendation: 'Monitor blood pressure and renal function. Use lowest effective NSAID dose.',
                monitoringParameters: ['Blood pressure', 'Creatinine', 'BUN'],
                alternativeTherapies: ['Use paracetamol for pain', 'Topical NSAID'],
                onsetTime: 'rapid',
                documentation: 'established',
            },
            {
                drug1: 'diclofenac',
                drug2: 'warfarin',
                severity: 'major',
                mechanism: 'NSAIDs increase bleeding risk and may displace warfarin from protein binding',
                clinicalEffect: 'Significantly increased bleeding risk',
                recommendation: 'Avoid combination. If necessary, intensive INR monitoring required.',
                monitoringParameters: ['INR', 'CBC', 'Signs of bleeding'],
                alternativeTherapies: ['Use paracetamol', 'Topical preparations'],
                onsetTime: 'rapid',
                documentation: 'established',
            },
            {
                drug1: 'azithromycin',
                drug2: 'warfarin',
                severity: 'moderate',
                mechanism: 'Macrolide antibiotics may enhance warfarin effect',
                clinicalEffect: 'Increased INR and bleeding risk',
                recommendation: 'Monitor INR more frequently during and after antibiotic course.',
                monitoringParameters: ['INR', 'Signs of bleeding'],
                alternativeTherapies: [
                    'Use alternative antibiotic with less interaction',
                ],
                onsetTime: 'rapid',
                documentation: 'probable',
            },
        ];
        interactions.forEach((interaction) => {
            const key1 = `${interaction.drug1.toLowerCase()}-${interaction.drug2.toLowerCase()}`;
            const key2 = `${interaction.drug2.toLowerCase()}-${interaction.drug1.toLowerCase()}`;
            if (!this.interactions.has(key1)) {
                this.interactions.set(key1, []);
            }
            if (!this.interactions.has(key2)) {
                this.interactions.set(key2, []);
            }
            this.interactions.get(key1).push(interaction);
            this.interactions.get(key2).push(interaction);
        });
    }
    loadContraindications() {
        const contraindications = [
            {
                drug: 'atenolol',
                condition: 'asthma',
                type: 'respiratory_contraindication',
                severity: 'absolute',
                reason: 'Beta-blockers can cause bronchospasm in asthmatic patients',
            },
            {
                drug: 'propranolol',
                condition: 'asthma',
                type: 'respiratory_contraindication',
                severity: 'absolute',
                reason: 'Non-selective beta-blockers strongly contraindicated in asthma',
            },
            {
                drug: 'atenolol',
                condition: 'heart_block',
                type: 'cardiac_contraindication',
                severity: 'absolute',
                reason: 'Beta-blockers can worsen conduction abnormalities',
            },
            {
                drug: 'lisinopril',
                condition: 'pregnancy',
                type: 'teratogenic_contraindication',
                severity: 'absolute',
                reason: 'ACE inhibitors cause fetal kidney damage and oligohydramnios',
            },
            {
                drug: 'enalapril',
                condition: 'angioedema_history',
                type: 'allergic_contraindication',
                severity: 'absolute',
                reason: 'Previous ACE inhibitor-induced angioedema is absolute contraindication',
            },
            {
                drug: 'metformin',
                condition: 'renal_failure',
                type: 'metabolic_contraindication',
                severity: 'absolute',
                reason: 'Risk of lactic acidosis in renal impairment',
            },
            {
                drug: 'metformin',
                condition: 'heart_failure',
                type: 'metabolic_contraindication',
                severity: 'relative',
                reason: 'Increased risk of lactic acidosis in severe heart failure',
            },
            {
                drug: 'warfarin',
                condition: 'pregnancy',
                type: 'teratogenic_contraindication',
                severity: 'absolute',
                reason: 'Warfarin causes fetal bleeding and teratogenic effects',
            },
            {
                drug: 'warfarin',
                condition: 'gi_bleeding',
                type: 'bleeding_contraindication',
                severity: 'absolute',
                reason: 'Active bleeding is contraindication to anticoagulation',
            },
            {
                drug: 'ibuprofen',
                condition: 'peptic_ulcer',
                type: 'gi_contraindication',
                severity: 'relative',
                reason: 'NSAIDs increase risk of ulcer complications',
            },
            {
                drug: 'diclofenac',
                condition: 'severe_heart_failure',
                type: 'cardiovascular_contraindication',
                severity: 'absolute',
                reason: 'NSAIDs can worsen heart failure and increase cardiovascular risk',
            },
        ];
        contraindications.forEach((contra) => {
            const key = contra.drug.toLowerCase();
            if (!this.contraindications.has(key)) {
                this.contraindications.set(key, []);
            }
            this.contraindications.get(key).push(contra);
        });
    }
    async findInteraction(drug1, drug2) {
        const key = `${drug1.toLowerCase()}-${drug2.toLowerCase()}`;
        const interactions = this.interactions.get(key);
        if (interactions && interactions.length > 0) {
            return interactions.sort((a, b) => {
                const severityOrder = { critical: 4, major: 3, moderate: 2, minor: 1 };
                return severityOrder[b.severity] - severityOrder[a.severity];
            })[0];
        }
        return null;
    }
    async getTherapeuticClass(activeIngredient) {
        const classInfo = this.therapeuticClasses.get(activeIngredient.toLowerCase());
        return classInfo ? classInfo.therapeuticClass : 'other';
    }
    async findContraindication(drug, condition) {
        const contraindications = this.contraindications.get(drug.toLowerCase());
        if (contraindications) {
            return (contraindications.find((c) => c.condition.toLowerCase() === condition.toLowerCase()) || null);
        }
        return null;
    }
    async isValidCombination(therapeuticClass, activeIngredients) {
        const validCombinations = new Map([
            ['antihypertensives', ['ace_inhibitors', 'calcium_channel_blockers']],
            ['antihypertensives', ['ace_inhibitors', 'thiazide_diuretics']],
            ['diabetes', ['metformin', 'sulfonylureas']],
            ['cardiovascular', ['beta_blockers', 'ace_inhibitors']],
        ]);
        const classes = activeIngredients
            .map((ingredient) => this.therapeuticClasses.get(ingredient.toLowerCase())
            ?.therapeuticClass)
            .filter(Boolean);
        const uniqueClasses = new Set(classes);
        if (uniqueClasses.size === activeIngredients.length) {
            return true;
        }
        for (const [category, validClassCombos] of validCombinations) {
            if (classes.every((cls) => validClassCombos.includes(cls))) {
                return true;
            }
        }
        return false;
    }
    async addInteraction(interaction) {
        const key1 = `${interaction.drug1.toLowerCase()}-${interaction.drug2.toLowerCase()}`;
        const key2 = `${interaction.drug2.toLowerCase()}-${interaction.drug1.toLowerCase()}`;
        if (!this.interactions.has(key1)) {
            this.interactions.set(key1, []);
        }
        if (!this.interactions.has(key2)) {
            this.interactions.set(key2, []);
        }
        this.interactions.get(key1).push(interaction);
        this.interactions.get(key2).push(interaction);
    }
    async getAllInteractions() {
        const allInteractions = [];
        for (const interactions of this.interactions.values()) {
            allInteractions.push(...interactions);
        }
        return Array.from(new Map(allInteractions.map((i) => [`${i.drug1}-${i.drug2}`, i])).values());
    }
    async getInteractionsByDrug(drug) {
        const interactions = [];
        for (const [key, interactionList] of this.interactions) {
            if (key.includes(drug.toLowerCase())) {
                interactions.push(...interactionList);
            }
        }
        return interactions;
    }
}
exports.DrugInteractionDB = DrugInteractionDB;
//# sourceMappingURL=drugInteractionDatabase.js.map