"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPatientNotes = exports.deleteNote = exports.updateNote = exports.createNote = exports.getNote = exports.getNotes = void 0;
const ClinicalNote_1 = __importDefault(require("../models/ClinicalNote"));
const getNotes = async (req, res) => {
    try {
        const { page = 1, limit = 10, type, priority } = req.query;
        const query = { pharmacist: req.user.id };
        if (type)
            query.type = type;
        if (priority)
            query.priority = priority;
        const notes = await ClinicalNote_1.default.find(query)
            .limit(Number(limit) * 1)
            .skip((Number(page) - 1) * Number(limit))
            .populate('patient', 'firstName lastName')
            .sort({ createdAt: -1 });
        const total = await ClinicalNote_1.default.countDocuments(query);
        res.json({
            notes,
            totalPages: Math.ceil(total / Number(limit)),
            currentPage: Number(page),
            total
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.getNotes = getNotes;
const getNote = async (req, res) => {
    try {
        const note = await ClinicalNote_1.default.findOne({
            _id: req.params.id,
            pharmacist: req.user.id
        }).populate('patient medications');
        if (!note) {
            res.status(404).json({ message: 'Clinical note not found' });
            return;
        }
        res.json({ note });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.getNote = getNote;
const createNote = async (req, res) => {
    try {
        const note = await ClinicalNote_1.default.create({
            ...req.body,
            pharmacist: req.user.id
        });
        res.status(201).json({ note });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.createNote = createNote;
const updateNote = async (req, res) => {
    try {
        const note = await ClinicalNote_1.default.findOneAndUpdate({ _id: req.params.id, pharmacist: req.user.id }, req.body, { new: true, runValidators: true });
        if (!note) {
            res.status(404).json({ message: 'Clinical note not found' });
            return;
        }
        res.json({ note });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.updateNote = updateNote;
const deleteNote = async (req, res) => {
    try {
        const note = await ClinicalNote_1.default.findOneAndDelete({
            _id: req.params.id,
            pharmacist: req.user.id
        });
        if (!note) {
            res.status(404).json({ message: 'Clinical note not found' });
            return;
        }
        res.json({ message: 'Clinical note deleted successfully' });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.deleteNote = deleteNote;
const getPatientNotes = async (req, res) => {
    try {
        const notes = await ClinicalNote_1.default.find({
            patient: req.params.patientId,
            pharmacist: req.user.id
        }).sort({ createdAt: -1 });
        res.json({ notes });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.getPatientNotes = getPatientNotes;
//# sourceMappingURL=noteController.js.map