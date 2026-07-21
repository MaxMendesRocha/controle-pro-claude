// src/components/holerites/BaixarPdfButton.tsx
export function BaixarPdfButton({ docId }: { docId: string }) {
  return (
    <a
      href={`/api/holerites/${docId}/pdf`}
      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
    >
      Baixar PDF
    </a>
  );
}