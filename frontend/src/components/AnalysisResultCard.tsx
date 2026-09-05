import { useState } from 'react';
import { FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axiosInstance';

interface Analysis {
  id: number;
  diagnosis: string | null;
  confidence: number | null;
  allScores: Record<string, number> | null;
  status: string;
  analyzedAt: string | null;
  createdAt: string;
  performedByName: string | null;
}

interface Props {
  analysis: Analysis;
  isMedecin?: boolean;
}

const DIAG: Record<string, { bg: string; text: string; bar: string }> = {
  CONTROL:       { bg: 'bg-green-50',  text: 'text-green-700',  bar: 'bg-green-500'  },
  SCHIZOPHRENIA: { bg: 'bg-red-50',    text: 'text-red-700',    bar: 'bg-red-500'    },
  BIPOLAR:       { bg: 'bg-orange-50', text: 'text-orange-700', bar: 'bg-orange-500' },
  ADHD:          { bg: 'bg-blue-50',   text: 'text-blue-700',   bar: 'bg-blue-500'   },
};
const CLASS_ORDER = ['CONTROL', 'SCHIZOPHRENIA', 'BIPOLAR', 'ADHD'];

function formatDate(s: string | null): string {
  if (!s) return '—';
  return new Date(s).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function AnalysisResultCard({ analysis, isMedecin = false }: Props) {
  const [generating, setGenerating] = useState(false);

  const diag    = analysis.diagnosis ?? 'N/A';
  const conf    = analysis.confidence ?? 0;
  const pct     = Math.round(conf * 100);
  const colors  = DIAG[diag] ?? { bg: 'bg-gray-50', text: 'text-gray-700', bar: 'bg-gray-400' };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data: report } = await api.post(`/api/reports/${analysis.id}`);
      const { data: blob }   = await api.get(`/api/reports/${report.id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href = url; a.download = report.fileName; a.click();
      URL.revokeObjectURL(url);
      toast.success('Report generated and downloaded');
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${colors.bg} ${colors.text}`}>
            {diag}
          </span>
          <p className="mt-1 text-xs text-gray-400">{formatDate(analysis.analyzedAt ?? analysis.createdAt)}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">{pct}%</p>
          <p className="text-xs text-gray-400">confidence</p>
        </div>
      </div>

      {/* Confidence bar */}
      <div className="mb-4 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${colors.bar}`} style={{ width: `${pct}%` }} />
      </div>

      {/* Score distribution */}
      {analysis.allScores && (
        <div className="space-y-2 mb-4">
          {CLASS_ORDER.map(cls => {
            const score    = analysis.allScores?.[cls] ?? 0;
            const clsColor = DIAG[cls] ?? { bar: 'bg-gray-300', text: 'text-gray-500' };
            return (
              <div key={cls} className="flex items-center gap-3">
                <span className={`w-28 text-right text-xs font-medium ${clsColor.text}`}>{cls}</span>
                <div className="flex-1 h-1 rounded-full bg-gray-100 overflow-hidden">
                  <div className={`h-full rounded-full ${clsColor.bar}`} style={{ width: `${Math.round(score * 100)}%` }} />
                </div>
                <span className="w-10 text-right text-xs text-gray-400">{(score * 100).toFixed(1)}%</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        {analysis.performedByName ? (
          <p className="text-xs text-gray-400">
            By <span className="font-medium text-gray-600">{analysis.performedByName}</span>
          </p>
        ) : <span />}
        {isMedecin && (
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:border-blue-300 hover:text-blue-600 disabled:opacity-50 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            {generating ? 'Generating…' : 'Generate Report'}
          </button>
        )}
      </div>

    </div>
  );
}
