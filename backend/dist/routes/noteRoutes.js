"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const noteController_1 = require("../controllers/noteController");
const auth_1 = require("../middlewares/auth");
const fileUploadService_1 = require("../services/fileUploadService");
const router = express_1.default.Router();
router.use(auth_1.auth);
router.route('/')
    .get(noteController_1.getNotes)
    .post(noteController_1.createNote);
router.get('/search', noteController_1.searchNotes);
router.get('/filter', noteController_1.getNotesWithFilters);
router.get('/statistics', noteController_1.getNoteStatistics);
router.post('/bulk/update', noteController_1.bulkUpdateNotes);
router.post('/bulk/delete', noteController_1.bulkDeleteNotes);
router.get('/patient/:patientId', noteController_1.getPatientNotes);
router.post('/:id/attachments', fileUploadService_1.uploadMiddleware.array('files', 5), noteController_1.uploadAttachment);
router.delete('/:id/attachments/:attachmentId', noteController_1.deleteAttachment);
router.get('/:id/attachments/:attachmentId/download', noteController_1.downloadAttachment);
router.route('/:id')
    .get(noteController_1.getNote)
    .put(noteController_1.updateNote)
    .delete(noteController_1.deleteNote);
exports.default = router;
//# sourceMappingURL=noteRoutes.js.map