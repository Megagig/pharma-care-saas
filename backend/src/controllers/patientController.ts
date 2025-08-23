import { Request, Response } from 'express';
import Patient from '../models/Patient';

interface AuthRequest extends Request {
  user?: any;
}

export const getPatients = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const query: any = { pharmacist: req.user.id };

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }

    const patients = await Patient.find(query)
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit))
      .populate('medications')
      .sort({ createdAt: -1 });

    const total = await Patient.countDocuments(query);

    res.json({
      patients,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      total
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getPatient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const patient = await Patient.findOne({
      _id: req.params.id,
      pharmacist: req.user.id
    }).populate(['medications', 'clinicalNotes']);

    if (!patient) {
      res.status(404).json({ message: 'Patient not found' });
      return;
    }

    res.json({ patient });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const createPatient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const patient = await Patient.create({
      ...req.body,
      pharmacist: req.user.id
    });
    res.status(201).json({ patient });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updatePatient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const patient = await Patient.findOneAndUpdate(
      { _id: req.params.id, pharmacist: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!patient) {
      res.status(404).json({ message: 'Patient not found' });
      return;
    }

    res.json({ patient });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deletePatient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const patient = await Patient.findOneAndDelete({
      _id: req.params.id,
      pharmacist: req.user.id
    });

    if (!patient) {
      res.status(404).json({ message: 'Patient not found' });
      return;
    }

    res.json({ message: 'Patient deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const searchPatients = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { q } = req.query;
    const patients = await Patient.find({
      pharmacist: req.user.id,
      $or: [
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
        { 'contactInfo.phone': { $regex: q, $options: 'i' } }
      ]
    }).limit(10);

    res.json({ patients });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};