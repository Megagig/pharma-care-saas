"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkplaceService = void 0;
const Workplace_1 = __importDefault(require("../models/Workplace"));
const User_1 = __importDefault(require("../models/User"));
class WorkplaceService {
    async createWorkplace(data) {
        const workplace = new Workplace_1.default({
            ...data,
            verificationStatus: 'verified',
            patientPortalEnabled: true,
            patientPortalSettings: {
                allowSelfRegistration: true,
                requireEmailVerification: true,
                requireAdminApproval: true,
                operatingHours: 'Monday-Friday: 8:00 AM - 5:00 PM',
                services: ['Prescription Refills', 'Medication Consultation', 'Health Screening'],
            },
            teamMembers: [data.ownerId],
        });
        const savedWorkplace = await workplace.save();
        await User_1.default.findByIdAndUpdate(data.ownerId, {
            workplaceId: savedWorkplace._id,
            workplaceRole: 'Owner',
        });
        return savedWorkplace;
    }
    async joinWorkplace(data, session) {
        let workplace = null;
        if (data.inviteCode) {
            workplace = await Workplace_1.default.findOne({ inviteCode: data.inviteCode });
            if (!workplace) {
                throw new Error('Invalid invite code');
            }
        }
        else if (data.workplaceId) {
            workplace = await Workplace_1.default.findById(data.workplaceId);
            if (!workplace) {
                throw new Error('Workplace not found');
            }
        }
        else {
            throw new Error('Either invite code or workplace ID is required');
        }
        const isAlreadyMember = workplace.teamMembers.some((memberId) => memberId.toString() === data.userId.toString());
        if (!isAlreadyMember) {
            workplace.teamMembers.push(data.userId);
            await workplace.save({ session });
        }
        await User_1.default.findByIdAndUpdate(data.userId, {
            workplaceId: workplace._id,
            workplaceRole: data.workplaceRole || 'Staff',
        }, { session });
        return workplace;
    }
    async findByInviteCode(inviteCode) {
        return await Workplace_1.default.findOne({ inviteCode }).populate('ownerId', 'firstName lastName email');
    }
    async regenerateInviteCode(workplaceId) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let newCode = '';
        let isUnique = false;
        while (!isUnique) {
            newCode = '';
            for (let i = 0; i < 6; i++) {
                newCode += characters.charAt(Math.floor(Math.random() * characters.length));
            }
            const existing = await Workplace_1.default.findOne({ inviteCode: newCode });
            if (!existing) {
                isUnique = true;
            }
        }
        await Workplace_1.default.findByIdAndUpdate(workplaceId, { inviteCode: newCode });
        return newCode;
    }
    async getWorkplaceWithTeam(workplaceId) {
        return await Workplace_1.default.findById(workplaceId)
            .populate('ownerId', 'firstName lastName email')
            .populate('teamMembers', 'firstName lastName email role workplaceRole');
    }
    async removeFromWorkplace(workplaceId, userId) {
        await Workplace_1.default.findByIdAndUpdate(workplaceId, {
            $pull: { teamMembers: userId },
        });
        await User_1.default.findByIdAndUpdate(userId, {
            $unset: { workplaceId: 1, workplaceRole: 1 },
        });
    }
    async canAccessWorkplaceFeatures(userId) {
        const user = await User_1.default.findById(userId);
        return !!(user?.workplaceId || user?.currentPlanId);
    }
}
exports.WorkplaceService = WorkplaceService;
exports.default = new WorkplaceService();
//# sourceMappingURL=WorkplaceService.js.map