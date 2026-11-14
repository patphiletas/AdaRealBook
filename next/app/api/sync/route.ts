import { syncPartitions } from "@/lib/cloudinary";
import { checkEditPassword, delayFailedAuth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/withErrorHandling";

// POST + mot de passe dans le corps JSON : un mot de passe en query string
// (GET ?password=…) finit dans les logs Vercel, l'historique du navigateur
// et l'en-tête Referer.
export const POST = withErrorHandling(async (request: Request) => {
  const body = await request.json().catch(() => ({}));

  if (!checkEditPassword(body?.password)) {
    await delayFailedAuth();
    return Response.json({ error: "Mot de passe incorrect" }, { status: 403 });
  }

  await syncPartitions();
  return Response.json({ message: "Synchro lancée, vérifie les logs !" });
}, "Erreur lors de la synchronisation Cloudinary");
