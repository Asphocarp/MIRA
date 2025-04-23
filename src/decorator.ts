import {
  Range,
  TextEditor,
  DecorationOptions,
  ThemeColor,
  window,
} from 'vscode';
import {
  DefaultColorDecorationType,
  HideDecorationType,
  XxlTextDecorationType,
  XlTextDecorationType,
  LTextDecorationType,
  CheckboxCheckedDecorationType,
  CheckboxUncheckedDecorationType,
} from './decorations';

// --- NEW DECORATION TYPES ---
const hyperlinkIcon = '󰖟';
const listItemLevel0Icon = '●';
const listItemLevel1Icon = '○';
const listItemLevel2Icon = '◆';
const listItemLevel3Icon = '◇';
const imageIcon = '󰥶';
// later: 󱗖

const commonIconStyles = {
  margin: '0 0.5em 0 0',
  textDecoration: 'none; display: inline-block; vertical-align: middle;', // Ensure icon aligns well
};

const HyperlinkIconDecorationType = () => window.createTextEditorDecorationType({
  before: {
    ...commonIconStyles,
    color: new ThemeColor('textLink.foreground'), // Use link color
    contentText: hyperlinkIcon,
  },
});

const ListItemLevel0DecorationType = () => window.createTextEditorDecorationType({
  before: {
    color: new ThemeColor('foreground'), // Use default text color
    contentText: listItemLevel0Icon,
    textDecoration: 'none; display: inline-block; vertical-align: middle;', // Keep necessary alignment
  },
});

const ListItemLevel1DecorationType = () => window.createTextEditorDecorationType({
  before: {
    color: new ThemeColor('foreground'),
    contentText: listItemLevel1Icon,
    textDecoration: 'none; display: inline-block; vertical-align: middle;', // Keep necessary alignment
  },
});

const ListItemLevel2DecorationType = () => window.createTextEditorDecorationType({
  before: {
    color: new ThemeColor('foreground'),
    contentText: listItemLevel2Icon,
    textDecoration: 'none; display: inline-block; vertical-align: middle;', // Keep necessary alignment
  },
});

const ListItemLevel3DecorationType = () => window.createTextEditorDecorationType({
  before: {
    color: new ThemeColor('foreground'),
    contentText: listItemLevel3Icon,
    textDecoration: 'none; display: inline-block; vertical-align: middle;', // Keep necessary alignment
  },
});

// --- NEW IMAGE DECORATION TYPE ---
const ImageIconDecorationType = () => window.createTextEditorDecorationType({
  before: {
    ...commonIconStyles,
    color: new ThemeColor('foreground'), // Or another appropriate color
    contentText: imageIcon,
  },
});
// --- END NEW IMAGE DECORATION TYPE ---

const boldRegex = /(\*{2}|_{2})((?=[^\s*_]).*?[^\s*_])(\1)/g;
const italicRegex = /(?<!\*|_)(\*|_)((?=[^\s*_]).*?[^\s*_])(\1)(?!\*|_)/g;
const strikethroughRegex = /(?<!~)(~{2})((?=[^\s~]).*?[^\s~])(~{2})(?!~)/g;
const inlineCodeRegex = /(`)((?=[^\s`]).*?[^\s`])(`)/g;
const blockCodeRegex = /((`{3}|~{3})\w*\n)(.*\n)*?(\2\n)/g;
const hRegex = /^[ \t]*#{1,6}([ \t].*|$)/gm;
const h1Regex = /^[ \t]*#{1}([ \t].*|$)/gm;
const h2Regex = /^[ \t]*#{2}([ \t].*|$)/gm;
const h3Regex = /^[ \t]*#{3}([ \t].*|$)/gm;
// Regex for Markdown links: [text](url) - avoiding image links ![alt](url)
const hyperlinkRegex = /(?<!!)\[([^\]]+)\]\(([^)]+)\)/g;
// Regex for Markdown images: ![alt text](url)
const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g; // Removed unnecessary escape
// Regex for list items (captures marker and indentation)

export class Decorator {
  activeEditor: TextEditor | undefined;

  hideDecorationType = HideDecorationType();

  defaultColorDecorationType = DefaultColorDecorationType();

  checkboxUncheckedDecorationType = CheckboxUncheckedDecorationType();

  checkboxCheckedDecorationType = CheckboxCheckedDecorationType();

  xxlTextDecorationType = XxlTextDecorationType();

  xlTextDecorationType = XlTextDecorationType();

  lTextDecorationType = LTextDecorationType();

  // --- Instantiate new decoration types ---
  hyperlinkIconDecorationType = HyperlinkIconDecorationType();

  listItemLevel0DecorationType = ListItemLevel0DecorationType();

  listItemLevel1DecorationType = ListItemLevel1DecorationType();

  listItemLevel2DecorationType = ListItemLevel2DecorationType();

  listItemLevel3DecorationType = ListItemLevel3DecorationType();

  imageIconDecorationType = ImageIconDecorationType();
  // --- End new decoration types ---

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
    if (
      !['markdown', 'md', 'mdx'].includes(this.activeEditor.document.languageId)
    ) {
      return;
    }

    const documentText = this.activeEditor.document.getText();
    const editor = this.activeEditor; // Alias for easier access

    const hiddenRanges: Range[] = [];
    const hyperlinkIconRanges: DecorationOptions[] = []; // Use DecorationOptions for icons
    const listItemLevel0Ranges: DecorationOptions[] = [];
    const listItemLevel1Ranges: DecorationOptions[] = [];
    const listItemLevel2Ranges: DecorationOptions[] = [];
    const listItemLevel3Ranges: DecorationOptions[] = []; // NEW: Add level 3
    const imageIconRanges: DecorationOptions[] = []; // For image icons

    // --- Handle Symmetric Toggles (Bold, Italic, etc.) ---
    hiddenRanges.push(
      ...this.getTogglableSymmetricRanges(documentText, boldRegex),
    );
    hiddenRanges.push(
      ...this.getTogglableSymmetricRanges(documentText, italicRegex),
    );
    hiddenRanges.push(
      ...this.getTogglableSymmetricRanges(documentText, strikethroughRegex),
    );
    hiddenRanges.push(
      ...this.getTogglableSymmetricRanges(documentText, inlineCodeRegex),
    );
    hiddenRanges.push(
      ...this.getTogglableSymmetricRanges(documentText, blockCodeRegex),
    );

    // --- Handle Headings ---
    hiddenRanges.push(...this.getHeadingHidingRanges(documentText));

    // --- Handle Hyperlinks ---
    const { linkHideRanges, linkIconRanges } = this.getHyperlinkRanges(documentText);
    hiddenRanges.push(...linkHideRanges);
    hyperlinkIconRanges.push(...linkIconRanges);

    // --- Handle Images ---
    const { imageHideRanges, imgIconRanges } = this.getImageRanges(documentText);
    hiddenRanges.push(...imageHideRanges);
    imageIconRanges.push(...imgIconRanges);

    // --- Handle Checkboxes ---
    const { uncheckedRanges, checkedRanges } = this.getCheckboxRanges();
    editor.setDecorations(
      this.checkboxUncheckedDecorationType,
      uncheckedRanges,
    );
    editor.setDecorations(this.checkboxCheckedDecorationType, checkedRanges);
    // Hide the original checkbox text like "- [ ] "
    hiddenRanges.push(...uncheckedRanges);
    hiddenRanges.push(...checkedRanges);

    // --- Handle List Items ---
    const {
      itemHideRanges, level0Ranges, level1Ranges, level2Ranges, level3Ranges,
    } = this.getListMarkerRanges();
    hiddenRanges.push(...itemHideRanges);
    listItemLevel0Ranges.push(...level0Ranges);
    listItemLevel1Ranges.push(...level1Ranges);
    listItemLevel2Ranges.push(...level2Ranges);
    listItemLevel3Ranges.push(...level3Ranges); // NEW: Add level 3 ranges

    // --- Apply Decorations ---
    editor.setDecorations(this.hideDecorationType, hiddenRanges);
    editor.setDecorations(
      this.hyperlinkIconDecorationType,
      hyperlinkIconRanges,
    );
    editor.setDecorations(
      this.listItemLevel0DecorationType,
      listItemLevel0Ranges,
    );
    editor.setDecorations(
      this.listItemLevel1DecorationType,
      listItemLevel1Ranges,
    );
    editor.setDecorations(
      this.listItemLevel2DecorationType,
      listItemLevel2Ranges,
    );
    editor.setDecorations(
      this.listItemLevel3DecorationType, // NEW: Apply level 3 decoration
      listItemLevel3Ranges,
    );
    editor.setDecorations(this.imageIconDecorationType, imageIconRanges); // Apply image icons

    // --- Apply Color/Size Decorations (excluding hidden parts) ---
    const defaultColorRanges = [];
    defaultColorRanges.push(...this.getRanges(documentText, boldRegex));
    defaultColorRanges.push(...this.getRanges(documentText, italicRegex));
    defaultColorRanges.push(...this.getRanges(documentText, hRegex));
    // console.log('Default Color Ranges:', defaultColorRanges);
    editor.setDecorations(
      this.defaultColorDecorationType,
      Decorator.filterRanges(defaultColorRanges, hiddenRanges),
    );

    editor.setDecorations(
      this.xxlTextDecorationType,
      Decorator.filterRanges(this.getRanges(documentText, h1Regex), hiddenRanges),
    );
    editor.setDecorations(
      this.xlTextDecorationType,
      Decorator.filterRanges(this.getRanges(documentText, h2Regex), hiddenRanges),
    );
    editor.setDecorations(
      this.lTextDecorationType,
      Decorator.filterRanges(this.getRanges(documentText, h3Regex), hiddenRanges),
    );
  }

  // Helper to filter out ranges that are completely hidden
  static filterRanges(rangesToFilter: Range[], hiddenRanges: Range[]): Range[] {
    return rangesToFilter.filter(
      (range) => !hiddenRanges.some((hiddenRange) => hiddenRange.contains(range)),
    );
  }

  isRangeSelected(range: Range): boolean {
    return !!this.activeEditor?.selections.find((s) => range.intersection(s));
  }

  isLineOfRangeSelected(range: Range): boolean {
    return !!this.activeEditor?.selections.find(
      (s) => !(range.end.line < s.start.line || range.start.line > s.end.line),
    );
  }

  getTogglableSymmetricRanges(documentText: string, regex: RegExp): Range[] {
    if (!this.activeEditor) return [];
    const editor = this.activeEditor;
    let match;
    const ranges = [];
    while ((match = regex.exec(documentText))) {
      const group = match[0];

      const startGroup = match[1] || ''; // Handle cases like block code where group 1 might not exist
      const endGroup = match[match.length - 1] || ''; // Handle cases like block code

      const openingStartPosition = editor.document.positionAt(match.index);
      const openingEndPosition = editor.document.positionAt(
        match.index + startGroup.length,
      );
      const closingStartPosition = editor.document.positionAt(
        match.index + group.length - endGroup.length,
      );
      const closingEndPosition = editor.document.positionAt(
        match.index + group.length,
      );
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

  getHeadingHidingRanges(documentText: string): Range[] {
    if (!this.activeEditor) return [];
    let match;
    const ranges = [];
    while ((match = hRegex.exec(documentText))) {
      const group = match[0];
      const prefixMatch = group.match(/^[ \t]*#{1,6}([ \t]|$)/);
      const prefixLength = prefixMatch?.[0]?.length ?? 0;
      if (prefixLength === 0) {
        continue;
      }

      const startPosition = this.activeEditor.document.positionAt(match.index);
      const endOfPrefixPosition = this.activeEditor.document.positionAt(
        match.index + prefixLength,
      );
      const endPosition = this.activeEditor.document.positionAt(
        match.index + group.length,
      );
      const fullRange = new Range(startPosition, endPosition);
      if (this.isLineOfRangeSelected(fullRange)) {
        // or this.isRangeSelected(range)?
        continue;
      }
      ranges.push(new Range(startPosition, endOfPrefixPosition));
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
        } else {
          // Matches '[x]' (case-insensitive due to regex flag)
          checkedRanges.push(range);
        }
      }
    }

    return { uncheckedRanges, checkedRanges };
  }

  // --- NEW: Get Hyperlink Ranges ---
  getHyperlinkRanges(documentText: string): {
    linkHideRanges: Range[];
    linkIconRanges: DecorationOptions[];
  } {
    if (!this.activeEditor) return { linkHideRanges: [], linkIconRanges: [] };
    const editor = this.activeEditor;
    const linkHideRanges: Range[] = [];
    const linkIconRanges: DecorationOptions[] = [];
    let match;

    while ((match = hyperlinkRegex.exec(documentText))) {
      const fullMatch = match[0]; // e.g., "[title](url)"
      const title = match[1]; // e.g., "title"
      const urlPart = match[2]; // e.g., "url"

      // Add check for potentially undefined groups
      if (!title || urlPart === undefined) continue;

      const startIndex = match.index;
      const startPosition = editor.document.positionAt(startIndex);
      const endPosition = editor.document.positionAt(
        startIndex + fullMatch.length,
      );
      const fullRange = new Range(startPosition, endPosition);

      if (this.isLineOfRangeSelected(fullRange)) {
        continue;
      }

      // Range for '['
      const openingBracketStart = startPosition;
      const openingBracketEnd = editor.document.positionAt(startIndex + 1);
      const openingBracketRange = new Range(
        openingBracketStart,
        openingBracketEnd,
      );

      // Range for '](url)'
      const closingPartStart = editor.document.positionAt(
        startIndex + 1 + title.length,
      );
      const closingPartEnd = endPosition;
      const closingPartRange = new Range(closingPartStart, closingPartEnd);

      linkHideRanges.push(openingBracketRange); // Hide '['
      linkHideRanges.push(closingPartRange); // Hide '](url)'

      // Add decoration option for the icon before the title
      linkIconRanges.push({
        range: openingBracketRange, // Place icon exactly where '[' was
        // hoverMessage: `Link: ${urlPart}` // Optional: Show URL on hover
      });
    }

    return { linkHideRanges, linkIconRanges };
  }
  // --- END NEW: Get Hyperlink Ranges ---

  // --- NEW: Get Image Ranges ---
  getImageRanges(documentText: string): { imageHideRanges: Range[]; imgIconRanges: DecorationOptions[] } {
    if (!this.activeEditor) return { imageHideRanges: [], imgIconRanges: [] };
    const editor = this.activeEditor;
    const imageHideRanges: Range[] = [];
    const imgIconRanges: DecorationOptions[] = [];
    let match;

    while ((match = imageRegex.exec(documentText))) {
      const fullMatch = match[0]; // e.g., "![alt](url)"
      const altText = match[1]; // e.g., "alt"
      const urlPart = match[2]; // e.g., "url"

      // Add check for potentially undefined groups (altText can be empty)
      if (altText === undefined || urlPart === undefined) continue;

      const startIndex = match.index;
      const startPosition = editor.document.positionAt(startIndex);
      const endPosition = editor.document.positionAt(
        startIndex + fullMatch.length,
      );
      const fullRange = new Range(startPosition, endPosition);

      if (this.isLineOfRangeSelected(fullRange)) {
        continue;
      }

      // Range for '!['
      const openingPartStart = startPosition;
      const openingPartEnd = editor.document.positionAt(startIndex + 2);
      const openingPartRange = new Range(openingPartStart, openingPartEnd);

      // Range for '](url)'
      const closingPartStart = editor.document.positionAt(startIndex + 2 + altText.length);
      const closingPartEnd = endPosition;
      const closingPartRange = new Range(closingPartStart, closingPartEnd);

      imageHideRanges.push(openingPartRange); // Hide '!['
      imageHideRanges.push(closingPartRange); // Hide '](url)'

      // Add decoration option for the icon before the alt text
      imgIconRanges.push({
        range: openingPartRange, // Place icon exactly where '![' was
        // hoverMessage: `Image: ${urlPart}` // Optional: Show URL on hover
      });
    }

    return { imageHideRanges, imgIconRanges };
  }

  getListMarkerRanges(): {
    itemHideRanges: Range[];
    level0Ranges: DecorationOptions[];
    level1Ranges: DecorationOptions[];
    level2Ranges: DecorationOptions[];
    level3Ranges: DecorationOptions[];
  } {
    if (!this.activeEditor) {
      return {
        itemHideRanges: [],
        level0Ranges: [],
        level1Ranges: [],
        level2Ranges: [],
        level3Ranges: [],
      };
    }

    const editor = this.activeEditor;
    const itemHideRanges: Range[] = [];
    const level0Ranges: DecorationOptions[] = [];
    const level1Ranges: DecorationOptions[] = [];
    const level2Ranges: DecorationOptions[] = [];
    const level3Ranges: DecorationOptions[] = [];
    const tabSize = typeof editor.options.tabSize === 'number' ? editor.options.tabSize : 2; // Default to 2 if not number

    for (let i = 0; i < editor.document.lineCount; i++) {
      const line = editor.document.lineAt(i);
      const lineText = line.text;

      // Ignore empty lines or lines that are part of code blocks etc.
      if (line.isEmptyOrWhitespace) continue;
      // Basic check to avoid decorating inside code blocks (can be improved)
      if (
        lineText.trim().startsWith('```')
        || lineText.trim().startsWith('~~~')
      ) continue;

      // Regex for checkboxes on the same line
      const lineCheckboxRegex = /^[ \t]*(?:[-*+]|[0-9]+\.)[ \t]+(\[( |x)\])/i;
      // Regex for unordered list items only
      const listItemMatch = lineText.match(
        /^([ \t]*)([-*+])(?=[ \t])/, // Ensure space after marker, only -, *, +
      );

      if (listItemMatch) {
        const indentationText = listItemMatch[1]; // All leading whitespace
        const marker = listItemMatch[2]; // The actual marker like '-', '*'

        // Add check for potentially undefined groups
        if (indentationText === undefined || !marker) continue;

        // --- NEW: Skip if it's a checkbox line ---
        if (lineText.match(lineCheckboxRegex)) {
          continue;
        }
        // --- END NEW ---

        // Calculate indentation level based on spaces (treat tabs as tabSize spaces)
        const indentationLevel = indentationText.split('').reduce((level, char) => {
          return level + (char === '\t' ? tabSize : 1);
        }, 0);
        const level = Math.floor(indentationLevel / tabSize); // Simple level calculation
        const displayLevel = level % 4; // NEW: Cycle through 0, 1, 2, 3

        const markerStartIndex = indentationText.length;
        const markerEndIndex = markerStartIndex + marker.length;

        const markerStartPosition = line.range.start.translate(
          0,
          markerStartIndex,
        );
        const markerEndPosition = line.range.start.translate(0, markerEndIndex);
        const markerRange = new Range(markerStartPosition, markerEndPosition);

        // Skip if the line is selected
        if (this.isLineOfRangeSelected(line.range)) {
          continue;
        }

        // Hide the original marker
        itemHideRanges.push(markerRange);

        // Add decoration based on level, cycling through 0-3
        const decorationOptions: DecorationOptions = { range: markerRange };
        if (displayLevel === 0) {
          level0Ranges.push(decorationOptions);
        } else if (displayLevel === 1) {
          level1Ranges.push(decorationOptions);
        } else if (displayLevel === 2) {
          level2Ranges.push(decorationOptions);
        } else {
          level3Ranges.push(decorationOptions);
        }
      }
    }

    return {
      itemHideRanges, level0Ranges, level1Ranges, level2Ranges, level3Ranges,
    };
  }
  // --- END NEW: Get List Marker Ranges ---

  getRanges(documentText: string, regex: RegExp) {
    if (!this.activeEditor) return [];
    const editor = this.activeEditor;
    let match;
    const ranges = [];
    while ((match = regex.exec(documentText))) {
      const group = match[0];

      const startPosition = editor.document.positionAt(match.index);
      const endPosition = editor.document.positionAt(
        match.index + group.length,
      );
      ranges.push(new Range(startPosition, endPosition));
    }
    return ranges;
  }
}
