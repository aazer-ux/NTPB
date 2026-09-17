import React, { useState, useEffect } from 'react';
import { APP_IMAGES } from '../data/initialData';

interface ImageManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  images?: typeof APP_IMAGES;
  onUpdateImages: (newImages: typeof APP_IMAGES) => void;
  onResetImages: () => void;
}

export const ImageManagerModal: React.FC<ImageManagerModalProps> = ({
  isOpen,
  onClose,
  images = APP_IMAGES,
  onUpdateImages,
  onResetImages,
}) => {
  const [currentImages, setCurrentImages] = useState(images);
  const [activeTab, setActiveTab] = useState<keyof typeof APP_IMAGES>('banner2026');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (images) {
      setCurrentImages(images);
    }
  }, [images, isOpen]);

  if (!isOpen) return null;

  const imageItems: {
    key: keyof typeof APP_IMAGES;
    title: string;
    description: string;
    category: string;
  }[] = [
    {
      key: 'banner2026',
      title: 'Affiche & Bannière Noël 2026',
      description: 'Image principale montrant les enfants souriants de Batcha sous le soleil doré',
      category: 'Campagnes',
    },
    {
      key: 'foyerCommunautaire',
      title: 'Foyer Communautaire de Batcha',
      description: 'Lieu de distribution de la chefferie et de rassemblement des familles',
      category: 'Logistique',
    },
    {
      key: 'colisConditionnes',
      title: 'Colis Conditionnés & Cadeaux',
      description: 'Paquets de friandises, fournitures scolaires et jouets emballés',
      category: 'Logistique',
    },
    {
      key: 'logoNTPB',
      title: 'Logo Officiel NTPB',
      description: 'Emblème de Noël Pour Tous à Batcha (Cameroun)',
      category: 'Identité',
    },
    {
      key: 'logoDocument',
      title: 'Emblème Document Officiel',
      description: 'En-tête des bilans financiers et rapports de clôture audités',
      category: 'Identité',
    },
    ];

  const handleUrlChange = (newUrl: string) => {
    setCurrentImages((prev) => ({
      ...prev,
      [activeTab]: newUrl,
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          handleUrlChange(reader.result);
          setToastMsg('Image locale importée avec succès !');
          setTimeout(() => setToastMsg(null), 2500);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onUpdateImages(currentImages);
    setToastMsg('Toutes les images dynamiques ont été mises à jour !');
    setTimeout(() => {
      setToastMsg(null);
      onClose();
    }, 800);
  };

  const handleReset = () => {
    onResetImages();
    setCurrentImages(APP_IMAGES);
    setToastMsg('Images restaurées aux valeurs par défaut.');
    setTimeout(() => setToastMsg(null), 2000);
  };

  const currentItem = imageItems.find((i) => i.key === activeTab) || imageItems[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-xl rounded-t-3xl sm:rounded-3xl bg-white p-5 sm:p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#e7eeff]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-[#dee8ff] flex items-center justify-center text-[#af101a]">
              <span className="material-symbols-outlined text-[22px]">link</span>
            </div>
            <div>
              <h3 className="text-[18px] font-bold text-[#111c2d] leading-tight">
                Gestionnaire de Liens Images Dynamiques
              </h3>
              <span className="text-[12px] text-[#5b403d]">
                Personnalisez les photos à partir d'URLs HTML ou fichiers
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-[#f0f3ff] hover:bg-[#dee8ff] text-[#5b403d] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto space-y-4 py-4 pr-1">
          {/* Instructions note */}
          <div className="rounded-xl bg-[#f0f3ff] p-3 border border-[#d8e3fb] flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[#1b6d24] text-[18px] mt-0.5">
              cloud_sync
            </span>
            <p className="text-[12px] text-[#5b403d] leading-relaxed">
              Vous pouvez insérer n'importe quel <strong>lien d'image HTML</strong> (URL direct{' '}
              <code className="text-[#af101a] font-mono bg-white px-1 py-0.5 rounded">https://...</code>
              ) ou téléverser vos photos de terrain à Batcha. Les liens s'appliquent immédiatement à toute
              l'application.
            </p>
          </div>

          {/* Image category selector pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {imageItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === item.key
                    ? 'bg-[#af101a] text-white shadow-xs'
                    : 'bg-[#f0f3ff] text-[#111c2d] hover:bg-[#dee8ff]'
                }`}
              >
                {item.title.split(' ')[0]} {item.title.split(' ')[1]}
              </button>
            ))}
          </div>

          {/* Active Image Editor */}
          <div className="rounded-2xl border border-[#d8e3fb] p-4 bg-white space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#af101a] tracking-wider">
                  {currentItem.category}
                </span>
                <h4 className="text-[15px] font-bold text-[#111c2d]">{currentItem.title}</h4>
                <p className="text-[12px] text-[#5b403d]">{currentItem.description}</p>
              </div>
            </div>

            {/* Live Preview of the Active Image */}
            <div className="relative h-44 w-full rounded-xl overflow-hidden bg-[#f0f3ff] border border-[#d8e3fb] group shadow-inner">
              <img
                src={currentImages[activeTab]}
                alt={currentItem.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1512389142860-9c449e58a543?auto=format&fit=crop&w=800&q=80';
                }}
              />
              <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-xs font-mono">
                Aperçu Direct
              </div>
            </div>

            {/* Input URL field */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-[#111c2d] flex items-center justify-between">
                <span>URL / Lien dynamique HTML de l'image</span>
                <span className="text-[11px] text-[#af101a]">Ex: Unsplash, Cloudinary, Imgur...</span>
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-[#8f6f6c] text-[18px]">
                  link
                </span>
                <input
                  type="url"
                  value={currentImages[activeTab]}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full h-11 pl-9 pr-3 rounded-xl bg-[#f0f3ff] text-[13px] text-[#111c2d] border border-[#d8e3fb] outline-none focus:ring-2 focus:ring-[#af101a] font-mono"
                />
              </div>
            </div>

            {/* Upload alternative */}
            <div className="flex items-center gap-2 pt-1">
              <label className="flex-1 h-10 rounded-xl bg-[#dee8ff] hover:bg-[#d8e3fb] text-[#111c2d] font-bold text-[12px] flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                <span className="material-symbols-outlined text-[18px]">upload_file</span>
                <span>Téléverser depuis l'appareil</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#e7eeff] gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="h-11 px-3 text-[#5b403d] hover:text-[#af101a] text-[12px] font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
            <span>Rétablir défaut</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-11 px-4 rounded-full bg-[#f0f3ff] text-[#111c2d] font-bold text-[13px] hover:bg-[#dee8ff] cursor-pointer"
            >
              Fermer
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="h-11 px-6 rounded-full bg-[#af101a] hover:bg-[#d32f2f] text-white font-bold text-[13px] shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">check</span>
              <span>Appliquer</span>
            </button>
          </div>
        </div>

        {/* Toast */}
        {toastMsg && (
          <div className="fixed bottom-6 left-6 right-6 z-50 animate-in slide-in-from-bottom">
            <div className="rounded-xl bg-[#111c2d] text-white p-3 text-center text-[12px] font-bold shadow-xl">
              {toastMsg}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
