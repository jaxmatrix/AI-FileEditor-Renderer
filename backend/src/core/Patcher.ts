import * as diff from 'diff';

export class Patcher {
  applyPatch(originalContent: string, patchContent: string): string {
    const result = diff.applyPatch(originalContent, patchContent);
    if (result === false) {
      throw new Error('Patch application failed.');
    }
    return result;
  }

  createPatch(oldContent: string, newContent: string, fileName: string): string {
    return diff.createTwoFilesPatch(fileName, fileName, oldContent, newContent, '', '', { context: 3 });
  }
}
