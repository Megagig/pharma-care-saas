import 'express';

declare global {
    namespace Express {
        interface Request {
            user?: {
                id?: string;
                _id?: string;
                workplaceId?: string;
                // Add other user properties as needed
            };
            sessionId?: string;
        }
    }
}