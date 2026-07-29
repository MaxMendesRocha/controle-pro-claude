'use client';

// src/components/perfil/FormEditarPerfil.tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useToast } from '@/components/ui/Toast';

export function FormEditarPerfil({
  nomeInicial,
  emailInicial,
  bancoInicial,
}: {
  nomeInicial: string;
  emailInicial: string;
  bancoInicial: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [nome, setNome] = useState(nomeInicial);
  const [email, setEmail] = useState(emailInicial);
  const [banco, setBanco] = useState(bancoInicial);
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);

    const res = await fetch('/api/perfil', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, banco }),
    });

    const data = await res.json();
    setSalvando(false);

    if (!res.ok) {
      showToast(data.error || 'Erro ao salvar', 'error');
      return;
    }

    if (data.emailAlterado) {
      showToast('E-mail atualizado. Faca login novamente.');
      await signOut(auth);
      await fetch('/api/session', { method: 'DELETE' });
      router.push('/login');
      router.refresh();
      return;
    }

    showToast('Perfil atualizado com sucesso');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-surface p-5">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-faint">Meus dados</p>

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-muted">Nome</label>
          <input
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-muted">Email</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-accent"
          />
          <p className="mt-1 text-xs text-faint">Tambem e o e-mail usado para entrar no sistema.</p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-muted">Banco / Agencia / Conta</label>
          <input
            value={banco}
            onChange={(e) => setBanco(e.target.value)}
            placeholder="Banco / Ag / Conta"
            className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={salvando}
        className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent/90 disabled:opacity-50"
      >
        {salvando ? 'Salvando...' : 'Salvar'}
      </button>
    </form>
  );
}
