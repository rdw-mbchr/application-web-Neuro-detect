import { useState, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CloudUpload, CheckCircle, AlertCircle, X, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axiosInstance';

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  cin: string | null;
}

function calcAge(dob: string | null): string {
  if (!dob) return '—';
  const birth = new Date(dob);
  const now   = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--;
  return String(age);
}

function isNifti(name: string) {
  const n = name.toLowerCase();
  return n.endsWith('.nii.gz') || n.endsWith('.nii');
}

export default function UploadPage() {
  const queryClient = useQueryClient();

  const [search, setSearch]           = useState('');
  const [showDrop, setShowDrop]       = useState(false);
  const [patient, setPatient]         = useState<Patient | null>(null);
  const [file, setFile]               = useState<File | null>(null);
  const [dragging, setDragging]       = useState(false);
  const [progress, setProgress]       = useState(0);
  const [status, setStatus]           = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');

  const fileRef = useRef<HTMLInputElement>(null);

  const { data: results = [] } = useQuery<Patient[]>({
    queryKey: ['patient-search-upload', search],
    queryFn: () =>
      api.get('/api/patients', { params: { search, size: 6 } }).then(r => r.data.content),
    enabled: search.length >= 1 && !patient,
  });

  const selectPatient = (p: Patient) => {
    setPatient(p);
    setSearch('');
    setShowDrop(true);
  };

  const clearPatient = () => {
    setPatient(null);
    setFile(null);
    setStatus('idle');
    setProgress(0);
    setShowDrop(false);
  };

  const pickFile = (f: File) => {
    if (!isNifti(f.name)) {
      toast.error('Only .nii and .nii.gz files are accepted');
      return;
    }
    setFile(f);
    setStatus('idle');
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) pickFile(f);
  }, []);

  const handleUpload = async () => {
    if (!patient || !file) return;
    setStatus('uploading');
    setProgress(0);
    const form = new FormData();
    form.append('patientId', String(patient.id));
    form.append('file', file);
    try {
      await api.post('/api/analyses', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: e => {
          if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
        },
      });
      setStatus('done');
      setProgress(100);
      queryClient.invalidateQueries({ queryKey: ['analyses', String(patient.id)] });
      toast.success('Analysis completed successfully');
    } catch (err: unknown) {
      setStatus('error');
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  const resetAll = () => {
    setPatient(null);
    setFile(null);
    setStatus('idle');
    setProgress(0);
    setShowDrop(false);
  };

  return (
    <div className="p-8 max-w-2xl">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Upload MRI Scan</h1>
        <p className="mt-1 text-sm text-gray-500">Select a patient then upload their MRI file for AI analysis</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">

        {/* Patient selection */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
            Patient
          </label>

          {patient ? (
            <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
              <div>
                <p className="font-medium text-gray-900">{patient.lastName} {patient.firstName}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Age {calcAge(patient.dateOfBirth)}{patient.cin ? ` · CIN ${patient.cin}` : ''}
                </p>
              </div>
              <button onClick={clearPatient} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search patient by name or CIN…"
                  className="w-full rounded-lg border border-gray-200 pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              {results.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white rounded-lg border border-gray-200 shadow-lg divide-y divide-gray-50">
                  {results.map(p => (
                    <button
                      key={p.id}
                      onClick={() => selectPatient(p)}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors"
                    >
                      <p className="text-sm font-medium text-gray-900">{p.lastName} {p.firstName}</p>
                      <p className="text-xs text-gray-400">
                        Age {calcAge(p.dateOfBirth)}{p.cin ? ` · ${p.cin}` : ''}
                      </p>
                    </button>
                  ))}
                </div>
              )}
              {search.length > 0 && results.length === 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white rounded-lg border border-gray-200 shadow-lg px-4 py-3 text-sm text-gray-400">
                  No patients found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Drop zone */}
        {showDrop && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
              MRI File
            </label>

            {status === 'done' ? (
              <div className="rounded-xl border-2 border-green-200 bg-green-50 p-8 text-center">
                <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
                <p className="font-semibold text-green-700">Analysis complete</p>
                <p className="text-sm text-green-600 mt-1">{file?.name}</p>
                <button
                  onClick={resetAll}
                  className="mt-4 rounded-lg border border-green-300 px-4 py-2 text-sm text-green-700 hover:bg-green-100"
                >
                  New upload
                </button>
              </div>
            ) : status === 'error' ? (
              <div className="rounded-xl border-2 border-red-200 bg-red-50 p-8 text-center">
                <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                <p className="font-semibold text-red-700">Upload failed</p>
                <button
                  onClick={() => { setStatus('idle'); setFile(null); }}
                  className="mt-4 rounded-lg border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-100"
                >
                  Try again
                </button>
              </div>
            ) : (
              <>
                <div
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  onClick={() => fileRef.current?.click()}
                  className={`relative cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
                    dragging
                      ? 'border-blue-400 bg-blue-50'
                      : file
                      ? 'border-blue-300 bg-blue-50/60'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-slate-50'
                  }`}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".nii,.nii.gz"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f); e.target.value = ''; }}
                  />
                  <CloudUpload className={`w-10 h-10 mx-auto mb-3 ${file ? 'text-blue-500' : 'text-gray-300'}`} />
                  {file ? (
                    <>
                      <p className="font-medium text-blue-700">{file.name}</p>
                      <p className="text-xs text-blue-500 mt-1">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-gray-700">Drop MRI scan here</p>
                      <p className="text-sm text-gray-400 mt-1">or</p>
                      <span className="mt-3 inline-block rounded-lg border border-gray-200 px-4 py-1.5 text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600">
                        Browse Files
                      </span>
                    </>
                  )}
                </div>
                <p className="mt-2 text-center text-xs text-gray-400">
                  Supported formats: <span className="font-medium">.nii</span>, <span className="font-medium">.nii.gz</span>
                </p>

                {status === 'uploading' && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Uploading & analysing…</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={handleUpload}
                  disabled={!file || status === 'uploading'}
                  className="mt-5 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {status === 'uploading' ? 'Analysing…' : 'Analyze MRI'}
                </button>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
