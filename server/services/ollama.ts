import fetch from 'node-fetch';

export interface OllamaModel {
  name: string;
  model: string;
  size: number;
  digest: string;
  modified_at: string;
}

export interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

export class OllamaService {
  private baseUrl: string;
  private defaultModel: string;

      constructor(baseUrl: string = 'http://localhost:11434', defaultModel: string = 'llama3.1:8b') {
    this.baseUrl = baseUrl;
    this.defaultModel = defaultModel;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async listModels(): Promise<OllamaModel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }
      const data = await response.json() as { models: OllamaModel[] };
      return data.models || [];
    } catch (error) {
      console.error('Error listing Ollama models:', error);
      return [];
    }
  }

  async generateResponse(prompt: string, model?: string): Promise<string> {
    const modelToUse = model || this.defaultModel;
    
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelToUse,
          prompt,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama generate error: ${response.statusText}`);
      }

      const data = await response.json() as OllamaResponse;
      return data.response;
    } catch (error) {
      console.error('Error generating response from Ollama:', error);
      throw new Error(`Failed to generate response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateStructuredResponse<T>(prompt: string, schema: any, model?: string): Promise<T> {
    const structuredPrompt = `${prompt}\n\nPlease respond with a valid JSON object that matches this schema: ${JSON.stringify(schema, null, 2)}`;
    
    const response = await this.generateResponse(structuredPrompt, model);
    
    try {
      return JSON.parse(response) as T;
    } catch (error) {
      console.error('Error parsing structured response:', error);
      throw new Error('Failed to parse structured response from LLM');
    }
  }
}

export const ollamaService = new OllamaService();
