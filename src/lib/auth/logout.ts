// src/lib/auth/logout.ts
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

export async function performLogout() {
  await signOut(auth);
  await fetch('/api/session', { method: 'DELETE' });
}
