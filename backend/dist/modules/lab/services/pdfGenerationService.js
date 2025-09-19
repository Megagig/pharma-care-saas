"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pdfGenerationService = exports.PDFGenerationService = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const qrcode_1 = __importDefault(require("qrcode"));
const jsbarcode_1 = __importDefault(require("jsbarcode"));
const canvas_1 = require("canvas");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const manualLabCacheService_1 = __importDefault(require("./manualLabCacheService"));
class PDFGenerationService {
    constructor() {
        this.browser = null;
        this.templatePath = path_1.default.join(__dirname, '../templates/requisitionTemplate.html');
    }
    async initializeBrowser() {
        if (!this.browser) {
            this.browser = await puppeteer_1.default.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                    '--disable-gpu'
                ]
            });
        }
        return this.browser;
    }
    async generateQRCode(data) {
        try {
            const qrCodeDataUrl = await qrcode_1.default.toDataURL(data, {
                errorCorrectionLevel: 'M',
                margin: 1,
                color: {
                    dark: '#2c5aa0',
                    light: '#FFFFFF'
                },
                width: 200
            });
            return qrCodeDataUrl;
        }
        catch (error) {
            throw new Error(`Failed to generate QR code: ${error.message}`);
        }
    }
    async generateBarcode(data) {
        try {
            const canvas = (0, canvas_1.createCanvas)(300, 100);
            (0, jsbarcode_1.default)(canvas, data, {
                format: 'CODE128',
                width: 2,
                height: 60,
                displayValue: true,
                fontSize: 12,
                textMargin: 5,
                fontOptions: 'bold',
                font: 'Arial',
                textAlign: 'center',
                textPosition: 'bottom',
                background: '#FFFFFF',
                lineColor: '#2c5aa0'
            });
            return canvas.toDataURL('image/png');
        }
        catch (error) {
            throw new Error(`Failed to generate barcode: ${error.message}`);
        }
    }
    async renderTemplate(templateData) {
        try {
            const templateContent = await promises_1.default.readFile(this.templatePath, 'utf-8');
            let renderedHtml = templateContent;
            const singleValueReplacements = {
                orderId: templateData.orderId,
                orderDate: templateData.orderDate,
                orderTime: templateData.orderTime,
                priority: templateData.priority,
                indication: templateData.indication,
                patientName: templateData.patientName,
                patientDOB: templateData.patientDOB,
                patientGender: templateData.patientGender,
                patientPhone: templateData.patientPhone,
                patientAddress: templateData.patientAddress,
                pharmacyName: templateData.pharmacyName,
                pharmacyAddress: templateData.pharmacyAddress,
                pharmacyPhone: templateData.pharmacyPhone,
                pharmacyEmail: templateData.pharmacyEmail,
                pharmacistName: templateData.pharmacistName,
                qrCodeDataUrl: templateData.qrCodeDataUrl,
                barcodeDataUrl: templateData.barcodeDataUrl,
                securityToken: templateData.securityToken,
                generatedAt: templateData.generatedAt
            };
            for (const [key, value] of Object.entries(singleValueReplacements)) {
                const regex = new RegExp(`{{${key}}}`, 'g');
                renderedHtml = renderedHtml.replace(regex, value || '');
            }
            const testsHtml = templateData.tests.map(test => `
        <tr>
          <td>${test.name}</td>
          <td>${test.code}</td>
          <td>${test.specimenType}</td>
          <td>${test.category || 'General'}</td>
          <td>${test.refRange || 'N/A'}</td>
        </tr>
      `).join('');
            renderedHtml = renderedHtml.replace(/{{#each tests}}[\s\S]*?{{\/each}}/g, testsHtml);
            return renderedHtml;
        }
        catch (error) {
            throw new Error(`Failed to render template: ${error.message}`);
        }
    }
    generateSecurityHash(orderId, timestamp) {
        const data = `${orderId}-${timestamp.toISOString()}`;
        return crypto_1.default.createHash('sha256').update(data).digest('hex').substring(0, 16);
    }
    formatPatientAddress(patient) {
        return patient.address || 'Address not provided';
    }
    formatPharmacyAddress(workplace) {
        return workplace.address || 'Address not provided';
    }
    async generateRequisitionPDF(order, patient, workplace, pharmacist) {
        let page = null;
        try {
            const browser = await this.initializeBrowser();
            page = await browser.newPage();
            const qrCodeData = JSON.stringify({
                orderId: order.orderId,
                token: order.barcodeData,
                type: 'manual_lab_order'
            });
            const [qrCodeDataUrl, barcodeDataUrl] = await Promise.all([
                this.generateQRCode(qrCodeData),
                this.generateBarcode(order.barcodeData)
            ]);
            const now = new Date();
            const templateData = {
                orderId: order.orderId,
                orderDate: order.createdAt.toLocaleDateString(),
                orderTime: order.createdAt.toLocaleTimeString(),
                priority: order.priority || 'routine',
                indication: order.indication,
                patientName: `${patient.firstName} ${patient.lastName}`,
                patientDOB: patient.dob ? patient.dob.toLocaleDateString() : 'Not provided',
                patientGender: patient.gender || 'Not specified',
                patientPhone: patient.phone || 'Not provided',
                patientAddress: this.formatPatientAddress(patient),
                pharmacyName: workplace.name,
                pharmacyAddress: this.formatPharmacyAddress(workplace),
                pharmacyPhone: workplace.phone || 'Not provided',
                pharmacyEmail: workplace.email || 'Not provided',
                pharmacistName: `${pharmacist.firstName} ${pharmacist.lastName}`,
                tests: order.tests.map(test => ({
                    name: test.name,
                    code: test.code,
                    specimenType: test.specimenType,
                    category: test.category || 'General',
                    refRange: test.refRange || 'N/A'
                })),
                qrCodeDataUrl,
                barcodeDataUrl,
                securityToken: this.generateSecurityHash(order.orderId, now),
                generatedAt: now.toLocaleString()
            };
            const htmlContent = await this.renderTemplate(templateData);
            await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
            const pdfBuffer = Buffer.from(await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '0.5in',
                    right: '0.5in',
                    bottom: '0.5in',
                    left: '0.5in'
                },
                displayHeaderFooter: false,
                preferCSSPageSize: true
            }));
            const fileName = `lab-requisition-${order.orderId}-${Date.now()}.pdf`;
            const url = `/api/manual-lab-orders/${order.orderId}/pdf`;
            const metadata = {
                orderId: order.orderId,
                generatedAt: now,
                fileSize: pdfBuffer.length,
                securityHash: this.generateSecurityHash(order.orderId, now),
                generationTime: Date.now() - now.getTime()
            };
            const result = {
                pdfBuffer,
                fileName,
                url,
                metadata
            };
            await manualLabCacheService_1.default.cachePDFRequisition(order.orderId, result);
            return result;
        }
        catch (error) {
            throw new Error(`PDF generation failed: ${error.message}`);
        }
        finally {
            if (page) {
                await page.close();
            }
        }
    }
    async addWatermark(pdfBuffer, watermarkText, opacity = 0.1) {
        return pdfBuffer;
    }
    validateGenerationRequirements(order, patient, workplace, pharmacist) {
        const errors = [];
        if (!order.orderId)
            errors.push('Order ID is required');
        if (!order.tests || order.tests.length === 0)
            errors.push('At least one test is required');
        if (!order.indication)
            errors.push('Clinical indication is required');
        if (!order.barcodeData)
            errors.push('Barcode data is required');
        if (!patient.firstName || !patient.lastName)
            errors.push('Patient name is required');
        if (!workplace.name)
            errors.push('Pharmacy name is required');
        if (!pharmacist.firstName || !pharmacist.lastName)
            errors.push('Pharmacist name is required');
        if (errors.length > 0) {
            throw new Error(`PDF generation validation failed: ${errors.join(', ')}`);
        }
    }
    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
    async getBrowserStatus() {
        try {
            if (!this.browser) {
                return { isConnected: false };
            }
            const version = await this.browser.version();
            return { isConnected: true, version };
        }
        catch (error) {
            return { isConnected: false };
        }
    }
}
exports.PDFGenerationService = PDFGenerationService;
exports.pdfGenerationService = new PDFGenerationService();
process.on('SIGTERM', async () => {
    await exports.pdfGenerationService.cleanup();
});
process.on('SIGINT', async () => {
    await exports.pdfGenerationService.cleanup();
});
//# sourceMappingURL=pdfGenerationService.js.map