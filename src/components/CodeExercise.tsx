'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  FiPlay,
  FiCheckCircle,
  FiXCircle,
  FiEye,
  FiEyeOff,
  FiAward,
  FiCode,
  FiHelpCircle,
} from 'react-icons/fi';
import type { CodeExercise as CodeExerciseType } from '@/types';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface CodeExerciseProps {
  exercise: CodeExerciseType;
  onComplete: (exerciseId: string, passed: boolean) => void;
}

const difficultyColors: Record<string, string> = {
  EASY: 'badge-green',
  MEDIUM: 'badge-yellow',
  HARD: 'badge-red',
};

const languageColors: Record<string, string> = {
  javascript: 'badge-yellow',
  python: 'badge-blue',
  html: 'badge-red',
  css: 'badge-blue',
};

export function CodeExercise({ exercise, onComplete }: CodeExerciseProps) {
  const [code, setCode] = useState(exercise.starterCode || '');
  const [results, setResults] = useState<{ description: string; passed: boolean; expected: string; actual: string }[] | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [allPassed, setAllPassed] = useState(false);

  function runTests() {
    if (exercise.language !== 'javascript') {
      toast.error('Las pruebas automáticas solo están disponibles para JavaScript');
      return;
    }

    setIsRunning(true);
    const testResults: { description: string; passed: boolean; expected: string; actual: string }[] = [];

    for (const tc of exercise.testCases) {
      try {
        const fn = new Function('input', `${code}\n\nreturn ${tc.input};`);
        const result = fn(tc.input);
        const actual = String(result).trim();
        const expected = String(tc.expected).trim();
        const passed = actual === expected;

        testResults.push({
          description: tc.description,
          passed,
          expected,
          actual,
        });
      } catch (err) {
        testResults.push({
          description: tc.description,
          passed: false,
          expected: tc.expected,
          actual: `Error: ${(err as Error).message}`,
        });
      }
    }

    setResults(testResults);
    setIsRunning(false);

    const passed = testResults.every((r) => r.passed);
    setAllPassed(passed);

    if (passed) {
      toast.success('¡Todas las pruebas pasaron!');
      onComplete(exercise.id, true);
    } else {
      const passedCount = testResults.filter((r) => r.passed).length;
      toast.error(`${passedCount}/${testResults.length} pruebas pasaron`);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 border-b border-dark-800/50">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent-500/10 rounded-xl flex items-center justify-center">
              <FiCode size={18} className="text-accent-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{exercise.title}</h3>
              <div className="flex items-center gap-3 mt-1">
                <span className={difficultyColors[exercise.difficulty] || 'badge-blue'}>
                  {exercise.difficulty}
                </span>
                <span className={languageColors[exercise.language] || 'badge-blue'}>
                  {exercise.language}
                </span>
                <span className="text-xs text-dark-500 flex items-center gap-1">
                  <FiAward size={12} />
                  {exercise.points} puntos
                </span>
              </div>
            </div>
          </div>

          {allPassed && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full"
            >
              <FiCheckCircle size={14} className="text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">Completado</span>
            </motion.div>
          )}
        </div>

        <p className="text-dark-300 text-sm mt-3 leading-relaxed">{exercise.description}</p>
      </div>

      {/* Editor */}
      <div className="h-64">
        <MonacoEditor
          language={exercise.language}
          value={code}
          onChange={(value) => setCode(value || '')}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'Fira Code', monospace",
            padding: { top: 12 },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            automaticLayout: true,
          }}
        />
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-dark-800/50 flex items-center gap-3">
        <button
          onClick={runTests}
          disabled={isRunning}
          className="btn-primary text-sm py-2 flex items-center gap-2"
        >
          <FiPlay size={14} />
          {isRunning ? 'Ejecutando...' : 'Ejecutar pruebas'}
        </button>

        <button
          onClick={() => setShowHint(!showHint)}
          className="btn-secondary text-sm py-2 flex items-center gap-2"
        >
          {showHint ? <FiEyeOff size={14} /> : <FiEye size={14} />}
          {showHint ? 'Ocultar' : 'Ver solución'}
        </button>
      </div>

      {/* Hint / Solution */}
      <AnimatePresence>
        {showHint && exercise.solution && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden border-t border-dark-800/50"
          >
            <div className="p-4 bg-brand-500/5">
              <div className="flex items-center gap-2 mb-2">
                <FiHelpCircle size={14} className="text-brand-400" />
                <span className="text-sm font-medium text-brand-400">Solución</span>
              </div>
              <pre className="text-sm text-dark-200 bg-dark-950/50 p-3 rounded-xl overflow-x-auto font-mono">
                {exercise.solution}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Test Results */}
      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden border-t border-dark-800/50"
          >
            <div className="p-4 space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium text-dark-300">Resultados</span>
                <span className="text-xs text-dark-500">
                  {results.filter((r) => r.passed).length}/{results.length} pasaron
                </span>
              </div>

              {results.map((result, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-start gap-3 p-3 rounded-xl border ${
                    result.passed
                      ? 'bg-emerald-500/5 border-emerald-500/20'
                      : 'bg-red-500/5 border-red-500/20'
                  }`}
                >
                  {result.passed ? (
                    <FiCheckCircle size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                  ) : (
                    <FiXCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className={`text-sm font-medium ${result.passed ? 'text-emerald-300' : 'text-red-300'}`}>
                      {result.description}
                    </p>
                    {!result.passed && (
                      <div className="mt-1 text-xs text-dark-400 font-mono space-y-0.5">
                        <p>Esperado: <span className="text-dark-200">{result.expected}</span></p>
                        <p>Obtenido: <span className="text-red-300">{result.actual}</span></p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
