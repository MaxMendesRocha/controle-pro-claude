'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);

    try {
      await sendPasswordResetEmail(auth, email);
    } catch {
      // Nao revela se o e-mail existe ou nao na conta - segue para a confirmacao
      // mesmo em caso de erro, evitando expor quais e-mails estao cadastrados.
    }

    setEnviando(false);
    setEnviado(true);
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
          <p className="text-sm text-faint">Recuperar acesso</p>
        </div>

        {enviado ? (
          <div className="space-y-5 text-center">
            <p className="text-sm text-muted">
              Se houver uma conta cadastrada com o e-mail{' '}
              <span className="font-medium text-foreground">{email}</span>, enviamos um link para redefinir a
              senha. Confira sua caixa de entrada (e o spam).
            </p>
            <Link href="/login" className="inline-block text-sm font-medium text-accent hover:text-accent-ink">
              Voltar para o login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-muted">
              Informe o e-mail da sua conta. Vamos enviar um link para você criar uma nova senha.
            </p>

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

            <button
              type="submit"
              disabled={enviando}
              className="w-full rounded-lg bg-accent py-2.5 font-semibold text-white shadow-lg transition hover:bg-accent/90 disabled:opacity-50"
            >
              {enviando ? 'Enviando...' : 'Enviar link de redefinicao'}
            </button>

            <Link href="/login" className="block text-center text-sm font-medium text-muted hover:text-foreground">
              Voltar para o login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
