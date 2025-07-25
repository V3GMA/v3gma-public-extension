import * as vscode from 'vscode';
import { CodeGenerator } from './services/codeGenerator';
import { DebugAssistant } from './services/debugAssistant';
import { CodeRefactorer } from './services/codeRefactorer';
import { v3gmaPanel } from './views/v3gmaPanel';
import { ConfigManager } from './utils/configManager';

export function activate(context: vscode.ExtensionContext) {
    console.log('Wasaami AI Code Assistant is now active!');

    const configManager = new ConfigManager();
    const codeGenerator = new CodeGenerator(configManager);
    const debugAssistant = new DebugAssistant(configManager);
    const codeRefactorer = new CodeRefactorer(configManager);
    const v3gmaPanel = new v3gmaPanel(context.extensionUri);

    // Set context for views
    vscode.commands.executeCommand('setContext', 'wasaami:enabled', true);

    // Register commands
    const generateCodeCommand = vscode.commands.registerCommand(
        'wasaami.generateCode',
        async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor found');
                return;
            }

            const prompt = await vscode.window.showInputBox({
                prompt: 'Describe the code you want to generate',
                placeHolder: 'e.g., Create a function to sort an array of objects by name'
            });

            if (!prompt) return;

            try {
                const generatedCode = await codeGenerator.generateCode(prompt, editor.document.languageId);
                const position = editor.selection.active;
                
                await editor.edit(editBuilder => {
                    editBuilder.insert(position, generatedCode);
                });

                vscode.window.showInformationMessage('Code generated successfully!');
            } catch (error) {
                vscode.window.showErrorMessage(`Error generating code: ${error}`);
            }
        }
    );

    const debugAssistCommand = vscode.commands.registerCommand(
        'wasaami.debugAssist',
        async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor found');
                return;
            }

            const selection = editor.document.getText(editor.selection);
            if (!selection) {
                vscode.window.showErrorMessage('Please select code to debug');
                return;
            }

            try {
                const debugSuggestion = await debugAssistant.analyzeCode(selection, editor.document.languageId);
                
                const panel = vscode.window.createWebviewPanel(
                    'wasaamiDebug',
                    'Wasaami Debug Assistant',
                    vscode.ViewColumn.Two,
                    { enableScripts: true }
                );

                panel.webview.html = getDebugWebviewContent(debugSuggestion);
            } catch (error) {
                vscode.window.showErrorMessage(`Error analyzing code: ${error}`);
            }
        }
    );

    const refactorCodeCommand = vscode.commands.registerCommand(
        'wasaami.refactorCode',
        async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor found');
                return;
            }

            const selection = editor.document.getText(editor.selection);
            if (!selection) {
                vscode.window.showErrorMessage('Please select code to refactor');
                return;
            }

            try {
                const refactoredCode = await codeRefactorer.refactorCode(selection, editor.document.languageId);
                
                const action = await vscode.window.showInformationMessage(
                    'Code refactored successfully! Apply changes?',
                    'Apply',
                    'Compare',
                    'Cancel'
                );

                if (action === 'Apply') {
                    await editor.edit(editBuilder => {
                        editBuilder.replace(editor.selection, refactoredCode);
                    });
                } else if (action === 'Compare') {
                    // Open diff view
                    const originalUri = vscode.Uri.parse('untitled:Original');
                    const refactoredUri = vscode.Uri.parse('untitled:Refactored');
                    
                    await vscode.workspace.openTextDocument(originalUri).then(doc => {
                        vscode.window.showTextDocument(doc);
                    });
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Error refactoring code: ${error}`);
            }
        }
    );

    const explainCodeCommand = vscode.commands.registerCommand(
        'wasaami.explainCode',
        async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor found');
                return;
            }

            const selection = editor.document.getText(editor.selection);
            if (!selection) {
                vscode.window.showErrorMessage('Please select code to explain');
                return;
            }

            try {
                const explanation = await codeGenerator.explainCode(selection, editor.document.languageId);
                
                const panel = vscode.window.createWebviewPanel(
                    'wasaamiExplain',
                    'Wasaami Code Explanation',
                    vscode.ViewColumn.Two,
                    { enableScripts: true }
                );

                panel.webview.html = getExplanationWebviewContent(explanation, selection);
            } catch (error) {
                vscode.window.showErrorMessage(`Error explaining code: ${error}`);
            }
        }
    );

    const openSettingsCommand = vscode.commands.registerCommand(
        'wasaami.openSettings',
        () => {
            vscode.commands.executeCommand('workbench.action.openSettings', 'wasaami');
        }
    );

    // Register webview provider for the panel
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('wasaamiPanel', wasaamiPanel)
    );

    // Add all commands to subscriptions
    context.subscriptions.push(
        generateCodeCommand,
        debugAssistCommand,
        refactorCodeCommand,
        explainCodeCommand,
        openSettingsCommand
    );

    // Status bar item
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = "$(robot) Wasaami";
    statusBarItem.tooltip = "Wasaami AI Assistant - Ready";
    statusBarItem.command = 'wasaami.openSettings';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
}

function getDebugWebviewContent(suggestion: string): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Debug Assistant</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 20px; background-color: var(--vscode-editor-background); color: var(--vscode-editor-foreground); }
            .suggestion { background-color: var(--vscode-textBlockQuote-background); padding: 15px; border-radius: 5px; border-left: 4px solid var(--vscode-textBlockQuote-border); }
            h1 { color: var(--vscode-textPreformat-foreground); }
        </style>
    </head>
    <body>
        <h1>🔍 Debug Analysis</h1>
        <div class="suggestion">${suggestion}</div>
    </body>
    </html>`;
}

function getExplanationWebviewContent(explanation: string, code: string): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Code Explanation</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 20px; background-color: var(--vscode-editor-background); color: var(--vscode-editor-foreground); }
            .code { background-color: var(--vscode-textCodeBlock-background); padding: 15px; border-radius: 5px; font-family: monospace; margin: 10px 0; }
            .explanation { background-color: var(--vscode-textBlockQuote-background); padding: 15px; border-radius: 5px; border-left: 4px solid var(--vscode-textBlockQuote-border); }
            h1 { color: var(--vscode-textPreformat-foreground); }
        </style>
    </head>
    <body>
        <h1>📚 Code Explanation</h1>
        <h3>Selected Code:</h3>
        <div class="code">${code}</div>
        <h3>Explanation:</h3>
        <div class="explanation">${explanation}</div>
    </body>
    </html>`;
}

export function deactivate() {
    console.log('Wasaami AI Code Assistant deactivated');
}