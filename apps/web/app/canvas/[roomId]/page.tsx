import CanvasClient from "@/components/canvas/CanvasClient";

export default async function CanvasPage({ params }: { params: Promise<{ roomId: string }> }) {
  const resolvedParams = await params;
  return <CanvasClient roomId={resolvedParams.roomId} />;
}
