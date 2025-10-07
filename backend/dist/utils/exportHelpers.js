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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeExportFileName = exports.isValidExportFileName = exports.getExportStats = exports.cleanupOldExports = exports.generateCSVReport = exports.generateExcelReport = exports.generatePDFReport = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const logger_1 = __importDefault(require("./logger"));
const generatePDFReport = async (data, fileName, options) => {
    try {
        const exportsDir = path.join(process.cwd(), 'exports');
        await fs.mkdir(exportsDir, { recursive: true });
        const filePath = path.join(exportsDir, `${fileName}.pdf`);
        const content = generateReportContent(data, options);
        await fs.writeFile(filePath, content, 'utf-8');
        logger_1.default.info(`PDF report generated: ${filePath}`);
        return filePath;
    }
    catch (error) {
        logger_1.default.error('Failed to generate PDF report:', error);
        throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
exports.generatePDFReport = generatePDFReport;
const generateExcelReport = async (data, fileName, options) => {
    try {
        const exportsDir = path.join(process.cwd(), 'exports');
        await fs.mkdir(exportsDir, { recursive: true });
        const filePath = path.join(exportsDir, `${fileName}.xlsx`);
        const csvContent = generateCSVContent(data, options);
        await fs.writeFile(filePath, csvContent, 'utf-8');
        logger_1.default.info(`Excel report generated: ${filePath}`);
        return filePath;
    }
    catch (error) {
        logger_1.default.error('Failed to generate Excel report:', error);
        throw new Error(`Excel generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
exports.generateExcelReport = generateExcelReport;
const generateCSVReport = async (data, fileName, options) => {
    try {
        const exportsDir = path.join(process.cwd(), 'exports');
        await fs.mkdir(exportsDir, { recursive: true });
        const filePath = path.join(exportsDir, `${fileName}.csv`);
        const csvContent = generateCSVContent(data, options);
        await fs.writeFile(filePath, csvContent, 'utf-8');
        logger_1.default.info(`CSV report generated: ${filePath}`);
        return filePath;
    }
    catch (error) {
        logger_1.default.error('Failed to generate CSV report:', error);
        throw new Error(`CSV generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
exports.generateCSVReport = generateCSVReport;
function generateReportContent(data, options) {
    const { reportType, workplaceId, filters, generatedAt, data: reportData } = data;
    let content = `PharmacyCopilot SaaS - ${reportType} Report\n`;
    content += `========================================\n\n`;
    content += `Generated: ${generatedAt.toISOString()}\n`;
    content += `Workplace ID: ${workplaceId}\n`;
    content += `Report Type: ${reportType}\n\n`;
    if (filters && Object.keys(filters).length > 0) {
        content += `Filters Applied:\n`;
        Object.entries(filters).forEach(([key, value]) => {
            content += `  ${key}: ${JSON.stringify(value)}\n`;
        });
        content += `\n`;
    }
    if (options?.includeCharts) {
        content += `Charts: Included\n\n`;
    }
    if (options?.includeRawData && Array.isArray(reportData)) {
        content += `Data Records: ${reportData.length}\n\n`;
        if (reportData.length > 0) {
            const headers = Object.keys(reportData[0]);
            content += headers.join('\t') + '\n';
            reportData.forEach(record => {
                const row = headers.map(header => {
                    const value = record[header];
                    return typeof value === 'object' ? JSON.stringify(value) : String(value);
                });
                content += row.join('\t') + '\n';
            });
        }
    }
    content += `\nReport generated by PharmacyCopilot SaaS\n`;
    return content;
}
function generateCSVContent(data, options) {
    const { reportType, workplaceId, generatedAt, data: reportData } = data;
    let csvContent = '';
    csvContent += `# PharmacyCopilot SaaS - ${reportType} Report\n`;
    csvContent += `# Generated: ${generatedAt.toISOString()}\n`;
    csvContent += `# Workplace ID: ${workplaceId}\n`;
    csvContent += `# Report Type: ${reportType}\n\n`;
    if (options?.includeRawData && Array.isArray(reportData) && reportData.length > 0) {
        const headers = Object.keys(reportData[0]);
        csvContent += headers.join(',') + '\n';
        reportData.forEach(record => {
            const row = headers.map(header => {
                const value = record[header];
                if (value === null || value === undefined) {
                    return '';
                }
                const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
                if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                    return `"${stringValue.replace(/"/g, '""')}"`;
                }
                return stringValue;
            });
            csvContent += row.join(',') + '\n';
        });
    }
    else {
        csvContent += 'No Data Available\n';
    }
    return csvContent;
}
const cleanupOldExports = async (daysOld = 7) => {
    try {
        const exportsDir = path.join(process.cwd(), 'exports');
        const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
        const files = await fs.readdir(exportsDir);
        let deletedCount = 0;
        for (const file of files) {
            const filePath = path.join(exportsDir, file);
            const stats = await fs.stat(filePath);
            if (stats.mtime < cutoffDate) {
                await fs.unlink(filePath);
                deletedCount++;
                logger_1.default.debug(`Deleted old export file: ${file}`);
            }
        }
        if (deletedCount > 0) {
            logger_1.default.info(`Cleaned up ${deletedCount} old export files`);
        }
    }
    catch (error) {
        logger_1.default.error('Failed to cleanup old exports:', error);
    }
};
exports.cleanupOldExports = cleanupOldExports;
const getExportStats = async () => {
    try {
        const exportsDir = path.join(process.cwd(), 'exports');
        const stats = {
            totalFiles: 0,
            totalSize: 0,
            fileTypes: {}
        };
        const files = await fs.readdir(exportsDir);
        for (const file of files) {
            const filePath = path.join(exportsDir, file);
            const fileStats = await fs.stat(filePath);
            if (fileStats.isFile()) {
                stats.totalFiles++;
                stats.totalSize += fileStats.size;
                const ext = path.extname(file).toLowerCase();
                stats.fileTypes[ext] = (stats.fileTypes[ext] || 0) + 1;
            }
        }
        return stats;
    }
    catch (error) {
        logger_1.default.error('Failed to get export stats:', error);
        return {
            totalFiles: 0,
            totalSize: 0,
            fileTypes: {}
        };
    }
};
exports.getExportStats = getExportStats;
const isValidExportFileName = (fileName) => {
    const invalidChars = /[<>:"/\\|?*]/;
    return !invalidChars.test(fileName) && fileName.length > 0 && fileName.length < 255;
};
exports.isValidExportFileName = isValidExportFileName;
const sanitizeExportFileName = (fileName) => {
    return fileName
        .replace(/[<>:"/\\|?*]/g, '_')
        .replace(/\s+/g, '_')
        .substring(0, 250);
};
exports.sanitizeExportFileName = sanitizeExportFileName;
//# sourceMappingURL=exportHelpers.js.map