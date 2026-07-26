'use client';

import { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiPlay, FiTerminal, FiChevronDown, FiCopy, FiCheck } from 'react-icons/fi';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface CodeEditorProps {
  initialCode?: string;
  language?: string;
  onChange?: (code: string) => void;
  height?: string;
  readOnly?: boolean;
}

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
] as const;

export function CodeEditor({
  initialCode = '',
  language: initialLanguage = 'javascript',
  onChange,
  height = '300px',
  readOnly = false,
}: CodeEditorProps) {
  const [code, setCode] = useState(initialCode);
  const [language, setLanguage] = useState(initialLanguage);
  const [output, setOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  function handleChange(value: string | undefined) {
    const newCode = value || '';
    setCode(newCode);
    onChange?.(newCode);
  }

  function runCode() {
    setIsRunning(true);
    setShowOutput(true);
    setOutput([]);

    try {
      if (language === 'javascript') {
        runJavaScript();
      } else if (language === 'html') {
        runHTML();
      } else {
        setOutput([`Execución de ${language} no soportada en el navegador.`]);
      }
    } catch (err) {
      setOutput([`Error: ${(err as Error).message}`]);
    } finally {
      setIsRunning(false);
    }
  }

  function runJavaScript() {
    const logs: string[] = [];
    const mockConsole = {
      log: (...args: unknown[]) => logs.push(args.map(String).join(' ')),
      error: (...args: unknown[]) => logs.push(`ERROR: ${args.map(String).join(' ')}`),
      warn: (...args: unknown[]) => logs.push(`WARN: ${args.map(String).join(' ')}`),
      info: (...args: unknown[]) => logs.push(`INFO: ${args.map(String).join(' ')}`),
    };

    const fn = new Function('console', code);
    const result = fn(mockConsole);

    if (logs.length === 0 && result !== undefined) {
      logs.push(String(result));
    }

    setOutput(logs.length > 0 ? logs : ['(sin salida)']);
  }

  function runHTML() {
    const srcDoc = `
      <!DOCTYPE html>
      <html>
      <head><style>body{margin:0;font-family:sans-serif;}</style></head>
      <body>${code}</body>
      </html>
    `;
    setOutput(['HTML renderizado en el panel de vista previa ↓']);

    setTimeout(() => {
      if (iframeRef.current) {
        iframeRef.current.srcdoc = srcDoc;
      }
    }, 0);
  }

  function copyCode() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Código copiado');
    setTimeout(() => setCopied(false), 2000);
  }

  const currentLang = LANGUAGES.find((l) => l.value === language);

  return (
    <div className="rounded-2xl border border-dark-800/50 bg-dark-900/80 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-dark-800/50 bg-dark-900/60">
        <div className="flex items-center gap-3">
          {/* Language selector */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-2 text-sm text-dark-300 hover:text-white transition-colors px-3 py-1.5 rounded-lg bg-dark-800/50 hover:bg-dark-800"
            >
              {currentLang?.label}
              <FiChevronDown size={12} />
            </button>
            <AnimatePresence>
              {showLangMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute top-full left-0 mt-1 w-40 bg-dark-800 border border-dark-700/50 rounded-xl shadow-xl z-50 overflow-hidden"
                >
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.value}
                      onClick={() => {
                        setLanguage(lang.value);
                        setShowLangMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        language === lang.value
                          ? 'bg-brand-500/10 text-brand-400'
                          : 'text-dark-300 hover:bg-dark-700 hover:text-white'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <span className="text-xs text-dark-600">
            {code.split('\n').length} líneas
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyCode}
            className="p-1.5 text-dark-500 hover:text-dark-200 transition-colors rounded-lg hover:bg-dark-800"
            title="Copiar código"
          >
            {copied ? <FiCheck size={14} className="text-emerald-400" /> : <FiCopy size={14} />}
          </button>

          {!readOnly && (
            <button
              onClick={runCode}
              disabled={isRunning}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <FiPlay size={12} />
              {isRunning ? 'Ejecutando...' : 'Ejecutar'}
            </button>
          )}
        </div>
      </div>

      {/* Editor */}
      <div style={{ height }}>
        <MonacoEditor
          language={language}
          value={code}
          onChange={handleChange}
          theme="vs-dark"
          options={{
            readOnly,
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'Fira Code', monospace",
            padding: { top: 12 },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            renderLineHighlight: 'line',
            automaticLayout: true,
          }}
        />
      </div>

      {/* Output */}
      <AnimatePresence>
        {showOutput && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden border-t border-dark-800/50"
          >
            <div className="flex items-center gap-2 px-4 py-2 bg-dark-950/50">
              <FiTerminal size={12} className="text-dark-500" />
              <span className="text-xs font-medium text-dark-500 uppercase tracking-wider">Salida</span>
              <button
                onClick={() => setShowOutput(false)}
                className="ml-auto text-xs text-dark-600 hover:text-dark-300 transition-colors"
              >
                Cerrar
              </button>
            </div>
            <div className="bg-dark-950 p-4 max-h-48 overflow-y-auto font-mono text-sm space-y-1">
              {output.map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={
                    line.startsWith('ERROR:')
                      ? 'text-red-400'
                      : line.startsWith('WARN:')
                      ? 'text-yellow-400'
                      : 'text-emerald-400'
                  }
                >
                  {line}
                </motion.div>
              ))}
              {isRunning && (
                <div className="text-dark-500 animate-pulse">Ejecutando...</div>
              )}
            </div>

            {language === 'html' && (
              <div className="border-t border-dark-800/50 p-4 bg-white">
                <iframe
                  ref={iframeRef}
                  title="Vista previa HTML"
                  className="w-full h-48 rounded-lg border border-dark-800/50"
                  sandbox="allow-scripts"
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
