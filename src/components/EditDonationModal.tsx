import React, { useState, useEffect } from 'react';
import { Donation, DonorType, PaymentMethod, DonationStatus } from '../types';
import { formatAmountInput, parseAmountInput } from '../utils/format';

interface EditDonationModalProps {
  donation: Donation | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedDonation: Donation) => void;
}

export const EditDonationModal: React.FC<EditDonationModalProps> = ({
  donation,
  isOpen,
  onClose,
  onSave,
}) => {
  const [donorType, setDonorType] = useState<DonorType>('Particulier');
  const [donorName, setDonorName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Espèces');
  const [isNature, setIsNature] = useState(false);
  const [natureDescription, setNatureDescription] = useState('');
  const [status, setStatus] = useState<DonationStatus>('Reçu');

  useEffect(() => {
    if (donation) {
      setDonorType(donation.donorType);
      setDonorName(donation.donorName);
      setPhone((donation.phone || '').replace(/^\+237\s*/, ''));
      setDate(donation.date);
      setAmount(formatAmountInput(String(donation.amount)));
      setPaymentMethod(donation.paymentMethod);
      setIsNature(donation.isNature);
      setNatureDescription(donation.natureDescription || '');
      setStatus(donation.status);
    }
  }, [donation]);

  if (!isOpen || !donation) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseAmountInput(amount);
    if (numericAmount <= 0 && !isNature) {
      alert('Veuillez préciser un montant ou cocher la contribution en nature.');
      return;
    }

    onSave({
      ...donation,
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
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs"
      role="dialog"
    >
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-white p-5 sm:p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#e7eeff]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-[#ffdad6] flex items-center justify-center text-[#af101a] shrink-0">
              <span className="material-symbols-outlined text-[22px]">edit</span>
            </div>
            <div>
              <h3 className="text-[18px] font-bold text-[#111c2d] leading-tight">
                Modifier le don
              </h3>
              <span className="text-[12px] text-[#5b403d]">
                {donation.donorName} • {donation.receiptNumber}
              </span>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto space-y-4 py-4 pr-1">
          {/* Profil */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#af101a]">
              <span className="material-symbols-outlined text-[18px]">person</span>
              <span className="text-[13px] font-bold text-[#111c2d]">Profil du bienfaiteur</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 bg-[#f0f3ff] p-1 rounded-xl">
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
                    if (item.type === 'Anonyme') setDonorName('Donateur Anonyme');
                    else if (donorName === 'Donateur Anonyme') setDonorName('');
                  }}
                  className={`h-10 rounded-lg flex flex-col items-center justify-center transition-all ${
                    donorType === item.type
                      ? 'bg-white text-[#af101a] shadow-xs font-bold'
                      : 'text-[#5b403d] hover:text-[#111c2d] font-medium'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
                  <span className="text-[10px]">{item.type}</span>
                </button>
              ))}
            </div>

            {donorType !== 'Anonyme' && (
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-[#8f6f6c] text-[18px]">
                  badge
                </span>
                <input
                  type="text"
                  required
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder="Nom du donateur"
                  className="w-full h-11 pl-10 pr-3 rounded-xl bg-[#f0f3ff] text-[13px] text-[#111c2d] border border-[#d8e3fb] focus:outline-none focus:ring-2 focus:ring-[#af101a]"
                />
              </div>
            )}

            <div className="relative flex items-center bg-[#f0f3ff] rounded-xl border border-[#d8e3fb] overflow-hidden focus-within:ring-2 focus-within:ring-[#af101a]">
              <div className="flex items-center gap-1 pl-3 pr-2 py-2.5 bg-[#e7eeff] select-none text-[13px] font-bold text-[#111c2d]">
                <span>+237</span>
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="690 12 34 56"
                className="w-full bg-transparent px-3 py-2.5 text-[13px] text-[#111c2d] outline-none"
              />
            </div>
          </div>

          {/* Détails du don */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#1b6d24]">
              <span className="material-symbols-outlined text-[18px]">redeem</span>
              <span className="text-[13px] font-bold text-[#111c2d]">Détails du don</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-[#111c2d] block">Date</span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-[#f0f3ff] text-[12px] text-[#111c2d] border border-[#d8e3fb] outline-none focus:ring-2 focus:ring-[#af101a]"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-[#111c2d] block">Montant (FCFA)</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => setAmount(formatAmountInput(e.target.value))}
                  className="w-full h-11 px-3 rounded-xl bg-[#f0f3ff] text-[14px] font-bold text-[#111c2d] border border-[#d8e3fb] focus:outline-none focus:ring-2 focus:ring-[#af101a]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
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
                    className={`h-10 px-2 rounded-xl flex items-center gap-1.5 transition-all border ${
                      paymentMethod === item.method
                        ? 'bg-[#af101a] text-white font-bold border-[#af101a] shadow-xs'
                        : 'bg-white text-[#111c2d] border-[#d8e3fb] hover:bg-[#f0f3ff]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
                    <span className="text-[11px] truncate">{item.method}</span>
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl bg-[#f0f3ff] hover:bg-[#e7eeff] transition-colors">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#1b6d24] text-[18px]">
                  inventory_2
                </span>
                <span className="text-[12px] font-bold text-[#111c2d]">
                  Don en nature ou mixte
                </span>
              </div>
              <input
                type="checkbox"
                checked={isNature}
                onChange={(e) => {
                  setIsNature(e.target.checked);
                  if (e.target.checked && parseAmountInput(amount) > 0) setPaymentMethod('Mixte');
                }}
                className="w-4 h-4 rounded text-[#af101a] focus:ring-[#af101a]"
              />
            </label>

            {isNature && (
              <textarea
                rows={2}
                value={natureDescription}
                onChange={(e) => setNatureDescription(e.target.value)}
                placeholder="Description des biens offerts..."
                className="w-full p-3 rounded-xl bg-[#f0f3ff] text-[12px] text-[#111c2d] border border-[#d8e3fb] focus:outline-none focus:ring-2 focus:ring-[#af101a] resize-none"
              />
            )}
          </div>

          {/* Statut */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#715300]">
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
              <span className="text-[13px] font-bold text-[#111c2d]">Statut d'encaissement</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus('Promesse')}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer text-left ${
                  status === 'Promesse'
                    ? 'bg-[#ffdfa0]/30 border-[#715300] ring-1 ring-[#715300]'
                    : 'bg-[#f0f3ff] border-transparent hover:border-[#d8e3fb]'
                }`}
              >
                <span className="text-[12px] font-bold text-[#261a00]">Promis</span>
              </button>
              <button
                type="button"
                onClick={() => setStatus('Reçu')}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer text-left ${
                  status === 'Reçu'
                    ? 'bg-[#a3f69c]/30 border-[#1b6d24] ring-1 ring-[#1b6d24]'
                    : 'bg-[#f0f3ff] border-transparent hover:border-[#d8e3fb]'
                }`}
              >
                <span className="text-[12px] font-bold text-[#002204]">Reçu</span>
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-2 pt-2 border-t border-[#e7eeff]">
            <button
              type="button"
              onClick={onClose}
              className="h-12 px-5 rounded-full bg-[#f0f3ff] hover:bg-[#dee8ff] text-[#111c2d] font-bold text-[13px] transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 h-12 rounded-full bg-[#af101a] hover:bg-[#d32f2f] text-white font-bold text-[14px] shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">save</span>
              <span>Enregistrer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
