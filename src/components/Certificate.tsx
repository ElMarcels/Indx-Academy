'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiDownload } from 'react-icons/fi';
import jsPDF from 'jspdf';

interface CertificateProps {
  courseId: string;
  courseTitle: string;
  userName: string;
  completionDate: string;
  certificateNumber: string;
}

export function Certificate({
  courseId,
  courseTitle,
  userName,
  completionDate,
  certificateNumber,
}: CertificateProps) {
  const [generating, setGenerating] = useState(false);

  function generatePDF() {
    setGenerating(true);

    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const w = doc.internal.pageSize.getWidth();
      const h = doc.internal.pageSize.getHeight();

      doc.setFillColor(15, 15, 20);
      doc.rect(0, 0, w, h, 'F');

      doc.setDrawColor(99, 102, 241);
      doc.setLineWidth(1.5);
      doc.roundedRect(8, 8, w - 16, h - 16, 4, 4);

      doc.setDrawColor(217, 70, 239);
      doc.setLineWidth(0.5);
      doc.roundedRect(12, 12, w - 24, h - 24, 3, 3);

      doc.setDrawColor(99, 102, 241);
      doc.setLineWidth(0.3);
      doc.roundedRect(16, 16, w - 32, h - 32, 2, 2);

      doc.setFontSize(32);
      doc.setTextColor(99, 102, 241);
      doc.text('Indx Academy', w / 2, 45, { align: 'center' });

      doc.setFontSize(18);
      doc.setTextColor(217, 70, 239);
      doc.text('Certificado de Finalización', w / 2, 62, { align: 'center' });

      doc.setDrawColor(99, 102, 241);
      doc.setLineWidth(0.3);
      doc.line(w / 2 - 50, 70, w / 2 + 50, 70);

      doc.setFontSize(12);
      doc.setTextColor(150, 150, 160);
      doc.text('Se certifica que', w / 2, 88, { align: 'center' });

      doc.setFontSize(28);
      doc.setTextColor(255, 255, 255);
      doc.text(userName, w / 2, 105, { align: 'center' });

      doc.setDrawColor(217, 70, 239);
      doc.setLineWidth(0.3);
      doc.line(w / 2 - 60, 112, w / 2 + 60, 112);

      doc.setFontSize(12);
      doc.setTextColor(150, 150, 160);
      doc.text('ha completado satisfactoriamente el curso', w / 2, 125, { align: 'center' });

      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text(courseTitle, w / 2, 140, { align: 'center' });

      doc.setFontSize(10);
      doc.setTextColor(120, 120, 130);
      doc.text(`Fecha: ${completionDate}`, w / 2 - 50, 165, { align: 'center' });
      doc.text(`No. Certificado: ${certificateNumber}`, w / 2 + 50, 165, { align: 'center' });

      doc.setDrawColor(150, 150, 160);
      doc.setLineWidth(0.3);
      doc.line(w / 2 - 35, 185, w / 2 + 35, 185);
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 160);
      doc.text('Firma', w / 2, 191, { align: 'center' });

      doc.save(`certificado-${certificateNumber}.pdf`);
      toast.success('Certificado descargado');
    } catch {
      toast.error('Error al generar el certificado');
    } finally {
      setGenerating(false);
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

        <div className="relative border-2 border-brand-500/30 rounded-xl p-8">
          <div className="border border-accent-500/20 rounded-lg p-6">
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-brand-400 mb-2">— Indx Academy —</p>
              <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-accent-400 to-emerald-400 mb-1">
                Certificado de Finalización
              </h3>
              <div className="w-24 h-px bg-gradient-to-r from-brand-500 to-accent-500 mx-auto my-4" />
            </div>

            <p className="text-center text-dark-400 text-sm mb-2">Se certifica que</p>
            <p className="text-center text-white text-3xl font-bold mb-4">{userName}</p>

            <div className="w-32 h-px bg-gradient-to-r from-accent-500 to-brand-500 mx-auto my-4" />

            <p className="text-center text-dark-400 text-sm mb-2">
              ha completado satisfactoriamente el curso
            </p>
            <p className="text-center text-white text-xl font-semibold mb-6">{courseTitle}</p>

            <div className="flex items-center justify-center gap-8 text-sm text-dark-400">
              <span>{completionDate}</span>
              <span className="w-px h-4 bg-dark-700" />
              <span>No. {certificateNumber}</span>
            </div>

            <div className="mt-8 flex items-end justify-center gap-16">
              <div className="text-center">
                <div className="w-32 h-px bg-dark-600 mb-2" />
                <p className="text-xs text-dark-400">Firma</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.button
        onClick={generatePDF}
        disabled={generating}
        className="btn-primary w-full flex items-center justify-center gap-2"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        {generating ? (
          'Generando...'
        ) : (
          <>
            <FiDownload size={16} /> Descargar PDF
          </>
        )}
      </motion.button>
    </div>
  );
}
