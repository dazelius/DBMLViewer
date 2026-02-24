import type * as Monaco from 'monaco-editor';

export function registerDBMLLanguage(monaco: typeof Monaco) {
  if (monaco.languages.getLanguages().some((l) => l.id === 'dbml')) return;

  monaco.languages.register({ id: 'dbml' });

  monaco.languages.setMonarchTokensProvider('dbml', {
    keywords: [
      'Table', 'table', 'Ref', 'ref', 'Enum', 'enum',
      'TableGroup', 'tablegroup', 'TablePartial',
      'Project', 'project', 'Note', 'note',
      'indexes', 'checks',
    ],
    columnSettings: [
      'pk', 'primary key', 'not null', 'null', 'unique',
      'increment', 'default', 'ref', 'note',
    ],
    refOps: ['>', '<', '-', '<>'],
    typeKeywords: [
      'integer', 'int', 'bigint', 'smallint', 'tinyint',
      'varchar', 'char', 'text', 'nvarchar', 'ntext',
      'boolean', 'bool', 'bit',
      'decimal', 'numeric', 'float', 'double', 'real', 'money',
      'date', 'datetime', 'datetime2', 'timestamp', 'time',
      'json', 'jsonb', 'xml', 'uuid', 'blob', 'binary', 'bytea',
      'serial', 'bigserial',
    ],
    tokenizer: {
      root: [
        [/\/\/.*$/, 'comment'],
        [/\/\*/, 'comment', '@comment'],
        [/'''/, 'string', '@multilineString'],
        [/'[^']*'/, 'string'],
        [/`[^`]*`/, 'string.expression'],
        [/"[^"]*"/, 'string.quoted'],
        [/\[/, 'delimiter.bracket', '@settings'],
        [/\{/, 'delimiter.curly', '@tableBody'],
        [/\}/, 'delimiter.curly'],
        [/[<>-]/, { cases: { '@refOps': 'operator' } }],
        [/:/, 'delimiter'],
        [/\./, 'delimiter'],
        [/[a-zA-Z_]\w*/, {
          cases: {
            '@keywords': 'keyword',
            '@typeKeywords': 'type',
            '@default': 'identifier',
          },
        }],
        [/\d+(\.\d+)?/, 'number'],
        [/\s+/, 'white'],
      ],
      tableBody: [
        [/\}/, 'delimiter.curly', '@pop'],
        [/\/\/.*$/, 'comment'],
        [/\/\*/, 'comment', '@comment'],
        [/indexes\s*\{/, 'keyword', '@indexBlock'],
        [/(\s+)([a-zA-Z_]\w*)(\s+)([a-zA-Z_]\w*(?:\(\d+\))?)/, ['white', 'variable.name', 'white', 'type']],
        [/\[/, 'delimiter.bracket', '@settings'],
        [/'[^']*'/, 'string'],
        [/`[^`]*`/, 'string.expression'],
        [/"[^"]*"/, 'string.quoted'],
        [/[a-zA-Z_]\w*/, {
          cases: {
            '@keywords': 'keyword',
            '@columnSettings': 'keyword.setting',
            '@default': 'identifier',
          },
        }],
        [/[<>-]/, { cases: { '@refOps': 'operator' } }],
        [/[,:]/, 'delimiter'],
        [/\d+(\.\d+)?/, 'number'],
        [/\s+/, 'white'],
      ],
      indexBlock: [
        [/\}/, 'delimiter.curly', '@pop'],
        [/\/\/.*$/, 'comment'],
        [/'[^']*'/, 'string'],
        [/\[/, 'delimiter.bracket', '@settings'],
        [/[a-zA-Z_]\w*/, {
          cases: {
            '@columnSettings': 'keyword.setting',
            '@default': 'identifier',
          },
        }],
        [/[(),]/, 'delimiter'],
        [/\s+/, 'white'],
      ],
      comment: [
        [/[^/*]+/, 'comment'],
        [/\*\//, 'comment', '@pop'],
        [/[/*]/, 'comment'],
      ],
      multilineString: [
        [/'''/, 'string', '@pop'],
        [/./, 'string'],
      ],
      settings: [
        [/\]/, 'delimiter.bracket', '@pop'],
        [/'[^']*'/, 'string'],
        [/`[^`]*`/, 'string.expression'],
        [/\d+(\.\d+)?/, 'number'],
        [/,/, 'delimiter'],
        [/:/, 'delimiter'],
        [/[a-zA-Z_]\w*/, {
          cases: {
            '@columnSettings': 'keyword.setting',
            '@default': 'identifier',
          },
        }],
        [/\s+/, 'white'],
      ],
    },
  });

  monaco.editor.defineTheme('dbml-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: 'c678dd', fontStyle: 'bold' },
      { token: 'keyword.setting', foreground: 'e5c07b' },
      { token: 'type', foreground: '61afef' },
      { token: 'variable.name', foreground: 'e06c75' },
      { token: 'identifier', foreground: 'abb2bf' },
      { token: 'string', foreground: '98c379' },
      { token: 'string.expression', foreground: 'd19a66' },
      { token: 'string.quoted', foreground: '98c379' },
      { token: 'number', foreground: 'd19a66' },
      { token: 'comment', foreground: '5c6370', fontStyle: 'italic' },
      { token: 'operator', foreground: '56b6c2' },
      { token: 'delimiter', foreground: '636d83' },
      { token: 'delimiter.bracket', foreground: 'e5c07b' },
      { token: 'delimiter.curly', foreground: 'c678dd' },
    ],
    colors: {
      'editor.background': '#1e1e2e',
      'editor.foreground': '#cdd6f4',
      'editorLineNumber.foreground': '#6c7086',
      'editorLineNumber.activeForeground': '#cdd6f4',
      'editor.selectionBackground': '#45475a',
      'editor.lineHighlightBackground': '#252536',
      'editorCursor.foreground': '#89b4fa',
    },
  });

  monaco.editor.defineTheme('dbml-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: '7c3aed', fontStyle: 'bold' },
      { token: 'keyword.setting', foreground: 'b45309' },
      { token: 'type', foreground: '2563eb' },
      { token: 'variable.name', foreground: 'be185d' },
      { token: 'identifier', foreground: '374151' },
      { token: 'string', foreground: '16a34a' },
      { token: 'string.expression', foreground: 'ea580c' },
      { token: 'string.quoted', foreground: '16a34a' },
      { token: 'number', foreground: 'ea580c' },
      { token: 'comment', foreground: '9ca3af', fontStyle: 'italic' },
      { token: 'operator', foreground: '0891b2' },
      { token: 'delimiter', foreground: '9ca3af' },
      { token: 'delimiter.bracket', foreground: 'b45309' },
      { token: 'delimiter.curly', foreground: '7c3aed' },
    ],
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#1e1e2e',
    },
  });
}
