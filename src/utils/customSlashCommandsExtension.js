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

      // Text Colors: /red (absolute), /blue, /green, /purple, /orange (semantic)
      new InputRule({
        find: /^\/red(?:\s|$)/,
        handler: ({ range, chain }) => {
          chain().focus().deleteRange(range).setColor('#EF4444').run();
        }
      }),
      new InputRule({
        find: /^\/blue(?:\s|$)/,
        handler: ({ range, chain }) => {
          chain().focus().deleteRange(range).setColor('var(--color-accent-blue)').run();
        }
      }),
      new InputRule({
        find: /^\/green(?:\s|$)/,
        handler: ({ range, chain }) => {
          chain().focus().deleteRange(range).setColor('var(--color-accent-green)').run();
        }
      }),
      new InputRule({
        find: /^\/purple(?:\s|$)/,
        handler: ({ range, chain }) => {
          chain().focus().deleteRange(range).setColor('var(--color-accent-purple)').run();
        }
      }),
      new InputRule({
        find: /^\/orange(?:\s|$)/,
        handler: ({ range, chain }) => {
          chain().focus().deleteRange(range).setColor('var(--color-accent-orange)').run();
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

      // Font Triggers: .playpen., .fredoka., .roman.
      new InputRule({
        find: /(?:\.playpen\.|^\.playpen\.)(?:\s|$)/,
        handler: ({ range, chain }) => {
          chain().focus().deleteRange(range).setFontFamily("'Playpen Sans', cursive, sans-serif").run();
        }
      }),
      new InputRule({
        find: /(?:\.fredoka\.|^\.fredoka\.)(?:\s|$)/,
        handler: ({ range, chain }) => {
          chain().focus().deleteRange(range).setFontFamily("'Fredoka', sans-serif").run();
        }
      }),
      new InputRule({
        find: /(?:\.roman\.|^\.roman\.)(?:\s|$)/,
        handler: ({ range, chain }) => {
          chain().focus().deleteRange(range).setFontFamily("'Times New Roman', Times, serif").run();
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
