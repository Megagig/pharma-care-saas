"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const logger_1 = __importDefault(require("../utils/logger"));
class OpenRouterService {
    constructor() {
        this.baseURL =
            process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
        this.apiKey = process.env.OPENROUTER_API_KEY || '';
        this.defaultModel = 'deepseek/deepseek-chat-v3.1:free';
        this.timeout = 180000;
        this.retryConfig = {
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 10000,
            backoffMultiplier: 2,
        };
        if (!this.apiKey) {
            logger_1.default.error('OpenRouter API key not configured');
            throw new Error('OpenRouter API key is required');
        }
    }
    async generateDiagnosticAnalysis(input) {
        const startTime = Date.now();
        try {
            const systemPrompt = this.createSystemPrompt();
            const userPrompt = this.formatDiagnosticPrompt(input);
            const request = {
                model: this.defaultModel,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                max_tokens: 4000,
                temperature: 0.1,
                top_p: 0.9,
            };
            logger_1.default.info('Sending diagnostic request to OpenRouter', {
                model: this.defaultModel,
                promptLength: userPrompt.length,
            });
            const response = await this.executeWithRetry(async () => {
                return await axios_1.default.post(`${this.baseURL}/chat/completions`, request, {
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
                        'X-Title': 'PharmacyCopilot SaaS - AI Diagnostic Module',
                    },
                    timeout: this.timeout,
                });
            });
            const processingTime = Date.now() - startTime;
            const message = response.data.choices?.[0]?.message;
            if (!message?.content) {
                throw new Error('No response generated from AI model or content is empty');
            }
            const aiContent = message.content;
            const analysis = this.parseAndValidateAIResponse(aiContent);
            logger_1.default.info('Diagnostic analysis completed', {
                requestId: response.data.id,
                processingTime,
                tokensUsed: response.data.usage.total_tokens,
            });
            return {
                analysis,
                usage: response.data.usage,
                requestId: response.data.id,
                processingTime,
            };
        }
        catch (error) {
            const processingTime = Date.now() - startTime;
            const enhancedError = this.enhanceError(error);
            logger_1.default.error('OpenRouter API error', {
                error: enhancedError.message,
                statusCode: enhancedError.statusCode,
                responseData: enhancedError.responseData,
                processingTime,
                apiKey: this.apiKey ? `${this.apiKey.substring(0, 10)}...` : 'NOT_SET',
                baseURL: this.baseURL,
                model: this.defaultModel,
            });
            throw new Error(`AI diagnostic analysis failed: ${enhancedError.message}`);
        }
    }
    async executeWithRetry(operation, attempt = 1) {
        try {
            return await operation();
        }
        catch (error) {
            const shouldRetry = this.shouldRetryError(error);
            if (shouldRetry && attempt <= this.retryConfig.maxRetries) {
                const delay = this.calculateRetryDelay(attempt);
                logger_1.default.warn(`OpenRouter request failed, retrying in ${delay}ms`, {
                    attempt,
                    maxRetries: this.retryConfig.maxRetries,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
                await this.sleep(delay);
                return this.executeWithRetry(operation, attempt + 1);
            }
            throw error;
        }
    }
    shouldRetryError(error) {
        if (error?.response?.status) {
            const status = error.response.status;
            return status >= 500 || status === 429;
        }
        if (error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT') {
            return true;
        }
        return false;
    }
    calculateRetryDelay(attempt) {
        const delay = this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1);
        return Math.min(delay, this.retryConfig.maxDelay);
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    enhanceError(error) {
        let errorMessage = 'Unknown error';
        let statusCode = null;
        let responseData = 'N/A';
        if (error instanceof Error) {
            errorMessage = error.message;
            if ('response' in error && error.response) {
                const axiosError = error;
                if (axiosError.response && axiosError.response.status) {
                    statusCode = parseInt(axiosError.response.status, 10);
                }
                responseData = JSON.stringify(axiosError.response.data);
                if (statusCode) {
                    if (statusCode === 401) {
                        errorMessage = 'Invalid or missing OpenRouter API key';
                    }
                    else if (statusCode === 402) {
                        errorMessage = 'OpenRouter API quota exceeded or payment required';
                    }
                    else if (statusCode === 429) {
                        errorMessage = 'OpenRouter API rate limit exceeded';
                    }
                    else if (statusCode >= 500) {
                        errorMessage = 'OpenRouter API server error';
                    }
                }
            }
        }
        return { message: errorMessage, statusCode, responseData };
    }
    createSystemPrompt() {
        return `You are an expert medical AI assistant designed to help pharmacists with diagnostic evaluations. Your role is to:

1. Analyze patient symptoms, vital signs, lab results, and medication history
2. Provide differential diagnoses with probability assessments
3. Recommend appropriate laboratory investigations
4. Suggest evidence-based therapeutic options
5. Identify red flags requiring immediate medical attention
6. Recommend specialist referrals when appropriate

IMPORTANT GUIDELINES:
- Always provide structured JSON output as specified
- Include appropriate medical disclaimers
- Consider drug interactions and contraindications
- Prioritize patient safety over convenience
- Use evidence-based medicine principles
- Be conservative in recommendations
- Always recommend physician consultation for serious conditions

Your response must be valid JSON in this exact format:
{
  "differentialDiagnoses": [
    {
      "condition": "string",
      "probability": number (0-100),
      "reasoning": "string",
      "severity": "low|medium|high"
    }
  ],
  "recommendedTests": [
    {
      "testName": "string",
      "priority": "urgent|routine|optional",
      "reasoning": "string"
    }
  ],
  "therapeuticOptions": [
    {
      "medication": "string",
      "dosage": "string",
      "frequency": "string",
      "duration": "string",
      "reasoning": "string",
      "safetyNotes": ["string"]
    }
  ],
  "redFlags": [
    {
      "flag": "string",
      "severity": "low|medium|high|critical",
      "action": "string"
    }
  ],
  "referralRecommendation": {
    "recommended": boolean,
    "urgency": "immediate|within_24h|routine",
    "specialty": "string",
    "reason": "string"
  },
  "disclaimer": "This AI-generated analysis is for pharmacist consultation only and does not replace professional medical diagnosis. Final clinical decisions must always be made by qualified healthcare professionals.",
  "confidenceScore": number (0-100)
}`;
    }
    formatDiagnosticPrompt(input) {
        let prompt = `PATIENT PRESENTATION FOR DIAGNOSTIC ANALYSIS:\n\n`;
        if (input.patientAge || input.patientGender) {
            prompt += `PATIENT DEMOGRAPHICS:\n`;
            if (input.patientAge)
                prompt += `- Age: ${input.patientAge} years\n`;
            if (input.patientGender)
                prompt += `- Gender: ${input.patientGender}\n`;
            prompt += `\n`;
        }
        prompt += `PRESENTING SYMPTOMS:\n`;
        prompt += `- Onset: ${input.symptoms.onset}\n`;
        prompt += `- Duration: ${input.symptoms.duration}\n`;
        prompt += `- Severity: ${input.symptoms.severity}\n`;
        if (input.symptoms.subjective.length > 0) {
            prompt += `- Subjective complaints: ${input.symptoms.subjective.join(', ')}\n`;
        }
        if (input.symptoms.objective.length > 0) {
            prompt += `- Objective findings: ${input.symptoms.objective.join(', ')}\n`;
        }
        prompt += `\n`;
        if (input.vitalSigns) {
            prompt += `VITAL SIGNS:\n`;
            if (input.vitalSigns.bloodPressure)
                prompt += `- Blood Pressure: ${input.vitalSigns.bloodPressure}\n`;
            if (input.vitalSigns.heartRate)
                prompt += `- Heart Rate: ${input.vitalSigns.heartRate} bpm\n`;
            if (input.vitalSigns.temperature)
                prompt += `- Temperature: ${input.vitalSigns.temperature}°C\n`;
            if (input.vitalSigns.respiratoryRate)
                prompt += `- Respiratory Rate: ${input.vitalSigns.respiratoryRate} breaths/min\n`;
            if (input.vitalSigns.oxygenSaturation)
                prompt += `- Oxygen Saturation: ${input.vitalSigns.oxygenSaturation}%\n`;
            prompt += `\n`;
        }
        if (input.labResults && input.labResults.length > 0) {
            prompt += `LABORATORY RESULTS:\n`;
            input.labResults.forEach((lab) => {
                prompt += `- ${lab.testName}: ${lab.value} (Reference: ${lab.referenceRange})${lab.abnormal ? ' [ABNORMAL]' : ''}\n`;
            });
            prompt += `\n`;
        }
        if (input.currentMedications && input.currentMedications.length > 0) {
            prompt += `CURRENT MEDICATIONS:\n`;
            input.currentMedications.forEach((med) => {
                prompt += `- ${med.name} ${med.dosage} ${med.frequency}\n`;
            });
            prompt += `\n`;
        }
        if (input.allergies && input.allergies.length > 0) {
            prompt += `KNOWN ALLERGIES:\n`;
            prompt += `- ${input.allergies.join(', ')}\n\n`;
        }
        if (input.medicalHistory && input.medicalHistory.length > 0) {
            prompt += `MEDICAL HISTORY:\n`;
            prompt += `- ${input.medicalHistory.join(', ')}\n\n`;
        }
        prompt += `Please provide a comprehensive diagnostic analysis in the specified JSON format.`;
        return prompt;
    }
    parseAndValidateAIResponse(content) {
        try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch?.[0]) {
                throw new Error('No valid JSON found in AI response');
            }
            const parsed = JSON.parse(jsonMatch[0]);
            const validatedResponse = this.validateDiagnosticResponse(parsed);
            return validatedResponse;
        }
        catch (error) {
            logger_1.default.error('Failed to parse AI response', {
                error: error instanceof Error ? error.message : 'Unknown error',
                content: content.substring(0, 500),
            });
            throw new Error('Failed to parse AI diagnostic response');
        }
    }
    validateDiagnosticResponse(parsed) {
        const errors = [];
        if (!parsed.differentialDiagnoses || !Array.isArray(parsed.differentialDiagnoses)) {
            errors.push('Missing or invalid differential diagnoses array');
        }
        else {
            parsed.differentialDiagnoses.forEach((diagnosis, index) => {
                if (!diagnosis.condition || typeof diagnosis.condition !== 'string') {
                    errors.push(`Diagnosis ${index}: missing or invalid condition`);
                }
                if (typeof diagnosis.probability !== 'number' || diagnosis.probability < 0 || diagnosis.probability > 100) {
                    errors.push(`Diagnosis ${index}: invalid probability (must be 0-100)`);
                }
                if (!diagnosis.reasoning || typeof diagnosis.reasoning !== 'string') {
                    errors.push(`Diagnosis ${index}: missing or invalid reasoning`);
                }
                if (!['low', 'medium', 'high'].includes(diagnosis.severity)) {
                    errors.push(`Diagnosis ${index}: invalid severity (must be low/medium/high)`);
                }
            });
        }
        if (parsed.recommendedTests) {
            if (!Array.isArray(parsed.recommendedTests)) {
                errors.push('Recommended tests must be an array');
            }
            else {
                parsed.recommendedTests.forEach((test, index) => {
                    if (!test.testName || typeof test.testName !== 'string') {
                        errors.push(`Test ${index}: missing or invalid test name`);
                    }
                    if (!['urgent', 'routine', 'optional'].includes(test.priority)) {
                        errors.push(`Test ${index}: invalid priority (must be urgent/routine/optional)`);
                    }
                    if (!test.reasoning || typeof test.reasoning !== 'string') {
                        errors.push(`Test ${index}: missing or invalid reasoning`);
                    }
                });
            }
        }
        if (parsed.therapeuticOptions) {
            if (!Array.isArray(parsed.therapeuticOptions)) {
                errors.push('Therapeutic options must be an array');
            }
            else {
                parsed.therapeuticOptions.forEach((option, index) => {
                    if (!option.medication || typeof option.medication !== 'string') {
                        errors.push(`Therapeutic option ${index}: missing or invalid medication`);
                    }
                    if (!option.dosage || typeof option.dosage !== 'string') {
                        errors.push(`Therapeutic option ${index}: missing or invalid dosage`);
                    }
                    if (!option.frequency || typeof option.frequency !== 'string') {
                        errors.push(`Therapeutic option ${index}: missing or invalid frequency`);
                    }
                    if (!option.reasoning || typeof option.reasoning !== 'string') {
                        errors.push(`Therapeutic option ${index}: missing or invalid reasoning`);
                    }
                    if (option.safetyNotes && !Array.isArray(option.safetyNotes)) {
                        errors.push(`Therapeutic option ${index}: safety notes must be an array`);
                    }
                });
            }
        }
        if (parsed.redFlags) {
            if (!Array.isArray(parsed.redFlags)) {
                errors.push('Red flags must be an array');
            }
            else {
                parsed.redFlags.forEach((flag, index) => {
                    if (!flag.flag || typeof flag.flag !== 'string') {
                        errors.push(`Red flag ${index}: missing or invalid flag description`);
                    }
                    if (!['low', 'medium', 'high', 'critical'].includes(flag.severity)) {
                        errors.push(`Red flag ${index}: invalid severity (must be low/medium/high/critical)`);
                    }
                    if (!flag.action || typeof flag.action !== 'string') {
                        errors.push(`Red flag ${index}: missing or invalid action`);
                    }
                });
            }
        }
        if (parsed.referralRecommendation) {
            const ref = parsed.referralRecommendation;
            if (typeof ref.recommended !== 'boolean') {
                errors.push('Referral recommendation: recommended must be boolean');
            }
            if (ref.recommended) {
                if (!['immediate', 'within_24h', 'routine'].includes(ref.urgency)) {
                    errors.push('Referral recommendation: invalid urgency (must be immediate/within_24h/routine)');
                }
                if (!ref.specialty || typeof ref.specialty !== 'string') {
                    errors.push('Referral recommendation: missing or invalid specialty');
                }
                if (!ref.reason || typeof ref.reason !== 'string') {
                    errors.push('Referral recommendation: missing or invalid reason');
                }
            }
        }
        if (typeof parsed.confidenceScore !== 'number' || parsed.confidenceScore < 0 || parsed.confidenceScore > 100) {
            parsed.confidenceScore = 75;
            logger_1.default.warn('Invalid confidence score, using default value of 75');
        }
        if (!parsed.disclaimer || typeof parsed.disclaimer !== 'string') {
            parsed.disclaimer =
                'This AI-generated analysis is for pharmacist consultation only and does not replace professional medical diagnosis. Final clinical decisions must always be made by qualified healthcare professionals.';
        }
        if (errors.length > 0) {
            throw new Error(`Validation errors: ${errors.join('; ')}`);
        }
        if (!parsed.recommendedTests) {
            parsed.recommendedTests = [];
        }
        if (!parsed.therapeuticOptions) {
            parsed.therapeuticOptions = [];
        }
        if (!parsed.redFlags) {
            parsed.redFlags = [];
        }
        return parsed;
    }
    async testConnection() {
        try {
            logger_1.default.info('Testing OpenRouter connection', {
                baseURL: this.baseURL,
                apiKeySet: !!this.apiKey,
                apiKeyPrefix: this.apiKey ? this.apiKey.substring(0, 10) : 'NOT_SET',
            });
            const response = await axios_1.default.get(`${this.baseURL}/models`, {
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
                    'X-Title': 'PharmacyCopilot SaaS - AI Diagnostic Module',
                },
                timeout: 30000,
            });
            logger_1.default.info('OpenRouter connection test successful', {
                status: response.status,
                modelsCount: response.data?.data?.length || 'unknown',
            });
            return response.status === 200;
        }
        catch (error) {
            let errorDetails = 'Unknown error';
            let statusCode = null;
            if (error instanceof Error) {
                errorDetails = error.message;
                if ('response' in error && error.response) {
                    const axiosError = error;
                    if (axiosError.response && axiosError.response.status) {
                        statusCode = parseInt(axiosError.response.status, 10);
                    }
                    errorDetails = `${error.message} (Status: ${statusCode || 'N/A'})`;
                }
            }
            logger_1.default.error('OpenRouter connection test failed', {
                error: errorDetails,
                statusCode,
                baseURL: this.baseURL,
                apiKeySet: !!this.apiKey,
            });
            return false;
        }
    }
}
exports.default = new OpenRouterService();
//# sourceMappingURL=openRouterService.js.map