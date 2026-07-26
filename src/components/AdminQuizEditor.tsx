'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiSave } from 'react-icons/fi';

interface QuizData {
  title: string;
  description: string;
  questions: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
}

interface AdminQuizEditorProps {
  moduleId: string;
  existingQuiz?: {
    id: string;
    title: string;
    description: string | null;
    questions: {
      id: string;
      question: string;
      options: string[];
      correctIndex: number;
      explanation: string | null;
      order: number;
    }[];
  };
  onUpdate: () => void;
}

export function AdminQuizEditor({ moduleId, existingQuiz, onUpdate }: AdminQuizEditorProps) {
  const [quiz, setQuiz] = useState<QuizData>({
    title: existingQuiz?.title || '',
    description: existingQuiz?.description || '',
    questions: existingQuiz?.questions || [
      { question: '', options: ['', '', '', ''], correctIndex: 0, explanation: '' },
    ],
  });
  const [saving, setSaving] = useState(false);

  function addQuestion() {
    setQuiz((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        { question: '', options: ['', '', '', ''], correctIndex: 0, explanation: '' },
      ],
    }));
  }

  function removeQuestion(index: number) {
    if (quiz.questions.length <= 1) return;
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  }

  function updateQuestion(index: number, field: string, value: any) {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === index ? { ...q, [field]: value } : q
      ),
    }));
  }

  function updateOption(qIndex: number, oIndex: number, value: string) {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === qIndex
          ? { ...q, options: q.options.map((o, j) => (j === oIndex ? value : o)) }
          : q
      ),
    }));
  }

  async function saveQuiz() {
    if (!quiz.title.trim()) {
      toast.error('El título del quiz es obligatorio');
      return;
    }
    if (quiz.questions.some((q) => !q.question.trim())) {
      toast.error('Todas las preguntas deben tener texto');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/quizzes`, {
        method: existingQuiz ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId, ...quiz, quizId: existingQuiz?.id }),
      });
      if (res.ok) {
        toast.success('Quiz guardado');
        onUpdate();
      } else {
        toast.error('Error al guardar');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-white">Quiz del Módulo</h4>
        <button onClick={saveQuiz} disabled={saving} className="btn-primary text-sm py-2 flex items-center gap-2">
          <FiSave size={14} />
          {saving ? 'Guardando...' : 'Guardar Quiz'}
        </button>
      </div>

      <input
        value={quiz.title}
        onChange={(e) => setQuiz((p) => ({ ...p, title: e.target.value }))}
        placeholder="Título del quiz"
        className="input"
      />
      <input
        value={quiz.description}
        onChange={(e) => setQuiz((p) => ({ ...p, description: e.target.value }))}
        placeholder="Descripción (opcional)"
        className="input"
      />

      <div className="space-y-6">
        {quiz.questions.map((q, qIndex) => (
          <motion.div
            key={qIndex}
            layout
            className="p-4 bg-dark-800/50 rounded-xl border border-dark-700/30 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-brand-400">Pregunta {qIndex + 1}</span>
              {quiz.questions.length > 1 && (
                <button onClick={() => removeQuestion(qIndex)} className="text-dark-500 hover:text-red-400 transition-colors">
                  <FiTrash2 size={14} />
                </button>
              )}
            </div>

            <input
              value={q.question}
              onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
              placeholder="Texto de la pregunta"
              className="input"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {q.options.map((opt, oIndex) => (
                <div key={oIndex} className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuestion(qIndex, 'correctIndex', oIndex)}
                    className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs flex-shrink-0 transition-colors ${
                      q.correctIndex === oIndex
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-dark-600 text-dark-500 hover:border-dark-500'
                    }`}
                    title="Marcar como respuesta correcta"
                  >
                    {String.fromCharCode(65 + oIndex)}
                  </button>
                  <input
                    value={opt}
                    onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                    placeholder={`Opción ${String.fromCharCode(65 + oIndex)}`}
                    className="input text-sm"
                  />
                </div>
              ))}
            </div>

            <input
              value={q.explanation}
              onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
              placeholder="Explicación (opcional)"
              className="input text-sm"
            />
          </motion.div>
        ))}
      </div>

      <button onClick={addQuestion} className="btn-secondary text-sm flex items-center gap-2">
        <FiPlus size={14} /> Agregar Pregunta
      </button>
    </div>
  );
}
