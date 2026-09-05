import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/axiosInstance';

const profileSchema  = z.object({ fullName: z.string().min(1, 'Required'), phone: z.string() });
const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword:     z.string().min(8, 'At least 8 characters'),
});
type ProfileForm  = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

interface UserProfile {
  id: number; email: string; fullName: string; role: string;
  phone?: string; isActive: boolean; createdAt: string;
}

const inp = 'w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500';

export default function ProfilePage() {
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ['me'],
    queryFn: () => api.get('/api/auth/me').then(r => r.data),
  });

  const profileForm  = useForm<ProfileForm>({ resolver: zodResolver(profileSchema), defaultValues: { fullName: '', phone: '' } });
  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema), defaultValues: { currentPassword: '', newPassword: '' } });

  useEffect(() => {
    if (profile) profileForm.reset({ fullName: profile.fullName, phone: profile.phone ?? '' });
  }, [profile]);

  const updateProfile = useMutation({
    mutationFn: (data: ProfileForm) => api.put('/api/auth/me', data).then(r => r.data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['me'] }); toast.success('Profile updated'); },
    onError:   (e: Error) => toast.error(e.message),
  });

  const changePassword = useMutation({
    mutationFn: (data: PasswordForm) => api.post('/api/auth/reset-password', data),
    onSuccess: () => { passwordForm.reset(); toast.success('Password changed'); },
    onError:   (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="p-8"><div className="h-48 bg-white rounded-xl border border-gray-100 animate-pulse" /></div>;

  return (
    <div className="p-8 max-w-lg">

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your account information</p>
      </div>

      {/* Account info */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-5">
        <div className="flex items-center gap-3 mb-5 pb-5 border-b border-gray-100">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-lg font-bold text-blue-600">
              {profile?.fullName?.[0]?.toUpperCase() ?? 'U'}
            </span>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{profile?.fullName}</p>
            <p className="text-sm text-gray-500">{profile?.email}</p>
          </div>
          <span className={`ml-auto inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            profile?.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {profile?.role}
          </span>
        </div>

        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Edit Information</p>
        <form onSubmit={profileForm.handleSubmit(d => updateProfile.mutate(d))} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Full name</label>
            <input {...profileForm.register('fullName')} className={inp} />
            {profileForm.formState.errors.fullName && (
              <p className="mt-1 text-xs text-red-500">{profileForm.formState.errors.fullName.message}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Phone</label>
            <input {...profileForm.register('phone')} placeholder="Optional" className={inp} />
          </div>
          <button type="submit" disabled={updateProfile.isPending}
            className="w-full rounded-lg bg-black py-2.5 text-sm font-semibold text-white hover:opacity-80 disabled:opacity-50">
            {updateProfile.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Change Password</p>
        <form onSubmit={passwordForm.handleSubmit(d => changePassword.mutate(d))} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Current password</label>
            <input type="password" autoComplete="current-password" {...passwordForm.register('currentPassword')} className={inp} />
            {passwordForm.formState.errors.currentPassword && (
              <p className="mt-1 text-xs text-red-500">{passwordForm.formState.errors.currentPassword.message}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">New password</label>
            <input type="password" autoComplete="new-password" {...passwordForm.register('newPassword')} className={inp} />
            {passwordForm.formState.errors.newPassword && (
              <p className="mt-1 text-xs text-red-500">{passwordForm.formState.errors.newPassword.message}</p>
            )}
          </div>
          <button type="submit" disabled={changePassword.isPending}
            className="w-full rounded-lg bg-black py-2.5 text-sm font-semibold text-white hover:opacity-80 disabled:opacity-50">
            {changePassword.isPending ? 'Updating…' : 'Change password'}
          </button>
        </form>
      </div>

    </div>
  );
}
