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

	const statusBarItem: vscode.StatusBarItem =
		vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);

	const renderStatusBarItem = () => {
		positionArr = [];
		if (activeEditor) {
			// "// keyword" or "/** keyword */"
			const todoRegex = new RegExp(`(/\\*([^*]|[\\r\\n]|(\\*+([^*/]|[\\r\n])))*\\*+/)|(//.*)${keyword}`, 'gi');
			const text = activeEditor.document.getText();
			let match;
			let count = 0;

			while (match = todoRegex.exec(text)) {
				const startPos = activeEditor.document.positionAt(match.index + 2);
				const endPos = activeEditor.document.positionAt(match.index + match[0].length);
				positionArr.push({ start: startPos, end: endPos });
				count++;
			}
			fileMatch = `${count}`;

			statusBarItem.text = count > 0 ? `${keyword.toUpperCase()}s: ${count}` : `No ${keyword}s`;
			statusBarItem.show();
			statusBarItem.command = 'extension.annotationCounter';
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
					if (activeEditor) {
						let newPosition = positionArr[i];
						let newSelection = new vscode.Selection(newPosition.start, newPosition.end);
						const range = new vscode.Range(newPosition.start, newPosition.end);
						const decorationRange = [{ range: range, hoverMessage: '👷‍Annotation found!' }];

						activeEditor.selection = newSelection;
						activeEditor.revealRange(range);
						activeEditor.setDecorations(decorationType, decorationRange);
					}
					clickCounter++;
				} else {
					vscode.window.showInputBox().then((result) => {
						// escape user input
						if (result && result.length < 20 && activeEditor) {
							keyword = escape(result);
							renderStatusBarItem();
						}
					});
				}
			}
		};

		const infoMessage = `Number of ${keyword}s in file ${fileMatch}`;
		const args = (fileMatch === '0') ? [newKeyword] : [gotoButton, newKeyword];
		vscode.window.showInformationMessage(infoMessage, ...args).then(thenable);

	});
	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}