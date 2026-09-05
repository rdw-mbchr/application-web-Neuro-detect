import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Brain } from 'lucide-react';
import api from '../api/axiosInstance';

const schema = z.object({
  email:    z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setServerError('');
    try {
      const res   = await api.post('/api/auth/login', data);
      const token = res.data?.token ?? res.data?.accessToken ?? res.data;
      localStorage.setItem('token', token);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <div className="flex h-screen w-screen">

      {/* Left — form */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center bg-white px-8 lg:px-16">
        <div className="w-full max-w-sm">

          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-base font-bold text-gray-900 leading-tight">NeuroScan AI</p>
              <p className="text-xs text-gray-400 leading-tight">MRI Analysis Platform</p>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h1>
          <p className="text-sm text-gray-500 mb-8">Sign in to your account</p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Email address</label>
              <input
                type="email" placeholder="doctor@hospital.com"
                autoComplete="email" {...register('email')}
                className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Password</label>
              <input
                type="password" placeholder="••••••••"
                autoComplete="current-password" {...register('password')}
                className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            {serverError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-600">
                {serverError}
              </div>
            )}

            <button
              type="submit" disabled={isSubmitting}
              className="mt-1 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-gray-400">
            Secure medical platform for authorized healthcare professionals
          </p>
        </div>
      </div>

      {/* Right — visual panel */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 flex-col items-center justify-center p-16 text-white">
        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
          <Brain className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold mb-3 text-center">AI-Powered MRI Analysis</h2>
        <p className="text-blue-200 text-center max-w-xs leading-relaxed">
          Detect neurological conditions with advanced deep learning — ADHD, Bipolar, Schizophrenia, and Control classification.
        </p>
        <div className="mt-10 grid grid-cols-2 gap-4 w-full max-w-xs">
          {[
            ['CONTROL', 'bg-green-400/20 text-green-300'],
            ['SCHIZOPHRENIA', 'bg-red-400/20 text-red-300'],
            ['BIPOLAR', 'bg-orange-400/20 text-orange-300'],
            ['ADHD', 'bg-blue-400/20 text-blue-200'],
          ].map(([label, cls]) => (
            <div key={label} className={`rounded-lg px-3 py-2 text-xs font-semibold text-center ${cls}`}>
              {label}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
