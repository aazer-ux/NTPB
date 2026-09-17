import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Donation, Edition, NavigationTab } from '../types';
import { DonationActionMenu } from './DonationActionMenu';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AllDonationsViewProps {
  currentEdition: Edition;
  donations: Donation[];
  onNavigate: (tab: NavigationTab) => void;
  onToggleDonationStatus: (donation: Donation) => void;
  onEditDonation: (donation: Donation) => void;
  onDeleteDonation: (donationId: string) => void;
}

export const AllDonationsView: React.FC<AllDonationsViewProps> = ({
  currentEdition,
  donations,
  onNavigate,
  onToggleDonationStatus,
  onEditDonation,
  onDeleteDonation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Tous' | 'Reçu' | 'Promesse'>('Tous');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Filtered donations based on search query & status filter
  const filteredDonations = useMemo(() => {
    return donations.filter((don) => {
      const matchesSearch =
        don.donorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (don.natureDescription &&
          don.natureDescription.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === 'Tous' ||
        (statusFilter === 'Reçu' && don.status === 'Reçu') ||
        (statusFilter === 'Promesse' && don.status === 'Promesse');

      return matchesSearch && matchesStatus;
    });
  }, [donations, searchQuery, statusFilter]);

  // Total amount computed from filtered donations
  const filteredReceivedAmount = useMemo(() => {
    return filteredDonations
      .filter((d) => d.status === 'Reçu')
      .reduce((sum, d) => sum + (d.amount || 0), 0);
  }, [filteredDonations]);

  // Export handlers
  const handleExportExcel = () => {
    const dataToExport = filteredDonations.map((d, index) => ({
      'N°': index + 1,
      'Nom du Donateur': d.donorName,
      'Type de Donateur': d.donorType,
      'Nature / Description':
        d.isNature && d.natureDescription
          ? d.natureDescription
          : d.amount > 0
            ? `${formatNumber(d.amount)} FCFA`
            : 'Nature',
      'Montant (FCFA)': d.amount,
      'Moyen de Paiement': d.paymentMethod,
      Statut: d.status,
      Date: d.date || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dons');
    XLSX.writeFile(
      workbook,
      `dons_${currentEdition.name.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();

    // Title & Metadata
    doc.setFontSize(16);
    doc.setTextColor(175, 16, 26); // #af101a
    doc.text(`Liste des Dons - ${currentEdition.name}`, 14, 18);

    doc.setFontSize(10);
    doc.setTextColor(91, 64, 61); // #5b403d
    const subtitle = `Généré le ${new Date().toLocaleDateString('fr-FR')} | Filtres : ${statusFilter}${searchQuery ? ` | Recherche : "${searchQuery}"` : ''} | Total : ${filteredDonations.length} dons (${formatNumber(filteredReceivedAmount)} FCFA encaissés)`;
    doc.text(subtitle, 14, 25);

    const tableColumn = ['Nom', 'Type', 'Nature / Montant', 'Statut'];
    const tableRows = filteredDonations.map((d) => [
      d.donorName,
      d.donorType,
      d.isNature && d.natureDescription
        ? `${d.natureDescription}${d.amount > 0 ? ` + ${formatNumber(d.amount)} FCFA` : ''}`
        : `${formatNumber(d.amount)} FCFA (${d.paymentMethod})`,
      d.status,
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      headStyles: {
        fillColor: [175, 16, 26],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [240, 243, 255],
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
    });

    doc.save(
      `dons_${currentEdition.name.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`
    );
    setShowExportMenu(false);
  };

  return (
    <div className="flex flex-col w-full max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 pb-24 lg:pb-12 pt-2">
      {/* Navigation Header / Bouton de retour */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#d8e3fb] hover:bg-[#f0f3ff] text-[13px] font-bold text-[#af101a] shadow-2xs transition-all cursor-pointer active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Retour à l'accueil</span>
        </button>

        {/* Bouton Exporter (Excel / PDF) */}
        <div className="relative" ref={exportMenuRef}>
          <button
            type="button"
            id="btn-export-donations"
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#d8e3fb] hover:bg-[#f0f3ff] text-[12px] font-bold text-[#111c2d] shadow-2xs transition-all cursor-pointer"
            title="Exporter la liste des dons"
          >
            <span className="material-symbols-outlined text-[16px] text-[#af101a]">download</span>
            <span>Exporter</span>
            <span className="material-symbols-outlined text-[14px] text-[#5b403d]">
              {showExportMenu ? 'arrow_drop_up' : 'arrow_drop_down'}
            </span>
          </button>

          {showExportMenu && (
            <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-2xl shadow-xl border border-[#e7eeff] py-1.5 z-30 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 border-b border-[#f0f3ff]">
                <span className="text-[10px] uppercase font-bold text-[#5b403d] tracking-wider block">
                  Export des {filteredDonations.length} dons filtrés
                </span>
              </div>
              <button
                type="button"
                onClick={handleExportExcel}
                className="w-full px-3 py-2.5 flex items-center gap-2.5 text-left text-[12px] font-bold text-[#111c2d] hover:bg-[#f0f3ff] transition-colors cursor-pointer"
              >
                <span className="w-7 h-7 rounded-lg bg-[#a3f69c]/50 flex items-center justify-center text-[#1b6d24]">
                  <span className="material-symbols-outlined text-[18px]">table_view</span>
                </span>
                <div className="flex flex-col">
                  <span>Excel (.xlsx)</span>
                  <span className="text-[10px] text-[#5b403d] font-normal">Tableau structuré</span>
                </div>
              </button>

              <button
                type="button"
                onClick={handleExportPDF}
                className="w-full px-3 py-2.5 flex items-center gap-2.5 text-left text-[12px] font-bold text-[#111c2d] hover:bg-[#f0f3ff] transition-colors cursor-pointer"
              >
                <span className="w-7 h-7 rounded-lg bg-[#ffdad6] flex items-center justify-center text-[#af101a]">
                  <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                </span>
                <div className="flex flex-col">
                  <span>Document PDF</span>
                  <span className="text-[10px] text-[#5b403d] font-normal">Mise en page prête à imprimer</span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Titre & Compteur de l'écran dédié */}
      <div className="rounded-2xl bg-white p-4 sm:p-5 shadow-xs border border-[#e7eeff] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-[#af101a] mb-0.5">
            <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {currentEdition.name}
            </span>
          </div>
          <h1 className="text-[20px] sm:text-[22px] font-extrabold text-[#111c2d] leading-tight">
            Liste complète des dons
          </h1>
          <p className="text-[12px] text-[#5b403d] mt-0.5">
            {filteredDonations.length} {filteredDonations.length > 1 ? 'dons affichés' : 'don affiché'} sur {donations.length} au total
          </p>
        </div>
        <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-[#f0f3ff] flex sm:flex-col justify-between items-center sm:items-end">
          <span className="text-[10px] text-[#5b403d] font-semibold uppercase block">
            Total affiché
          </span>
          <span className="text-[18px] sm:text-[20px] font-extrabold text-[#1b6d24] flex items-baseline gap-1">
            {formatNumber(filteredReceivedAmount)}{' '}
            <span className="text-[10px] text-[#5b403d]">FCFA</span>
          </span>
        </div>
      </div>

      {/* Recherche & Filtres */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Champ Recherche */}
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#8f6f6c] text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom de donateur..."
              className="w-full h-11 pl-9 pr-8 rounded-xl bg-white border border-[#e7eeff] text-[13px] text-[#111c2d] focus:outline-none focus:ring-2 focus:ring-[#af101a]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-3 text-[#8f6f6c] hover:text-[#111c2d]"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          {/* Filtres de statut */}
          <div className="flex items-center justify-center gap-1 bg-[#f0f3ff] p-1 rounded-xl border border-[#d8e3fb] flex-shrink-0">
            {(['Tous', 'Reçu', 'Promesse'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all cursor-pointer ${
                  statusFilter === filter
                    ? 'bg-white text-[#111c2d] shadow-xs'
                    : 'text-[#5b403d] hover:text-[#111c2d]'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Liste des dons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
        {donations.length === 0 ? (
          <div className="col-span-full p-10 text-center bg-white rounded-2xl border border-[#e7eeff] space-y-2">
            <span className="material-symbols-outlined text-[36px] text-[#8f6f6c]">inbox</span>
            <p className="text-[14px] font-bold text-[#111c2d]">Aucun don à afficher</p>
            <p className="text-[12px] text-[#5b403d]">
              Les dons enregistrés pour cette édition apparaîtront dans cette liste.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('new')}
              className="mt-2 inline-flex items-center gap-1 px-3.5 py-2 rounded-full bg-[#af101a] text-white text-[12px] font-bold hover:bg-[#d32f2f] shadow-md active:scale-[0.98] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              Enregistrer le premier don
            </button>
          </div>
        ) : filteredDonations.length === 0 ? (
          <div className="col-span-full p-10 text-center bg-white rounded-2xl border border-[#e7eeff] space-y-2">
            <span className="material-symbols-outlined text-[36px] text-[#8f6f6c]">
              search_off
            </span>
            <p className="text-[14px] font-bold text-[#111c2d]">Aucun don correspondant</p>
            <p className="text-[12px] text-[#5b403d]">
              Modifiez votre recherche ou réinitialisez les filtres.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('Tous');
              }}
              className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#f0f3ff] text-[#af101a] text-[12px] font-bold hover:bg-[#e7eeff] transition-colors cursor-pointer"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          filteredDonations.map((don) => {
            const initials = getInitials(don.donorName);
            const isReceived = don.status === 'Reçu';

            return (
              <div
                key={don.id}
                onClick={() => onEditDonation(don)}
                className="group active:scale-[0.99] transition-transform rounded-2xl bg-white p-3.5 shadow-xs border border-[#e7eeff] flex items-center justify-between gap-2 cursor-pointer hover:border-[#af101a]/30"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Avatar icon / initials */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-[13px] ${
                      isReceived
                        ? 'bg-[#a3f69c]/50 text-[#1b6d24]'
                        : 'bg-[#ffdfa0]/60 text-[#715300]'
                    }`}
                  >
                    {don.isNature ? (
                      <span className="material-symbols-outlined text-[20px]">
                        {don.amount > 0 ? 'redeem' : 'inventory_2'}
                      </span>
                    ) : initials ? (
                      initials
                    ) : (
                      <span className="material-symbols-outlined text-[20px]">payments</span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-[14px] text-[#111c2d] truncate font-bold">
                        {don.donorName}
                      </p>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          don.donorType === 'Sponsor'
                            ? 'bg-[#ffdfa0] text-[#715300]'
                            : 'bg-[#f0f3ff] text-[#5b403d]'
                        }`}
                      >
                        {don.donorType}
                      </span>
                    </div>
                    <p className="text-[12px] text-[#5b403d] truncate mt-0.5">
                      {don.isNature && don.natureDescription
                        ? `${don.paymentMethod} • ${don.natureDescription}`
                        : `${don.paymentMethod} • ${formatNumber(don.amount)} FCFA`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      isReceived
                        ? 'bg-[#a3f69c] text-[#002204]'
                        : 'bg-[#ffdfa0] text-[#261a00]'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isReceived ? 'bg-[#1b6d24]' : 'bg-[#715300]'
                      }`}
                    />
                    {don.status}
                  </span>
                  <DonationActionMenu
                    donation={don}
                    onToggleStatus={onToggleDonationStatus}
                    onEdit={onEditDonation}
                    onDelete={onDeleteDonation}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
