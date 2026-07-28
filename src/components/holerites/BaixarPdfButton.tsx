// src/components/holerites/BaixarPdfButton.tsx
export function BaixarPdfButton({ docId }: { docId: string }) {
  return (
    <a
      href={`/api/holerites/${docId}/pdf`}
      className="bg-critical hover:bg-critical/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
    >
      Baixar PDF
    </a>
  );
}