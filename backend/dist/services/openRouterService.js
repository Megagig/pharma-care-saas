"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const logger_1 = __importDefault(require("../utils/logger"));
class OpenRouterService {
    constructor() {
        this.baseURL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
        this.apiKey = process.env.OPENROUTER_API_KEY || '';
        this.defaultModel = 'deepseek/deepseek-reasoner';
        this.timeout = 60000;
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
                    { role: 'user', content: userPrompt }
                ],
                max_tokens: 4000,
                temperature: 0.1,
                top_p: 0.9
            };
            logger_1.default.info('Sending diagnostic request to OpenRouter', {
                model: this.defaultModel,
                promptLength: userPrompt.length
            });
            const response = await axios_1.default.post(`${this.baseURL}/chat/completions`, request, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
                    'X-Title': 'PharmaCare SaaS - AI Diagnostic Module'
                },
                timeout: this.timeout
            });
            const processingTime = Date.now() - startTime;
            if (!response.data.choices || response.data.choices.length === 0) {
                throw new Error('No response generated from AI model');
            }
            const aiContent = response.data.choices[0].message.content;
            const analysis = this.parseAIResponse(aiContent);
            logger_1.default.info('Diagnostic analysis completed', {
                requestId: response.data.id,
                processingTime,
                tokensUsed: response.data.usage.total_tokens
            });
            return {
                analysis,
                usage: response.data.usage,
                requestId: response.data.id,
                processingTime
            };
        }
        catch (error) {
            const processingTime = Date.now() - startTime;
            logger_1.default.error('OpenRouter API error', {
                error: error instanceof Error ? error.message : 'Unknown error',
                processingTime,
                input: JSON.stringify(input, null, 2)
            });
            throw new Error(`AI diagnostic analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
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
            input.labResults.forEach(lab => {
                prompt += `- ${lab.testName}: ${lab.value} (Reference: ${lab.referenceRange})${lab.abnormal ? ' [ABNORMAL]' : ''}\n`;
            });
            prompt += `\n`;
        }
        if (input.currentMedications && input.currentMedications.length > 0) {
            prompt += `CURRENT MEDICATIONS:\n`;
            input.currentMedications.forEach(med => {
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
    parseAIResponse(content) {
        try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch?.[0]) {
                throw new Error('No valid JSON found in AI response');
            }
            const parsed = JSON.parse(jsonMatch[0]);
            if (!parsed.differentialDiagnoses || !Array.isArray(parsed.differentialDiagnoses)) {
                throw new Error('Invalid differential diagnoses format');
            }
            if (!parsed.disclaimer) {
                parsed.disclaimer = "This AI-generated analysis is for pharmacist consultation only and does not replace professional medical diagnosis. Final clinical decisions must always be made by qualified healthcare professionals.";
            }
            if (typeof parsed.confidenceScore !== 'number') {
                parsed.confidenceScore = 75;
            }
            return parsed;
        }
        catch (error) {
            logger_1.default.error('Failed to parse AI response', {
                error: error instanceof Error ? error.message : 'Unknown error',
                content: content.substring(0, 500)
            });
            throw new Error('Failed to parse AI diagnostic response');
        }
    }
    async testConnection() {
        try {
            const response = await axios_1.default.get(`${this.baseURL}/models`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                },
                timeout: 10000
            });
            return response.status === 200;
        }
        catch (error) {
            logger_1.default.error('OpenRouter connection test failed', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return false;
        }
    }
}
exports.default = new OpenRouterService();
//# sourceMappingURL=openRouterService.js.map