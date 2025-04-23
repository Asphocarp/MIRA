import { Range, TextEditor } from 'vscode';
import {
  DefaultColorDecorationType, HideDecorationType, XxlTextDecorationType, XlTextDecorationType, LTextDecorationType,
  CheckboxCheckedDecorationType, CheckboxUncheckedDecorationType,
} from './decorations';

const boldRegex = /(\*{2}|_{2})((?=[^\s*_]).*?[^\s*_])(\1)/g;
const italicRegex = /(?<!\*|_)(\*|_)((?=[^\s*_]).*?[^\s*_])(\1)(?!\*|_)/g;
const strikethroughRegex = /(?<!~)(~{2})((?=[^\s~]).*?[^\s~])(~{2})(?!~)/g;
const inlineCodeRegex = /(`)((?=[^\s`]).*?[^\s`])(`)/g;
const blockCodeRegex = /((`{3}|~{3})\w*\n)(.*\n)*?(\2\n)/g;
const hRegex = /^[ \t]*#{1,6}([ \t].*|$)/gm;
const h1Regex = /^[ \t]*#{1}([ \t].*|$)/gm;
const h2Regex = /^[ \t]*#{2}([ \t].*|$)/gm;
const h3Regex = /^[ \t]*#{3}([ \t].*|$)/gm;

export class Decorator {
  activeEditor: TextEditor | undefined;

  hideDecorationType = HideDecorationType();

  defaultColorDecorationType = DefaultColorDecorationType();

  checkboxUncheckedDecorationType = CheckboxUncheckedDecorationType();

  checkboxCheckedDecorationType = CheckboxCheckedDecorationType();

  xxlTextDecorationType = XxlTextDecorationType();

  xlTextDecorationType = XlTextDecorationType();

  lTextDecorationType = LTextDecorationType();

  setActiveEditor(textEditor: TextEditor | undefined) {
    if (!textEditor) {
      return;
    }
    this.activeEditor = textEditor;
    this.updateDecorations();
  }

  updateDecorations() {
    if (!this.activeEditor) {
      return;
    }
    if (!['markdown', 'md', 'mdx'].includes(this.activeEditor.document.languageId)) {
      return;
    }

    const documentText = this.activeEditor.document.getText();

    const hiddenRanges = [];
    hiddenRanges.push(...this.getTogglableSymmetricRanges(documentText, boldRegex));
    hiddenRanges.push(...this.getTogglableSymmetricRanges(documentText, italicRegex));
    hiddenRanges.push(...this.getTogglableSymmetricRanges(documentText, strikethroughRegex));
    hiddenRanges.push(...this.getTogglableSymmetricRanges(documentText, inlineCodeRegex));
    hiddenRanges.push(...this.getTogglableSymmetricRanges(documentText, blockCodeRegex));
    hiddenRanges.push(...this.getHeadingHidingRanges(documentText));
    this.activeEditor.setDecorations(this.hideDecorationType, hiddenRanges);

    const defaultColorRanges = [];
    defaultColorRanges.push(...this.getRanges(documentText, boldRegex));
    defaultColorRanges.push(...this.getRanges(documentText, italicRegex));
    defaultColorRanges.push(...this.getRanges(documentText, hRegex));
    console.log('Default Color Ranges:', defaultColorRanges);
    this.activeEditor.setDecorations(this.defaultColorDecorationType, defaultColorRanges);

    const { uncheckedRanges, checkedRanges } = this.getCheckboxRanges();
    console.log('Unchecked Checkbox Ranges:', uncheckedRanges);
    console.log('Checked Checkbox Ranges:', checkedRanges);
    this.activeEditor.setDecorations(this.checkboxUncheckedDecorationType, uncheckedRanges);
    this.activeEditor.setDecorations(this.checkboxCheckedDecorationType, checkedRanges);

    this.activeEditor.setDecorations(this.xxlTextDecorationType, this.getRanges(documentText, h1Regex));
    this.activeEditor.setDecorations(this.xlTextDecorationType, this.getRanges(documentText, h2Regex));
    this.activeEditor.setDecorations(this.lTextDecorationType, this.getRanges(documentText, h3Regex));
  }

  isRangeSelected(range: Range): boolean {
    return !!(this.activeEditor?.selections.find((s) => range.intersection(s)));
  }

  isLineOfRangeSelected(range: Range): boolean {
    return !!(this.activeEditor?.selections.find((s) => !(range.end.line < s.start.line || range.start.line > s.end.line)));
  }

  getTogglableSymmetricRanges(documentText: string, regex: RegExp): Range[] {
    if (!this.activeEditor) return [];

    let match;
    const ranges = [];
    while ((match = regex.exec(documentText))) {
      const group = match[0];

      const startGroup = match[1] || [];
      const endGroup = match[match.length - 1] || [];

      const openingStartPosition = this.activeEditor.document.positionAt(match.index);
      const openingEndPosition = this.activeEditor.document.positionAt(match.index + startGroup.length);
      const closingStartPosition = this.activeEditor.document.positionAt(match.index + group.length - endGroup.length);
      const closingEndPosition = this.activeEditor.document.positionAt(match.index + group.length);
      const fullRange = new Range(openingStartPosition, closingEndPosition);
      if (this.isLineOfRangeSelected(fullRange)) {
        continue;
      }
      ranges.push(
        new Range(openingStartPosition, openingEndPosition),
        new Range(closingStartPosition, closingEndPosition),
      );
    }
    return ranges;
  }

  getHeadingHidingRanges(documentText: string) {
    if (!this.activeEditor) return [];

    let match;
    const ranges = [];
    while ((match = hRegex.exec(documentText))) {
      const group = match[0];
      const prefixLength = group.match(/^[ \t]*#{1,6}([ \t]|$)/)?.[0]?.length ?? 0;
      if (prefixLength === 0) {
        continue;
      }

      const startPosition = this.activeEditor.document.positionAt(match.index);
      const endOfPrefixPosition = this.activeEditor.document.positionAt(match.index + prefixLength);
      const endPosition = this.activeEditor.document.positionAt(match.index + group.length);
      const fullRange = new Range(startPosition, endPosition);
      if (this.isLineOfRangeSelected(fullRange)) { // or this.isRangeSelected(range)?
        continue;
      }
      ranges.push(
        new Range(startPosition, endOfPrefixPosition),
      );
    }
    return ranges;
  }

  getCheckboxRanges(): { uncheckedRanges: Range[]; checkedRanges: Range[] } {
    if (!this.activeEditor) return { uncheckedRanges: [], checkedRanges: [] };

    const uncheckedRanges: Range[] = [];
    const checkedRanges: Range[] = [];
    const { lineCount } = this.activeEditor.document;
    // Regex to find list markers followed by a checkbox on a single line
    const lineCheckboxRegex = /^[ \t]*(?:[-*+]|[0-9]+\.)[ \t]+(\[( |x)\])/i;

    for (let i = 0; i < lineCount; i++) {
      const line = this.activeEditor.document.lineAt(i);
      const lineText = line.text;
      const match = lineText.match(lineCheckboxRegex);

      if (match) {
        const fullMatchText = match[0]; // e.g., "  - [ ]"
        const checkboxPart = match[1]; // e.g., "[ ]" or "[x]"

        // Find the start column of the non-whitespace content (e.g., '-')
        const contentStartCol = fullMatchText.search(/\S/);
        if (contentStartCol === -1) continue; // Should not happen with this regex

        // The end column is simply the length of the full match
        const contentEndCol = fullMatchText.length;

        // Create the range for the list marker + checkbox part (e.g., "- [ ]")
        const range = new Range(i, contentStartCol, i, contentEndCol);

        // Do not decorate if the line is selected
        if (this.isLineOfRangeSelected(range)) {
          continue;
        }

        // Check if it's an unchecked or checked box using the captured checkboxPart
        if (!checkboxPart) continue; // Should not happen, but satisfies linter
        if (checkboxPart.toLowerCase() === '[ ]') {
          uncheckedRanges.push(range);
        } else { // Matches '[x]' (case-insensitive due to regex flag)
          checkedRanges.push(range);
        }
      }
    }

    return { uncheckedRanges, checkedRanges };
  }

  getRanges(documentText: string, regex: RegExp) {
    if (!this.activeEditor) return [];

    let match;
    const ranges = [];
    while ((match = regex.exec(documentText))) {
      const group = match[0];

      const startPosition = this.activeEditor.document.positionAt(match.index);
      const endPosition = this.activeEditor.document.positionAt(match.index + group.length);
      ranges.push(
        new Range(startPosition, endPosition),
      );
    }
    return ranges;
  }
}
