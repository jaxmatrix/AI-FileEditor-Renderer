export class Renderer {
  renderSection(sectionContent: string): string {
    console.log("Rendering section...");
    // Basic HTML escaping for safety
    const escapedContent = sectionContent
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
      
    return `<pre>${escapedContent}</pre>`;
  }
}
