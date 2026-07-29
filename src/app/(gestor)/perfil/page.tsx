// src/app/(gestor)/perfil/page.tsx
import { PerfilContent } from '@/components/perfil/PerfilContent';

export default function PerfilPage() {
  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold text-foreground">Meu Perfil</h2>
      <PerfilContent />
    </div>
  );
}
