import { Extension, InputRule } from '@tiptap/core';

// Custom TipTap Extension for auto-converting ..h1:, ..h2:, ..h3:, ..h4: commands into Headings
export const CustomHeadingCommands = Extension.create({
  name: 'customHeadingCommands',

  addInputRules() {
    const levels = [1, 2, 3, 4];
    return levels.map(level => {
      // Matches ..h1: , ..h2: , ..h3: , ..h4: followed by Space, Tab, or Enter
      const regex = new RegExp(`^\\.\\.h${level}:(?:\\s|$)`);
      return new InputRule({
        find: regex,
        handler: ({ state, range, chain }) => {
          const { from, to } = range;
          chain()
            .focus()
            .deleteRange({ from, to })
            .toggleHeading({ level })
            .run();
        }
      });
    });
  }
});
