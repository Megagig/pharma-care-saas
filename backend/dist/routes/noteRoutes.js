"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const noteController_1 = require("../controllers/noteController");
const auth_1 = require("../middlewares/auth");
const router = express_1.default.Router();
router.use(auth_1.auth);
router.route('/')
    .get(noteController_1.getNotes)
    .post(noteController_1.createNote);
router.get('/patient/:patientId', noteController_1.getPatientNotes);
router.route('/:id')
    .get(noteController_1.getNote)
    .put(noteController_1.updateNote)
    .delete(noteController_1.deleteNote);
exports.default = router;
//# sourceMappingURL=noteRoutes.js.map