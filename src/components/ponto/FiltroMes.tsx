'use client';

export function FiltroMes({ mesAtual }: { mesAtual: string }) {
  return (
    <form>
      <input
        type="month"
        name="mes"
        defaultValue={mesAtual}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
        onChange={(e) => e.currentTarget.form?.submit()}
      />
    </form>
  );
}