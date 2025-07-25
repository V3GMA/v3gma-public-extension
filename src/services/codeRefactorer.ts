import { ConfigManager } from '../utils/configManager';
import { AIService } from './aiService';

export interface RefactoringOptions {
    type: 'cleanup' | 'optimize' | 'modernize' | 'extract' | 'rename' | 'structure';
    preserveLogic: boolean;
    targetVersion?: string;
}

export class CodeRefactorer {
    private aiService: AIService;

    constructor(private configManager: ConfigManager) {
        this.aiService = new AIService(configManager);
    }

    async refactorCode(code: string, languageId: string, options: Partial<RefactoringOptions> = {}): Promise<string> {
        const defaultOptions: RefactoringOptions = {
            type: 'cleanup',
            preserveLogic: true,
            ...options
        };

        const systemPrompt = this.getRefactoringPrompt(languageId, defaultOptions);
        const userPrompt = `Refactor this ${languageId} code:\n\n${code}`;

        try {
            const response = await this.aiService.generateCompletion(systemPrompt, userPrompt);
            return this.extractCodeFromResponse(response, languageId);
        } catch (error) {
            throw new Error(`Failed to refactor code: ${error}`);
        }
    }

    async cleanupCode(code: string, languageId: string): Promise<string> {
        return this.refactorCode(code