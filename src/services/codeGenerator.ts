import { ConfigManager } from '../utils/configManager';
import { AIService } from './aiService';

export class CodeGenerator {
    private aiService: AIService;

    constructor(private configManager: ConfigManager) {
        this.aiService = new AIService(configManager);
    }

    async generateCode(prompt: string, languageId: string): Promise<string> {
        const systemPrompt = `You are an expert ${languageId} developer. Generate clean, efficient, and well-documented code based on the user's request. 
        Follow best practices for ${languageId} and include helpful comments.`;

        const userPrompt = `Generate ${languageId} code for: ${prompt}`;

        try {
            const response = await this.aiService.generateCompletion(systemPrompt, userPrompt);
            return this.extractCodeFromResponse(response, languageId);
        } catch (error) {
            throw new Error(`Failed to generate code: ${error}`);
        }
    }

    async generateBoilerplate(fileType: string, languageId: string): Promise<string> {
        const boilerplatePrompts = {
            'class': `Create a basic class template with constructor, properties, and methods`,
            'function': `Create a function template with parameters and return value`,
            'component': `Create a ${languageId} component template`,
            'test': `Create a unit test template for ${languageId}`,
            'api': `Create an API endpoint template for ${languageId}`,
            'interface': `Create an interface/type definition template`
        };

        const prompt = boilerplatePrompts[fileType as keyof typeof boilerplatePrompts] || 
                      `Create a ${fileType} template for ${languageId}`;

        return this.generateCode(prompt, languageId);
    }

    async explainCode(code: string, languageId: string): Promise<string> {
        const systemPrompt = `You are an expert code reviewer and educator. Explain code clearly and thoroughly, 
        including what it does, how it works, potential issues, and suggestions for improvement.`;

        const userPrompt = `Explain this ${languageId} code:\n\n${code}`;

        try {
            const response = await this.aiService.generateCompletion(systemPrompt, userPrompt);
            return response;
        } catch (error) {
            throw new Error(`Failed to explain code: ${error}`);
        }
    }

    async generateDocumentation(code: string, languageId: string): Promise<string> {
        const systemPrompt = `You are a documentation expert. Generate comprehensive documentation 
        for the provided code including function descriptions, parameter explanations, return values, 
        and usage examples.`;

        const userPrompt = `Generate documentation for this ${languageId} code:\n\n${code}`;

        try {
            const response = await this.aiService.generateCompletion(systemPrompt, userPrompt);
            return response;
        } catch (error) {
            throw new Error(`Failed to generate documentation: ${error}`);
        }
    }

    private extractCodeFromResponse(response: string, languageId: string): string {
        // Remove markdown code blocks and clean up the response
        const codeBlockRegex = new RegExp(`\`\`\`${languageId}?\\n?([\\s\\S]*?)\`\`\``, 'gi');
        const match = codeBlockRegex.exec(response);
        
        if (match && match[1]) {
            return match[1].trim();
        }

        // If no code block found, return the response as-is (might be inline code)
        return response.trim();
    }

    async generateCodeCompletion(context: string, languageId: string): Promise<string[]> {
        const systemPrompt = `You are an intelligent code completion system. Based on the provided context, 
        suggest the most likely code completions. Return multiple suggestions if appropriate.`;

        const userPrompt = `Complete this ${languageId} code:\n${context}`;

        try {
            const response = await this.aiService.generateCompletion(systemPrompt, userPrompt);
            // Parse multiple suggestions if provided
            return [this.extractCodeFromResponse(response, languageId)];
        } catch (error) {
            throw new Error(`Failed to generate code completion: ${error}`);
        }
    }
}