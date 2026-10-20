'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import AuthShell from '@/components/auth/AuthShell';
import { Button, Field, Input, Toast } from '@/components/ui';

const schema = z.object({
  name: z.string().min(2, 'Enter your full name').max(80),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Use at least 8 characters'),
});
type FormValues = z.infer<typeof schema>;

export default function SignupPage() {
  const { refresh } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [created, setCreated] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      await api.post('/auth/register', values);
      await refresh();
      setCreated(true);
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : 'Could not create your account. Check your connection.');
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="One account connects you to your whole family."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="text-white font-semibold underline">
            Sign in
          </Link>
        </>
      }
    >
      {created ? (
        <div className="space-y-4 text-center">
          <Toast kind="success" message="Account created! Welcome to Smart Family." />
          <div className="space-y-3">
            <p className="text-sm text-sf-muted-gray">Next step: create your family space and invite loved ones.</p>
            <a href="/family" className="block">
              <Button className="w-full">Set up my family space</Button>
            </a>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {serverError ? <Toast kind="error" message={serverError} /> : null}
          <Field label="Full name" error={errors.name?.message}>
            <Input autoComplete="name" placeholder="Rafi Hassan" {...register('name')} />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <Input type="email" autoComplete="email" placeholder="you@example.com" {...register('email')} />
          </Field>
          <Field label="Password" error={errors.password?.message} hint="At least 8 characters.">
            <Input type="password" autoComplete="new-password" placeholder="••••••••" {...register('password')} />
          </Field>
          <Button type="submit" className="w-full" loading={isSubmitting}>
            Create account
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
