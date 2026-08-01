import { Extension, InputRule } from '@tiptap/core';

export const CustomSlashCommands = Extension.create({
  name: 'customSlashCommands',

  addInputRules() {
    return [
      // Headings: /h1, /h2, /h3, /h4, ..h1:, ..h2:, ..h3:, ..h4:
      new InputRule({
        find: /^(?:\/h1|\.\.h1:)(?:\s|$)/,
        handler: ({ range, chain }) => {
          chain().focus().deleteRange(range).toggleHeading({ level: 1 }).run();
        }
      }),
      new InputRule({
        find: /^(?:\/h2|\.\.h2:)(?:\s|$)/,
        handler: ({ range, chain }) => {
          chain().focus().deleteRange(range).toggleHeading({ level: 2 }).run();
        }
      }),
      new InputRule({
        find: /^(?:\/h3|\.\.h3:)(?:\s|$)/,
        handler: ({ range, chain }) => {
          chain().focus().deleteRange(range).toggleHeading({ level: 3 }).run();
        }
      }),
      new InputRule({
        find: /^(?:\/h4|\.\.h4:)(?:\s|$)/,
        handler: ({ range, chain }) => {
          chain().focus().deleteRange(range).toggleHeading({ level: 4 }).run();
        }
      }),

      // Lists: /b (bullet), /n (numbered), /c (checklist)
      new InputRule({
        find: /^\/b(?:\s|$)/,
        handler: ({ range, chain }) => {
          chain().focus().deleteRange(range).toggleBulletList().run();
        }
      }),
      new InputRule({
        find: /^\/n(?:\s|$)/,
        handler: ({ range, chain }) => {
          chain().focus().deleteRange(range).toggleOrderedList().run();
        }
      }),
      new InputRule({
        find: /^\/c(?:\s|$)/,
        handler: ({ range, chain }) => {
          chain().focus().deleteRange(range).toggleTaskList().run();
        }
      }),

      // Callouts: /note, /tip, /warn, /important
      new InputRule({
        find: /^\/note(?:\s|$)/,
        handler: ({ range, chain }) => {
          chain().focus().deleteRange(range).insertContent('<blockquote class="callout-box callout-note"><strong>Note: </strong> </blockquote>').run();
        }
      }),
      new InputRule({
        find: /^\/tip(?:\s|$)/,
        handler: ({ range, chain }) => {
          chain().focus().deleteRange(range).insertContent('<blockquote class="callout-box callout-tip"><strong>Tip: </strong> </blockquote>').run();
        }
      }),
      new InputRule({
        find: /^\/warn(?:\s|$)/,
        handler: ({ range, chain }) => {
          chain().focus().deleteRange(range).insertContent('<blockquote class="callout-box callout-warn"><strong>Warning: </strong> </blockquote>').run();
        }
      }),
      new InputRule({
        find: /^\/important(?:\s|$)/,
        handler: ({ range, chain }) => {
          chain().focus().deleteRange(range).insertContent('<blockquote class="callout-box callout-important"><strong>Important: </strong> </blockquote>').run();
        }
      }),

      // Quotes: /q, /quote
      new InputRule({
        find: /^\/(?:q|quote)(?:\s|$)/,
        handler: ({ range, chain }) => {
          chain().focus().deleteRange(range).toggleBlockquote().run();
        }
      }),

      // Code Block: /code
      new InputRule({
        find: /^\/code(?:\s|$)/,
        handler: ({ range, chain }) => {
          chain().focus().deleteRange(range).toggleCodeBlock().run();
        }
      }),

      // Horizontal Rule / Divider: /hr
      new InputRule({
        find: /^\/hr(?:\s|$)/,
        handler: ({ range, chain }) => {
          chain().focus().deleteRange(range).setHorizontalRule().run();
        }
      }),

      // Formatting Toggles: /bold, /italic, /underline
      new InputRule({
        find: /^\/bold(?:\s|$)/,
        handler: ({ range, chain }) => {
          chain().focus().deleteRange(range).toggleBold().run();
        }
      }),
      new InputRule({
        find: /^\/italic(?:\s|$)/,
        handler: ({ range, chain }) => {
          chain().focus().deleteRange(range).toggleItalic().run();
        }
      }),
      new InputRule({
        find: /^\/underline(?:\s|$)/,
        handler: ({ range, chain }) => {
          chain().focus().deleteRange(range).toggleUnderline().run();
        }
      }),

      // Text Colors: /red, /blue, /green, /purple, /orange
      new InputRule({
        find: /^\/red(?:\s|$)/,
        handler: ({ range, chain }) => {
          chain().focus().deleteRange(range).setColor('#EF4444').run();
        }
      }),
      new InputRule({
        find: /^\/blue(?:\s|$)/,
        handler: ({ range, chain }) => {
          chain().focus().deleteRange(range).setColor('#0078D4').run();
        }
      }),
      new InputRule({
        find: /^\/green(?:\s|$)/,
        handler: ({ range, chain }) => {
          chain().focus().deleteRange(range).setColor('#10B981').run();
        }
      }),
      new InputRule({
        find: /^\/purple(?:\s|$)/,
        handler: ({ range, chain }) => {
          chain().focus().deleteRange(range).setColor('#8B5CF6').run();
        }
      }),
      new InputRule({
        find: /^\/orange(?:\s|$)/,
        handler: ({ range, chain }) => {
          chain().focus().deleteRange(range).setColor('#F59E0B').run();
        }
      }),

      // Date & Time: /date, /time, /datetime
      new InputRule({
        find: /^\/date(?:\s|$)/,
        handler: ({ range, chain }) => {
          const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
          chain().focus().deleteRange(range).insertContent(dateStr).run();
        }
      }),
      new InputRule({
        find: /^\/time(?:\s|$)/,
        handler: ({ range, chain }) => {
          const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
          chain().focus().deleteRange(range).insertContent(timeStr).run();
        }
      }),
      new InputRule({
        find: /^\/datetime(?:\s|$)/,
        handler: ({ range, chain }) => {
          const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
          const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
          chain().focus().deleteRange(range).insertContent(`${dateStr} ${timeStr}`).run();
        }
      }),

      // Quick Emojis
      new InputRule({ find: /:tick:$/, handler: ({ range, chain }) => chain().focus().deleteRange(range).insertContent('✓ ').run() }),
      new InputRule({ find: /:cross:$/, handler: ({ range, chain }) => chain().focus().deleteRange(range).insertContent('✗ ').run() }),
      new InputRule({ find: /:star:$/, handler: ({ range, chain }) => chain().focus().deleteRange(range).insertContent('⭐ ').run() }),
      new InputRule({ find: /:idea:$/, handler: ({ range, chain }) => chain().focus().deleteRange(range).insertContent('💡 ').run() }),
      new InputRule({ find: /:book:$/, handler: ({ range, chain }) => chain().focus().deleteRange(range).insertContent('📚 ').run() }),
      new InputRule({ find: /:pin:$/, handler: ({ range, chain }) => chain().focus().deleteRange(range).insertContent('📌 ').run() }),
      new InputRule({ find: /:warning:$/, handler: ({ range, chain }) => chain().focus().deleteRange(range).insertContent('⚠️ ').run() })
    ];
  }
});
