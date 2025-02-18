export const configurePrismSyntax = (monaco: typeof import('monaco-editor')) => {
  monaco.languages.register({ id: 'aim' });

  monaco.languages.setMonarchTokensProvider('aim', {
    tokenizer: {
      root: [
        [/^---\n[\s\S]*?\n---/, 'frontmatter'],
        [/<!--[\s\S]*?-->/, 'comment'],
        [/{%/, { token: 'tag.punctuation', next: '@aimTag' }],
        [/{{.*?}}/, 'variable'],
        [/\b\w+(?=\()/i, 'function'],
        [/\$\w+/, 'variable'],
      ],

      aimTag: [
        [/%}/, { token: 'tag.punctuation', next: '@pop' }],
        [/\s+/, 'whitespace'],
        [/#(\w|-)*\b/, 'id'],
        [/".*?"/, 'string'],
        [/=/, 'equals'],
        [/\b\d+\b/, 'number'],
        [/\$[\w.]+/, 'variable'],
        [/\b(true|false)\b/, 'boolean'],
        [/^({%\s*\/?)(\w|-)*\b/, 'tagType'],
        [/\b\w+(?=\()/i, 'function'],
      ],
    }
  });

  monaco.editor.defineTheme('aim-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'frontmatter', foreground: '8B949E' },
      { token: 'comment', foreground: '6E7681' },
      { token: 'tagType', foreground: '79C0FF' },
      { token: 'tag', foreground: 'FF7B72' },
      { token: 'tag.punctuation', foreground: 'FF7B72' },
      { token: 'id', foreground: 'FFA657' },
      { token: 'variable', foreground: '7EE787' },
      { token: 'string', foreground: 'A5D6FF' },
      { token: 'function', foreground: 'D2A8FF' },
      { token: 'boolean', foreground: '79C0FF' },
      { token: 'number', foreground: '79C0FF' },
      { token: 'equals', foreground: '8B949E' },
    ],
    colors: {
      'editor.background': '#1e1e1e',
      'editor.foreground': '#FFFFFF',
    }
  });

  monaco.editor.defineTheme('aim-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'frontmatter', foreground: '57606a' },
      { token: 'comment', foreground: '6e7781' },
      { token: 'tagType', foreground: '0550ae' },
      { token: 'tag', foreground: 'cf222e' },
      { token: 'tag.punctuation', foreground: 'cf222e' },
      { token: 'id', foreground: '953800' },
      { token: 'variable', foreground: '1a7f37' },
      { token: 'string', foreground: '0a3069' },
      { token: 'function', foreground: '8250df' },
      { token: 'boolean', foreground: '0550ae' },
      { token: 'number', foreground: '0550ae' },
      { token: 'equals', foreground: '57606a' },
    ],
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#000000',
    }
  });
};