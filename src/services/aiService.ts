import { ConfigManager } from '../utils/configManager';
import OpenAI from 'openai';
import axios from 'axios';

export class AIService {
    private openai?: OpenAI;
    private configManager: ConfigManager;

    constructor(configManager: ConfigManager) {
        this.configManager = configManager;
        this.initializeAI();
    }

    private initializeAI(): void {
        const apiKey = this.configManager.getApiKey();
        const model = this.configManager.getModel();

        if (apiKey && (model === 'gpt-4' || model === 'gpt-3.5-turbo')) {
            this.openai = new OpenAI({
                apiKey: apiKey
            });
        }
    }

    async generateCompletion(systemPrompt: string, userPrompt: string): Promise<string> {
        const model = this.configManager.getModel();
        const maxTokens = this.configManager.getMaxTokens();

        try {
            switch (model) {
                case 'gpt-4':
                case 'gpt-3.5-turbo':
                    return await this.generateOpenAICompletion(systemPrompt, userPrompt, model, maxTokens);
                case 'claude-3':
                    return await this.generateClaudeCompletion(systemPrompt, userPrompt, maxTokens);
                case 'custom':
                    return await this.generateCustomCompletion(systemPrompt, userPrompt, maxTokens);
                default:
                    throw new Error(`Unsupported model: ${model}`);
            }
        } catch (error) {
            throw new Error(`AI service error: ${error}`);
        }
    }

    private async generateOpenAICompletion(
        systemPrompt: string, 
        userPrompt: string, 
        model: string, 
        maxTokens: number
    ): Promise<string> {
        if (!this.openai) {
            throw new Error('OpenAI client not initialized. Please check your API key.');
        }

        const response = await this.openai.chat.completions.create({
            model: model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            max_tokens: maxTokens,
            temperature: 0.7,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0
        });

        return response.choices[0]?.message?.content || 'No response generated';
    }

    private async generateClaudeCompletion(
        systemPrompt: string, 
        userPrompt: string, 
        maxTokens: number
    ): Promise<string> {
        const apiKey = this.configManager.getApiKey();
        
        if (!apiKey) {
            throw new Error('API key required for Claude');
        }

        // Claude API implementation
        const response = await axios.post('https://api.anthropic.com/v1/messages', {
            model: 'claude-3-sonnet-20240229',
            max_tokens: maxTokens,
            system: systemPrompt,
            messages: [
                { role: 'user', content: userPrompt }
            ]
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            }
        });

        return response.data.content[0]?.text || 'No response generated';
    }

    private async generateCustomCompletion(
        systemPrompt: string, 
        userPrompt: string, 
        maxTokens: number
    ): Promise<string> {
        // Placeholder for custom AI service integration
        // Users can implement their own AI service here
        const customEndpoint = this.configManager.getCustomEndpoint();
        
        if (!customEndpoint) {
            throw new Error('Custom endpoint not configured');
        }

        const response = await axios.post(customEndpoint, {
            system_prompt: systemPrompt,
            user_prompt: userPrompt,
            max_tokens: maxTokens
        }, {
            headers: {
                'Authorization': `Bearer ${this.configManager.getApiKey()}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data.response || response.data.content || 'No response generated';
    }

    async isConfigured(): Promise<boolean> {
        const apiKey = this.configManager.getApiKey();
        const model = this.configManager.getModel();
        
        if (!apiKey || !model) {
            return false;
        }

        try {
            // Test the connection with a simple request
            await this.generateCompletion(
                'You are a helpful assistant.',
                'Say "OK" if you can respond.'
            );
            return true;
        } catch (error) {
            return false;
        }
    }

    async getAvailableModels(): Promise<string[]> {
        const model = this.configManager.getModel();
        
        switch (model) {
            case 'gpt-4':
            case 'gpt-3.5-turbo':
                if (this.openai) {
                    try {
                        const models = await this.openai.models.list();
                        return models.data
                            .filter(m => m.id.includes('gpt'))
                            .map(m => m.id);
                    } catch (error) {
                        return ['gpt-4', 'gpt-3.5-turbo'];
                    }
                }
                return ['gpt-4', 'gpt-3.5-turbo'];
            case 'claude-3':
                return ['claude-3-sonnet-20240229', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'];
            case 'custom':
                return ['custom'];
            default:
                return ['gpt-4', 'gpt-3.5-turbo', 'claude-3', 'custom'];
        }
    }

    async estimateTokens(text: string): Promise<number> {
        // Simple token estimation (approximately 4 characters per token for English)
        return Math.ceil(text.length / 4);
    }
}