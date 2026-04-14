"use client";

import { useState } from "react";
import type { Partition } from "../types/interface";

type Props = {
  partition: Partition;
  onUpdated: (updated: Partition) => void;
};

const inputClass =
  "w-full border border-amber-200 rounded-lg px-3 py-2 text-sm bg-amber-50/40 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400";
const labelClass = "block text-xs font-semibold uppercase tracking-wide text-stone-500 mb-1";

export default function EditMetadataDialog({ partition, onUpdated }: Props) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [form, setForm] = useState({
    title: partition.title,
    composer: partition.composer,
    musical_key: partition.musical_key ?? "",
    category: partition.category ?? "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleOpen() {
    setForm({
      title: partition.title,
      composer: partition.composer,
      musical_key: partition.musical_key ?? "",
      category: partition.category ?? "",
    });
    setPassword("");
    setError("");
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/partitions/${partition.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password, ...form }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Une erreur est survenue.");
        setLoading(false);
        return;
      }

      const updated: Partition = await res.json();
      onUpdated(updated);
      setOpen(false);
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="shrink-0 rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 transition-colors hover:bg-stone-100"
      >
        Modifier
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-6">
          <div className="w-full max-w-md rounded-2xl border border-amber-200/50 bg-[linear-gradient(145deg,#fffdf7_0%,#fff6ea_45%,#fbe9d7_100%)] shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-amber-200/50">
              <h2 className="text-base font-bold text-amber-950">Modifier les métadonnées</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full px-3 py-1 text-xs font-semibold bg-amber-100 text-amber-900 hover:bg-amber-200"
              >
                Annuler
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-4 flex flex-col gap-4">
              <div>
                <label className={labelClass}>Titre *</label>
                <input
                  className={inputClass}
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Titre du morceau"
                />
              </div>

              <div>
                <label className={labelClass}>Compositeur *</label>
                <input
                  className={inputClass}
                  value={form.composer}
                  onChange={e => setForm(f => ({ ...f, composer: e.target.value }))}
                  placeholder="Nom du compositeur"
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className={labelClass}>Tonalité</label>
                  <input
                    className={inputClass}
                    value={form.musical_key}
                    onChange={e => setForm(f => ({ ...f, musical_key: e.target.value }))}
                    placeholder="ex : Bb, F minor"
                  />
                </div>
                <div className="flex-1">
                  <label className={labelClass}>Catégorie</label>
                  <input
                    className={inputClass}
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    placeholder="ex : Realbook"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Mot de passe *</label>
                <input
                  type="password"
                  className={inputClass}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mot de passe"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-stone-900 py-2.5 text-sm font-semibold text-white hover:bg-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Enregistrement…" : "Enregistrer"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
