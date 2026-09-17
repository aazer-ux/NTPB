import React, { useEffect, useRef, useState } from 'react';
import { Edition } from '../types';
import { APP_IMAGES } from '../data/initialData';

interface CreateEditionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateEdition: (newEdition: Edition) => void;
}

export const CreateEditionModal: React.FC<CreateEditionModalProps> = ({
  isOpen,
  onClose,
  onCreateEdition,
}) => {
  // Année en cours : la campagne NTPB débute par défaut le 1er novembre
  // et se termine le 25 décembre, une vraie valeur voulue et non un exemple.
  const currentYear = new Date().getFullYear();

  const [name, setName] = useState('');
  const [theme, setTheme] = useState('');
  const [editionNumber, setEditionNumber] = useState('');
  const [bannerUrl, setBannerUrl] = useState(APP_IMAGES.banner2026);
  const [startDate, setStartDate] = useState(`${currentYear}-11-01`);
  const [endDate, setEndDate] = useState(`${currentYear}-12-25`);
  const [budgetGoal, setBudgetGoal] = useState('');
  const [vision, setVision] = useState('');

  const [customImageMode, setCustomImageMode] = useState<'preset' | 'url' | 'upload'>('preset');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);

  // Garde la modale au-dessus du clavier virtuel : on borne sa hauteur maximale
  // à la hauteur réellement visible (visualViewport). Le bouton de validation,
  // en zone FIXE, reste donc toujours visible et cliquable.
  useEffect(() => {
    if (!isOpen) return;
    const panel = panelRef.current;
    const vv = window.visualViewport;
    if (!panel || !vv) return;

    const clampHeight = () => {
      panel.style.maxHeight = `${Math.max(280, vv.height * 0.92)}px`;
    };

    clampHeight();
    vv.addEventListener('resize', clampHeight);
    return () => vv.removeEventListener('resize', clampHeight);
  }, [isOpen]);

  // Formulaire à blanc à chaque ouverture : aucune valeur résiduelle ni
  // calcul automatique, le numéro d'édition provient uniquement de la saisie.
  useEffect(() => {
    if (!isOpen) return;
    setName('');
    setTheme('');
    setEditionNumber('');
    setBannerUrl(APP_IMAGES.banner2026);
    setStartDate(`${currentYear}-11-01`);
    setEndDate(`${currentYear}-12-25`);
    setBudgetGoal('');
    setVision('');
    setCustomImageMode('preset');
  }, [isOpen, currentYear]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setBannerUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const edition: Edition = {
      id: `bta-${Date.now()}`,
      editionNumber: parseInt(editionNumber, 10) || 0,
      name,
      theme: `« ${theme.replace(/^«|»$/g, '').trim()} »`,
      startDate,
      endDate,
      budgetGoal: parseInt(budgetGoal, 10) || 0,
      bannerImage: bannerUrl || APP_IMAGES.banner2026,
      status: 'En cours',
      achievedAmount: 0,
      vision,
    };

    setTimeout(() => {
      onCreateEdition(edition);
      setIsSubmitting(false);
      onClose();
    }, 600);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={panelRef}
        className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-white p-5 sm:p-6 shadow-2xl flex flex-col max-h-[92dvh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#e7eeff]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-[#ffdad6] flex items-center justify-center text-[#af101a] shrink-0">
              <span className="material-symbols-outlined text-[22px]">celebration</span>
            </div>
            <div>
              <h3 className="text-[18px] font-bold text-[#111c2d] leading-tight">
                Nouvelle Édition de Noël
              </h3>
              <span className="text-[12px] text-[#5b403d]">Campagne solidaire pour Batcha</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-[#f0f3ff] hover:bg-[#dee8ff] text-[#5b403d] transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form
          id="create-edition-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto space-y-4 py-4 pr-1"
        >
          {/* Nom de l'édition */}
          <div>
            <label className="text-[12px] text-[#5b403d] block mb-1 font-semibold">
              Nom de l'édition <span className="text-[#af101a]">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-[#8f6f6c] text-[19px]">
                label
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex: Noël 2027"
                className="w-full h-11 pl-10 pr-3 rounded-xl bg-[#f0f3ff] text-[13px] text-[#111c2d] outline-none focus:ring-2 focus:ring-[#af101a] border border-[#d8e3fb]"
              />
            </div>
          </div>

          {/* Numéro de l'édition */}
          <div>
            <label className="text-[12px] text-[#5b403d] block mb-1 font-semibold">
              Numéro de l'édition <span className="text-[#af101a]">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-[#8f6f6c] text-[19px]">
                tag
              </span>
              <input
                type="number"
                min={1}
                required
                value={editionNumber}
                onChange={(e) => setEditionNumber(e.target.value)}
                placeholder="ex : 1, 2, 3…"
                className="w-full h-11 pl-10 pr-3 rounded-xl bg-[#f0f3ff] text-[13px] text-[#111c2d] outline-none focus:ring-2 focus:ring-[#af101a] border border-[#d8e3fb]"
              />
            </div>
            <p className="text-[10px] text-[#5b403d] mt-1">
              1 pour la première édition, 2 pour la suivante, etc. — ce numéro apparaît dans les
              rapports officiels.
            </p>
          </div>

          {/* Thème */}
          <div>
            <label className="text-[12px] text-[#5b403d] block mb-1 font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[#715300] text-[16px] fill">
                auto_awesome
              </span>
              <span>Thème de l'édition</span>
              <span className="text-[#af101a]">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-[#715300] text-[19px]">
                hotel_class
              </span>
              <input
                type="text"
                required
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="ex: Un cadeau, un sourire dans les collines de Batcha"
                className="w-full h-11 pl-10 pr-3 rounded-xl bg-[#f0f3ff] text-[13px] text-[#111c2d] outline-none focus:ring-2 focus:ring-[#af101a] border border-[#d8e3fb]"
              />
            </div>
          </div>

          {/* Photo de couverture / Affiche (Lien dynamique & Upload) */}
          <div>
            <label className="text-[12px] text-[#5b403d] block mb-1 font-semibold flex items-center justify-between">
              <span>Photo de couverture ou affiche</span>
              <span className="text-[11px] text-[#1b6d24] font-semibold">Lien dynamique</span>
            </label>

            {/* Selector mode: preset vs url vs upload */}
            <div className="flex gap-1 mb-2 bg-[#f0f3ff] p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setCustomImageMode('preset')}
                className={`flex-1 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  customImageMode === 'preset'
                    ? 'bg-white text-[#af101a] shadow-xs'
                    : 'text-[#5b403d]'
                }`}
              >
                Galerie Batcha
              </button>
              <button
                type="button"
                onClick={() => setCustomImageMode('url')}
                className={`flex-1 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  customImageMode === 'url' ? 'bg-white text-[#af101a] shadow-xs' : 'text-[#5b403d]'
                }`}
              >
                Lien Web / HTML
              </button>
              <button
                type="button"
                onClick={() => setCustomImageMode('upload')}
                className={`flex-1 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  customImageMode === 'upload'
                    ? 'bg-white text-[#af101a] shadow-xs'
                    : 'text-[#5b403d]'
                }`}
              >
                Téléverser
              </button>
            </div>

            {customImageMode === 'preset' && (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Enfants 2026', url: APP_IMAGES.banner2026 },
                  { label: 'Foyer Village', url: APP_IMAGES.foyerCommunautaire },
                  { label: 'Colis Cadeaux', url: APP_IMAGES.colisConditionnes },
                ].map((img) => (
                  <div
                    key={img.label}
                    onClick={() => setBannerUrl(img.url)}
                    className={`h-20 rounded-xl overflow-hidden relative cursor-pointer border-2 transition-all ${
                      bannerUrl === img.url
                        ? 'border-[#af101a] ring-2 ring-[#af101a]/30'
                        : 'border-transparent hover:opacity-80'
                    }`}
                  >
                    <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 left-1 right-1 text-[9px] bg-black/60 text-white font-bold px-1 rounded truncate text-center">
                      {img.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {customImageMode === 'url' && (
              <div className="space-y-2">
                <input
                  type="url"
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  placeholder="https://exemple.com/affiche-batcha-2027.jpg"
                  className="w-full h-11 px-3 rounded-xl bg-[#f0f3ff] text-[13px] text-[#111c2d] border border-[#d8e3fb] focus:outline-none focus:ring-2 focus:ring-[#af101a]"
                />
                {bannerUrl && (
                  <div className="h-24 rounded-xl overflow-hidden border border-[#d8e3fb]">
                    <img
                      src={bannerUrl}
                      alt="Aperçu"
                      className="w-full h-full object-cover"
                      onError={() => alert("Impossible de charger l'image depuis cette URL")}
                    />
                  </div>
                )}
              </div>
            )}

            {customImageMode === 'upload' && (
              <div className="relative border-2 border-dashed border-[#e4beba] rounded-2xl p-4 bg-[#f0f3ff]/50 hover:bg-[#f0f3ff] transition-colors flex flex-col items-center justify-center text-center group cursor-pointer">
                <span className="material-symbols-outlined text-[28px] text-[#af101a] mb-1">
                  add_photo_alternate
                </span>
                <span className="text-[12px] font-bold text-[#111c2d]">
                  Choisir un fichier image
                </span>
                <span className="text-[10px] text-[#5b403d] mb-1">JPG, PNG ou WebP</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] text-[#5b403d] block mb-1 font-semibold">
                Date de début
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-[#f0f3ff] text-[12px] text-[#111c2d] border border-[#d8e3fb] outline-none focus:ring-2 focus:ring-[#af101a]"
              />
            </div>
            <div>
              <label className="text-[12px] text-[#5b403d] block mb-1 font-semibold">
                Date de fin
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-[#f0f3ff] text-[12px] text-[#111c2d] border border-[#d8e3fb] outline-none focus:ring-2 focus:ring-[#af101a]"
              />
            </div>
          </div>

          {/* Budget espéré */}
          <div>
            <label className="text-[12px] text-[#5b403d] block mb-1 font-semibold">
              Budget espéré (FCFA)
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-[#8f6f6c] text-[18px]">
                payments
              </span>
              <input
                type="number"
                value={budgetGoal}
                onChange={(e) => setBudgetGoal(e.target.value)}
                placeholder="ex : 5 000 000"
                className="w-full h-11 pl-9 pr-2.5 rounded-xl bg-[#f0f3ff] text-[13px] font-bold text-[#111c2d] border border-[#d8e3fb] outline-none focus:ring-2 focus:ring-[#af101a]"
              />
            </div>
          </div>

          {/* Vision */}
          <div>
            <label className="text-[12px] text-[#5b403d] block mb-1 font-semibold">
              Objectifs et vision de l'édition
            </label>
            <textarea
              rows={3}
              value={vision}
              onChange={(e) => setVision(e.target.value)}
              placeholder="Ex : Offrir un paquet cadeau festif, un repas chaud et des kits scolaires aux enfants scolarisés et orphelins des villages des hauts plateaux de Batcha."
              className="w-full p-3 rounded-xl bg-[#f0f3ff] text-[12px] text-[#111c2d] border border-[#d8e3fb] outline-none focus:ring-2 focus:ring-[#af101a] resize-none"
            />
          </div>
        </form>

        {/* Footer Actions — zone FIXE, toujours visible et cliquable au bas de la modale */}
        <div className="flex items-center gap-2 pt-3 border-t border-[#e7eeff] pb-[env(safe-area-inset-bottom)] sm:pb-0">
          <button
            type="button"
            onClick={onClose}
            className="h-12 px-5 rounded-full bg-[#f0f3ff] hover:bg-[#dee8ff] text-[#111c2d] font-bold text-[13px] transition-colors cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="submit"
            form="create-edition-form"
            disabled={isSubmitting}
            className="flex-1 h-12 rounded-full bg-[#af101a] hover:bg-[#d32f2f] text-white font-bold text-[14px] shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
            <span>{isSubmitting ? 'Création...' : "Créer et lancer l'édition"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
