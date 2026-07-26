'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiBold,
  FiItalic,
  FiCode,
  FiLink,
  FiImage,
  FiList,
  FiAlignLeft,
  FiHash,
  FiChevronDown,
  FiCheck,
  FiMaximize2,
  FiMinimize2,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

interface InlineCMSEditorProps {
  initialContent?: string;
  onSave: (content: string) => void;
  label?: string;
}

type ViewMode = 'split' | 'editor' | 'preview';

export function InlineCMSEditor({
  initialContent = '',
  onSave,
  label,
}: InlineCMSEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileTab, setMobileTab] = useState<'edit' | 'preview'>('edit');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    setHasChanges(content !== initialContent);
  }, [content, initialContent]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await onSave(content);
      setLastSaved(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }));
      setHasChanges(false);
      toast.success('Contenido guardado');
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  }, [content, onSave]);

  const insertMarkdown = useCallback((before: string, after: string = '') => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.substring(start, end);
    const replacement = before + (selected || 'texto') + after;
    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);
    setTimeout(() => {
      ta.focus();
      const cursorPos = start + before.length;
      ta.setSelectionRange(cursorPos, cursorPos + (selected || 'texto').length);
    }, 0);
  }, [content]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        insertMarkdown('**', '**');
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        insertMarkdown('*', '*');
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    },
    [insertMarkdown, handleSave]
  );

  const toolbarButtons = [
    { icon: FiBold, label: 'Negrita', action: () => insertMarkdown('**', '**'), shortcut: 'Ctrl+B' },
    { icon: FiItalic, label: 'Cursiva', action: () => insertMarkdown('*', '*'), shortcut: 'Ctrl+I' },
    { type: 'divider' as const },
    { icon: FiHash, label: 'H1', action: () => insertMarkdown('# ') },
    { icon: FiHash, label: 'H2', action: () => insertMarkdown('## ') },
    { icon: FiHash, label: 'H3', action: () => insertMarkdown('### ') },
    { type: 'divider' as const },
    { icon: FiCode, label: 'Código', action: () => insertMarkdown('`', '`') },
    { icon: FiCode, label: 'Bloque', action: () => insertMarkdown('\n```\n', '\n```\n') },
    { type: 'divider' as const },
    { icon: FiLink, label: 'Enlace', action: () => insertMarkdown('[', '](url)') },
    { icon: FiImage, label: 'Imagen', action: () => insertMarkdown('![alt](', ')') },
    { type: 'divider' as const },
    { icon: FiList, label: 'Lista', action: () => insertMarkdown('\n- ') },
    { icon: FiAlignLeft, label: 'Lista num.', action: () => insertMarkdown('\n1. ') },
    { icon: FiAlignLeft, label: 'Cita', action: () => insertMarkdown('\n> ') },
  ];

  const viewModes: { mode: ViewMode; label: string }[] = [
    { mode: 'split', label: 'Dividido' },
    { mode: 'editor', label: 'Editor' },
    { mode: 'preview', label: 'Vista previa' },
  ];

  if (isMobile) {
    return (
      <div className="space-y-3">
        {label && (
          <label className="text-sm font-medium text-dark-300 block">{label}</label>
        )}

        <div className="flex gap-1 bg-dark-800/50 rounded-lg p-0.5">
          {(['edit', 'preview'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setMobileTab(tab)}
              className={`flex-1 py-2 rounded-md text-xs font-medium transition-colors ${
                mobileTab === tab
                  ? 'bg-brand-600 text-white'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              {tab === 'edit' ? 'Editor' : 'Vista previa'}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {mobileTab === 'edit' ? (
            <motion.div
              key="editor"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <MobileToolbar onInsert={insertMarkdown} />
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe en Markdown..."
                rows={20}
                className="input font-mono text-sm w-full"
              />
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="card p-6 min-h-[200px]">
                {content ? (
                  <MarkdownRenderer content={content} />
                ) : (
                  <p className="text-dark-500 italic">Sin contenido para previsualizar</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between pt-2">
          <SaveIndicator hasChanges={hasChanges} saving={saving} lastSaved={lastSaved} />
          <button onClick={handleSave} disabled={saving || !hasChanges} className="btn-primary text-sm">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        {label && <label className="text-sm font-medium text-dark-300">{label}</label>}

        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-dark-800/50 rounded-lg p-0.5">
            {viewModes.map(({ mode, label: modeLabel }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  viewMode === mode
                    ? 'bg-brand-600 text-white'
                    : 'text-dark-400 hover:text-white'
                }`}
              >
                {modeLabel}
              </button>
            ))}
          </div>

          <SaveIndicator hasChanges={hasChanges} saving={saving} lastSaved={lastSaved} />

          <button onClick={handleSave} disabled={saving || !hasChanges} className="btn-primary text-sm">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      <div className="flex gap-0 border border-dark-800/50 rounded-2xl overflow-hidden bg-dark-900/80 backdrop-blur-sm">
        <AnimatePresence initial={false}>
          {(viewMode === 'split' || viewMode === 'editor') && (
            <motion.div
              key="editor-panel"
              initial={{ width: 0, opacity: 0 }}
              animate={{
                width: viewMode === 'split' ? '50%' : '100%',
                opacity: 1,
              }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="border-r border-dark-800/50 h-full">
                <div className="border-b border-dark-800/50 px-3 py-2 flex items-center gap-1">
                  {toolbarButtons.map((btn, i) => {
                    if ('type' in btn && btn.type === 'divider') {
                      return (
                        <div key={i} className="w-px h-5 bg-dark-700/50 mx-1" />
                      );
                    }
                    const b = btn as { icon: React.ElementType; label: string; action: () => void; shortcut?: string };
                    return (
                      <button
                        key={i}
                        onClick={b.action}
                        title={`${b.label}${b.shortcut ? ` (${b.shortcut})` : ''}`}
                        className="p-1.5 rounded-md text-dark-500 hover:text-white hover:bg-dark-700/50 transition-colors"
                      >
                        <b.icon size={14} />
                      </button>
                    );
                  })}
                </div>
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe en Markdown..."
                  rows={24}
                  className="w-full bg-transparent font-mono text-sm text-dark-100 placeholder-dark-600 p-4 resize-none focus:outline-none"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {(viewMode === 'split' || viewMode === 'preview') && (
            <motion.div
              key="preview-panel"
              initial={{ width: 0, opacity: 0 }}
              animate={{
                width: viewMode === 'split' ? '50%' : '100%',
                opacity: 1,
              }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="p-6 min-h-[400px] overflow-y-auto max-h-[600px]">
                {content ? (
                  <MarkdownRenderer content={content} />
                ) : (
                  <div className="flex items-center justify-center h-full min-h-[300px]">
                    <p className="text-dark-600 italic">La vista previa aparecerá aquí</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function SaveIndicator({
  hasChanges,
  saving,
  lastSaved,
}: {
  hasChanges: boolean;
  saving: boolean;
  lastSaved: string | null;
}) {
  if (saving) {
    return (
      <span className="text-xs text-brand-400 flex items-center gap-1.5">
        <motion.div
          className="w-1.5 h-1.5 rounded-full bg-brand-400"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
        Guardando...
      </span>
    );
  }

  if (hasChanges) {
    return (
      <span className="text-xs text-yellow-400 flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
        Sin guardar
      </span>
    );
  }

  if (lastSaved) {
    return (
      <span className="text-xs text-emerald-400 flex items-center gap-1.5">
        <FiCheck size={12} />
        Guardado {lastSaved}
      </span>
    );
  }

  return null;
}

function MobileToolbar({ onInsert }: { onInsert: (before: string, after?: string) => void }) {
  const [showMore, setShowMore] = useState(false);

  const buttons = [
    { icon: FiBold, action: () => onInsert('**', '**') },
    { icon: FiItalic, action: () => onInsert('*', '*') },
    { icon: FiCode, action: () => onInsert('`', '`') },
    { icon: FiLink, action: () => onInsert('[', '](url)') },
    { icon: FiList, action: () => onInsert('\n- ') },
  ];

  const moreButtons = [
    { icon: FiHash, label: 'H1', action: () => onInsert('# ') },
    { icon: FiHash, label: 'H2', action: () => onInsert('## ') },
    { icon: FiHash, label: 'H3', action: () => onInsert('### ') },
    { icon: FiCode, label: 'Bloque', action: () => onInsert('\n```\n', '\n```\n') },
    { icon: FiImage, label: 'Imagen', action: () => onInsert('![alt](', ')') },
    { icon: FiAlignLeft, label: 'Lista num.', action: () => onInsert('\n1. ') },
    { icon: FiAlignLeft, label: 'Cita', action: () => onInsert('\n> ') },
  ];

  return (
    <div className="flex items-center gap-1 pb-2 flex-wrap">
      {buttons.map((btn, i) => (
        <button
          key={i}
          onClick={btn.action}
          className="p-2 rounded-md text-dark-500 hover:text-white hover:bg-dark-700/50 transition-colors"
        >
          <btn.icon size={16} />
        </button>
      ))}
      <div className="relative">
        <button
          onClick={() => setShowMore(!showMore)}
          className="p-2 rounded-md text-dark-500 hover:text-white hover:bg-dark-700/50 transition-colors flex items-center gap-1"
        >
          <FiChevronDown size={14} className={`transition-transform ${showMore ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence>
          {showMore && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="absolute top-full left-0 mt-1 bg-dark-800 border border-dark-700/50 rounded-xl p-2 shadow-xl z-10 flex flex-wrap gap-1"
            >
              {moreButtons.map((btn, i) => (
                <button
                  key={i}
                  onClick={() => {
                    btn.action();
                    setShowMore(false);
                  }}
                  className="p-2 rounded-md text-dark-400 hover:text-white hover:bg-dark-700/50 transition-colors"
                  title={btn.label}
                >
                  <btn.icon size={14} />
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
