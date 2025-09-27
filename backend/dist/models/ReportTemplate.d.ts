import mongoose, { Document } from 'mongoose';
export interface IReportTemplate extends Document {
    _id: string;
    name: string;
    description: string;
    reportType: string;
    layout: {
        sections: Array<{
            id: string;
            type: 'chart' | 'table' | 'kpi' | 'text';
            title: string;
            position: {
                x: number;
                y: number;
                width: number;
                height: number;
            };
            config: any;
        }>;
        theme: {
            colorPalette: string[];
            fontFamily: string;
            fontSize: number;
        };
        responsive: boolean;
    };
    filters: Array<{
        key: string;
        label: string;
        type: 'date' | 'select' | 'multiselect' | 'text' | 'number';
        options?: Array<{
            value: string;
            label: string;
        }>;
        defaultValue?: any;
        required: boolean;
        validation?: {
            min?: number;
            max?: number;
            pattern?: string;
        };
    }>;
    charts: Array<{
        id: string;
        type: string;
        title: string;
        dataSource: string;
        config: {
            xAxis?: string;
            yAxis?: string;
            groupBy?: string;
            aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
            colors?: string[];
            showLegend?: boolean;
            showTooltip?: boolean;
            animations?: boolean;
        };
        styling: {
            width: number;
            height: number;
            backgroundColor?: string;
            borderRadius?: number;
            padding?: number;
        };
    }>;
    tables: Array<{
        id: string;
        title: string;
        dataSource: string;
        columns: Array<{
            key: string;
            label: string;
            type: 'text' | 'number' | 'date' | 'currency' | 'percentage';
            format?: string;
            sortable: boolean;
            filterable: boolean;
        }>;
        pagination: {
            enabled: boolean;
            pageSize: number;
        };
        styling: {
            striped: boolean;
            bordered: boolean;
            compact: boolean;
        };
    }>;
    createdBy: mongoose.Types.ObjectId;
    workplaceId: mongoose.Types.ObjectId;
    isPublic: boolean;
    isActive: boolean;
    version: number;
    tags: string[];
    category: string;
    permissions: {
        view: string[];
        edit: string[];
        delete: string[];
    };
    usage: {
        viewCount: number;
        lastViewed: Date;
        favoriteCount: number;
    };
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IReportTemplate, {}, {}, {}, mongoose.Document<unknown, {}, IReportTemplate> & IReportTemplate & Required<{
    _id: string;
}>, any>;
export default _default;
//# sourceMappingURL=ReportTemplate.d.ts.map