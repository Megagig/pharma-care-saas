import express from 'express';
import {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
  searchPatients
} from '../controllers/patientController';
import { auth } from '../middlewares/auth';

const router = express.Router();

router.use(auth); // All patient routes require authentication

router.route('/')
  .get(getPatients)
  .post(createPatient);

router.get('/search', searchPatients);

router.route('/:id')
  .get(getPatient)
  .put(updatePatient)
  .delete(deletePatient);

export default router;