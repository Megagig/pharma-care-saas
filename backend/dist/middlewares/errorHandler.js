"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    if (err instanceof SyntaxError && 'body' in err) {
        res.status(400).json({
            message: 'Invalid JSON format in request body'
        });
        return;
    }
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        res.status(404).json({ message });
        return;
    }
    if (err.code === 11000) {
        const message = 'Duplicate field value entered';
        res.status(400).json({ message });
        return;
    }
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map((val) => val.message).join(', ');
        res.status(400).json({ message });
        return;
    }
    res.status(err.statusCode || 500).json({
        message: err.message || 'Server Error'
    });
};
exports.default = errorHandler;
//# sourceMappingURL=errorHandler.js.map