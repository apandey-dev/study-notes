import { Extension } from '@tiptap/core';

export const CustomRelatedBranches = Extension.create({
  name: 'customRelatedBranches',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading'],
        attributes: {
          branchId: {
            default: null,
            keepOnSplit: false,
            parseHTML: element => element.getAttribute('data-branch-id') || null,
            renderHTML: attributes => {
              if (!attributes.branchId) return {};
              return { 'data-branch-id': attributes.branchId };
            }
          },
          branchParent: {
            default: null,
            keepOnSplit: false,
            parseHTML: element => element.getAttribute('data-branch-parent') || null,
            renderHTML: attributes => {
              if (!attributes.branchParent) return {};
              return { 'data-branch-parent': attributes.branchParent };
            }
          },
          branchLevel: {
            default: 0,
            keepOnSplit: false,
            parseHTML: element => parseInt(element.getAttribute('data-branch-level') || '0', 10),
            renderHTML: attributes => {
              const lvl = attributes.branchLevel || 0;
              const hid = attributes.branchHidden ? ' branch-hidden' : '';
              return { 
                'data-branch-level': lvl,
                class: `branch-line branch-level-${lvl}${hid}`
              };
            }
          },
          branchCollapsed: {
            default: false,
            keepOnSplit: false,
            parseHTML: element => element.getAttribute('data-branch-collapsed') === 'true',
            renderHTML: attributes => {
              if (!attributes.branchCollapsed) return {};
              return { 'data-branch-collapsed': 'true' };
            }
          },
          branchHidden: {
            default: false,
            keepOnSplit: false,
            parseHTML: element => element.getAttribute('data-branch-hidden') === 'true',
            renderHTML: attributes => {
              if (!attributes.branchHidden) return {};
              return { 'data-branch-hidden': 'true' };
            }
          }
        }
      }
    ];
  },

  addKeyboardShortcuts() {
    return {
      'Shift-Enter': ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;

        const currentBlock = $from.node($from.depth);
        if (!currentBlock || (currentBlock.type.name !== 'paragraph' && currentBlock.type.name !== 'heading')) {
          return false;
        }

        let parentId = currentBlock.attrs.branchId;
        const currentLevel = currentBlock.attrs.branchLevel || 0;

        if (!parentId) {
          parentId = crypto.randomUUID();
          editor.commands.command(({ tr }) => {
            tr.setNodeMarkup($from.before($from.depth), undefined, {
              ...currentBlock.attrs,
              branchId: parentId
            });
            return true;
          });
        }

        const childId = crypto.randomUUID();
        const nextLevel = currentLevel + 1;

        editor.chain()
          .focus()
          .splitBlock()
          .command(({ tr }) => {
            const { selection: postSplitSel } = tr;
            const $newFrom = postSplitSel.$from;
            const nodePos = $newFrom.before($newFrom.depth);

            const newNode = tr.doc.nodeAt(nodePos);
            if (newNode) {
              tr.setNodeMarkup(nodePos, undefined, {
                ...newNode.attrs,
                branchId: childId,
                branchParent: parentId,
                branchLevel: nextLevel,
                branchCollapsed: false,
                branchHidden: false
              });
            }
            return true;
          })
          .run();

        return true;
      }
    };
  }
});
