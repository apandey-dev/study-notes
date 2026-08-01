import TurndownService from 'turndown';
import { marked } from 'marked';

// Configure Marked for GFM
marked.setOptions({
  gfm: true,
  breaks: true
});

// Configure Turndown for Markdown export
const turndownService = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced'
});

// Preserve colored text span elements in Markdown export
turndownService.addRule('coloredSpan', {
  filter: function (node) {
    return node.tagName === 'SPAN' && node.getAttribute('style') && node.getAttribute('style').includes('color');
  },
  replacement: function (content, node) {
    const style = node.getAttribute('style');
    return `<span style="${style}">${content}</span>`;
  }
});

// Custom Rule for GFM Interactive Checklists (- [ ] Task and - [x] Task)
turndownService.addRule('taskListItems', {
  filter: function (node) {
    return (
      node.tagName === 'LI' &&
      (node.getAttribute('data-type') === 'taskItem' || node.querySelector('input[type="checkbox"]'))
    );
  },
  replacement: function (content, node) {
    const checkbox = node.querySelector('input[type="checkbox"]');
    const isChecked = checkbox ? checkbox.checked : false;
    const textContent = content.trim().replace(/^\[[ x]\]\s*/, '');
    return `- [${isChecked ? 'x' : ' '}] ${textContent}\n`;
  }
});

export function parseFileContent(rawText, format) {
  if (!rawText) return { html: '<p></p>', floatingObjects: [] };

  let floatingObjects = [];
  let cleanText = rawText;

  // Extract floating objects JSON metadata block if present
  const metaMatch = rawText.match(/<!-- FLOATING_OBJECTS_DATA: ([\s\S]*?) -->/);
  if (metaMatch && metaMatch[1]) {
    try {
      floatingObjects = JSON.parse(metaMatch[1]);
      cleanText = rawText.replace(/<!-- FLOATING_OBJECTS_DATA: [\s\S]*? -->/, '').trim();
    } catch (e) {
      console.error('Failed to parse floating objects metadata:', e);
    }
  }

  // Pre-process custom command syntax ..h1:, ..h2:, ..h3:, ..h4:
  let processedText = cleanText
    .replace(/^^\.\.h1:\s*(.*)$/gm, '# $1')
    .replace(/^^\.\.h2:\s*(.*)$/gm, '## $1')
    .replace(/^^\.\.h3:\s*(.*)$/gm, '### $1')
    .replace(/^^\.\.h4:\s*(.*)$/gm, '#### $1')
    .replace(/^\.\.h1:\s*(.*)$/gm, '# $1')
    .replace(/^\.\.h2:\s*(.*)$/gm, '## $1')
    .replace(/^\.\.h3:\s*(.*)$/gm, '### $1')
    .replace(/^\.\.h4:\s*(.*)$/gm, '#### $1');

  if (format === 'txt') {
    const html = processedText
      .split('\n')
      .map(line => `<p>${line.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`)
      .join('');
    return { html, floatingObjects };
  }
  
  // Markdown (.md) Parsing
  try {
    const html = marked.parse(processedText);
    return { html, floatingObjects };
  } catch (e) {
    console.error('Markdown parse error:', e);
    return { html: `<p>${processedText}</p>`, floatingObjects: [] };
  }
}

export function serializeFileContent(htmlContent, format, floatingObjects = []) {
  if (!htmlContent) return '';

  let outputText = '';

  if (format === 'txt') {
    // Plain text export with clean heading decorations
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    let txtOutput = '';
    tempDiv.childNodes.forEach(node => {
      if (!node) return;
      const tag = node.tagName ? node.tagName.toUpperCase() : '';
      const text = (node.textContent || '').trim();
      if (!text) return;

      if (tag === 'H1') {
        const border = '='.repeat(Math.max(20, text.length));
        txtOutput += `\n${border}\n${text}\n${border}\n\n`;
      } else if (tag === 'H2') {
        const border = '-'.repeat(Math.max(16, text.length));
        txtOutput += `\n${text}\n${border}\n\n`;
      } else if (tag === 'H3') {
        txtOutput += `\n### ${text}\n\n`;
      } else if (tag === 'H4') {
        txtOutput += `\n#### ${text}\n\n`;
      } else {
        txtOutput += `${text}\n`;
      }
    });

    outputText = txtOutput.trim();
  } else {
    // Markdown (.md) Serialization
    try {
      outputText = turndownService.turndown(htmlContent);
    } catch (e) {
      console.error('Turndown serialize error:', e);
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      outputText = tempDiv.innerText || tempDiv.textContent || '';
    }
  }

  // Append floating objects JSON metadata block if present
  if (Array.isArray(floatingObjects) && floatingObjects.length > 0) {
    outputText += `\n\n<!-- FLOATING_OBJECTS_DATA: ${JSON.stringify(floatingObjects)} -->`;
  }

  return outputText;
}

// Aliases for compatibility
export function parseMarkdownFloatingObjects(rawText) {
  const res = parseFileContent(rawText, 'md');
  return { htmlContent: res.html, floatingObjects: res.floatingObjects };
}

export function serializeMarkdownWithFloatingObjects(htmlContent, floatingObjects) {
  return serializeFileContent(htmlContent, 'md', floatingObjects);
}
