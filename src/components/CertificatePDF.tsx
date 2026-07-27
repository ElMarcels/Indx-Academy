'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiDownload } from 'react-icons/fi';

interface CertificatePDFProps {
  userName: string;
  courseTitle: string;
  completionDate: string;
  certificateNumber: string;
}

function buildPrintHTML(
  userName: string,
  courseTitle: string,
  completionDate: string,
  certificateNumber: string
) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>Certificado - ${certificateNumber}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap');

  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    background: #0a0a0f;
    font-family: 'Inter', sans-serif;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 2rem;
  }

  .certificate {
    width: 1056px;
    height: 748px;
    background: #0a0a0f;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .border-outer {
    position: absolute;
    inset: 16px;
    border: 2px solid rgba(212, 175, 55, 0.5);
    border-radius: 8px;
  }

  .border-inner {
    position: absolute;
    inset: 24px;
    border: 1px solid rgba(212, 175, 55, 0.25);
    border-radius: 6px;
  }

  .corner {
    position: absolute;
    width: 48px;
    height: 48px;
  }
  .corner::before, .corner::after {
    content: '';
    position: absolute;
    background: linear-gradient(135deg, #d4af37, #f5d77a);
  }
  .corner-tl { top: 12px; left: 12px; }
  .corner-tl::before { top: 0; left: 0; width: 48px; height: 2px; }
  .corner-tl::after { top: 0; left: 0; width: 2px; height: 48px; }
  .corner-tr { top: 12px; right: 12px; }
  .corner-tr::before { top: 0; right: 0; width: 48px; height: 2px; }
  .corner-tr::after { top: 0; right: 0; width: 2px; height: 48px; }
  .corner-bl { bottom: 12px; left: 12px; }
  .corner-bl::before { bottom: 0; left: 0; width: 48px; height: 2px; }
  .corner-bl::after { bottom: 0; left: 0; width: 2px; height: 48px; }
  .corner-br { bottom: 12px; right: 12px; }
  .corner-br::before { bottom: 0; right: 0; width: 48px; height: 2px; }
  .corner-br::after { bottom: 0; right: 0; width: 2px; height: 48px; }

  .glow-top, .glow-bottom {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: 320px;
    height: 120px;
    background: radial-gradient(ellipse, rgba(212, 175, 55, 0.08) 0%, transparent 70%);
    pointer-events: none;
  }
  .glow-top { top: -30px; }
  .glow-bottom { bottom: -30px; }

  .content {
    position: relative;
    z-index: 1;
    text-align: center;
    max-width: 720px;
    padding: 0 2rem;
  }

  .brand {
    font-family: 'Playfair Display', serif;
    font-size: 1.1rem;
    font-weight: 600;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: #d4af37;
    margin-bottom: 0.25rem;
  }

  .divider-gold {
    width: 100px;
    height: 1px;
    background: linear-gradient(90deg, transparent, #d4af37, transparent);
    margin: 0.75rem auto;
  }

  .title {
    font-family: 'Playfair Display', serif;
    font-size: 2.2rem;
    font-weight: 700;
    background: linear-gradient(135deg, #d4af37, #f5d77a, #d4af37);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 0.25rem;
  }

  .subtitle {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.35);
    letter-spacing: 0.15em;
    text-transform: uppercase;
    margin-bottom: 1.5rem;
  }

  .certifies {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.45);
    letter-spacing: 0.05em;
    margin-bottom: 0.5rem;
  }

  .student-name {
    font-family: 'Playfair Display', serif;
    font-size: 2.4rem;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 0.5rem;
    line-height: 1.2;
  }

  .divider-subtle {
    width: 180px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.4), transparent);
    margin: 1rem auto;
  }

  .course-label {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.45);
    letter-spacing: 0.05em;
    margin-bottom: 0.4rem;
  }

  .course-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #ffffff;
    margin-bottom: 1.5rem;
    line-height: 1.3;
  }

  .meta {
    display: flex;
    justify-content: center;
    gap: 2rem;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.35);
    letter-spacing: 0.05em;
    margin-bottom: 2rem;
  }

  .meta-sep {
    width: 1px;
    height: 14px;
    background: rgba(255, 255, 255, 0.15);
    align-self: center;
  }

  .signatures {
    display: flex;
    justify-content: center;
    gap: 6rem;
    margin-top: 0.5rem;
  }

  .sig-block { text-align: center; }

  .sig-line {
    width: 160px;
    height: 1px;
    background: rgba(255, 255, 255, 0.15);
    margin-bottom: 0.4rem;
  }

  .sig-label {
    font-size: 0.65rem;
    color: rgba(255, 255, 255, 0.3);
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .seal {
    position: absolute;
    bottom: 48px;
    right: 60px;
    width: 72px;
    height: 72px;
    border: 2px solid rgba(212, 175, 55, 0.3);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .seal-inner {
    width: 56px;
    height: 56px;
    border: 1px solid rgba(212, 175, 55, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .seal-text {
    font-size: 0.5rem;
    color: rgba(212, 175, 55, 0.5);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    text-align: center;
    line-height: 1.3;
  }

  @media print {
    body { background: #0a0a0f; padding: 0; }
    .certificate { width: 100%; height: 100vh; }
  }
</style>
</head>
<body>
  <div class="certificate">
    <div class="border-outer"></div>
    <div class="border-inner"></div>
    <div class="corner corner-tl"></div>
    <div class="corner corner-tr"></div>
    <div class="corner corner-bl"></div>
    <div class="corner corner-br"></div>
    <div class="glow-top"></div>
    <div class="glow-bottom"></div>

    <div class="content">
      <p class="brand">Indx Academy</p>
      <div class="divider-gold"></div>
      <h1 class="title">Certificado de Completaci\u00f3n</h1>
      <p class="subtitle">Certificado de logro acad\u00e9mico</p>

      <p class="certifies">Se certifica que</p>
      <p class="student-name">${userName}</p>

      <div class="divider-subtle"></div>

      <p class="course-label">ha completado satisfactoriamente el curso</p>
      <p class="course-title">${courseTitle}</p>

      <div class="meta">
        <span>Fecha: ${completionDate}</span>
        <div class="meta-sep"></div>
        <span>No. Certificado: ${certificateNumber}</span>
      </div>

      <div class="signatures">
        <div class="sig-block">
          <div class="sig-line"></div>
          <p class="sig-label">Director Acad\u00e9mico</p>
        </div>
        <div class="sig-block">
          <div class="sig-line"></div>
          <p class="sig-label">Instructor</p>
        </div>
      </div>
    </div>

    <div class="seal">
      <div class="seal-inner">
        <p class="seal-text">Indx<br/>Academy</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function CertificatePDF({
  userName,
  courseTitle,
  completionDate,
  certificateNumber,
}: CertificatePDFProps) {
  const [downloading, setDownloading] = useState(false);

  function handleDownload() {
    setDownloading(true);
    try {
      const html = buildPrintHTML(userName, courseTitle, completionDate, certificateNumber);
      const printWindow = window.open('', '_blank', 'width=1200,height=900');
      if (!printWindow) {
        toast.error('El navegador bloque\u00f3 la ventana emergente. Permita ventanas emergentes para descargar.');
        return;
      }
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 600);
      toast.success('Certificado listo para imprimir / guardar como PDF');
    } catch {
      toast.error('Error al generar el certificado');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-4">
      <motion.div
        className="card p-6 relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600/5 via-accent-600/5 to-emerald-600/5" />

        <div className="relative border-2 border-yellow-600/30 rounded-xl p-8">
          <div className="border border-yellow-600/15 rounded-lg p-6 relative">
            {/* Decorative corner accents */}
            <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-yellow-500/40 rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-yellow-500/40 rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-yellow-500/40 rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-yellow-500/40 rounded-br-lg" />

            {/* Subtle glow */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-64 h-24 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative text-center">
              <p className="text-xs uppercase tracking-[0.25em] text-yellow-500/80 font-semibold mb-2">
                &#8212; Indx Academy &#8212;
              </p>
              <div className="w-20 h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent mx-auto mb-3" />
              <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 via-yellow-300 to-yellow-500 mb-0.5" style={{ fontFamily: 'Georgia, serif' }}>
                Certificado de Completaci&oacute;n
              </h3>
              <p className="text-[0.65rem] uppercase tracking-[0.15em] text-dark-500 mb-6">
                Certificado de logro acad&eacute;mico
              </p>
            </div>

            <p className="text-center text-dark-400 text-sm mb-2">Se certifica que</p>
            <p className="text-center text-white text-3xl font-bold mb-4" style={{ fontFamily: 'Georgia, serif' }}>
              {userName}
            </p>

            <div className="w-40 h-px bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent mx-auto my-4" />

            <p className="text-center text-dark-400 text-sm mb-2">
              ha completado satisfactoriamente el curso
            </p>
            <p className="text-center text-white text-xl font-semibold mb-6">{courseTitle}</p>

            <div className="flex items-center justify-center gap-6 text-sm text-dark-500">
              <span>Fecha: {completionDate}</span>
              <span className="w-px h-4 bg-dark-700" />
              <span>No. Certificado: {certificateNumber}</span>
            </div>

            <div className="mt-8 flex items-end justify-center gap-16">
              <div className="text-center">
                <div className="w-36 h-px bg-dark-600 mb-2" />
                <p className="text-[0.6rem] uppercase tracking-wider text-dark-500">Director Acad&eacute;mico</p>
              </div>
              <div className="text-center">
                <div className="w-36 h-px bg-dark-600 mb-2" />
                <p className="text-[0.6rem] uppercase tracking-wider text-dark-500">Instructor</p>
              </div>
            </div>

            {/* Seal */}
            <div className="absolute bottom-4 right-4 w-14 h-14 border-2 border-yellow-500/25 rounded-full flex items-center justify-center">
              <div className="w-10 h-10 border border-yellow-500/15 rounded-full flex items-center justify-center">
                <span className="text-[0.4rem] text-yellow-500/40 uppercase tracking-wider text-center leading-tight font-semibold">
                  Indx<br/>Academy
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.button
        onClick={handleDownload}
        disabled={downloading}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-600/90 to-yellow-500/90 hover:from-yellow-500 hover:to-yellow-400 text-dark-950 font-semibold py-2.5 px-6 rounded-xl transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-yellow-600/20 hover:shadow-yellow-500/40 hover:-translate-y-0.5"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        {downloading ? (
          <div className="w-4 h-4 border-2 border-dark-950/30 border-t-dark-950 rounded-full animate-spin" />
        ) : (
          <>
            <FiDownload size={16} /> Descargar PDF
          </>
        )}
      </motion.button>
    </div>
  );
}
