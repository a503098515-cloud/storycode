"use client";

// A CodeMirror 6 editor for JavaScript. Controlled-ish: `value` seeds the
// editor and replaces its text when it changes from outside; edits flow out
// through `onChange`. Tab is deliberately not bound (no indentWithTab), so the
// editor is never a keyboard trap.
import { useEffect, useRef } from "react";
import { EditorView, basicSetup } from "codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { Compartment } from "@codemirror/state";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  /** id of the visible label element */
  labelledBy: string;
}

const theme = EditorView.theme({
  "&": { fontSize: "13px", backgroundColor: "#fff" },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": {
    minHeight: "9rem",
    maxHeight: "24rem",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  },
});

export function CodeEditor({ value, onChange, disabled = false, labelledBy }: CodeEditorProps) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const editable = useRef(new Compartment());
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Create the editor once per mount; later prop changes are dispatched below.
  useEffect(() => {
    if (!host.current) return;
    const editor = new EditorView({
      doc: value,
      parent: host.current,
      extensions: [
        basicSetup,
        javascript(),
        theme,
        editable.current.of(EditorView.editable.of(!disabled)),
        EditorView.contentAttributes.of({ "aria-labelledby": labelledBy }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) onChangeRef.current(update.state.doc.toString());
        }),
      ],
    });
    view.current = editor;
    return () => {
      editor.destroy();
      view.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only; see effects below
  }, []);

  useEffect(() => {
    view.current?.dispatch({ effects: editable.current.reconfigure(EditorView.editable.of(!disabled)) });
  }, [disabled]);

  useEffect(() => {
    const editor = view.current;
    if (!editor) return;
    const current = editor.state.doc.toString();
    if (current !== value) editor.dispatch({ changes: { from: 0, to: current.length, insert: value } });
  }, [value]);

  return (
    <div
      ref={host}
      className={`overflow-hidden rounded-lg border border-neutral-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200 ${
        disabled ? "opacity-60" : ""
      }`}
    />
  );
}
