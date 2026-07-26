'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiStar } from 'react-icons/fi';

export default function NewCoursePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    level: 'BEGINNER',
    duration: '',
    thumbnail: '',
  });

  if (status === 'authenticated' && (session?.user as any)?.role !== 'ADMIN') {
    router.push('/dashboard');
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          duration: form.duration || null,
          thumbnail: form.thumbnail || null,
          category: form.category || null,
        }),
      });

      if (res.ok) {
        const course = await res.json();
        toast.success('Curso creado');
        router.push(`/admin/courses/${course.id}`);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Error al crear');
      }
    } catch {
      toast.error('Error al crear curso');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="py-12">
      <div className="section max-w-2xl">
        <Link href="/admin/courses" className="inline-flex items-center gap-1 text-dark-400 hover:text-white text-sm mb-6 transition-colors">
          <FiArrowLeft size={14} /> Volver a cursos
        </Link>

        <h1 className="text-3xl font-bold text-white mb-2">Nuevo Curso</h1>
        <p className="text-dark-400 mb-8 flex items-center gap-2">
          <FiStar size={14} className="text-emerald-400" />
          Todos los cursos son 100% gratuitos
        </p>

        <form onSubmit={handleSubmit} className="card p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Título *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ej: JavaScript Moderno"
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Descripción *</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe el curso..."
              className="input min-h-[120px] resize-y"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Nivel</label>
              <select
                value={form.level}
                onChange={(e) => setForm({ ...form, level: e.target.value })}
                className="input"
              >
                <option value="BEGINNER">Principiante</option>
                <option value="INTERMEDIATE">Intermedio</option>
                <option value="ADVANCED">Avanzado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Duración</label>
              <input
                type="text"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                placeholder="Ej: 40h"
                className="input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Categoría</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Ej: Desarrollo Web"
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Thumbnail URL</label>
              <input
                type="url"
                value={form.thumbnail}
                onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                placeholder="https://..."
                className="input"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : null}
              Crear Curso
            </button>
            <Link href="/admin/courses" className="btn-secondary">Cancelar</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
