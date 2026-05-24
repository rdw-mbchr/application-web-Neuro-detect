import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jwtDecode } from 'jwt-decode';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axiosInstance';
import MRIUploader from '../components/MRIUploader';
import AnalysisResultCard from '../components/AnalysisResultCard';

interface PatientDetail {
  id: number; firstName: string; lastName: string;
  dateOfBirth: string | null; gender: string | null;
  cin: string | null; phone: string | null; address: string | null;
  notes: string | null; createdByName: string | null;
  createdAt: string; updatedAt: string;
}
interface Analysis {
  id: number; diagnosis: string | null; confidence: number | null;
  allScores: Record<string, number> | null; status: string;
  analyzedAt: string | null; createdAt: string; performedByName: string | null;
}

function getRole(): string | null {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try { return jwtDecode<{ role: string }>(token).role; } catch { return null; }
}

function fmt(s: string | null): string {
  if (!s) return '—';
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
}

function InfoCell({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value ?? '—'}</p>
    </div>
  );
}

export default function PatientDetailPage() {
  const { id }      = useParams<{ id: string }>();
  const navigate    = useNavigate();
  const queryClient = useQueryClient();
  const isMedecin   = getRole() === 'MEDECIN';

  const { data: patient, isLoading } = useQuery<PatientDetail>({
    queryKey: ['patient', id],
    queryFn: () => api.get(`/api/patients/${id}`).then(r => r.data),
  });

  const { data: analyses = [], isLoading: analysesLoading } = useQuery<Analysis[]>({
    queryKey: ['analyses', id],
    queryFn: () => api.get(`/api/analyses/patient/${id}`).then(r => r.data),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/patients/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success('Patient deleted');
      navigate('/patients');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleDelete = () => {
    if (window.confirm(`Delete patient ${patient?.lastName} ${patient?.firstName}?`)) {
      deleteMutation.mutate();
    }
  };

  const handleAnalysisSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['analyses', id] });
    toast.success('Analysis completed');
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="h-64 bg-white rounded-xl border border-gray-100 animate-pulse" />
      </div>
    );
  }
  if (!patient) return null;

  return (
    <div className="p-8 max-w-3xl">

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Link to="/patients" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Patients
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{patient.lastName} {patient.firstName}</h1>
          <p className="mt-1 text-sm text-gray-500">Patient #{patient.id}</p>
        </div>
        {isMedecin && (
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/patients/${id}/edit`)}
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-3.5 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-red-500 px-3.5 py-2 text-sm text-white hover:bg-red-600 disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        )}
      </div>

      {/* Patient info */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Patient Information</p>
        <div className="grid grid-cols-3 gap-y-4 gap-x-8">
          <InfoCell label="CIN"            value={patient.cin} />
          <InfoCell label="Date of Birth"  value={fmt(patient.dateOfBirth)} />
          <InfoCell label="Gender"         value={patient.gender} />
          <InfoCell label="Phone"          value={patient.phone} />
          <InfoCell label="Address"        value={patient.address} />
          <InfoCell label="Added By"       value={patient.createdByName} />
        </div>
        {patient.notes && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-400 mb-1">Notes</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{patient.notes}</p>
          </div>
        )}
      </div>

      {/* MRI Upload */}
      {isMedecin && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">New MRI Analysis</p>
          <MRIUploader patientId={patient.id} onSuccess={handleAnalysisSuccess} />
        </div>
      )}

      {/* Analysis history */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Analysis History
          </p>
          {analyses.length > 0 && (
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
              {analyses.length}
            </span>
          )}
        </div>

        {analysesLoading && <p className="text-sm text-gray-400">Loading…</p>}

        {!analysesLoading && analyses.length === 0 && (
          <p className="text-sm text-gray-400">
            {isMedecin ? 'No analyses yet. Upload a .nii or .nii.gz file above.' : 'No analyses yet.'}
          </p>
        )}

        <div className="space-y-4">
          {analyses.map(a => (
            <AnalysisResultCard key={a.id} analysis={a} isMedecin={isMedecin} />
          ))}
        </div>
      </div>

    </div>
  );
}
