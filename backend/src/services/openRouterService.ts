import axios, { AxiosResponse } from 'axios';
import logger from '../utils/logger';

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
}

interface OpenRouterUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface OpenRouterResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: OpenRouterUsage;
}

interface DiagnosticInput {
  symptoms: {
    subjective: string[];
    objective: string[];
    duration: string;
    severity: 'mild' | 'moderate' | 'severe';
    onset: 'acute' | 'chronic' | 'subacute';
  };
  labResults?: {
    testName: string;
    value: string;
    referenceRange: string;
    abnormal: boolean;
  }[];
  currentMedications?: {
    name: string;
    dosage: string;
    frequency: string;
  }[];
  vitalSigns?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
  };
  patientAge?: number;
  patientGender?: string;
  allergies?: string[];
  medicalHistory?: string[];
}

interface DiagnosticResponse {
  differentialDiagnoses: {
    condition: string;
    probability: number;
    reasoning: string;
    severity: 'low' | 'medium' | 'high';
  }[];
  recommendedTests: {
    testName: string;
    priority: 'urgent' | 'routine' | 'optional';
    reasoning: string;
  }[];
  therapeuticOptions: {
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
    reasoning: string;
    safetyNotes: string[];
  }[];
  redFlags: {
    flag: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    action: string;
  }[];
  referralRecommendation?: {
    recommended: boolean;
    urgency: 'immediate' | 'within_24h' | 'routine';
    specialty: string;
    reason: string;
  };
  disclaimer: string;
  confidenceScore: number;
}

class OpenRouterService {
  private baseURL: string;
  private apiKey: string;
  private defaultModel: string;
  private timeout: number;

  constructor() {
    this.baseURL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    this.defaultModel = 'deepseek/deepseek-reasoner'; // Use reasoning mode for complex diagnostics
    this.timeout = 60000; // 60 seconds timeout

    if (!this.apiKey) {
      logger.error('OpenRouter API key not configured');
      throw new Error('OpenRouter API key is required');
    }
  }

  /**
   * Generate structured medical diagnostic analysis using DeepSeek V3.1
   */
  async generateDiagnosticAnalysis(input: DiagnosticInput): Promise<{
    analysis: DiagnosticResponse;
    usage: OpenRouterUsage;
    requestId: string;
    processingTime: number;
  }> {
    const startTime = Date.now();

    try {
      const systemPrompt = this.createSystemPrompt();
      const userPrompt = this.formatDiagnosticPrompt(input);

      const request: OpenRouterRequest = {
        model: this.defaultModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 4000,
        temperature: 0.1, // Low temperature for consistent medical analysis
        top_p: 0.9
      };

      logger.info('Sending diagnostic request to OpenRouter', {
        model: this.defaultModel,
        promptLength: userPrompt.length
      });

      const response: AxiosResponse<OpenRouterResponse> = await axios.post(
        `${this.baseURL}/chat/completions`,
        request,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
            'X-Title': 'PharmaCare SaaS - AI Diagnostic Module'
          },
          timeout: this.timeout
        }
      );

      const processingTime = Date.now() - startTime;

      const message = response.data.choices?.[0]?.message;

      if (!message?.content) {
        throw new Error('No response generated from AI model or content is empty');
      }

      const aiContent = message.content;
      const analysis = this.parseAIResponse(aiContent);

      logger.info('Diagnostic analysis completed', {
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
    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error('OpenRouter API error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime,
        input: JSON.stringify(input, null, 2)
      });
      throw new Error(`AI diagnostic analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create system prompt for medical diagnostic AI
   */
  private createSystemPrompt(): string {
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

  /**
   * Format diagnostic input into structured prompt
   */
  private formatDiagnosticPrompt(input: DiagnosticInput): string {
    let prompt = `PATIENT PRESENTATION FOR DIAGNOSTIC ANALYSIS:\n\n`;

    // Patient Demographics
    if (input.patientAge || input.patientGender) {
      prompt += `PATIENT DEMOGRAPHICS:\n`;
      if (input.patientAge) prompt += `- Age: ${input.patientAge} years\n`;
      if (input.patientGender) prompt += `- Gender: ${input.patientGender}\n`;
      prompt += `\n`;
    }

    // Symptoms
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

    // Vital Signs
    if (input.vitalSigns) {
      prompt += `VITAL SIGNS:\n`;
      if (input.vitalSigns.bloodPressure) prompt += `- Blood Pressure: ${input.vitalSigns.bloodPressure}\n`;
      if (input.vitalSigns.heartRate) prompt += `- Heart Rate: ${input.vitalSigns.heartRate} bpm\n`;
      if (input.vitalSigns.temperature) prompt += `- Temperature: ${input.vitalSigns.temperature}°C\n`;
      if (input.vitalSigns.respiratoryRate) prompt += `- Respiratory Rate: ${input.vitalSigns.respiratoryRate} breaths/min\n`;
      if (input.vitalSigns.oxygenSaturation) prompt += `- Oxygen Saturation: ${input.vitalSigns.oxygenSaturation}%\n`;
      prompt += `\n`;
    }

    // Lab Results
    if (input.labResults && input.labResults.length > 0) {
      prompt += `LABORATORY RESULTS:\n`;
      input.labResults.forEach(lab => {
        prompt += `- ${lab.testName}: ${lab.value} (Reference: ${lab.referenceRange})${lab.abnormal ? ' [ABNORMAL]' : ''}\n`;
      });
      prompt += `\n`;
    }

    // Current Medications
    if (input.currentMedications && input.currentMedications.length > 0) {
      prompt += `CURRENT MEDICATIONS:\n`;
      input.currentMedications.forEach(med => {
        prompt += `- ${med.name} ${med.dosage} ${med.frequency}\n`;
      });
      prompt += `\n`;
    }

    // Allergies
    if (input.allergies && input.allergies.length > 0) {
      prompt += `KNOWN ALLERGIES:\n`;
      prompt += `- ${input.allergies.join(', ')}\n\n`;
    }

    // Medical History
    if (input.medicalHistory && input.medicalHistory.length > 0) {
      prompt += `MEDICAL HISTORY:\n`;
      prompt += `- ${input.medicalHistory.join(', ')}\n\n`;
    }

    prompt += `Please provide a comprehensive diagnostic analysis in the specified JSON format.`;

    return prompt;
  }

  /**
   * Parse AI response and extract structured diagnostic data
   */
  private parseAIResponse(content: string): DiagnosticResponse {
    try {
      // Extract JSON from response (handle cases where AI includes extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch?.[0]) {
        throw new Error('No valid JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      if (!parsed.differentialDiagnoses || !Array.isArray(parsed.differentialDiagnoses)) {
        throw new Error('Invalid differential diagnoses format');
      }

      // Ensure disclaimer is present
      if (!parsed.disclaimer) {
        parsed.disclaimer = "This AI-generated analysis is for pharmacist consultation only and does not replace professional medical diagnosis. Final clinical decisions must always be made by qualified healthcare professionals.";
      }

      // Ensure confidence score is present
      if (typeof parsed.confidenceScore !== 'number') {
        parsed.confidenceScore = 75; // Default confidence
      }

      return parsed as DiagnosticResponse;
    } catch (error) {
      logger.error('Failed to parse AI response', {
        error: error instanceof Error ? error.message : 'Unknown error',
        content: content.substring(0, 500)
      });
      throw new Error('Failed to parse AI diagnostic response');
    }
  }

  /**
   * Test the OpenRouter connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseURL}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        timeout: 10000
      });
      return response.status === 200;
    } catch (error) {
      logger.error('OpenRouter connection test failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }
}

export default new OpenRouterService();
export { DiagnosticInput, DiagnosticResponse };