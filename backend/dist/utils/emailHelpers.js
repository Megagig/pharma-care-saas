"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeEmailContent = exports.isValidEmail = exports.sendBulkEmails = exports.sendEmail = void 0;
const email_1 = require("./email");
const sendEmail = async (options) => {
    try {
        let htmlContent;
        let textContent;
        if (options.template) {
            htmlContent = generateEmailTemplate(options.template, options.data || {});
        }
        else if (options.html) {
            htmlContent = options.html;
        }
        if (options.text) {
            textContent = options.text;
        }
        else if (options.data) {
            textContent = generateTextContent(options.data);
        }
        const emailOptions = {
            to: options.to,
            subject: options.subject,
            html: htmlContent,
            text: textContent
        };
        return await (0, email_1.sendEmail)(emailOptions);
    }
    catch (error) {
        console.error('Failed to send email from emailHelpers:', error);
        throw error;
    }
};
exports.sendEmail = sendEmail;
function generateEmailTemplate(template, data) {
    const templates = {
        'export-ready': `
            <h2>Report Export Ready</h2>
            <p>Your report export is ready for download.</p>
            <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
                <h3>${data.fileName || 'Report'}</h3>
                <p><strong>Format:</strong> ${data.format || 'PDF'}</p>
                <p><a href="${data.downloadLink || '#'}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Download Report</a></p>
            </div>
            <p>This report was generated automatically by PharmaCare SaaS.</p>
        `,
        'export-failed': `
            <h2>Report Export Failed</h2>
            <p>We encountered an issue while generating your report export.</p>
            <div style="margin: 20px 0; padding: 15px; background-color: #f8d7da; border-radius: 5px;">
                <h3>${data.fileName || 'Report'}</h3>
                <p><strong>Error:</strong> ${data.error || 'Unknown error occurred'}</p>
            </div>
            <p>Please try again or contact support if the problem persists.</p>
        `,
        'scheduled-report': `
            <h2>Scheduled Report</h2>
            <p>Your scheduled report has been generated and is attached.</p>
            <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
                <h3>${data.reportType || 'Report'}</h3>
                <p><strong>Generated:</strong> ${data.generatedAt || new Date().toLocaleString()}</p>
                <p><strong>Formats:</strong> ${data.formats || 'PDF'}</p>
            </div>
            <p>This report was generated automatically by PharmaCare SaaS.</p>
        `,
        'scheduled-report-failed': `
            <h2>Scheduled Report Failed</h2>
            <p>We encountered an issue while generating your scheduled report.</p>
            <div style="margin: 20px 0; padding: 15px; background-color: #f8d7da; border-radius: 5px;">
                <h3>${data.reportType || 'Report'}</h3>
                <p><strong>Error:</strong> ${data.error || 'Unknown error occurred'}</p>
            </div>
            <p>Please check your report configuration or contact support if the problem persists.</p>
        `
    };
    return templates[template] || `
        <h2>Notification</h2>
        <p>${JSON.stringify(data, null, 2)}</p>
    `;
}
function generateTextContent(data) {
    return Object.entries(data)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
}
const sendBulkEmails = async (recipients, options) => {
    const results = [];
    for (const recipient of recipients) {
        try {
            const result = await (0, exports.sendEmail)({
                ...options,
                to: recipient
            });
            results.push({ recipient, success: true, result });
        }
        catch (error) {
            results.push({
                recipient,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    return results;
};
exports.sendBulkEmails = sendBulkEmails;
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.isValidEmail = isValidEmail;
const sanitizeEmailContent = (content) => {
    return content
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"')
        .replace(/'/g, '&#39;');
};
exports.sanitizeEmailContent = sanitizeEmailContent;
//# sourceMappingURL=emailHelpers.js.map