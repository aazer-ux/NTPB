import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Donation, DonorType, PaymentMethod, DonationStatus } from '../types';
import { formatAmountInput, parseAmountInput } from '../utils/format';

interface NewDonationViewProps {
  isLoggedIn: boolean;
  onAddDonation: (newDonation: Omit<Donation, 'id' | 'receiptNumber'>) => Promise<boolean>;
  onLoginRequired: () => void;
  onNavigate: (view: string) => void;
}

export const NewDonationView: React.FC<NewDonationViewProps> = ({
  isLoggedIn,
  onAddDonation,
  onLoginRequired,
  onNavigate,
}) => {
  // Form State
  const [donorType, setDonorType] = useState<DonorType>('Particulier');
  const [donorName, setDonorName] = useState('');
  const [phone, setPhone] = useState('');

  // Step 2: The donation details
  // Date par défaut = réel jour d'enregistrement (valeur utile, pas un exemple)
  const [date, setDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;
  });
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Espèces');
  const [isNature, setIsNature] = useState(false);
  const [natureDescription, setNatureDescription] = useState('');

  // Step 3: Status
  const [status, setStatus] = useState<DonationStatus>('Reçu');

  // Interactive submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const handlePresetAmount = (val: number) => {
    setAmount(formatAmountInput(String(val)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mode consultation : la saisie d'un don exige la connexion gestionnaire
    if (!isLoggedIn) {
      onLoginRequired();
      return;
    }

    if (!donorName.trim() && donorType !== 'Anonyme') {
      alert('Veuillez renseigner le nom du donateur.');
      return;
    }

    const numericAmount = parseAmountInput(amount);
    if (numericAmount <= 0 && !isNature) {
      alert('Veuillez préciser un montant ou cocher la contribution en nature.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(async () => {
      const saved = await onAddDonation({
        donorName: donorType === 'Anonyme' ? 'Donateur Anonyme' : donorName,
        donorType,
        phone: phone ? `+237 ${phone}` : undefined,
        amount: numericAmount,
        isNature: isNature || paymentMethod === 'Nature / Matériel' || paymentMethod === 'Mixte',
        natureDescription: isNature ? natureDescription : undefined,
        paymentMethod,
        status,
        date,
      });

      // Le don doit être confirmé côté serveur avant de valider le formulaire.
      if (!saved) {
        setIsSubmitting(false);
        return;
      }

      setDonorType('Particulier');
      setDonorName('');
      setPhone('');
      setDate(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
          d.getDate()
        ).padStart(2, '0')}`;
      });
      setAmount('');
      setPaymentMethod('Espèces');
      setIsNature(false);
      setNatureDescription('');
      setStatus('Reçu');

      setIsSubmitting(false);
      setShowSuccessToast(true);

      // Launch cheerful confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#af101a', '#1b6d24', '#f8bd2a', '#ffdad6'],
        });
      } catch {
        // Safe fallback if blocked
      }

      setTimeout(() => {
        onNavigate('home');
      }, 1500);
    }, 600);
  };

  return (
    <div className="flex flex-col w-full max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 pb-28 lg:pb-12 pt-2">
      {/* Header pill banner */}
      <div className="flex items-center justify-between p-3 sm:p-4 rounded-2xl bg-[#dee8ff]/50 border border-[#d8e3fb]">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#af101a] text-[18px]">
            celebration
          </span>
          <span className="text-[11px] sm:text-[12px] font-bold text-[#af101a] uppercase tracking-wide">
            ÉDITION SPÉCIALE NOËL 2026 • BATCHA
          </span>
        </div>
        <span className="flex items-center gap-1 text-[11px] font-semibold text-[#1b6d24]">
          <span className="material-symbols-outlined text-[15px]">lock</span>
          Saisie Sécurisée
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Profil du bienfaiteur */}
        <div className="rounded-2xl bg-white p-4 sm:p-5 shadow-sm border border-[#e7eeff] space-y-3">
          <div className="flex items-center gap-2 text-[#af101a]">
            <span className="material-symbols-outlined text-[20px]">person</span>
            <span className="text-[14px] font-bold text-[#111c2d]">
              Profil du bienfaiteur
            </span>
          </div>

          {/* Profile Switcher Tabs */}
          <div className="grid grid-cols-3 gap-2 bg-[#f0f3ff] p-1 rounded-xl">
            {(
              [
                { type: 'Particulier', icon: 'person' },
                { type: 'Sponsor', icon: 'storefront' },
                { type: 'Anonyme', icon: 'visibility_off' },
              ] as const
            ).map((item) => (
              <button
                type="button"
                key={item.type}
                onClick={() => {
                  setDonorType(item.type);
                  if (item.type === 'Anonyme') {
                    setDonorName('Donateur Anonyme');
                  } else if (donorName === 'Donateur Anonyme') {
                    setDonorName('');
                  }
                }}
                className={`h-11 rounded-lg flex flex-col items-center justify-center transition-all ${
                  donorType === item.type
                    ? 'bg-white text-[#af101a] shadow-xs font-bold'
                    : 'text-[#5b403d] hover:text-[#111c2d] font-medium'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                <span className="text-[11px]">{item.type}</span>
              </button>
            ))}
          </div>

          {/* Side-by-side inputs on tablet/desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Nom du donateur */}
            {donorType !== 'Anonyme' ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-bold text-[#111c2d]">
                    Nom et prénom du donateur <span className="text-[#af101a]">*</span>
                  </label>
                  <span className="text-[10px] text-[#1b6d24] font-semibold">
                    Reçu fiscal
                  </span>
                </div>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-[#8f6f6c] text-[18px]">
                    badge
                  </span>
                  <input
                    type="text"
                    required
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    placeholder="ex: Jean-Pierre Talla ou Société ABC"
                    className="w-full h-11 pl-10 pr-3 rounded-xl bg-[#f0f3ff] text-[14px] text-[#111c2d] border border-[#d8e3fb] focus:outline-none focus:ring-2 focus:ring-[#af101a]"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-[12px] font-bold text-[#111c2d]">
                  Statut Anonymat
                </label>
                <div className="h-11 px-3 rounded-xl bg-[#f0f3ff] border border-[#d8e3fb] flex items-center text-[13px] text-[#5b403d]">
                  <span className="material-symbols-outlined text-[18px] mr-2 text-[#8f6f6c]">visibility_off</span>
                  Identité masquée au grand public
                </div>
              </div>
            )}

            {/* Numéro de téléphone */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-bold text-[#111c2d]">
                  Numéro de téléphone <span className="text-[11px] font-normal text-[#5b403d]">(Optionnel)</span>
                </label>
                <span className="text-[10px] text-[#1b6d24] font-semibold">
                  Pour SMS de remerciement
                </span>
              </div>
              <div className="relative flex items-center bg-[#f0f3ff] rounded-xl border border-[#d8e3fb] overflow-hidden focus-within:ring-2 focus-within:ring-[#af101a]">
                <div className="flex items-center gap-1 pl-3 pr-2 py-2.5 bg-[#e7eeff] select-none text-[13px] font-bold text-[#111c2d]">
                  <span>🇨🇲</span>
                  <span>+237</span>
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="690 12 34 56"
                  className="w-full bg-transparent px-3 py-2.5 text-[14px] text-[#111c2d] outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Informations sur le don */}
        <div className="rounded-2xl bg-white p-4 sm:p-5 shadow-sm border border-[#e7eeff] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#1b6d24]">
              <span className="material-symbols-outlined text-[20px]">redeem</span>
              <div>
                <h3 className="text-[14px] font-bold text-[#111c2d]">Informations sur le don</h3>
                <p className="text-[11px] text-[#5b403d]">
                  Mixte possible : argent liquide ou objets
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[#ffdfa0] text-[#261a00] text-[10px] font-bold">
              Batcha 2026
            </span>
          </div>

          {/* Date & Montant on side-by-side layout for tablet/desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Date Picker */}
            <div className="space-y-1">
              <span className="text-[12px] font-bold text-[#111c2d] block">
                Date d'enregistrement
              </span>
              <div className="flex items-center justify-between p-2.5 h-12 rounded-xl bg-[#f0f3ff] border border-[#d8e3fb]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#af101a] text-[18px]">
                    calendar_month
                  </span>
                  <div>
                    <span className="text-[13px] font-bold text-[#111c2d]">{date}</span>
                  </div>
                </div>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="text-[11px] font-semibold text-[#af101a] bg-transparent outline-none cursor-pointer"
                />
              </div>
            </div>

            {/* Montant Financier */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-bold text-[#111c2d] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[#af101a] text-[16px]">
                    payments
                  </span>
                  Montant (FCFA)
                </label>
                <span className="text-[11px] text-[#1b6d24] font-bold">FCFA</span>
              </div>

              <div className="relative flex items-center">
                <input
                  type="text"
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => setAmount(formatAmountInput(e.target.value))}
                  placeholder="ex : 50 000"
                  className="w-full h-12 px-4 rounded-xl bg-[#f0f3ff] text-[20px] font-extrabold text-[#111c2d] border border-[#d8e3fb] focus:outline-none focus:ring-2 focus:ring-[#af101a]"
                />
                <span className="absolute right-4 text-[14px] font-bold text-[#5b403d]">FCFA</span>
              </div>
            </div>
          </div>

          {/* Quick Chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[10000, 25000, 50000, 100000, 250000, 500000].map((preset) => (
              <button
                type="button"
                key={preset}
                onClick={() => handlePresetAmount(preset)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                  parseAmountInput(amount) === preset
                    ? 'bg-[#af101a] text-white shadow-xs'
                    : 'bg-[#f0f3ff] text-[#5b403d] hover:bg-[#e7eeff]'
                }`}
              >
                {new Intl.NumberFormat('fr-FR').format(preset)} F
              </button>
            ))}
          </div>

          {/* Mode de règlement */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-bold text-[#5b403d] uppercase tracking-wider block">
              Mode de règlement
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { method: 'Espèces', icon: 'payments' },
                { method: 'Orange Money', icon: 'smartphone' },
                { method: 'MTN MoMo', icon: 'send_to_mobile' },
                { method: 'Virement', icon: 'account_balance' },
              ].map((item) => (
                <button
                  type="button"
                  key={item.method}
                  onClick={() => setPaymentMethod(item.method as PaymentMethod)}
                  className={`h-11 px-3 rounded-xl flex items-center gap-2 transition-all border ${
                    paymentMethod === item.method
                      ? 'bg-[#af101a] text-white font-bold border-[#af101a] shadow-xs'
                      : 'bg-white text-[#111c2d] border-[#d8e3fb] hover:bg-[#f0f3ff]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                  <span className="text-[12px] truncate">{item.method}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Don en nature / Mixte */}
          <div className="pt-2 border-t border-[#e7eeff] space-y-2">
            <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl bg-[#f0f3ff] hover:bg-[#e7eeff] transition-colors">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#1b6d24] text-[20px]">
                  inventory_2
                </span>
                <span className="text-[12px] font-bold text-[#111c2d]">
                  Don en nature ou mixte (Objets / Vivres)
                </span>
              </div>
              <input
                type="checkbox"
                checked={isNature}
                onChange={(e) => {
                  setIsNature(e.target.checked);
                  if (e.target.checked && parseAmountInput(amount) > 0) {
                    setPaymentMethod('Mixte');
                  }
                }}
                className="w-4 h-4 rounded text-[#af101a] focus:ring-[#af101a]"
              />
            </label>

            {isNature && (
              <div className="space-y-1.5 animate-in fade-in duration-200">
                <label className="text-[11px] font-semibold text-[#5b403d]">
                  Description détaillée des biens offerts :
                </label>
                <textarea
                  rows={3}
                  required={isNature}
                  value={natureDescription}
                  onChange={(e) => setNatureDescription(e.target.value)}
                  placeholder="ex: 3 cartons de livres scolaires, 15 poupées, 1 sac de friandises..."
                  className="w-full p-3 rounded-xl bg-[#f0f3ff] text-[13px] text-[#111c2d] border border-[#d8e3fb] focus:outline-none focus:ring-2 focus:ring-[#af101a] resize-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* Statut d'encaissement */}
        <div className="rounded-2xl bg-white p-4 sm:p-5 shadow-sm border border-[#e7eeff] space-y-3">
          <div className="flex items-center gap-2 text-[#715300]">
            <span className="material-symbols-outlined text-[20px]">verified_user</span>
            <div>
              <h3 className="text-[14px] font-bold text-[#111c2d]">
                Statut d'encaissement
              </h3>
              <p className="text-[11px] text-[#5b403d]">
                Indiquez si le don est déjà perçu ou encore promis
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Promis */}
            <div
              onClick={() => setStatus('Promesse')}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                status === 'Promesse'
                  ? 'bg-[#ffdfa0]/30 border-[#715300] ring-1 ring-[#715300]'
                  : 'bg-[#f0f3ff] border-transparent hover:border-[#d8e3fb]'
              }`}
            >
              <div className="w-5 h-5 rounded-full border-2 border-[#715300] flex items-center justify-center mt-0.5">
                {status === 'Promesse' && <div className="w-2.5 h-2.5 rounded-full bg-[#715300]" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-[#261a00]">Promis</span>
                  {status === 'Promesse' && (
                    <span className="px-1.5 py-0.2 bg-[#ffdfa0] text-[#261a00] text-[9px] font-bold rounded">
                      SÉLECTIONNÉ
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#5b403d] mt-0.5">
                  Engagement ferme non encore perçu à ce jour
                </p>
              </div>
            </div>

            {/* Reçu */}
            <div
              onClick={() => setStatus('Reçu')}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                status === 'Reçu'
                  ? 'bg-[#a3f69c]/30 border-[#1b6d24] ring-1 ring-[#1b6d24]'
                  : 'bg-[#f0f3ff] border-transparent hover:border-[#d8e3fb]'
              }`}
            >
              <div className="w-5 h-5 rounded-full border-2 border-[#1b6d24] flex items-center justify-center mt-0.5">
                {status === 'Reçu' && <div className="w-2.5 h-2.5 rounded-full bg-[#1b6d24]" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-[#002204]">Reçu</span>
                  {status === 'Reçu' && (
                    <span className="px-1.5 py-0.2 bg-[#a3f69c] text-[#002204] text-[9px] font-bold rounded">
                      SÉLECTIONNÉ
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#5b403d] mt-0.5">
                  Fonds encaissés ou objets déjà réceptionnés sur place
                </p>
              </div>
              {status === 'Reçu' && (
                <span className="material-symbols-outlined text-[#1b6d24] text-[18px]">
                  check_circle
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-1">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-14 rounded-full bg-[#af101a] text-white font-bold text-[15px] shadow-[0_6px_20px_rgba(175,16,26,0.3)] hover:bg-[#d32f2f] flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-75"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[22px]">sync</span>
                <span>Enregistrement sécurisé...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[22px]">volunteer_activism</span>
                <span>Enregistrer le don</span>
              </>
            )}
          </button>
          <p className="text-center text-[10px] text-[#5b403d] mt-2">
            Donation certifiée pour l'édition de bienfaisance Noël 2026 sous supervision du comité
            Batcha Core.
          </p>
        </div>
      </form>

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-24 left-4 right-4 z-50 max-w-xl mx-auto animate-in slide-in-from-bottom-6 duration-300">
          <div className="rounded-2xl bg-[#111c2d] text-white p-4 shadow-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#a3f69c] text-[24px]">
                check_circle
              </span>
              <div>
                <p className="text-[13px] font-bold">Don enregistré avec succès !</p>
                <p className="text-[11px] text-gray-300">
                  La jauge financière a été recalculée automatiquement.
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded bg-white/20 text-[11px] font-bold">Batcha 2026</span>
          </div>
        </div>
      )}
    </div>
  );
};
