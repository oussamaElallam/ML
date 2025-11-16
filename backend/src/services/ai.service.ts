import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import FormData from 'form-data';
import fs from 'fs';
import { AppError } from '../types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class AIService {
  /**
   * Transcribe audio file using OpenAI Whisper
   */
  async transcribeAudio(filePath: string): Promise<string> {
    try {
      console.log('Transcribing audio file:', filePath);

      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
        model: 'whisper-1',
        language: 'en',
        response_format: 'text',
      });

      return transcription as unknown as string;
    } catch (error: any) {
      console.error('Whisper transcription error:', error);
      throw new AppError(
        `Failed to transcribe audio: ${error.message}`,
        500
      );
    }
  }

  /**
   * Generate SOAP note from clinical text using Claude
   */
  async generateSOAPNote(clinicalText: string): Promise<{
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  }> {
    try {
      console.log('Generating SOAP note from text...');

      const prompt = `You are a medical documentation assistant. Convert the following clinical encounter into a structured SOAP note.

Input: ${clinicalText}

Generate a properly formatted SOAP note with these sections:
- SUBJECTIVE: Patient's complaints, history, and symptoms as reported by the patient
- OBJECTIVE: Vital signs, examination findings, and observable data
- ASSESSMENT: Diagnosis, differential diagnosis, and clinical interpretation
- PLAN: Treatment plan, medications, follow-up, and next steps

Use medical terminology. Be concise, professional, and accurate. Format your response as JSON with the keys: "subjective", "objective", "assessment", "plan".

IMPORTANT: Return ONLY valid JSON, no additional text or markdown formatting.`;

      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      // Extract the text content from Claude's response
      const responseText = message.content[0].type === 'text'
        ? message.content[0].text
        : '';

      // Try to parse JSON from the response
      let soapNote;
      try {
        // Remove any markdown code blocks if present
        const cleanedResponse = responseText
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();

        soapNote = JSON.parse(cleanedResponse);
      } catch (parseError) {
        // If JSON parsing fails, try to extract sections manually
        console.log('JSON parsing failed, extracting sections manually');
        soapNote = this.extractSOAPSections(responseText);
      }

      // Validate that we have all required sections
      if (!soapNote.subjective || !soapNote.objective || !soapNote.assessment || !soapNote.plan) {
        throw new AppError('Invalid SOAP note structure generated', 500);
      }

      return soapNote;
    } catch (error: any) {
      console.error('Claude SOAP generation error:', error);
      throw new AppError(
        `Failed to generate SOAP note: ${error.message}`,
        500
      );
    }
  }

  /**
   * Fallback method to extract SOAP sections from unstructured text
   */
  private extractSOAPSections(text: string): {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  } {
    const sections = {
      subjective: '',
      objective: '',
      assessment: '',
      plan: '',
    };

    // Try to find sections by headers
    const subjectiveMatch = text.match(/SUBJECTIVE[:\s]+(.*?)(?=OBJECTIVE|$)/is);
    const objectiveMatch = text.match(/OBJECTIVE[:\s]+(.*?)(?=ASSESSMENT|$)/is);
    const assessmentMatch = text.match(/ASSESSMENT[:\s]+(.*?)(?=PLAN|$)/is);
    const planMatch = text.match(/PLAN[:\s]+(.*?)$/is);

    sections.subjective = subjectiveMatch ? subjectiveMatch[1].trim() : 'Not provided';
    sections.objective = objectiveMatch ? objectiveMatch[1].trim() : 'Not provided';
    sections.assessment = assessmentMatch ? assessmentMatch[1].trim() : 'Not provided';
    sections.plan = planMatch ? planMatch[1].trim() : 'Not provided';

    return sections;
  }
}

export default new AIService();
