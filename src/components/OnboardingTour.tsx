'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBook, FiTarget, FiCode, FiUsers, FiMessageSquare, FiStar, FiAward, FiCheck, FiArrowRight, FiX } from 'react-icons/fi';

interface Step {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  link?: string;
}

const STEPS: Step[] = [
  {
    id: 'welcome',
    title: '¡Bienvenido a Indx Academy!',
    description: 'Tu plataforma de aprendizaje gratuita. Vamos a darte un tour rápido para que aproveches todo al máximo.',
    icon: <FiStar size={24} />,
    color: 'from-brand-500 to-accent-500',
  },
  {
    id: 'courses',
    title: 'Explora los cursos',
    description: 'Tenemos cursos de programación para todos los niveles. Inscríbete en los que te interesen y empieza a aprender.',
    icon: <FiBook size={24} />,
    color: 'from-blue-500 to-cyan-500',
    link: '/cursos',
  },
  {
    id: 'paths',
    title: 'Rutas de aprendizaje',
    description: '¿No sabes por dónde empezar? Haz el cuestionario de las rutas y te recomendaremos un camino personalizado según tu nivel.',
    icon: <FiTarget size={24} />,
    color: 'from-emerald-500 to-teal-500',
    link: '/rutas',
  },
  {
    id: 'glossary',
    title: 'Glosario y flashcards',
    description: 'Consulta el glosario de términos técnicos y usa las flashcards con repaso espaciado para memorizar概念os clave.',
    icon: <FiBook size={24} />,
    color: 'from-yellow-500 to-orange-500',
    link: '/glosario',
  },
  {
    id: 'community',
    title: 'Conecta con otros',
    description: 'Envía solicitudes de contacto, únete a grupos de estudio y participa en el foro de cada curso.',
    icon: <FiUsers size={24} />,
    color: 'from-purple-500 to-pink-500',
    link: '/contactos',
  },
  {
    id: 'done',
    title: '¡Listo para empezar!',
    description: 'Ya conoces lo básico. ¡Es hora de aprender algo nuevo! Puedes volver a este tour desde tu dashboard.',
    icon: <FiAward size={24} />,
    color: 'from-emerald-500 to-green-500',
    link: '/dashboard',
  },
];

export function OnboardingTour() {
  const { data: session } = useSession();
  const [show, setShow] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) return;
    const userId = (session.user as any).id;
    if (!userId) { setLoading(false); return; }

    fetch(`/api/users/${userId}/onboarding`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.completed) {
          setShow(true);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [session]);

  async function complete() {
    const userId = (session?.user as any)?.id;
    if (!userId) return;

    const completedSteps = STEPS.map((s) => s.id);
    try {
      await fetch(`/api/users/${userId}/onboarding`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completedSteps }),
      });
    } catch { /* silent */ }
    setShow(false);
  }

  async function skip() {
    await complete();
  }

  function nextStep() {
    if (currentStep >= STEPS.length - 1) {
      complete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  }

  if (loading || !show) return null;

  const step = STEPS[currentStep];
  if (!step) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      >
        <motion.div
          key={step.id}
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: -20 }}
          transition={{ type: 'spring', damping: 25 }}
          className="card p-8 w-full max-w-md text-center relative"
        >
          <button
            onClick={skip}
            className="absolute top-4 right-4 text-dark-500 hover:text-white transition-colors"
          >
            <FiX size={18} />
          </button>

          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mx-auto mb-5 text-white`}>
            {step.icon}
          </div>

          <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
          <p className="text-dark-400 text-sm leading-relaxed mb-6">{step.description}</p>

          <div className="flex items-center justify-center gap-1.5 mb-6">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentStep ? 'bg-brand-400 w-6' : i < currentStep ? 'bg-emerald-400' : 'bg-dark-700'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2 justify-center">
            <button onClick={skip} className="btn-secondary text-sm">
              Saltar tour
            </button>
            <button onClick={nextStep} className="btn-primary text-sm flex items-center gap-2">
              {currentStep === STEPS.length - 1 ? (
                '¡Empezar!'
              ) : (
                <>
                  Siguiente <FiArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
