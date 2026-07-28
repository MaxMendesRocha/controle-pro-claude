'use client';

export function FiltroMes({ mesAtual }: { mesAtual: string }) {
  return (
    <form>
      <input
        type="month"
        name="mes"
        defaultValue={mesAtual}
        className="px-3 py-2 border border-border bg-surface rounded-lg text-sm text-foreground focus:ring-2 focus:ring-accent outline-none"
        onChange={(e) => e.currentTarget.form?.submit()}
      />
    </form>
  );
}