// L'attribut `download` d'un <a> n'est pas honoré par les navigateurs pour une
// URL cross-origin (ils dérivent le nom de fichier de l'URL elle-même) — Cloudinary
// étant sur un domaine différent, il faut récupérer le fichier en blob (URL same-origin
// une fois créée) pour que le nom de fichier proposé soit respecté. Voir DOC/error.md.
export async function downloadFile(url: string, filename: string): Promise<void> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(blobUrl);
  } catch {
    // Repli : ouvrir le PDF dans un nouvel onglet si le fetch échoue (ex: hors ligne).
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
