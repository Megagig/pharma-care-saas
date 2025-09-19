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
const tenancyGuard_1 = require("../../../utils/tenancyGuard");
const testCatalogSchema = new mongoose_1.Schema({
    workplaceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Workplace',
        required: true,
        index: true
    },
    code: {
        type: String,
        required: [true, 'Test code is required'],
        trim: true,
        uppercase: true,
        maxlength: [20, 'Test code cannot exceed 20 characters'],
        index: true
    },
    name: {
        type: String,
        required: [true, 'Test name is required'],
        trim: true,
        maxlength: [200, 'Test name cannot exceed 200 characters'],
        index: true
    },
    loincCode: {
        type: String,
        trim: true,
        maxlength: [20, 'LOINC code cannot exceed 20 characters'],
        index: true,
        sparse: true
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        trim: true,
        maxlength: [100, 'Category cannot exceed 100 characters'],
        index: true
    },
    specimenType: {
        type: String,
        required: [true, 'Specimen type is required'],
        trim: true,
        maxlength: [100, 'Specimen type cannot exceed 100 characters'],
        index: true
    },
    unit: {
        type: String,
        trim: true,
        maxlength: [20, 'Unit cannot exceed 20 characters']
    },
    refRange: {
        type: String,
        trim: true,
        maxlength: [100, 'Reference range cannot exceed 100 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    estimatedCost: {
        type: Number,
        min: [0, 'Estimated cost cannot be negative']
    },
    turnaroundTime: {
        type: String,
        trim: true,
        maxlength: [50, 'Turnaround time cannot exceed 50 characters']
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    isCustom: {
        type: Boolean,
        default: false,
        index: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
(0, tenancyGuard_1.addAuditFields)(testCatalogSchema);
testCatalogSchema.plugin(tenancyGuard_1.tenancyGuardPlugin);
testCatalogSchema.index({ workplaceId: 1, code: 1 }, { unique: true });
testCatalogSchema.index({ workplaceId: 1, name: 1 });
testCatalogSchema.index({ workplaceId: 1, category: 1, isActive: 1 });
testCatalogSchema.index({ workplaceId: 1, specimenType: 1, isActive: 1 });
testCatalogSchema.index({ workplaceId: 1, isActive: 1, isCustom: 1 });
testCatalogSchema.index({ workplaceId: 1, isDeleted: 1, isActive: 1 });
testCatalogSchema.index({ loincCode: 1 }, { sparse: true });
testCatalogSchema.index({
    name: 'text',
    code: 'text',
    description: 'text',
    category: 'text'
});
testCatalogSchema.methods.activate = async function () {
    this.isActive = true;
    await this.save();
};
testCatalogSchema.methods.deactivate = async function () {
    this.isActive = false;
    await this.save();
};
testCatalogSchema.methods.updateCost = async function (cost, updatedBy) {
    this.estimatedCost = cost;
    this.updatedBy = updatedBy;
    await this.save();
};
testCatalogSchema.statics.findActiveTests = function (workplaceId) {
    return this.find({
        workplaceId,
        isActive: true,
        isDeleted: false
    }).sort({ category: 1, name: 1 });
};
testCatalogSchema.statics.findByCategory = function (workplaceId, category) {
    return this.find({
        workplaceId,
        category: { $regex: new RegExp(category, 'i') },
        isActive: true,
        isDeleted: false
    }).sort({ name: 1 });
};
testCatalogSchema.statics.findBySpecimenType = function (workplaceId, specimenType) {
    return this.find({
        workplaceId,
        specimenType: { $regex: new RegExp(specimenType, 'i') },
        isActive: true,
        isDeleted: false
    }).sort({ name: 1 });
};
testCatalogSchema.statics.searchTests = function (workplaceId, query, options = {}) {
    const searchQuery = {
        workplaceId,
        isActive: true,
        isDeleted: false
    };
    if (query) {
        searchQuery.$text = { $search: query };
    }
    if (options.category) {
        searchQuery.category = { $regex: new RegExp(options.category, 'i') };
    }
    if (options.specimenType) {
        searchQuery.specimenType = { $regex: new RegExp(options.specimenType, 'i') };
    }
    let queryBuilder = this.find(searchQuery);
    if (query) {
        queryBuilder = queryBuilder.sort({ score: { $meta: 'textScore' } });
    }
    else {
        queryBuilder = queryBuilder.sort({ category: 1, name: 1 });
    }
    if (options.offset) {
        queryBuilder = queryBuilder.skip(options.offset);
    }
    if (options.limit) {
        queryBuilder = queryBuilder.limit(options.limit);
    }
    return queryBuilder;
};
testCatalogSchema.statics.findByCode = function (workplaceId, code) {
    return this.findOne({
        workplaceId,
        code: code.toUpperCase(),
        isDeleted: false
    });
};
testCatalogSchema.statics.getCategories = function (workplaceId) {
    return this.distinct('category', {
        workplaceId,
        isActive: true,
        isDeleted: false
    });
};
testCatalogSchema.statics.getSpecimenTypes = function (workplaceId) {
    return this.distinct('specimenType', {
        workplaceId,
        isActive: true,
        isDeleted: false
    });
};
exports.default = mongoose_1.default.model('TestCatalog', testCatalogSchema);
//# sourceMappingURL=TestCatalog.js.map