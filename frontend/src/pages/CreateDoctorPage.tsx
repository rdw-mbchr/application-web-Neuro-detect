import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axiosInstance';

const schema = z.object({
  email:    z.string().email('Invalid email'),
  password: z.string().min(8, 'At least 8 characters'),
  fullName: z.string().min(1, 'Required'),
  phone:    z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const inp = 'w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500';

export default function CreateDoctorPage() {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', fullName: '', phone: '' },
  });

  const onSubmit = async (data: FormData) => {
    await api.post('/api/auth/register', { ...data, role: 'MEDECIN' });
    toast.success(`Account created for ${data.fullName}`);
    reset();
  };

  return (
    <div className="p-8 max-w-md">

      <div className="mb-6">
        <Link to="/admin" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" /> User Management
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create Doctor Account</h1>
        <p className="mt-1 text-sm text-gray-500">Register a new physician account</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Full name *</label>
            <input {...register('fullName')} placeholder="Dr. Jane Smith" className={inp} />
            {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Email *</label>
            <input type="email" autoComplete="off" {...register('email')} placeholder="doctor@hospital.com" className={inp} />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Password *</label>
            <input type="password" autoComplete="new-password" {...register('password')} placeholder="Min. 8 characters" className={inp} />
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Phone</label>
            <input {...register('phone')} placeholder="Optional" className={inp} />
          </div>

          <button
            type="submit" disabled={isSubmitting}
            className="mt-2 w-full rounded-lg bg-black py-2.5 text-sm font-semibold text-white hover:opacity-80 disabled:opacity-50"
          >
            {isSubmitting ? 'Creating…' : 'Create account'}
          </button>

        </form>
      </div>

    </div>
  );
}
