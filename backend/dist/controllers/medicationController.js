"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkInteractions = exports.getPatientMedications = exports.deleteMedication = exports.updateMedication = exports.createMedication = exports.getMedication = exports.getMedications = void 0;
const Medication_1 = __importDefault(require("../models/Medication"));
const getMedications = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, patient } = req.query;
        const query = { pharmacist: req.user.id };
        if (status)
            query.status = status;
        if (patient)
            query.patient = patient;
        const medications = await Medication_1.default.find(query)
            .limit(Number(limit) * 1)
            .skip((Number(page) - 1) * Number(limit))
            .populate('patient', 'firstName lastName')
            .sort({ createdAt: -1 });
        const total = await Medication_1.default.countDocuments(query);
        res.json({
            medications,
            totalPages: Math.ceil(total / Number(limit)),
            currentPage: Number(page),
            total
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.getMedications = getMedications;
const getMedication = async (req, res) => {
    try {
        const medication = await Medication_1.default.findOne({
            _id: req.params.id,
            pharmacist: req.user.id
        }).populate('patient');
        if (!medication) {
            res.status(404).json({ message: 'Medication not found' });
            return;
        }
        res.json({ medication });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.getMedication = getMedication;
const createMedication = async (req, res) => {
    try {
        const medication = await Medication_1.default.create({
            ...req.body,
            pharmacist: req.user.id
        });
        res.status(201).json({ medication });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.createMedication = createMedication;
const updateMedication = async (req, res) => {
    try {
        const medication = await Medication_1.default.findOneAndUpdate({ _id: req.params.id, pharmacist: req.user.id }, req.body, { new: true, runValidators: true });
        if (!medication) {
            res.status(404).json({ message: 'Medication not found' });
            return;
        }
        res.json({ medication });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.updateMedication = updateMedication;
const deleteMedication = async (req, res) => {
    try {
        const medication = await Medication_1.default.findOneAndDelete({
            _id: req.params.id,
            pharmacist: req.user.id
        });
        if (!medication) {
            res.status(404).json({ message: 'Medication not found' });
            return;
        }
        res.json({ message: 'Medication deleted successfully' });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.deleteMedication = deleteMedication;
const getPatientMedications = async (req, res) => {
    try {
        const medications = await Medication_1.default.find({
            patient: req.params.patientId,
            pharmacist: req.user.id
        }).sort({ createdAt: -1 });
        res.json({ medications });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.getPatientMedications = getPatientMedications;
const checkInteractions = async (req, res) => {
    try {
        const { medicationIds } = req.body;
        const medications = await Medication_1.default.find({
            _id: { $in: medicationIds },
            pharmacist: req.user.id
        });
        const interactions = [];
        for (let i = 0; i < medications.length; i++) {
            for (let j = i + 1; j < medications.length; j++) {
                const med1 = medications[i];
                const med2 = medications[j];
                if (med1 && med2 && med1.interactions) {
                    const hasInteraction = med1.interactions.some(interaction => interaction.interactingDrug === med2.drugName);
                    if (hasInteraction) {
                        interactions.push({
                            medication1: med1.drugName,
                            medication2: med2.drugName,
                            severity: 'moderate',
                            description: 'Potential drug interaction detected'
                        });
                    }
                }
            }
        }
        res.json({ interactions });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.checkInteractions = checkInteractions;
//# sourceMappingURL=medicationController.js.map