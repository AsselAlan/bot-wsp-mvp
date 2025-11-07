import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function getAuthenticatedUser() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
}

export async function getUserId(): Promise<string | null> {
  const user = await getAuthenticatedUser();
  return user?.id || null;
}

export async function requireAuth() {
  const user = await getAuthenticatedUser();

  if (!user) {
    throw new Error('No autenticado');
  }

  return user;
}
