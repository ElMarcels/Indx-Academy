'use client';

import { useState } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

export function MarkdownEditor({ value, onChange, placeholder, label }: MarkdownEditorProps) {
  const [tab, setTab] = useState<'write' | 'preview'>('write');

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-dark-300">{label}</label>
          <div className="flex gap-1 bg-dark-800/50 rounded-lg p-0.5">
            <button
              onClick={() => setTab('write')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                tab === 'write' ? 'bg-brand-600 text-white' : 'text-dark-400 hover:text-white'
              }`}
            >
              Escribir
            </button>
            <button
              onClick={() => setTab('preview')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                tab === 'preview' ? 'bg-brand-600 text-white' : 'text-dark-400 hover:text-white'
              }`}
            >
              Vista previa
            </button>
          </div>
        </div>
      )}

      {tab === 'write' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || 'Escribe en Markdown...'}
          rows={12}
          className="input font-mono text-sm"
        />
      ) : (
        <div className="card p-6 min-h-[200px]">
          {value ? (
            <MarkdownRenderer content={value} />
          ) : (
            <p className="text-dark-500 italic">Sin contenido para previsualizar</p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 text-xs text-dark-600">
        <span>**negrita**</span>
        <span>*cursiva*</span>
        <span>`código`</span>
        <span>```bloque```</span>
        <span>[enlace](url)</span>
        <span>- lista</span>
        <span># título</span>
        <span>&gt; cita</span>
      </div>
    </div>
  );
}
