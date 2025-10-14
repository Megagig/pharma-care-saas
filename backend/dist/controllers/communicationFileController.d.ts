import { Response } from "express";
import { AuthenticatedRequest } from "../types/auth";
export declare class CommunicationFileController {
    static uploadFile(req: AuthenticatedRequest, res: Response): Promise<void>;
    static downloadFile(req: AuthenticatedRequest, res: Response): Promise<void>;
    static deleteFile(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getFileMetadata(req: AuthenticatedRequest, res: Response): Promise<void>;
    static listConversationFiles(req: AuthenticatedRequest, res: Response): Promise<void>;
}
export default CommunicationFileController;
//# sourceMappingURL=communicationFileController.d.ts.map