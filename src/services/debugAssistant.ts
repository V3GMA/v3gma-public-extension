import { ConfigManager } from '../utils/configManager';
import { AIService } from './aiService';

export interface DebugSuggestion {
    issue: string;
    severity: 'error' | 'warning' | 'info';
    explanation: string;
    solution: string;
    codeExample?: string;
}

export class DebugAssistant {
    private aiService: AIService;

    constructor(private configManager: ConfigManager) {
        this.aiService = new AIService(configManager);
    }

    async analyzeCode(code: string, languageId: string): Promise<string> {
        const systemPrompt = `You are an expert ${languageId} debugger and code reviewer. 
        Analyze the provided code for potential bugs, issues, performance problems, and suggest improvements. 
        Provide clear explanations and actionable solutions.`;

        const userPrompt = `Analyze this ${languageId} code for issues and provide debugging suggestions:\n\n${code}`;

        try {
            const response = await this.aiService.generateCompletion(systemPrompt, userPrompt);
            return response;
        } catch (error) {
            throw new Error(`Failed to analyze code: ${error}`);
        }
    }

    async findBugs(code: string, languageId: string): Promise<DebugSuggestion[]> {
        const systemPrompt = `You are a bug detection expert for ${languageId}. 
        Identify potential bugs, logic errors, syntax issues, and common pitfalls. 
        For each issue found, provide: the issue type, severity level, detailed explanation, and solution.`;

        const userPrompt = `Find bugs and issues in this ${languageId} code:\n\n${code}`;

        try {
            const response = await this.aiService.generateCompletion(systemPrompt, userPrompt);
            return this.parseDebugResponse(response);
        } catch (error) {
            throw new Error(`Failed to find bugs: ${error}`);
        }
    }

    async explainError(errorMessage: string, code: string, languageId: string): Promise<string> {
        const systemPrompt = `You are an error explanation expert for ${languageId}. 
        Given an error message and the problematic code, provide a clear explanation of what went wrong, 
        why it happened, and how to fix it.`;

        const userPrompt = `Explain this ${languageId} error:\n\nError: ${errorMessage}\n\nCode:\n${code}`;

        try {
            const response = await this.aiService.generateCompletion(systemPrompt, userPrompt);
            return response;
        } catch (error) {
            throw new Error(`Failed to explain error: ${error}`);
        }
    }

    async suggestFix(code: string, issue: string, languageId: string): Promise<string> {
        const systemPrompt = `You are a code fixing expert for ${languageId}. 
        Provide a corrected version of the code that addresses the specified issue. 
        Include comments explaining the changes made.`;

        const userPrompt = `Fix this ${languageId} code to resolve the following issue: ${issue}\n\nCode:\n${code}`;

        try {
            const response = await this.aiService.generateCompletion(systemPrompt, userPrompt);
            return this.extractCodeFromResponse(response, languageId);
        } catch (error) {
            throw new Error(`Failed to suggest fix: ${error}`);
        }
    }

    async performSecurityAudit(code: string, languageId: string): Promise<string> {
        const systemPrompt = `You are a security expert for ${languageId}. 
        Audit the provided code for security vulnerabilities, including but not limited to:
        - SQL injection risks
        - XSS vulnerabilities  
        - Authentication/authorization issues
        - Input validation problems
        - Sensitive data exposure
        - Common security anti-patterns`;

        const userPrompt = `Perform a security audit on this ${languageId} code:\n\n${code}`;

        try {
            const response = await this.aiService.generateCompletion(systemPrompt, userPrompt);
            return response;
        } catch (error) {
            throw new Error(`Failed to perform security audit: ${error}`);
        }
    }

    async checkPerformance(code: string, languageId: string): Promise<string> {
        const systemPrompt = `You are a performance optimization expert for ${languageId}. 
        Analyze the code for performance bottlenecks, inefficiencies, and suggest optimizations. 
        Consider time complexity, space complexity, and language-specific performance best practices.`;

        const userPrompt = `Analyze the performance of this ${languageId} code and suggest optimizations:\n\n${code}`;

        try {
            const response = await this.aiService.generateCompletion(systemPrompt, userPrompt);
            return response;
        } catch (error) {
            throw new Error(`Failed to check performance: ${error}`);
        }
    }

    private parseDebugResponse(response: string): DebugSuggestion[] {
        // This is a simplified parser - in a real implementation, you might want more sophisticated parsing
        const suggestions: DebugSuggestion[] = [];
        
        // Basic parsing logic (can be enhanced based on response format)
        const lines = response.split('\n');
        let currentSuggestion: Partial<DebugSuggestion> = {};
        
        for (const line of lines) {
            if (line.toLowerCase().includes('error') || line.toLowerCase().includes('bug')) {
                if (currentSuggestion.issue) {
                    suggestions.push(currentSuggestion as DebugSuggestion);
                }
                currentSuggestion = {
                    issue: line.trim(),
                    severity: 'error',
                    explanation: '',
                    solution: ''
                };
            } else if (line.toLowerCase().includes('warning')) {
                currentSuggestion.severity = 'warning';
            } else if (currentSuggestion.issue) {
                if (!currentSuggestion.explanation) {
                    currentSuggestion.explanation = line.trim();
                } else {
                    currentSuggestion.solution = (currentSuggestion.solution || '') + line.trim() + ' ';
                }
            }
        }
        
        if (currentSuggestion.issue) {
            suggestions.push(currentSuggestion as DebugSuggestion);
        }
        
        return suggestions.length > 0 ? suggestions : [{
            issue: 'General Analysis',
            severity: 'info',
            explanation: response,
            solution: 'Review the analysis above for detailed feedback.'
        }];
    }

    private extractCodeFromResponse(response: string, languageId: string): string {
        const codeBlockRegex = new RegExp(`\`\`\`${languageId}?\\n?([\\s\\S]*?)\`\`\``, 'gi');
        const match = codeBlockRegex.exec(response);
        
        if (match && match[1]) {
            return match[1].trim();
        }

        return response.trim();
    }
}