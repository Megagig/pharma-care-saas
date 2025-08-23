import express from 'express';
import {
  getMedications,
  getMedication,
  createMedication,
  updateMedication,
  deleteMedication,
  getPatientMedications,
  checkInteractions
} from '../controllers/medicationController';
import { auth } from '../middlewares/auth';

const router = express.Router();

router.use(auth); // All medication routes require authentication

router.route('/')
  .get(getMedications)
  .post(createMedication);

router.get('/patient/:patientId', getPatientMedications);
router.post('/interactions', checkInteractions);

router.route('/:id')
  .get(getMedication)
  .put(updateMedication)
  .delete(deleteMedication);

export default router;