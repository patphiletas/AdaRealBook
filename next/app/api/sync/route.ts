import { syncPartitions } from "@/lib/cloudinary";

export async function GET() {
  await syncPartitions();
  return Response.json({ message: "Synchro lancée, vérifie les logs !" });
}
