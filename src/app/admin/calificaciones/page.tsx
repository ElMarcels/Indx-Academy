'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

type Range = { label: string; min: number; max: number; color: string };
const base: Range[] = [{ label: 'Suspenso', min: 0, max: 49, color: 'red' }, { label: 'Aprobado', min: 50, max: 69, color: 'yellow' }, { label: 'Notable', min: 70, max: 89, color: 'blue' }, { label: 'Sobresaliente', min: 90, max: 100, color: 'green' }];

export default function CalificacionesPage() {
  const { data: session, status } = useSession(); const router = useRouter();
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]); const [courseId, setCourseId] = useState('');
  const [name, setName] = useState('Escala estándar'); const [ranges, setRanges] = useState<Range[]>(base); const [saving, setSaving] = useState(false);
  useEffect(() => { if (status === 'authenticated' && (session?.user as any)?.role !== 'ADMIN') router.push('/dashboard'); }, [status, session, router]);
  useEffect(() => { fetch('/api/admin/courses').then(r => r.json()).then(d => setCourses((d.courses || d || []).map((c: any) => ({ id: c.id, title: c.title })))); }, []);
  useEffect(() => { fetch(`/api/grading-scales${courseId ? `?courseId=${courseId}` : ''}`).then(r => r.json()).then(d => { const scale = (d.scales || []).find((s: any) => courseId ? s.courseId === courseId : s.isGlobal); if (scale) { setName(scale.name); setRanges(JSON.parse(scale.ranges)); } else { setName(courseId ? 'Escala del curso' : 'Escala estándar'); setRanges(base); } }); }, [courseId]);
  async function save() { setSaving(true); try { const res = await fetch('/api/grading-scales', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, courseId: courseId || undefined, ranges }) }); if (!res.ok) throw new Error(); toast.success('Escala guardada'); } catch { toast.error('No se pudo guardar la escala'); } finally { setSaving(false); } }
  return <div className="py-12 section max-w-3xl"><h1 className="page-title">Escalas de calificaciones</h1><p className="page-subtitle mb-8">Define una escala global o una escala específica para cada curso. Las calificaciones se calculan con la media de los quizzes.</p><div className="card p-6 space-y-5"><label className="block text-sm text-dark-300">Aplicar a<select value={courseId} onChange={e => setCourseId(e.target.value)} className="mt-1 w-full bg-dark-800 border border-dark-700 rounded-xl p-2 text-white"><option value="">Todos los cursos (global)</option>{courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select></label><label className="block text-sm text-dark-300">Nombre<input value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full bg-dark-800 border border-dark-700 rounded-xl p-2 text-white" /></label><div className="space-y-2">{ranges.map((range, i) => <div key={i} className="grid grid-cols-[1fr_80px_80px] gap-2"><input value={range.label} onChange={e => setRanges(r => r.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} className="bg-dark-800 border border-dark-700 rounded-lg p-2 text-sm text-white" /><input type="number" value={range.min} onChange={e => setRanges(r => r.map((x, j) => j === i ? { ...x, min: Number(e.target.value) } : x))} className="bg-dark-800 border border-dark-700 rounded-lg p-2 text-sm text-white" /><input type="number" value={range.max} onChange={e => setRanges(r => r.map((x, j) => j === i ? { ...x, max: Number(e.target.value) } : x))} className="bg-dark-800 border border-dark-700 rounded-lg p-2 text-sm text-white" /></div>)}</div><button onClick={save} disabled={saving} className="btn-primary">{saving ? 'Guardando...' : 'Guardar escala'}</button></div></div>;
}
