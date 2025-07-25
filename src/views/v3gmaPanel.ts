import * as vscode from 'vscode';

export class WasaamiPanel implements vscode.WebviewViewProvider {
    public static readonly viewType = 'wasaamiPanel';
    private _view?: vscode.WebviewView;

    constructor(private readonly _extensionUri: vscode.Uri) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(data => {
            switch (data.type) {
                case 'generateCode':
                    vscode.commands.executeCommand('wasaami.generateCode');
                    break;
                case 'debugAssist':
                    vscode.commands.executeCommand('wasaami.debugAssist');
                    break;
                case 'refactorCode':
                    vscode.commands.executeCommand('wasaami.refactorCode');
                    break;
                case 'explainCode':
                    vscode.commands.executeCommand('wasaami.explainCode');
                    break;
                case 'openSettings':
                    vscode.commands.executeCommand('wasaami.openSettings');
                    break;
            }
        });
    }

    public updateStatus(status: string) {
        if (this._view) {
            this._view.webview.postMessage({ type: 'updateStatus', status });
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Wasaami Assistant</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    color: var(--vscode-foreground);
                    background-color: var(--vscode-sideBar-background);
                    margin: 0;
                    padding: 20px;
                }
                
                .header {
                    text-align: center;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid var(--vscode-sideBarSectionHeader-border);
                }
                
                .logo {
                    font-size: 24px;
                    font-weight: bold;
                    color: var(--vscode-textLink-foreground);
                    margin-bottom: 5px;
                }
                
                .subtitle {
                    font-size: 12px;
                    color: var(--vscode-descriptionForeground);
                    opacity: 0.8;
                }
                
                .actions {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                
                .action-button {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 12px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 13px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: background-color 0.2s;
                }
                
                .action-button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                
                .action-button:active {
                    background-color: var(--vscode-button-background);
                    opacity: 0.8;
                }
                
                .secondary-button {
                    background-color: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                }
                
                .secondary-button:hover {
                    background-color: var(--vscode-button-secondaryHoverBackground);
                }
                
                .status {
                    margin-top: 20px;
                    padding: 10px;
                    border-radius: 4px;
                    background-color: var(--vscode-textBlockQuote-background);
                    border-left: 4px solid var(--vscode-textBlockQuote-border);
                    font-size: 12px;
                }
                
                .features {
                    margin-top: 30px;
                }
                
                .features h3 {
                    font-size: 14px;
                    margin-bottom: 10px;
                    color: var(--vscode-sideBarSectionHeader-foreground);
                }
                
                .feature-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                
                .feature-list li {
                    padding: 5px 0;
                    font-size: 12px;
                    color: var(--vscode-descriptionForeground);
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                
                .feature-list li::before {
                    content: "✓";
                    color: var(--vscode-testing-iconPassed);
                    font-weight: bold;
                }
                
                .shortcuts {
                    margin-top: 20px;
                    padding: 15px;
                    background-color: var(--vscode-editor-background);
                    border-radius: 4px;
                    border: 1px solid var(--vscode-panel-border);
                }
                
                .shortcuts h4 {
                    margin: 0 0 10px 0;
                    font-size: 12px;
                    color: var(--vscode-sideBarSectionHeader-foreground);
                }
                
                .shortcut {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin: 5px 0;
                    font-size: 11px;
                }
                
                .shortcut-key {
                    background-color: var(--vscode-keybindingLabel-background);
                    color: var(--vscode-keybindingLabel-foreground);
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-family: monospace;
                    border: 1px solid var(--vscode-keybindingLabel-border);
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">🤖 Wasaami</div>
                <div class="subtitle">AI Code Assistant</div>
            </div>
            
            <div class="actions">
                <button class="action-button" onclick="generateCode()">
                    <span>⚡</span> Generate Code
                </button>
                <button class="action-button" onclick="debugAssist()">
                    <span>🐛</span> Debug Assistant
                </button>
                <button class="action-button" onclick="refactorCode()">
                    <span>🔧</span> Refactor Code
                </button>
                <button class="action-button" onclick="explainCode()">
                    <span>📖</span> Explain Code
                </button>
                <button class="action-button secondary-button" onclick="openSettings()">
                    <span>⚙️</span> Settings
                </button>
            </div>
            
            <div class="status" id="status">
                Ready to assist with your code!
            </div>
            
            <div class="features">
                <h3>Features</h3>
                <ul class="feature-list">
                    <li>Intelligent Code Generation</li>
                    <li>Smart Debugging Assistance</li>
                    <li>Automated Code Refactoring</li>
                    <li>Multi-Language Support</li>
                    <li>Performance Optimization</li>
                    <li>Security Analysis</li>
                </ul>
            </div>
            
            <div class="shortcuts">
                <h4>Keyboard Shortcuts</h4>
                <div class="shortcut">
                    <span>Generate Code</span>
                    <span class="shortcut-key">Ctrl+Alt+G</span>
                </div>
                <div class="shortcut">
                    <span>Debug Assist</span>
                    <span class="shortcut-key">Ctrl+Alt+D</span>
                </div>
                <div class="shortcut">
                    <span>Refactor</span>
                    <span class="shortcut-key">Ctrl+Alt+R</span>
                </div>
            </div>
            
            <script>
                const vscode = acquireVsCodeApi();
                
                function generateCode() {
                    vscode.postMessage({ type: 'generateCode' });
                }
                
                function debugAssist() {
                    vscode.postMessage({ type: 'debugAssist' });
                }
                
                function refactorCode() {
                    vscode.postMessage({ type: 'refactorCode' });
                }
                
                function explainCode() {
                    vscode.postMessage({ type: 'explainCode' });
                }
                
                function openSettings() {
                    vscode.postMessage({ type: 'openSettings' });
                }
                
                window.addEventListener('message', event => {
                    const message = event.data;
                    switch (message.type) {
                        case 'updateStatus':
                            document.getElementById('status').textContent = message.status;
                            break;
                    }
                });
            </script>
        </body>
        </html>`;
    }
}