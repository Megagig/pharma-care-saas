"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const noteController_1 = require("../controllers/noteController");
const auth_1 = require("../middlewares/auth");
const workspaceContext_1 = require("../middlewares/workspaceContext");
const fileUploadService_1 = require("../services/fileUploadService");
const auditLogging_1 = require("../middlewares/auditLogging");
const clinicalNoteRBAC_1 = __importDefault(require("../middlewares/clinicalNoteRBAC"));
const cacheMiddleware_1 = require("../middlewares/cacheMiddleware");
const router = express_1.default.Router();
router.use((req, res, next) => {
    console.log(`
========== NOTE ROUTE DEBUG ==========
Request URL: ${req.originalUrl}
Request method: ${req.method}
Request params: ${JSON.stringify(req.params)}
Note ID from params: ${req.params.id}
Path: ${req.path}
========== END DEBUG ==========
  `);
    next();
});
router.use(auth_1.auth);
router.use(workspaceContext_1.loadWorkspaceContext);
router.use(workspaceContext_1.requireWorkspaceContext);
router.use((0, auditLogging_1.auditMiddleware)({
    action: 'CLINICAL_NOTE_ROUTE_ACCESS',
    category: 'data_access',
}));
router
    .route('/')
    .get(clinicalNoteRBAC_1.default.canReadClinicalNote, clinicalNoteRBAC_1.default.enforceTenancyIsolation, (0, auditLogging_1.auditMiddleware)({ action: 'LIST_CLINICAL_NOTES', category: 'data_access' }), cacheMiddleware_1.clinicalNotesCacheMiddleware, noteController_1.getNotes)
    .post(clinicalNoteRBAC_1.default.canCreateClinicalNote, clinicalNoteRBAC_1.default.validatePatientAccess, (0, auditLogging_1.auditMiddleware)({
    action: 'CREATE_CLINICAL_NOTE',
    category: 'data_access',
}), noteController_1.createNote);
router.get('/search', clinicalNoteRBAC_1.default.canReadClinicalNote, clinicalNoteRBAC_1.default.enforceTenancyIsolation, (0, auditLogging_1.auditMiddleware)({
    action: 'SEARCH_CLINICAL_NOTES',
    category: 'data_access',
    severity: 'medium',
}), cacheMiddleware_1.searchCacheMiddleware, noteController_1.searchNotes);
router.get('/filter', clinicalNoteRBAC_1.default.canReadClinicalNote, clinicalNoteRBAC_1.default.enforceTenancyIsolation, (0, auditLogging_1.auditMiddleware)({ action: 'FILTER_CLINICAL_NOTES', category: 'data_access' }), noteController_1.getNotesWithFilters);
router.get('/statistics', clinicalNoteRBAC_1.default.canReadClinicalNote, clinicalNoteRBAC_1.default.enforceTenancyIsolation, (0, auditLogging_1.auditMiddleware)({ action: 'VIEW_NOTE_STATISTICS', category: 'data_access' }), noteController_1.getNoteStatistics);
router.post('/bulk/update', clinicalNoteRBAC_1.default.canUpdateClinicalNote, clinicalNoteRBAC_1.default.validateBulkNoteAccess, (0, auditLogging_1.auditMiddleware)({
    action: 'BULK_UPDATE_NOTES',
    category: 'data_access',
    severity: 'high',
}), noteController_1.bulkUpdateNotes);
router.post('/bulk/delete', clinicalNoteRBAC_1.default.canDeleteClinicalNote, clinicalNoteRBAC_1.default.validateBulkNoteAccess, (0, auditLogging_1.auditMiddleware)({
    action: 'BULK_DELETE_NOTES',
    category: 'data_access',
    severity: 'critical',
}), noteController_1.bulkDeleteNotes);
router.get('/patient/:patientId', clinicalNoteRBAC_1.default.canReadClinicalNote, clinicalNoteRBAC_1.default.validatePatientAccess, clinicalNoteRBAC_1.default.enforceTenancyIsolation, (0, auditLogging_1.auditMiddleware)({ action: 'VIEW_PATIENT_NOTES', category: 'data_access' }), noteController_1.getPatientNotes);
router.post('/:id/attachments', clinicalNoteRBAC_1.default.canUpdateClinicalNote, clinicalNoteRBAC_1.default.validateNoteAccess, clinicalNoteRBAC_1.default.canModifyNote, fileUploadService_1.uploadMiddleware.array('files', 5), (0, auditLogging_1.auditMiddleware)({
    action: 'UPLOAD_NOTE_ATTACHMENT',
    category: 'data_access',
}), noteController_1.uploadAttachment);
router.delete('/:id/attachments/:attachmentId', clinicalNoteRBAC_1.default.canUpdateClinicalNote, clinicalNoteRBAC_1.default.validateNoteAccess, clinicalNoteRBAC_1.default.canModifyNote, (0, auditLogging_1.auditMiddleware)({
    action: 'DELETE_NOTE_ATTACHMENT',
    category: 'data_access',
}), noteController_1.deleteAttachment);
router.get('/:id/attachments/:attachmentId/download', clinicalNoteRBAC_1.default.canReadClinicalNote, clinicalNoteRBAC_1.default.validateNoteAccess, clinicalNoteRBAC_1.default.logNoteAccess, (0, auditLogging_1.auditMiddleware)({
    action: 'DOWNLOAD_NOTE_ATTACHMENT',
    category: 'data_access',
}), noteController_1.downloadAttachment);
router
    .route('/:id')
    .get(clinicalNoteRBAC_1.default.canReadClinicalNote, clinicalNoteRBAC_1.default.validateNoteAccess, clinicalNoteRBAC_1.default.logNoteAccess, (0, auditLogging_1.auditMiddleware)({ action: 'VIEW_CLINICAL_NOTE', category: 'data_access' }), noteController_1.getNote)
    .put(clinicalNoteRBAC_1.default.canUpdateClinicalNote, clinicalNoteRBAC_1.default.validateNoteAccess, clinicalNoteRBAC_1.default.canModifyNote, (0, auditLogging_1.auditMiddleware)({
    action: 'UPDATE_CLINICAL_NOTE',
    category: 'data_access',
}), noteController_1.updateNote)
    .delete(clinicalNoteRBAC_1.default.canDeleteClinicalNote, clinicalNoteRBAC_1.default.validateNoteAccess, clinicalNoteRBAC_1.default.canModifyNote, (0, auditLogging_1.auditMiddleware)({
    action: 'DELETE_CLINICAL_NOTE',
    category: 'data_access',
    severity: 'critical',
}), noteController_1.deleteNote);
exports.default = router;
//# sourceMappingURL=noteRoutes.js.map