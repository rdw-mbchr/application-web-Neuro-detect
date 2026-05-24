import { useState, useRef, useCallback } from 'react';
import { CloudUpload, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axiosInstance';

interface Props {
  patientId: number;
  onSuccess: () => void;
}

function isNifti(name: string) {
  const n = name.toLowerCase();
  return n.endsWith('.nii.gz') || n.endsWith('.nii');
}

export default function MRIUploader({ patientId, onSuccess }: Props) {
  const [file, setFile]         = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus]     = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const fileRef                 = useRef<HTMLInputElement>(null);

  const pickFile = (f: File) => {
    if (!isNifti(f.name)) { toast.error('Only .nii and .nii.gz files are accepted'); return; }
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
    if (!file) return;
    setStatus('uploading');
    setProgress(0);
    const form = new FormData();
    form.append('patientId', String(patientId));
    form.append('file', file);
    try {
      await api.post('/api/analyses', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: e => { if (e.total) setProgress(Math.round((e.loaded / e.total) * 100)); },
      });
      setStatus('done');
      setProgress(100);
      onSuccess();
    } catch (err: unknown) {
      setStatus('error');
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  const reset = () => { setFile(null); setStatus('idle'); setProgress(0); };

  if (status === 'done') {
    return (
      <div className="rounded-xl border-2 border-green-200 bg-green-50 p-6 text-center">
        <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
        <p className="text-sm font-semibold text-green-700">Analysis complete</p>
        <button onClick={reset} className="mt-3 text-xs text-green-600 underline underline-offset-2">
          Upload another
        </button>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="rounded-xl border-2 border-red-200 bg-red-50 p-6 text-center">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-sm font-semibold text-red-600">Upload failed</p>
        <button onClick={reset} className="mt-3 text-xs text-red-500 underline underline-offset-2">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          dragging     ? 'border-blue-400 bg-blue-50'
          : file       ? 'border-blue-300 bg-blue-50/50'
          : 'border-gray-200 hover:border-blue-300 hover:bg-slate-50'
        }`}
      >
        <input
          ref={fileRef} type="file" accept=".nii,.nii.gz" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f); e.target.value = ''; }}
        />
        <CloudUpload className={`w-8 h-8 mx-auto mb-2 ${file ? 'text-blue-500' : 'text-gray-300'}`} />
        {file ? (
          <>
            <p className="text-sm font-medium text-blue-700">{file.name}</p>
            <p className="text-xs text-blue-400 mt-0.5">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-gray-600">Drop MRI scan here</p>
            <span className="mt-2 inline-block rounded-lg border border-gray-200 px-3.5 py-1 text-xs text-gray-500">
              Browse Files
            </span>
          </>
        )}
      </div>

      <p className="text-center text-xs text-gray-400">
        Supported: <span className="font-medium">.nii</span>, <span className="font-medium">.nii.gz</span>
      </p>

      {status === 'uploading' && (
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Analysing…</span><span>{progress}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || status === 'uploading'}
        className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {status === 'uploading' ? 'Analysing…' : 'Analyze MRI'}
      </button>
    </div>
  );
}
