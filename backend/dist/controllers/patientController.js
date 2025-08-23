"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchPatients = exports.deletePatient = exports.updatePatient = exports.createPatient = exports.getPatient = exports.getPatients = void 0;
const Patient_1 = __importDefault(require("../models/Patient"));
const getPatients = async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        const query = { pharmacist: req.user.id };
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } }
            ];
        }
        const patients = await Patient_1.default.find(query)
            .limit(Number(limit) * 1)
            .skip((Number(page) - 1) * Number(limit))
            .populate('medications')
            .sort({ createdAt: -1 });
        const total = await Patient_1.default.countDocuments(query);
        res.json({
            patients,
            totalPages: Math.ceil(total / Number(limit)),
            currentPage: Number(page),
            total
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.getPatients = getPatients;
const getPatient = async (req, res) => {
    try {
        const patient = await Patient_1.default.findOne({
            _id: req.params.id,
            pharmacist: req.user.id
        }).populate(['medications', 'clinicalNotes']);
        if (!patient) {
            res.status(404).json({ message: 'Patient not found' });
            return;
        }
        res.json({ patient });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.getPatient = getPatient;
const createPatient = async (req, res) => {
    try {
        const patient = await Patient_1.default.create({
            ...req.body,
            pharmacist: req.user.id
        });
        res.status(201).json({ patient });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.createPatient = createPatient;
const updatePatient = async (req, res) => {
    try {
        const patient = await Patient_1.default.findOneAndUpdate({ _id: req.params.id, pharmacist: req.user.id }, req.body, { new: true, runValidators: true });
        if (!patient) {
            res.status(404).json({ message: 'Patient not found' });
            return;
        }
        res.json({ patient });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.updatePatient = updatePatient;
const deletePatient = async (req, res) => {
    try {
        const patient = await Patient_1.default.findOneAndDelete({
            _id: req.params.id,
            pharmacist: req.user.id
        });
        if (!patient) {
            res.status(404).json({ message: 'Patient not found' });
            return;
        }
        res.json({ message: 'Patient deleted successfully' });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.deletePatient = deletePatient;
const searchPatients = async (req, res) => {
    try {
        const { q } = req.query;
        const patients = await Patient_1.default.find({
            pharmacist: req.user.id,
            $or: [
                { firstName: { $regex: q, $options: 'i' } },
                { lastName: { $regex: q, $options: 'i' } },
                { 'contactInfo.phone': { $regex: q, $options: 'i' } }
            ]
        }).limit(10);
        res.json({ patients });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.searchPatients = searchPatients;
//# sourceMappingURL=patientController.js.map