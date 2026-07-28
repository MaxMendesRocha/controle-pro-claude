'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    try {
      const credential = await signInWithEmailAndPassword(auth, email, senha);
      const idTokenResult = await credential.user.getIdTokenResult();
      const role = idTokenResult.claims.role as string | undefined;

      if (!role) {
        setErro('Esta conta nao tem uma funcao (role) configurada. Contate o administrador.');
        setCarregando(false);
        return;
      }

      const idToken = await credential.user.getIdToken();
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) {
        setErro('Nao foi possivel iniciar a sessao. Tente novamente.');
        setCarregando(false);
        return;
      }

      router.push(role === 'gestor' ? '/dashboard' : '/meu-ponto');
      router.refresh();
    } catch {
      setErro('E-mail ou senha invalidos.');
      setCarregando(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface-2 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-2xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image src="/pontopro-logo-icone.png" alt="" width={72} height={72} priority />
          <p className="mt-4 text-2xl font-extrabold tracking-tight">
            <span className="text-foreground">Ponto</span>
            <span className="text-positive">Pro</span>
          </p>
          <p className="text-sm text-faint">Gerenciamento inteligente</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-muted">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-surface-2 px-4 py-2 text-foreground outline-none transition focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-sm font-medium text-muted">Senha</label>
              <Link href="/esqueci-senha" className="text-xs font-medium text-accent hover:text-accent-ink">
                Esqueci minha senha
              </Link>
            </div>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-surface-2 px-4 py-2 text-foreground outline-none transition focus:ring-2 focus:ring-accent"
            />
          </div>

          {erro && <p className="text-sm text-critical">{erro}</p>}

          <button
            type="submit"
            disabled={carregando}
            className="w-full rounded-lg bg-accent py-2.5 font-semibold text-white shadow-lg transition hover:bg-accent/90 disabled:opacity-50"
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}