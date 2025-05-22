import { ThemeColor, window } from 'vscode';

export function HideDecorationType() {
  return window.createTextEditorDecorationType({
    // Hide the item
    textDecoration: 'none; display: none;',

    // This forces the editor to re-layout following text correctly
    after: {
      contentText: '',
    },
  });
}

export function DefaultColorDecorationType() {
  return window.createTextEditorDecorationType({
    color: new ThemeColor('foreground'),
  });
}

export function XxlTextDecorationType() {
  return window.createTextEditorDecorationType({
    textDecoration: 'none; font-size: 200%;',
  });
}

export function XlTextDecorationType() {
  return window.createTextEditorDecorationType({
    textDecoration: 'none; font-size: 150%;',
  });
}

export function LTextDecorationType() {
  return window.createTextEditorDecorationType({
    textDecoration: 'none; font-size: 110%;',
  });
}

export function CheckboxUncheckedDecorationType() {
  return window.createTextEditorDecorationType({
    before: {
      contentText: '󰄱',
      margin: '0 0.2em 0 0', // Add some spacing
      color: new ThemeColor('editor.foreground'), // Use default text color
    },
    // Hide the original '[ ]' text
    textDecoration: 'none; display: none;',
  });
}

export function CheckboxCheckedDecorationType() {
  return window.createTextEditorDecorationType({
    before: {
      contentText: '󰱒',
      margin: '0 0.2em 0 0', // Add some spacing
      color: new ThemeColor('editor.foreground'), // Use default text color
    },
    // Hide the original '[x]' text
    textDecoration: 'none; display: none;',
  });
}

export function CheckboxInProcessDecorationType() {
  return window.createTextEditorDecorationType({
    before: {
    //   contentText: '󰪥',
      contentText: '\uEABD',
      margin: '0 0.2em 0 0', // Add some spacing
      color: new ThemeColor('editor.foreground'), // Use default text color
    },
    // Hide the original '[/]' text
    textDecoration: 'none; display: none;',
  });
}

export function CheckboxCancelledDecorationType() {
  return window.createTextEditorDecorationType({
    before: {
      contentText: '☒',
      margin: '0 0.2em 0 0', // Add some spacing
      color: new ThemeColor('editor.foreground'), // Use default text color
    },
    // Hide the original '[-]' text
    textDecoration: 'none; display: none;',
  });
}