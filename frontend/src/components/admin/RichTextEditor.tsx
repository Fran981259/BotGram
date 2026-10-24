"use client";

import { useCallback, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";

type Props = {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

type BtnProps = {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
};

function ToolbarBtn({ onClick, active, title, children }: BtnProps) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      style={{
        padding: "2px 8px",
        fontSize: 12,
        lineHeight: "20px",
        borderRadius: 4,
        border: "1px solid var(--adm-border, #555)",
        background: active ? "var(--adm-accent, #3b82f6)" : "transparent",
        color: active ? "#fff" : "var(--adm-text, inherit)",
        cursor: "pointer",
        fontWeight: active ? 700 : 400,
      }}
    >
      {children}
    </button>
  );
}

/**
 * Editor WYSIWYG baseado em TipTap.
 * Recebe e emite HTML compatível com o formato já armazenado no banco.
 * Quando `disabled=true` exibe placeholder (conteúdo ainda não carregado).
 */
export function RichTextEditor({ value, onChange, disabled = false, placeholder }: Props) {
  const skipUpdate = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, autolink: true }),
    ],
    content: "",
    editable: !disabled,
    onUpdate: ({ editor }) => {
      if (!skipUpdate.current) {
        onChange(editor.getHTML());
      }
    },
  });

  // Sync valor externo → editor (ex: lazy-load do conteúdo)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value === current) return;
    skipUpdate.current = true;
    editor.commands.setContent(value || "<p></p>", false);
    skipUpdate.current = false;
  }, [editor, value]);

  // Atualiza editable quando disabled muda
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  const promptLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL do link:", prev ?? "");
    if (url === null) return;
    if (!url) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  }, [editor]);

  const containerStyle: React.CSSProperties = {
    border: "1px solid var(--adm-border, #555)",
    borderRadius: 6,
    overflow: "hidden",
    opacity: disabled ? 0.55 : 1,
  };

  if (!editor) {
    return (
      <div style={{ ...containerStyle, padding: "10px 12px", fontSize: 13, color: "var(--adm-text-muted, #888)" }}>
        {placeholder ?? "Carregando editor…"}
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Toolbar — oculta quando desabilitado */}
      {!disabled && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 3,
            padding: "6px 8px",
            borderBottom: "1px solid var(--adm-border, #555)",
            background: "var(--adm-sidebar-bg, rgba(128,128,128,0.06))",
          }}
        >
          <ToolbarBtn title="Negrito (Ctrl+B)" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
            <strong>B</strong>
          </ToolbarBtn>
          <ToolbarBtn title="Itálico (Ctrl+I)" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <em>I</em>
          </ToolbarBtn>
          <ToolbarBtn title="Tachado" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
            S̶
          </ToolbarBtn>
          <span style={{ width: 1, background: "var(--adm-border, #555)", margin: "0 2px" }} />
          <ToolbarBtn title="Título H2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            H2
          </ToolbarBtn>
          <ToolbarBtn title="Título H3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
            H3
          </ToolbarBtn>
          <span style={{ width: 1, background: "var(--adm-border, #555)", margin: "0 2px" }} />
          <ToolbarBtn title="Lista com marcadores" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            ≡ •
          </ToolbarBtn>
          <ToolbarBtn title="Lista numerada" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            1.
          </ToolbarBtn>
          <span style={{ width: 1, background: "var(--adm-border, #555)", margin: "0 2px" }} />
          <ToolbarBtn title="Citação" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            ❝
          </ToolbarBtn>
          <ToolbarBtn title="Código inline" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}>
            &lt;/&gt;
          </ToolbarBtn>
          <ToolbarBtn title="Link" active={editor.isActive("link")} onClick={promptLink}>
            🔗
          </ToolbarBtn>
          <span style={{ flex: 1 }} />
          <ToolbarBtn title="Desfazer (Ctrl+Z)" active={false} onClick={() => editor.chain().focus().undo().run()}>
            ↩
          </ToolbarBtn>
          <ToolbarBtn title="Refazer (Ctrl+Y)" active={false} onClick={() => editor.chain().focus().redo().run()}>
            ↪
          </ToolbarBtn>
          <ToolbarBtn title="Limpar formatação" active={false} onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>
            ✕
          </ToolbarBtn>
        </div>
      )}

      {/* Área editável */}
      <EditorContent
        editor={editor}
        style={{
          minHeight: 200,
          maxHeight: 480,
          overflowY: "auto",
          padding: "10px 12px",
          fontSize: 14,
          lineHeight: 1.7,
          color: "var(--adm-text, inherit)",
          outline: "none",
          cursor: disabled ? "default" : "text",
        }}
      />
    </div>
  );
}
