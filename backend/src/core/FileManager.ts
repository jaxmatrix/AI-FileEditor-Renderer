import * as fs from 'fs/promises';

export class FileManager {
  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async createFile(filePath: string, content: string): Promise<void> {
    try {
      await fs.writeFile(filePath, content, { flag: 'wx' });
    } catch (error: any) {
      if (error.code === 'EEXIST') {
        throw new Error(`File already exists at ${filePath}`);
      }
      throw error;
    }
  }

  async openFile(filePath: string): Promise<string> {
    return fs.readFile(filePath, 'utf-8');
  }

  async saveFile(filePath: string, content: string): Promise<void> {
    await fs.writeFile(filePath, content, 'utf-8');
  }
}

export const Grep = {
  getLines(fileContent: string, startLine: number, endLine: number): string {
    const lines = fileContent.split('\n');
    const zeroBasedStart = startLine - 1;
    if (zeroBasedStart < 0 || endLine > lines.length || zeroBasedStart > endLine) {
      return ''; // Or throw an error, depending on desired behavior
    }
    return lines.slice(zeroBasedStart, endLine).join('\n');
  }
};
