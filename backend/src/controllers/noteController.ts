import { Request, Response } from 'express';
import ClinicalNote from '../models/ClinicalNote';
import Patient from '../models/Patient';

interface AuthRequest extends Request {
  user?: any;
}

export const getNotes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, type, priority } = req.query;
    const query: any = { pharmacist: req.user.id };

    if (type) query.type = type;
    if (priority) query.priority = priority;

    const notes = await ClinicalNote.find(query)
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit))
      .populate('patient', 'firstName lastName')
      .sort({ createdAt: -1 });

    const total = await ClinicalNote.countDocuments(query);

    res.json({
      notes,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      total
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getNote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const note = await ClinicalNote.findOne({
      _id: req.params.id,
      pharmacist: req.user.id
    }).populate('patient medications');

    if (!note) {
      res.status(404).json({ message: 'Clinical note not found' });
      return;
    }

    res.json({ note });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const createNote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const note = await ClinicalNote.create({
      ...req.body,
      pharmacist: req.user.id
    });
    res.status(201).json({ note });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateNote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const note = await ClinicalNote.findOneAndUpdate(
      { _id: req.params.id, pharmacist: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!note) {
      res.status(404).json({ message: 'Clinical note not found' });
      return;
    }

    res.json({ note });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteNote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const note = await ClinicalNote.findOneAndDelete({
      _id: req.params.id,
      pharmacist: req.user.id
    });

    if (!note) {
      res.status(404).json({ message: 'Clinical note not found' });
      return;
    }

    res.json({ message: 'Clinical note deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getPatientNotes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notes = await ClinicalNote.find({
      patient: req.params.patientId,
      pharmacist: req.user.id
    }).sort({ createdAt: -1 });

    res.json({ notes });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};