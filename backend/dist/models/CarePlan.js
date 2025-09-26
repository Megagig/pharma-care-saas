"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const tenancyGuard_1 = require("../utils/tenancyGuard");
const carePlanSchema = new mongoose_1.Schema({
    workplaceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Workplace',
        required: true,
        index: true,
    },
    patientId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
        index: true,
    },
    visitId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Visit',
        index: true,
    },
    goals: {
        type: [String],
        required: [true, 'At least one goal is required'],
        validate: [
            {
                validator: function (goals) {
                    return goals && goals.length > 0 && goals.length <= 10;
                },
                message: 'Must have 1-10 goals',
            },
            {
                validator: function (goals) {
                    return goals.every((goal) => goal.trim().length >= 5 && goal.trim().length <= 200);
                },
                message: 'Each goal must be 5-200 characters long',
            },
        ],
    },
    objectives: {
        type: [String],
        required: [true, 'At least one objective is required'],
        validate: [
            {
                validator: function (objectives) {
                    return (objectives && objectives.length > 0 && objectives.length <= 15);
                },
                message: 'Must have 1-15 objectives',
            },
            {
                validator: function (objectives) {
                    return objectives.every((obj) => obj.trim().length >= 5 && obj.trim().length <= 300);
                },
                message: 'Each objective must be 5-300 characters long',
            },
        ],
    },
    followUpDate: {
        type: Date,
        validate: {
            validator: function (value) {
                if (value) {
                    const today = new Date();
                    const maxDate = new Date();
                    maxDate.setMonth(maxDate.getMonth() + 12);
                    return value > today && value <= maxDate;
                }
                return true;
            },
            message: 'Follow-up date must be in the future but within 12 months',
        },
        index: true,
    },
    planQuality: {
        type: String,
        enum: ['adequate', 'needsReview'],
        required: true,
        default: 'adequate',
        index: true,
    },
    dtpSummary: {
        type: String,
        enum: ['resolved', 'unresolved'],
        index: true,
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
(0, tenancyGuard_1.addAuditFields)(carePlanSchema);
carePlanSchema.plugin(tenancyGuard_1.tenancyGuardPlugin, { pharmacyIdField: 'workplaceId' });
carePlanSchema.index({ workplaceId: 1, patientId: 1, createdAt: -1 });
carePlanSchema.index({ workplaceId: 1, visitId: 1 });
carePlanSchema.index({ workplaceId: 1, planQuality: 1 });
carePlanSchema.index({ workplaceId: 1, dtpSummary: 1 });
carePlanSchema.index({ workplaceId: 1, isDeleted: 1 });
carePlanSchema.index({ followUpDate: 1 }, { sparse: true });
carePlanSchema.index({ createdAt: -1 });
carePlanSchema.virtual('patient', {
    ref: 'Patient',
    localField: 'patientId',
    foreignField: '_id',
    justOne: true,
});
carePlanSchema.virtual('visit', {
    ref: 'Visit',
    localField: 'visitId',
    foreignField: '_id',
    justOne: true,
});
carePlanSchema.virtual('followUpStatus').get(function () {
    if (!this.followUpDate) {
        return 'no_followup';
    }
    const now = new Date();
    const followUpDate = this.followUpDate;
    if (followUpDate < now) {
        return 'overdue';
    }
    else if (followUpDate <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)) {
        return 'due_soon';
    }
    else {
        return 'scheduled';
    }
});
carePlanSchema.virtual('daysUntilFollowUp').get(function () {
    if (!this.followUpDate) {
        return null;
    }
    const now = new Date();
    const diffTime = this.followUpDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
});
carePlanSchema.virtual('completenessScore').get(function () {
    let score = 0;
    let maxScore = 100;
    if (this.goals && this.goals.length > 0) {
        score += 20;
        if (this.goals.length >= 3)
            score += 10;
    }
    if (this.objectives && this.objectives.length > 0) {
        score += 20;
        if (this.objectives.length >= 5)
            score += 10;
    }
    if (this.followUpDate) {
        score += 20;
    }
    if (this.dtpSummary) {
        score += 10;
    }
    if (this.notes && this.notes.trim().length > 20) {
        score += 10;
    }
    return Math.round((score / maxScore) * 100);
});
carePlanSchema.pre('save', function () {
    if (this.goals) {
        this.goals = this.goals
            .map((goal) => goal.trim())
            .filter((goal) => goal.length > 0);
    }
    if (this.objectives) {
        this.objectives = this.objectives
            .map((obj) => obj.trim())
            .filter((obj) => obj.length > 0);
    }
    const completeness = this.get('completenessScore');
    if (completeness < 70) {
        this.planQuality = 'needsReview';
    }
    if (!this.goals || this.goals.length === 0) {
        throw new Error('At least one goal is required');
    }
    if (!this.objectives || this.objectives.length === 0) {
        throw new Error('At least one objective is required');
    }
});
carePlanSchema.statics.findByPatient = function (patientId, limit, workplaceId) {
    const query = { patientId };
    let baseQuery;
    if (workplaceId) {
        baseQuery = this.find(query).setOptions({ workplaceId });
    }
    else {
        baseQuery = this.find(query);
    }
    baseQuery = baseQuery.sort({ createdAt: -1 });
    if (limit) {
        baseQuery = baseQuery.limit(limit);
    }
    return baseQuery;
};
carePlanSchema.statics.findLatestByPatient = function (patientId, workplaceId) {
    const query = { patientId };
    if (workplaceId) {
        return this.findOne(query)
            .setOptions({ workplaceId })
            .sort({ createdAt: -1 });
    }
    return this.findOne(query).sort({ createdAt: -1 });
};
carePlanSchema.statics.findByVisit = function (visitId, workplaceId) {
    const query = { visitId };
    if (workplaceId) {
        return this.find(query).setOptions({ workplaceId });
    }
    return this.find(query);
};
carePlanSchema.statics.findNeedingReview = function (workplaceId) {
    const query = { planQuality: 'needsReview' };
    if (workplaceId) {
        return this.find(query).setOptions({ workplaceId }).sort({ createdAt: -1 });
    }
    return this.find(query).sort({ createdAt: -1 });
};
carePlanSchema.statics.findDueFollowUps = function (daysAhead = 7, workplaceId) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    const query = {
        followUpDate: {
            $gte: today,
            $lte: futureDate,
        },
    };
    if (workplaceId) {
        return this.find(query)
            .setOptions({ workplaceId })
            .sort({ followUpDate: 1 });
    }
    return this.find(query).sort({ followUpDate: 1 });
};
carePlanSchema.statics.findOverdueFollowUps = function (workplaceId) {
    const today = new Date();
    const query = {
        followUpDate: { $lt: today },
    };
    if (workplaceId) {
        return this.find(query)
            .setOptions({ workplaceId })
            .sort({ followUpDate: 1 });
    }
    return this.find(query).sort({ followUpDate: 1 });
};
carePlanSchema.methods.addGoal = function (goal) {
    if (!this.goals) {
        this.goals = [];
    }
    const trimmedGoal = goal.trim();
    if (trimmedGoal.length >= 5 && trimmedGoal.length <= 200) {
        this.goals.push(trimmedGoal);
    }
    else {
        throw new Error('Goal must be 5-200 characters long');
    }
};
carePlanSchema.methods.addObjective = function (objective) {
    if (!this.objectives) {
        this.objectives = [];
    }
    const trimmedObjective = objective.trim();
    if (trimmedObjective.length >= 5 && trimmedObjective.length <= 300) {
        this.objectives.push(trimmedObjective);
    }
    else {
        throw new Error('Objective must be 5-300 characters long');
    }
};
carePlanSchema.methods.removeGoal = function (index) {
    if (this.goals && index >= 0 && index < this.goals.length) {
        this.goals.splice(index, 1);
    }
};
carePlanSchema.methods.removeObjective = function (index) {
    if (this.objectives && index >= 0 && index < this.objectives.length) {
        this.objectives.splice(index, 1);
    }
};
carePlanSchema.methods.setFollowUp = function (date) {
    const today = new Date();
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 12);
    if (date > today && date <= maxDate) {
        this.followUpDate = date;
    }
    else {
        throw new Error('Follow-up date must be in the future but within 12 months');
    }
};
carePlanSchema.methods.markAsNeedingReview = function (reason) {
    this.planQuality = 'needsReview';
    if (reason) {
        this.notes = this.notes
            ? `${this.notes}\n\nReview needed: ${reason}`
            : `Review needed: ${reason}`;
    }
};
carePlanSchema.methods.markAsAdequate = function () {
    this.planQuality = 'adequate';
};
carePlanSchema.methods.isOverdue = function () {
    if (!this.followUpDate) {
        return false;
    }
    return this.followUpDate < new Date();
};
carePlanSchema.methods.isDueSoon = function (days = 7) {
    if (!this.followUpDate) {
        return false;
    }
    const now = new Date();
    const dueDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return this.followUpDate <= dueDate && this.followUpDate >= now;
};
exports.default = mongoose_1.default.model('CarePlan', carePlanSchema);
//# sourceMappingURL=CarePlan.js.map