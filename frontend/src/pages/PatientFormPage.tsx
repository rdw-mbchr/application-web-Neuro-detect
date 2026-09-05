import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axiosInstance';

const schema = z.object({
  firstName:   z.string().min(1, 'Required'),
  lastName:    z.string().min(1, 'Required'),
  dateOfBirth: z.string().optional(),
  gender:      z.string().optional(),
  cin:         z.string().optional(),
  phone:       z.string().optional(),
  address:     z.string().optional(),
  notes:       z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface PatientDetail {
  id: number; firstName: string; lastName: string;
  dateOfBirth: string | null; gender: string | null;
  cin: string | null; phone: string | null; address: string | null; notes: string | null;
}

const EMPTY: FormData = { firstName: '', lastName: '', dateOfBirth: '', gender: '', cin: '', phone: '', address: '', notes: '' };

const input = 'w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500';

export default function PatientFormPage() {
  const navigate    = useNavigate();
  const queryClient = useQueryClient();
  const { id }      = useParams<{ id: string }>();
  const isEdit      = !!id;

  const { data: patient } = useQuery<PatientDetail>({
    queryKey: ['patient', id],
    queryFn: () => api.get(`/api/patients/${id}`).then(r => r.data),
    enabled: isEdit,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (patient) reset({
      firstName: patient.firstName, lastName: patient.lastName,
      dateOfBirth: patient.dateOfBirth ?? '', gender: patient.gender ?? '',
      cin: patient.cin ?? '', phone: patient.phone ?? '',
      address: patient.address ?? '', notes: patient.notes ?? '',
    });
  }, [patient, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload = {
        ...data,
        dateOfBirth: data.dateOfBirth || null, gender: data.gender || null,
        cin: data.cin || null, phone: data.phone || null,
        address: data.address || null, notes: data.notes || null,
      };
      return isEdit
        ? api.put(`/api/patients/${id}`, payload).then(r => r.data)
        : api.post('/api/patients', payload).then(r => r.data);
    },
    onSuccess: (saved: PatientDetail) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      if (isEdit) queryClient.invalidateQueries({ queryKey: ['patient', id] });
      toast.success(isEdit ? 'Patient updated' : 'Patient created');
      navigate(`/patients/${saved.id}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-8 max-w-xl">

      <div className="mb-6">
        <Link
          to={isEdit ? `/patients/${id}` : '/patients'}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> {isEdit ? 'Back to patient' : 'Patients'}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Patient' : 'New Patient'}</h1>
        <p className="mt-1 text-sm text-gray-500">{isEdit ? 'Update patient information' : 'Register a new patient'}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="flex flex-col gap-4">

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Last name *</label>
              <input {...register('lastName')} className={input} />
              {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">First name *</label>
              <input {...register('firstName')} className={input} />
              {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Date of birth</label>
              <input type="date" {...register('dateOfBirth')} className={input} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Gender</label>
              <select {...register('gender')} className={input}>
                <option value="">—</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">CIN</label>
              <input {...register('cin')} className={input} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Phone</label>
              <input {...register('phone')} className={input} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Address</label>
            <input {...register('address')} className={input} />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Notes</label>
            <textarea {...register('notes')} rows={3} className={`${input} resize-none`} />
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="mt-2 w-full rounded-lg bg-black py-2.5 text-sm font-semibold text-white hover:opacity-80 disabled:opacity-50"
          >
            {mutation.isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Create patient'}
          </button>

        </form>
      </div>
    </div>
  );
}
