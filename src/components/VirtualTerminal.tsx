'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiTerminal, FiChevronRight } from 'react-icons/fi';

interface Command {
  command: string;
  description: string | null;
  output: string;
  explanation: string | null;
  order: number;
}

interface VirtualTerminalProps {
  commands: Command[];
}

interface HistoryEntry {
  command: string;
  output: string;
  explanation: string | null;
  isError: boolean;
}

export function VirtualTerminal({ commands }: VirtualTerminalProps) {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isTyping, setIsTyping] = useState(false);
  const [displayedOutput, setDisplayedOutput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [history, scrollToBottom]);

  function typeOutput(text: string, onComplete: () => void) {
    setIsTyping(true);
    setDisplayedOutput('');
    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedOutput(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
        onComplete();
      }
    }, 12);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isTyping) return;

    const trimmed = input.trim();
    if (!trimmed) return;

    if (trimmed === 'clear') {
      setHistory([]);
      setInput('');
      setCommandHistory((prev) => [...prev, trimmed]);
      setHistoryIndex(-1);
      return;
    }

    const matched = commands.find(
      (c) => c.command.toLowerCase() === trimmed.toLowerCase()
    );

    const entry: HistoryEntry = {
      command: trimmed,
      output: matched ? matched.output : `bash: ${trimmed}: command not found`,
      explanation: matched?.explanation || null,
      isError: !matched,
    };

    setCommandHistory((prev) => [...prev, trimmed]);
    setHistoryIndex(-1);
    setInput('');

    typeOutput(entry.output, () => {
      setHistory((prev) => [...prev, entry]);
      setDisplayedOutput('');
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
      setHistoryIndex(newIndex);
      setInput(commandHistory[commandHistory.length - 1 - newIndex]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex <= 0) {
        setHistoryIndex(-1);
        setInput('');
        return;
      }
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setInput(commandHistory[commandHistory.length - 1 - newIndex]);
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setHistory([]);
    }
  }

  return (
    <div
      className="rounded-2xl border border-dark-800/50 bg-dark-950 overflow-hidden font-mono cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-dark-900/80 border-b border-dark-800/50">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
        </div>
        <div className="flex items-center gap-2 ml-2">
          <FiTerminal size={12} className="text-dark-500" />
          <span className="text-xs text-dark-500">Terminal Virtual</span>
        </div>
      </div>

      {/* Terminal body */}
      <div className="p-4 h-80 overflow-y-auto text-sm leading-relaxed">
        {history.length === 0 && !isTyping && (
          <div className="text-dark-600 mb-2">
            Bienvenido a la terminal. Escribe un comando para comenzar.
          </div>
        )}

        {history.map((entry, i) => (
          <div key={i} className="mb-3">
            <div className="flex items-center gap-2 text-emerald-400">
              <FiChevronRight size={12} />
              <span className="text-white font-bold">{entry.command}</span>
            </div>
            <div className={`ml-5 mt-1 whitespace-pre-wrap ${entry.isError ? 'text-red-400' : 'text-dark-200'}`}>
              {entry.output}
            </div>
            {entry.explanation && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="ml-5 mt-1.5 p-2 rounded-lg bg-brand-500/5 border border-brand-500/20 text-xs text-brand-300"
              >
                {entry.explanation}
              </motion.div>
            )}
          </div>
        ))}

        {/* Typing output */}
        {isTyping && (
          <div className="mb-3">
            <div className="flex items-center gap-2 text-emerald-400">
              <FiChevronRight size={12} />
              <span className="text-white font-bold">{commandHistory[commandHistory.length - 1]}</span>
            </div>
            <div className="ml-5 mt-1 whitespace-pre-wrap text-dark-200">
              {displayedOutput}
              <span className="inline-block w-2 h-4 bg-emerald-400 animate-pulse ml-0.5 align-middle" />
            </div>
          </div>
        )}

        {/* Input line */}
        {!isTyping && (
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <FiChevronRight size={12} className="text-emerald-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-white outline-none placeholder-dark-600 caret-emerald-400"
              placeholder="Escribe un comando..."
              autoFocus
              spellCheck={false}
              autoComplete="off"
            />
          </form>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
