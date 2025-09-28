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
const ReportTemplateSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
        index: true
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },
    reportType: {
        type: String,
        required: true,
        enum: [
            'patient-outcomes',
            'pharmacist-interventions',
            'therapy-effectiveness',
            'quality-improvement',
            'regulatory-compliance',
            'cost-effectiveness',
            'trend-forecasting',
            'operational-efficiency',
            'medication-inventory',
            'patient-demographics',
            'adverse-events',
            'custom'
        ],
        index: true
    },
    layout: {
        sections: [{
                id: { type: String, required: true },
                type: {
                    type: String,
                    required: true,
                    enum: ['chart', 'table', 'kpi', 'text']
                },
                title: { type: String, required: true },
                position: {
                    x: { type: Number, required: true, min: 0 },
                    y: { type: Number, required: true, min: 0 },
                    width: { type: Number, required: true, min: 1, max: 12 },
                    height: { type: Number, required: true, min: 1 }
                },
                config: { type: mongoose_1.Schema.Types.Mixed }
            }],
        theme: {
            colorPalette: [{ type: String }],
            fontFamily: { type: String, default: 'Inter' },
            fontSize: { type: Number, default: 14, min: 10, max: 24 }
        },
        responsive: { type: Boolean, default: true }
    },
    filters: [{
            key: { type: String, required: true },
            label: { type: String, required: true },
            type: {
                type: String,
                required: true,
                enum: ['date', 'select', 'multiselect', 'text', 'number']
            },
            options: [{
                    value: { type: String, required: true },
                    label: { type: String, required: true }
                }],
            defaultValue: { type: mongoose_1.Schema.Types.Mixed },
            required: { type: Boolean, default: false },
            validation: {
                min: { type: Number },
                max: { type: Number },
                pattern: { type: String }
            }
        }],
    charts: [{
            id: { type: String, required: true },
            type: { type: String, required: true },
            title: { type: String, required: true },
            dataSource: { type: String, required: true },
            config: {
                xAxis: { type: String },
                yAxis: { type: String },
                groupBy: { type: String },
                aggregation: {
                    type: String,
                    enum: ['sum', 'avg', 'count', 'min', 'max'],
                    default: 'count'
                },
                colors: [{ type: String }],
                showLegend: { type: Boolean, default: true },
                showTooltip: { type: Boolean, default: true },
                animations: { type: Boolean, default: true }
            },
            styling: {
                width: { type: Number, required: true, min: 200 },
                height: { type: Number, required: true, min: 200 },
                backgroundColor: { type: String },
                borderRadius: { type: Number, default: 8 },
                padding: { type: Number, default: 16 }
            }
        }],
    tables: [{
            id: { type: String, required: true },
            title: { type: String, required: true },
            dataSource: { type: String, required: true },
            columns: [{
                    key: { type: String, required: true },
                    label: { type: String, required: true },
                    type: {
                        type: String,
                        enum: ['text', 'number', 'date', 'currency', 'percentage'],
                        default: 'text'
                    },
                    format: { type: String },
                    sortable: { type: Boolean, default: true },
                    filterable: { type: Boolean, default: true }
                }],
            pagination: {
                enabled: { type: Boolean, default: true },
                pageSize: { type: Number, default: 10, min: 5, max: 100 }
            },
            styling: {
                striped: { type: Boolean, default: true },
                bordered: { type: Boolean, default: true },
                compact: { type: Boolean, default: false }
            }
        }],
    createdBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    workplaceId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Workplace',
        required: true,
        index: true
    },
    isPublic: {
        type: Boolean,
        default: false,
        index: true
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    version: {
        type: Number,
        default: 1,
        min: 1
    },
    tags: [{
            type: String,
            trim: true,
            maxlength: 50
        }],
    category: {
        type: String,
        enum: ['Clinical', 'Financial', 'Operational', 'Quality', 'Compliance', 'Analytics', 'Custom'],
        default: 'Custom',
        index: true
    },
    permissions: {
        view: [{ type: String }],
        edit: [{ type: String }],
        delete: [{ type: String }]
    },
    usage: {
        viewCount: { type: Number, default: 0 },
        lastViewed: { type: Date },
        favoriteCount: { type: Number, default: 0 }
    }
}, {
    timestamps: true,
    collection: 'reporttemplates'
});
ReportTemplateSchema.index({ workplaceId: 1, reportType: 1 });
ReportTemplateSchema.index({ workplaceId: 1, isPublic: 1, isActive: 1 });
ReportTemplateSchema.index({ createdBy: 1, workplaceId: 1 });
ReportTemplateSchema.index({ tags: 1 });
ReportTemplateSchema.index({ category: 1, isActive: 1 });
ReportTemplateSchema.index({ 'usage.viewCount': -1 });
ReportTemplateSchema.index({ createdAt: -1 });
ReportTemplateSchema.index({
    name: 'text',
    description: 'text',
    tags: 'text'
}, {
    weights: {
        name: 10,
        description: 5,
        tags: 3
    }
});
ReportTemplateSchema.virtual('templateUrl').get(function () {
    return `/api/reports/templates/${this._id}`;
});
ReportTemplateSchema.pre('save', function (next) {
    const chartIds = this.charts.map(chart => chart.id);
    const uniqueChartIds = [...new Set(chartIds)];
    if (chartIds.length !== uniqueChartIds.length) {
        return next(new Error('Chart IDs must be unique within a template'));
    }
    const tableIds = this.tables.map(table => table.id);
    const uniqueTableIds = [...new Set(tableIds)];
    if (tableIds.length !== uniqueTableIds.length) {
        return next(new Error('Table IDs must be unique within a template'));
    }
    const sectionIds = this.layout.sections.map(section => section.id);
    const uniqueSectionIds = [...new Set(sectionIds)];
    if (sectionIds.length !== uniqueSectionIds.length) {
        return next(new Error('Section IDs must be unique within a template'));
    }
    next();
});
ReportTemplateSchema.methods.incrementViewCount = function () {
    this.usage.viewCount += 1;
    this.usage.lastViewed = new Date();
    return this.save();
};
ReportTemplateSchema.methods.clone = function (newName, userId) {
    const cloned = new this.constructor({
        ...this.toObject(),
        _id: undefined,
        name: newName,
        createdBy: userId,
        version: 1,
        usage: {
            viewCount: 0,
            lastViewed: undefined,
            favoriteCount: 0
        },
        createdAt: undefined,
        updatedAt: undefined
    });
    return cloned;
};
ReportTemplateSchema.statics.findByReportType = function (reportType, workplaceId) {
    return this.find({
        reportType,
        workplaceId: new mongoose_1.default.Types.ObjectId(workplaceId),
        isActive: true
    }).sort({ 'usage.viewCount': -1, createdAt: -1 });
};
ReportTemplateSchema.statics.findPublicTemplates = function (reportType) {
    const query = { isPublic: true, isActive: true };
    if (reportType) {
        query.reportType = reportType;
    }
    return this.find(query).sort({ 'usage.viewCount': -1, createdAt: -1 });
};
ReportTemplateSchema.statics.searchTemplates = function (searchTerm, workplaceId) {
    return this.find({
        $and: [
            { workplaceId: new mongoose_1.default.Types.ObjectId(workplaceId) },
            { isActive: true },
            {
                $or: [
                    { isPublic: true },
                    { workplaceId: new mongoose_1.default.Types.ObjectId(workplaceId) }
                ]
            },
            { $text: { $search: searchTerm } }
        ]
    }, {
        score: { $meta: 'textScore' }
    }).sort({ score: { $meta: 'textScore' } });
};
exports.default = mongoose_1.default.model('ReportTemplate', ReportTemplateSchema);
//# sourceMappingURL=ReportTemplate.js.map