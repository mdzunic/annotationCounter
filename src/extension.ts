'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    let activeEditor = vscode.window.activeTextEditor;
    let fileMatch: string;
    let positionArr: { start: vscode.Position, end: vscode.Position }[] = [];
    let clickCounter: number = 0;
    const decorationType = vscode.window.createTextEditorDecorationType({
        color: 'blue',
        borderWidth: '1px',
        borderStyle: 'dashed',
        fontStyle: 'bold',
        light: {
            // this color will be used in light color themes
            color: 'darkblue'
        },
        dark: {
            // this color will be used in dark color themes
            color: 'lightblue'
        }
    });
    
    let userInput = null;
    let keyword = userInput || 'TODO';

    const statusBarItem: vscode.StatusBarItem =  vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);

    const renderStatusBarItem = () => {
        positionArr = [];
        if (activeEditor) {
            const todoRegex = new RegExp('//\\s\*' + keyword, 'gi');
            const text = activeEditor.document.getText();
            let match;
            let count = 0;

            while (match = todoRegex.exec(text)) {
                const startPos = activeEditor.document.positionAt(match.index + 2);
                const endPos = activeEditor.document.positionAt(match.index + match[0].length);
                positionArr.push({ start: startPos, end: endPos });
                count++;
            }
            fileMatch = count + '';
            if (count > 0) {
                statusBarItem.text = count !== 1 ? `${count} ${keyword}s` : `1 ${keyword}`;
                statusBarItem.show();
                statusBarItem.command = 'extension.annotationCounter';
            } else {
                statusBarItem.text =`No ${keyword}`;
                statusBarItem.show();
                statusBarItem.command = 'extension.annotationCounter';
            }
        }
    };
    
    if (activeEditor) { renderStatusBarItem(); }
    vscode.window.onDidChangeActiveTextEditor(editor => {
        activeEditor = editor;
        statusBarItem.hide();
		if (editor) {
            editor.setDecorations(decorationType, []);
            renderStatusBarItem();
		}
	}, null, context.subscriptions);
    
	vscode.workspace.onDidChangeTextDocument(event => {
        if (activeEditor && event.document === activeEditor.document) {
            activeEditor.setDecorations(decorationType, []);
            renderStatusBarItem();
		}
	}, null, context.subscriptions);
    
    let disposable = vscode.commands.registerCommand('extension.annotationCounter', () => {
        const gotoButton = { title: 'Go to next match', action: 'goto' };
        const newKeyword = { title: 'Set new keyword', action: 'new' };
        const thenable = (item: any): void => {
            if (item) {
                const { action } = item;

                if (action === 'goto') {
                    const i = clickCounter % positionArr.length;
                    let newPosition = positionArr[i];
                    let newSelection = new vscode.Selection(newPosition.start, newPosition.end);
                    const range = new vscode.Range(newPosition.start, newPosition.end);
                    if (activeEditor) {
                        activeEditor.selection = newSelection;
                        activeEditor.revealRange(range);
                        const decorationRange = [{ range: range, hoverMessage: '👷‍'}];
                        activeEditor.setDecorations(decorationType, decorationRange);
                    }
                    clickCounter++;
                } else {
                    vscode.window.showInputBox().then((result) => {
                        // TODO: escape user input
                        if (result && result.length < 30) {
                            keyword = escape(result);
                            if (activeEditor) { renderStatusBarItem(); }
                        }
                    });
                }
            }
        };

        if (fileMatch !== '0') {
            vscode.window.showInformationMessage(`Number of ${keyword}s in file ${fileMatch}`, gotoButton, newKeyword).then(thenable);
        } else {
            vscode.window.showInformationMessage(`Number of ${keyword}s in file ${fileMatch}`, newKeyword).then(thenable);
        }
          
    });
    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}