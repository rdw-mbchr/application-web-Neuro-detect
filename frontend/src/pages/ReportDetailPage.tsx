import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Download, Printer, Mail, Brain } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axiosInstance';

interface ReportDTO {
  id: number;
  analysisId: number;
  patientId: number;
  patientName: string;
  patientCin: string | null;
  diagnosis: string | null;
  generatedByName: string;
  createdAt: string;
}

interface AnalysisDTO {
  id: number;
  confidence: number | null;
  allScores: Record<string, number> | null;
  status: string;
  analyzedAt: string | null;
  performedByName: string | null;
  imageFormat: string | null;
}

interface PatientDetail {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  gender: string | null;
  cin: string | null;
  phone: string | null;
}

const DIAG_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  CONTROL:       { bg: 'bg-green-50',  text: 'text-green-700',  bar: 'bg-green-500' },
  SCHIZOPHRENIA: { bg: 'bg-red-50',    text: 'text-red-700',    bar: 'bg-red-500'   },
  BIPOLAR:       { bg: 'bg-orange-50', text: 'text-orange-700', bar: 'bg-orange-500' },
  ADHD:          { bg: 'bg-blue-50',   text: 'text-blue-700',   bar: 'bg-blue-500'  },
};
const CLASS_ORDER = ['CONTROL', 'SCHIZOPHRENIA', 'BIPOLAR', 'ADHD'];

function fmt(s: string | null, opts: Intl.DateTimeFormatOptions): string {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('fr-FR', opts);
}

function InfoCell({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value ?? '—'}</p>
    </div>
  );
}

async function downloadPdf(id: number) {
  try {
    const { data: blob } = await api.get(`/api/reports/${id}/download`, { responseType: 'blob' });
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href = url; a.download = `neurodetect_report_${id}.pdf`; a.click();
    URL.revokeObjectURL(url);
  } catch {
    toast.error('Download failed');
  }
}

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: report, isLoading: rLoading } = useQuery<ReportDTO>({
    queryKey: ['report', id],
    queryFn: () => api.get(`/api/reports/${id}`).then(r => r.data),
    enabled: !!id,
  });

  const { data: analysis } = useQuery<AnalysisDTO>({
    queryKey: ['analysis', report?.analysisId],
    queryFn: () => api.get(`/api/analyses/${report!.analysisId}`).then(r => r.data),
    enabled: !!report?.analysisId,
  });

  const { data: patient } = useQuery<PatientDetail>({
    queryKey: ['patient', report?.patientId],
    queryFn: () => api.get(`/api/patients/${report!.patientId}`).then(r => r.data),
    enabled: !!report?.patientId,
  });

  if (rLoading) {
    return (
      <div className="p-8">
        <div className="h-96 bg-white rounded-xl border border-gray-100 animate-pulse" />
      </div>
    );
  }

  if (!report) return null;

  const diag    = report.diagnosis ?? 'N/A';
  const colors  = DIAG_COLORS[diag] ?? { bg: 'bg-gray-50', text: 'text-gray-700', bar: 'bg-gray-400' };
  const confPct = analysis?.confidence ? Math.round(analysis.confidence * 100) : null;

  const calcAge = (dob: string | null) => {
    if (!dob) return '—';
    const birth = new Date(dob);
    const now   = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    if (now.getMonth() < birth.getMonth()) age--;
    return `${age} years`;
  };

  return (
    <div className="p-8 max-w-4xl">

      {/* Header row */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Link to="/reports" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Reports
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Medical Report</h1>
          <p className="mt-1 text-sm text-gray-500">
            Report #{report.id} · {fmt(report.createdAt, { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toast('Email feature coming soon', { icon: '📧' })}
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-3.5 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            <Mail className="w-4 h-4" /> Email
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-3.5 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
          <button
            onClick={() => downloadPdf(report.id)}
            className="flex items-center gap-2 rounded-lg bg-black px-3.5 py-2 text-sm font-medium text-white hover:opacity-80"
          >
            <Download className="w-4 h-4" /> Download PDF
          </button>
        </div>
      </div>

      {/* Report header card */}
      <div className="bg-blue-600 rounded-xl p-6 mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-lg">NeuroScan AI</p>
            <p className="text-blue-200 text-xs">Neurological MRI Analysis Report</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-blue-200 text-xs">Report ID</p>
          <p className="text-white font-mono font-semibold">#{report.id}</p>
        </div>
      </div>

      {/* Patient + Scan info */}
      <div className="grid grid-cols-2 gap-5 mb-5">

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Patient Information</p>
          <div className="grid grid-cols-2 gap-y-4">
            <InfoCell label="Full Name"     value={patient ? `${patient.lastName} ${patient.firstName}` : report.patientName} />
            <InfoCell label="Patient ID"    value={`#${report.patientId}`} />
            <InfoCell label="Date of Birth" value={fmt(patient?.dateOfBirth ?? null, { day: '2-digit', month: '2-digit', year: 'numeric' })} />
            <InfoCell label="Age"           value={calcAge(patient?.dateOfBirth ?? null)} />
            <InfoCell label="Gender"        value={patient?.gender} />
            <InfoCell label="CIN"           value={patient?.cin ?? report.patientCin} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Scan Information</p>
          <div className="grid grid-cols-2 gap-y-4">
            <InfoCell label="Scan ID"      value={`#${report.analysisId}`} />
            <InfoCell label="Format"       value={analysis?.imageFormat ?? 'NIFTI'} />
            <InfoCell label="Analysis Date" value={fmt(analysis?.analyzedAt ?? null, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })} />
            <InfoCell label="Performed By" value={analysis?.performedByName ?? report.generatedByName} />
            <InfoCell label="Status"       value={analysis?.status ?? 'COMPLETED'} />
            <InfoCell label="Report Date"  value={fmt(report.createdAt, { day: '2-digit', month: '2-digit', year: 'numeric' })} />
          </div>
        </div>

      </div>

      {/* AI Analysis Results */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-5">AI Analysis Results</p>

        <div className="flex items-center gap-6 mb-6">
          <div className={`rounded-xl px-6 py-4 ${colors.bg}`}>
            <p className="text-xs font-medium text-gray-500 mb-1">Predicted Diagnosis</p>
            <p className={`text-2xl font-bold ${colors.text}`}>{diag}</p>
          </div>
          {confPct !== null && (
            <div className="rounded-xl bg-gray-50 px-6 py-4">
              <p className="text-xs font-medium text-gray-500 mb-1">Confidence Level</p>
              <p className="text-2xl font-bold text-gray-900">{confPct}%</p>
            </div>
          )}
        </div>

        {/* Main confidence bar */}
        {confPct !== null && (
          <div className="mb-6">
            <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${colors.bar}`}
                style={{ width: `${confPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Probability distribution */}
        {analysis?.allScores && (
          <>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
              Probability Distribution
            </p>
            <div className="space-y-3">
              {CLASS_ORDER.map(cls => {
                const score  = analysis.allScores?.[cls] ?? 0;
                const pct    = Math.round(score * 100);
                const clrBar = DIAG_COLORS[cls]?.bar ?? 'bg-gray-300';
                const clrTxt = DIAG_COLORS[cls]?.text ?? 'text-gray-600';
                return (
                  <div key={cls} className="flex items-center gap-4">
                    <span className={`w-28 text-xs font-medium text-right ${clrTxt}`}>{cls}</span>
                    <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className={`h-full rounded-full ${clrBar}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-10 text-right text-xs text-gray-500">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Disclaimer */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
        <p className="text-xs text-amber-700 leading-relaxed">
          <span className="font-semibold">Disclaimer:</span> This report is generated automatically by an AI system and is intended
          solely as a diagnostic aid. It does not replace the opinion of a qualified physician.
          Medical advice is required for any diagnosis or treatment decision.
        </p>
      </div>

    </div>
  );
}
