export interface FileIndex {
  toc: { heading: string; line: number }[];
  symbols: { symbol: string; line: number; section: string }[];
}

export class Indexer {
  generateIndex(fileContent: string): FileIndex {
    const index: FileIndex = { toc: [], symbols: [] };
    const lines = fileContent.split('\n');
    let currentSection = '';

    const functionRegex = /function\s+([a-zA-Z0-9_]+)/;
    const jsonKeyRegex = /"([a-zA-Z0-9_]+)":/;

    lines.forEach((line, i) => {
      const lineNumber = i + 1;

      // TOC Logic
      if (line.startsWith('## ')) {
        currentSection = line.substring(3).trim();
        index.toc.push({ heading: currentSection, line: lineNumber });
      }

      // Symbol Logic
      const functionMatch = line.match(functionRegex);
      if (functionMatch) {
        index.symbols.push({ symbol: functionMatch[1], line: lineNumber, section: currentSection });
      }
      
      if (currentSection.toLowerCase().includes('json') || currentSection.toLowerCase().includes('config')) {
        const jsonKeyMatch = line.match(jsonKeyRegex);
        if (jsonKeyMatch) {
          index.symbols.push({ symbol: jsonKeyMatch[1], line: lineNumber, section: currentSection });
        }
      }
    });

    return index;
  }
}
