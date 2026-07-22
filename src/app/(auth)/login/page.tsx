'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { LogoFull } from '@/components/ui/Logo';

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
    <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-blue-600 to-indigo-800">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <LogoFull width={220} />
          </div>
          <p className="text-gray-500 mt-1">Sistema de Controle de Ponto</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>

          {erro && <p className="text-sm text-red-600">{erro}</p>}

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition shadow-lg"
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}