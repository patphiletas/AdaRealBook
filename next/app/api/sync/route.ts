import { syncPartitions } from "@/lib/cloudinary";
import { checkEditPassword, delayFailedAuth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/withErrorHandling";

export const GET = withErrorHandling(async (request: Request) => {
  const { searchParams } = new URL(request.url);

  if (!checkEditPassword(searchParams.get("password"))) {
    await delayFailedAuth();
    return Response.json({ error: "Mot de passe incorrect" }, { status: 403 });
  }

  await syncPartitions();
  return Response.json({ message: "Synchro lancée, vérifie les logs !" });
}, "Erreur lors de la synchronisation Cloudinary");
