import express from 'express';
import {
  getNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
  getPatientNotes
} from '../controllers/noteController';
import { auth } from '../middlewares/auth';

const router = express.Router();

router.use(auth); // All note routes require authentication

router.route('/')
  .get(getNotes)
  .post(createNote);

router.get('/patient/:patientId', getPatientNotes);

router.route('/:id')
  .get(getNote)
  .put(updateNote)
  .delete(deleteNote);

export default router;