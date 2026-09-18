import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { Extension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Link2, Eraser,
} from 'lucide-react';

// TipTap has no built-in font-size mark — this is the documented pattern for adding one:
// extend `textStyle` with a `fontSize` attribute that round-trips through inline CSS.
const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return { types: ['textStyle'] };
  },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        fontSize: {
          default: null,
          parseHTML: (element) => element.style.fontSize || null,
          renderHTML: (attributes) => (attributes.fontSize ? { style: `font-size: ${attributes.fontSize}` } : {}),
        },
      },
    }];
  },
  addCommands() {
    return {
      setFontSize: (fontSize) => ({ chain }) => chain().setMark('textStyle', { fontSize }).run(),
      unsetFontSize: () => ({ chain }) => chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
    };
  },
});

const FONT_FAMILIES = [
  { label: 'Default', value: '' },
  { label: 'Sans Serif', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Serif', value: 'Georgia, "Times New Roman", serif' },
  { label: 'Monospace', value: '"Courier New", monospace' },
];

// Plain point-style numbers, like Word's font size box, rather than S/M/L labels.
const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];
const DEFAULT_FONT_SIZE = '14';

const ToolbarButton = ({ active, onClick, title, children }) => (
  <button
    type="button"
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    title={title}
    className={`inline-flex items-center justify-center w-7 h-7 rounded transition-colors ${
      active ? 'bg-violet-100 text-violet-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
    }`}
  >
    {children}
  </button>
);

// A shared "Word-like" rich text editor for content/description fields — value and onChange
// carry HTML strings, matching how these fields are read back (dangerouslySetInnerHTML) elsewhere.
// minHeight defaults to roughly what a 10-row textarea would take up — the minimum every
// content/description field should give the admin to work with.
const RichTextEditor = ({ value, onChange, placeholder = 'Write something...', minHeight = 220 }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: false }),
      Underline,
      TextStyle,
      FontSize,
      Color,
      FontFamily,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
    editorProps: {
      attributes: { class: 'rte-content' },
    },
  });

  // Keep the editor in sync when the parent resets `value` out from under it (e.g. switching
  // which record is selected in a master-detail list) without fighting the user mid-keystroke.
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const incoming = value || '';
    if (incoming !== current && incoming !== '<p></p>') {
      editor.commands.setContent(incoming, { emitUpdate: false });
    } else if (!incoming && current !== '<p></p>') {
      editor.commands.clearContent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) return null;

  const setLink = () => {
    const previous = editor.getAttributes('link').href;
    // eslint-disable-next-line no-alert
    const url = window.prompt('Link URL', previous || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="border border-gray-200 rounded-md overflow-hidden focus-within:border-violet-500 transition-colors">
      <div className="rte-toolbar flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50">
        <select
          value={editor.getAttributes('textStyle').fontFamily || ''}
          onChange={(e) => {
            const val = e.target.value;
            if (val) editor.chain().focus().setFontFamily(val).run();
            else editor.chain().focus().unsetFontFamily().run();
          }}
          className="h-7 px-1.5 text-xs border border-gray-200 rounded bg-white focus:outline-none"
        >
          {FONT_FAMILIES.map((f) => <option key={f.label} value={f.value}>{f.label}</option>)}
        </select>
        <select
          value={(editor.getAttributes('textStyle').fontSize || `${DEFAULT_FONT_SIZE}px`).replace('px', '')}
          onChange={(e) => editor.chain().focus().setFontSize(`${e.target.value}px`).run()}
          className="h-7 px-1.5 text-xs border border-gray-200 rounded bg-white focus:outline-none mr-1"
        >
          {FONT_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>

        <div className="w-px h-5 bg-gray-200 mx-0.5" />

        <ToolbarButton title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={14} />
        </ToolbarButton>
        <ToolbarButton title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={14} />
        </ToolbarButton>
        <ToolbarButton title="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon size={14} />
        </ToolbarButton>
        <ToolbarButton title="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough size={14} />
        </ToolbarButton>

        <label title="Text color" className="inline-flex items-center justify-center w-7 h-7 rounded cursor-pointer text-gray-500 hover:bg-gray-100 relative">
          <span className="text-xs font-bold" style={{ color: editor.getAttributes('textStyle').color || undefined }}>A</span>
          <input
            type="color"
            value={editor.getAttributes('textStyle').color || '#111827'}
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </label>

        <div className="w-px h-5 bg-gray-200 mx-0.5" />

        <ToolbarButton title="Align left" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
          <AlignLeft size={14} />
        </ToolbarButton>
        <ToolbarButton title="Align center" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
          <AlignCenter size={14} />
        </ToolbarButton>
        <ToolbarButton title="Align right" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
          <AlignRight size={14} />
        </ToolbarButton>
        <ToolbarButton title="Justify" active={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()}>
          <AlignJustify size={14} />
        </ToolbarButton>

        <div className="w-px h-5 bg-gray-200 mx-0.5" />

        <ToolbarButton title="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List size={14} />
        </ToolbarButton>
        <ToolbarButton title="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered size={14} />
        </ToolbarButton>
        <ToolbarButton title="Link" active={editor.isActive('link')} onClick={setLink}>
          <Link2 size={14} />
        </ToolbarButton>

        <div className="w-px h-5 bg-gray-200 mx-0.5" />

        <ToolbarButton title="Clear formatting" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>
          <Eraser size={14} />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} style={{ minHeight }} className="px-3 py-2 text-sm" />
    </div>
  );
};

export default RichTextEditor;
