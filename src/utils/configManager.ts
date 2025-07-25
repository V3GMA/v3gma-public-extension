import * as vscode from 'vscode';

export class ConfigManager {
    private readonly configSection = 'wasaami';

    getConfiguration(): vscode.WorkspaceConfiguration {
        return vscode.workspace.getConfiguration(this.configSection);
    }

    getApiKey(): string {
        return this.getConfiguration().get<string>('apiKey', '');
    }

    getModel(): string {
        return this.getConfiguration().get<string>('model', 'gpt-4');
    }

    getMaxTokens(): number {
        return this.getConfiguration().get<number>('maxTokens', 2048);
    }

    isAutoCompleteEnabled(): boolean {
        return this.getConfiguration().get<boolean>('enableAutoComplete', true);
    }

    areInlineHintsEnabled(): boolean {
        return this.getConfiguration().get<boolean>('enableInlineHints', true);
    }

    getSupportedLanguages(): string[] {
        return this.getConfiguration().get<string[]>('supportedLanguages', [
            'javascript', 'typescript', 'python', 'java', 'cpp', 'csharp', 'go', 'rust'
        ]);
    }

    getCustomEndpoint(): string {
        return this.getConfiguration().get<string>('customEndpoint', '');
    }

    getTemperature(): number {
        return this.getConfiguration().get<number>('temperature', 0.7);
    }

    getRequestTimeout(): number {
        return this.getConfiguration().get<number>('requestTimeout', 30000);
    }

    isLanguageSupported(languageId: string): boolean {
        const supportedLanguages = this.getSupportedLanguages();
        return supportedLanguages.includes(languageId.toLowerCase());
    }

    async updateConfiguration(key: string, value: any, target?: vscode.ConfigurationTarget): Promise<void> {
        const config = this.getConfiguration();
        await config.update(key, value, target || vscode.ConfigurationTarget.Global);
    }

    async setApiKey(apiKey: string): Promise<void> {
        await this.updateConfiguration('apiKey', apiKey);
    }

    async setModel(model: string): Promise<void> {
        await this.updateConfiguration('model', model);
    }

    async setMaxTokens(maxTokens: number): Promise<void> {
        await this.updateConfiguration('maxTokens', maxTokens);
    }

    async toggleAutoComplete(): Promise<void> {
        const current = this.isAutoCompleteEnabled();
        await this.updateConfiguration('enableAutoComplete', !current);
    }

    async toggleInlineHints(): Promise<void> {
        const current = this.areInlineHintsEnabled();
        await this.updateConfiguration('enableInlineHints', !current);
    }

    validateConfiguration(): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];
        
        const apiKey = this.getApiKey();
        if (!apiKey || apiKey.trim() === '') {
            errors.push('API key is required');
        }

        const model = this.getModel();
        const validModels = ['gpt-4', 'gpt-3.5-turbo', 'claude-3', 'custom'];
        if (!validModels.includes(model)) {
            errors.push(`Invalid model: ${model}. Valid options: ${validModels.join(', ')}`);
        }

        const maxTokens = this.getMaxTokens();
        if (maxTokens <= 0 || maxTokens > 8192) {
            errors.push('Max tokens must be between 1 and 8192');
        }

        const temperature = this.getTemperature();
        if (temperature < 0 || temperature > 2) {
            errors.push('Temperature must be between 0 and 2');
        }

        const timeout = this.getRequestTimeout();
        if (timeout < 1000 || timeout > 300000) {
            errors.push('Request timeout must be between 1 and 300 seconds');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    getConfigurationSummary(): string {
        return `
Model: ${this.getModel()}
Max Tokens: ${this.getMaxTokens()}
Auto Complete: ${this.isAutoCompleteEnabled() ? 'Enabled' : 'Disabled'}
Inline Hints: ${this.areInlineHintsEnabled() ? 'Enabled' : 'Disabled'}
Supported Languages: ${this.getSupportedLanguages().join(', ')}
Temperature: ${this.getTemperature()}
Timeout: ${this.getRequestTimeout()}ms
        `.trim();
    }

    onConfigurationChanged(callback: (e: vscode.ConfigurationChangeEvent) => void): vscode.Disposable {
        return vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration(this.configSection)) {
                callback(e);
            }
        });
    }
}