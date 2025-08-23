import { Request, Response, NextFunction } from 'express';

interface CustomError extends Error {
  statusCode?: number;
  code?: number;
  errors?: any;
}

const errorHandler = (err: CustomError, req: Request, res: Response, next: NextFunction): void => {
  console.error(err.stack);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    res.status(404).json({ message });
    return;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    res.status(400).json({ message });
    return;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val: any) => val.message).join(', ');
    res.status(400).json({ message });
    return;
  }

  res.status(err.statusCode || 500).json({
    message: err.message || 'Server Error'
  });
};

export default errorHandler;