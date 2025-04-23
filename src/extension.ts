import * as vscode from 'vscode';
import { Decorator } from './decorator';

export function activate(context: vscode.ExtensionContext) {
  const decorator = new Decorator();
  decorator.setActiveEditor(vscode.window.activeTextEditor);

  const changeActiveTextEditor = vscode.window.onDidChangeActiveTextEditor(() => {
    decorator.setActiveEditor(vscode.window.activeTextEditor);
  });
  const changeTextEditorSelection = vscode.window.onDidChangeTextEditorSelection(() => {
    decorator.updateDecorations();
  });

  context.subscriptions.push(changeActiveTextEditor);
  context.subscriptions.push(changeTextEditorSelection);

  // Register a document link provider so markdown links become clickable and show hover highlights
  const linkProvider = vscode.languages.registerDocumentLinkProvider(
    [{ language: 'markdown' }, { language: 'md' }, { language: 'mdx' }],
    {
      provideDocumentLinks(document, _token) {
        const text = document.getText();
        const regex = /(?<!!)\[([^\]]+)\]\(([^)]+)\)/g;
        const links: vscode.DocumentLink[] = [];
        let match: RegExpExecArray | null;
        while ((match = regex.exec(text))) {
          const title = match[1]!;
          const url = match[2]!;
          const startIndex = match.index + 1;
          const startPos = document.positionAt(startIndex);
          const endPos = document.positionAt(startIndex + title.length);
          const range = new vscode.Range(startPos, endPos);
          try {
            const target = vscode.Uri.parse(url);
            const link = new vscode.DocumentLink(range, target);
            link.tooltip = url;
            links.push(link);
          } catch {
            // ignore invalid URLs
          }
        }
        return links;
      }
    }
  );
  context.subscriptions.push(linkProvider);
}

export function deactivate(context: vscode.ExtensionContext) {
  context.subscriptions.forEach((subscription) => subscription.dispose());
}
