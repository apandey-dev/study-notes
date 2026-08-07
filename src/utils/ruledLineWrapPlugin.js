import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

function measureTextWidth(text, marks, nodeType, defaultFont = 'Playpen Sans') {
  const fontFamilyMark = marks?.find(m => m.type.name === 'fontFamily');
  const fontFamily = fontFamilyMark ? fontFamilyMark.attrs.fontFamily : defaultFont;
  
  let style = '';
  if (nodeType === 'heading') {
    const level = 1; // fallback
    if (level === 1) style = 'bold 32px Fredoka';
    else if (level === 2) style = 'bold 24px Fredoka';
    else if (level === 3) style = 'bold 20px Fredoka';
    else style = 'bold 18px Fredoka';
  } else if (nodeType === 'blockquote') {
    style = 'italic 16px ' + fontFamily;
  } else {
    style = '16px ' + fontFamily;
  }
  
  ctx.font = style;
  return ctx.measureText(text).width;
}

function findLogicalParagraphStart(doc, pos) {
  const resolvedPos = doc.resolve(pos);
  const depth = resolvedPos.depth;
  const parent = resolvedPos.node(depth);
  let index = resolvedPos.index(depth);
  
  while (index > 0) {
    const prevSibling = parent.child(index - 1);
    if (prevSibling.isTextblock && prevSibling.attrs.autoWrapped) {
      index--;
    } else if (prevSibling.isTextblock) {
      index--;
      break;
    } else {
      break;
    }
  }
  
  let posAccum = resolvedPos.start(depth);
  for (let i = 0; i < index; i++) {
    posAccum += parent.child(i).nodeSize;
  }
  return posAccum;
}

function collectLogicalParagraphNodes(doc, startPos) {
  const resolvedPos = doc.resolve(startPos);
  const depth = resolvedPos.depth;
  const parent = resolvedPos.node(depth);
  const index = resolvedPos.index(depth);
  
  const nodes = [];
  let currentPos = startPos;
  
  const firstNode = parent.child(index);
  nodes.push({ node: firstNode, pos: currentPos });
  
  let idx = index + 1;
  let posAccum = currentPos + firstNode.nodeSize;
  
  while (idx < parent.childCount) {
    const sibling = parent.child(idx);
    if (sibling.isTextblock && sibling.attrs.autoWrapped) {
      nodes.push({ node: sibling, pos: posAccum });
      posAccum += sibling.nodeSize;
      idx++;
    } else {
      break;
    }
  }
  
  return nodes;
}

function tokenizeInlineNodes(inlineChildren) {
  const tokens = [];
  inlineChildren.forEach(child => {
    if (child.isText) {
      const text = child.text;
      const regex = /(\s+)|([^\s]+)/g;
      let match;
      while ((match = regex.exec(text)) !== null) {
        tokens.push({
          text: match[0],
          isSpace: Boolean(match[1]),
          marks: child.marks
        });
      }
    } else {
      tokens.push({
        node: child,
        isSpace: false,
        marks: child.marks
      });
    }
  });
  return tokens;
}

function wrapTokens(tokens, measureWidth, maxWidth) {
  const lines = [];
  let currentLine = [];
  let currentWidth = 0;
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    
    let tokenWidth = 0;
    if (token.node) {
      tokenWidth = token.node.attrs.width || 50;
    } else {
      tokenWidth = measureWidth(token.text, token.marks);
    }
    
    if (currentWidth + tokenWidth <= maxWidth) {
      currentLine.push(token);
      currentWidth += tokenWidth;
    } else {
      if (token.isSpace) {
        if (currentLine.length > 0) {
          lines.push(currentLine);
          currentLine = [];
          currentWidth = 0;
        }
      } else {
        if (tokenWidth > maxWidth) {
          let charAccum = '';
          let charWidthAccum = 0;
          for (let c = 0; c < token.text.length; c++) {
            const char = token.text[c];
            const cw = measureWidth(char, token.marks);
            if (currentWidth + charWidthAccum + cw <= maxWidth) {
              charAccum += char;
              charWidthAccum += cw;
            } else {
              if (charAccum) {
                currentLine.push({ text: charAccum, marks: token.marks });
              }
              lines.push(currentLine);
              currentLine = [];
              currentWidth = 0;
              charAccum = char;
              charWidthAccum = cw;
            }
          }
          if (charAccum) {
            currentLine.push({ text: charAccum, marks: token.marks });
            currentWidth = charWidthAccum;
          }
        } else {
          if (currentLine.length > 0) {
            lines.push(currentLine);
          }
          currentLine = [token];
          currentWidth = tokenWidth;
        }
      }
    }
  }
  
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }
  
  return lines;
}

function getCaretCharOffset(doc, startPos, caretPos) {
  let offset = 0;
  let found = false;
  doc.nodesBetween(startPos, caretPos, (node, pos) => {
    if (found) return false;
    if (node.isText) {
      const nodeLen = node.text.length;
      if (pos + nodeLen >= caretPos) {
        offset += (caretPos - pos);
        found = true;
      } else {
        offset += nodeLen;
      }
    }
  });
  return offset;
}

function getNewCaretPos(newNodes, startPos, charOffset) {
  let currentPos = startPos;
  let remainingOffset = charOffset;
  
  for (let i = 0; i < newNodes.length; i++) {
    const node = newNodes[i];
    const textLen = node.textContent.length;
    
    if (remainingOffset <= textLen) {
      return currentPos + 1 + remainingOffset;
    }
    
    currentPos += node.nodeSize;
    remainingOffset -= textLen;
  }
  
  return currentPos - 1;
}

function wrapLogicalParagraph(tr, doc, startPos) {
  const nodes = collectLogicalParagraphNodes(doc, startPos);
  if (nodes.length === 0) return false;
  
  const firstNode = nodes[0].node;
  const nodeType = firstNode.type;
  const parentAttrs = firstNode.attrs;
  
  // Resolve available paper width dynamically
  const paperEl = document.querySelector('.study-paper');
  const paperWidth = paperEl ? paperEl.clientWidth : 794;
  
  // Writable Width = Paper Width - Left Margin (44px) - Right Margin (44px) - Safe Buffer (16px)
  const maxWidth = paperWidth - 104;
  
  // Resolve list indentation
  const $pos = doc.resolve(startPos);
  let leftIndent = 0;
  for (let d = 1; d <= $pos.depth; d++) {
    const ancestor = $pos.node(d);
    if (ancestor && ancestor.type) {
      if (ancestor.type.name === 'bulletList' || ancestor.type.name === 'orderedList' || ancestor.type.name === 'taskList') {
        leftIndent += 28;
      }
      if (ancestor.type.name === 'blockquote') {
        leftIndent += 24;
      }
    }
  }
  const targetWidth = maxWidth - leftIndent;
  
  // Extract all inline nodes
  const inlineNodes = [];
  nodes.forEach(n => {
    n.node.forEach(child => {
      inlineNodes.push(child);
    });
  });
  
  // Wrap tokens
  const tokens = tokenizeInlineNodes(inlineNodes);
  const defaultFont = 'Playpen Sans';
  
  const measureWidth = (txt, marks) => {
    const isHeading = nodeType.name === 'heading';
    const typeLabel = isHeading ? 'heading' : nodeType.name;
    return measureTextWidth(txt, marks, typeLabel, defaultFont);
  };
  
  const lines = wrapTokens(tokens, measureWidth, targetWidth);
  
  // Reconstruct block nodes
  const { schema } = tr.doc;
  const newBlocks = lines.map((lineTokens, index) => {
    const children = [];
    lineTokens.forEach(tok => {
      if (tok.node) {
        children.push(tok.node);
      } else {
        children.push(schema.text(tok.text, tok.marks));
      }
    });
    
    return nodeType.create({
      ...parentAttrs,
      autoWrapped: index > 0
    }, children);
  });
  
  // Compare contents to prevent recursion
  const totalOldSize = nodes.reduce((sum, n) => sum + n.node.nodeSize, 0);
  let isIdentical = newBlocks.length === nodes.length;
  if (isIdentical) {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].node.textContent !== newBlocks[i].textContent) {
        isIdentical = false;
        break;
      }
    }
  }
  
  if (isIdentical) return false;
  
  // Save caret offset before modification
  const selection = tr.selection;
  let caretOffset = -1;
  const selectionInside = selection.from >= startPos && selection.to <= startPos + totalOldSize;
  if (selectionInside && selection.empty) {
    caretOffset = getCaretCharOffset(doc, startPos, selection.from);
  }
  
  // Replace the range with new wrapped nodes
  tr.replaceWith(startPos, startPos + totalOldSize, newBlocks);
  
  // Restore caret selection position
  if (caretOffset !== -1) {
    const newCaretPos = getNewCaretPos(newBlocks, startPos, caretOffset);
    tr.setSelection(TextSelection.create(tr.doc, newCaretPos));
  }
  
  return true;
}

export const ruledLineWrapPlugin = new Plugin({
  key: new PluginKey('ruledLineWrap'),
  appendTransaction(transactions, oldState, newState) {
    const docChanged = transactions.some(tr => tr.docChanged);
    const forceWrap = transactions.some(tr => tr.getMeta('forceRuleWrap'));
    if (!docChanged && !forceWrap) return null;
    
    const hasRuledWrapMeta = transactions.some(tr => tr.getMeta('ruledLineWrapApplied'));
    if (hasRuledWrapMeta) return null;
    
    let minPos = newState.doc.content.size;
    let maxPos = 0;
    
    transactions.forEach(tr => {
      tr.steps.forEach(step => {
        step.getMap().forEach((oldStart, oldEnd, newStart, newEnd) => {
          if (newStart < minPos) minPos = newStart;
          if (newEnd > maxPos) maxPos = newEnd;
        });
      });
    });
    
    if (maxPos < minPos) {
      minPos = 0;
      maxPos = newState.doc.content.size;
    }
    
    const processedStarts = new Set();
    const tr = newState.tr;
    let anyChanges = false;
    
    newState.doc.nodesBetween(minPos, maxPos, (node, pos) => {
      if (node.isTextblock) {
        const startPos = findLogicalParagraphStart(newState.doc, pos);
        if (processedStarts.has(startPos)) return false;
        processedStarts.add(startPos);
        
        const changed = wrapLogicalParagraph(tr, newState.doc, startPos);
        if (changed) {
          anyChanges = true;
        }
        return false;
      }
      return true;
    });
    
    if (anyChanges) {
      tr.setMeta('ruledLineWrapApplied', true);
      return tr;
    }
    
    return null;
  }
});
