import * as vscode from 'vscode';
import * as path from 'path';
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
  const changeConfiguration = vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('mira')) {
      decorator.updateDecorations();
    }
  });

  context.subscriptions.push(changeActiveTextEditor);
  context.subscriptions.push(changeTextEditorSelection);
  context.subscriptions.push(changeConfiguration);

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
        // Provide links for inline images as well (using the alt text as the clickable range)
        const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
        while ((match = imageRegex.exec(text))) {
          const altText = match[1] ?? '';
          const url = match[2]!;

          if (altText.length === 0) {
            continue; // nothing visible to click on
          }

          const anchorStartIndex = match.index + 2; // skip '!['
          const anchorEndIndex = anchorStartIndex + altText.length;
          const startPos = document.positionAt(anchorStartIndex);
          const endPos = document.positionAt(anchorEndIndex);
          const range = new vscode.Range(startPos, endPos);

          let target: vscode.Uri | undefined;
          try {
            if (/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) {
              target = vscode.Uri.parse(url);
            } else {
              // Treat as local/relative path
              const absolutePath = path.resolve(path.dirname(document.uri.fsPath), url);
              target = vscode.Uri.file(absolutePath);
            }
          } catch {
            target = undefined;
          }

          if (target) {
            const link = new vscode.DocumentLink(range, target);
            link.tooltip = altText || url;
            links.push(link);
          }
        }
        return links;
      }
    }
  );
  context.subscriptions.push(linkProvider);

  // Register a hover provider to preview images on hover
  const hoverProvider = vscode.languages.registerHoverProvider(
    [{ language: 'markdown' }, { language: 'md' }, { language: 'mdx' }],
    {
      provideHover(document, position, _token) {
        const text = document.getText();
        const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
        let match: RegExpExecArray | null;
        while ((match = imageRegex.exec(text))) {
          const altText = match[1] ?? '';
          const url = match[2]!;

          // Determine the range of the alt text inside the brackets
          const altStartIndex = match.index + 2; // skip '!['
          const altEndIndex = altStartIndex + altText.length;
          if (altText.length === 0) {
            continue; // no visible anchor to hover on
          }
          const altRange = new vscode.Range(
            document.positionAt(altStartIndex),
            document.positionAt(altEndIndex),
          );

          if (altRange.contains(position)) {
            const md = new vscode.MarkdownString(`![${altText || 'image'}](${url})`);
            md.isTrusted = true;
            return new vscode.Hover(md, altRange);
          }
        }
        return undefined;
      },
    },
  );
  context.subscriptions.push(hoverProvider);
}

export function deactivate(context: vscode.ExtensionContext) {
  context.subscriptions.forEach((subscription) => subscription.dispose());
}
