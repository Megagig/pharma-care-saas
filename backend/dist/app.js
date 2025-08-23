"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
const xss_clean_1 = __importDefault(require("xss-clean"));
const hpp_1 = __importDefault(require("hpp"));
const errorHandler_1 = __importDefault(require("./middlewares/errorHandler"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const subscriptionRoutes_1 = __importDefault(require("./routes/subscriptionRoutes"));
const patientRoutes_1 = __importDefault(require("./routes/patientRoutes"));
const noteRoutes_1 = __importDefault(require("./routes/noteRoutes"));
const medicationRoutes_1 = __importDefault(require("./routes/medicationRoutes"));
const paymentRoutes_1 = __importDefault(require("./routes/paymentRoutes"));
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, express_mongo_sanitize_1.default)());
app.use((0, xss_clean_1.default)());
app.use((0, hpp_1.default)());
if (process.env.NODE_ENV === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});
app.use('/api/auth', authRoutes_1.default);
app.use('/api/subscriptions', subscriptionRoutes_1.default);
app.use('/api/patients', patientRoutes_1.default);
app.use('/api/notes', noteRoutes_1.default);
app.use('/api/medications', medicationRoutes_1.default);
app.use('/api/payments', paymentRoutes_1.default);
app.all('*', (req, res) => {
    res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});
app.use(errorHandler_1.default);
exports.default = app;
//# sourceMappingURL=app.js.map