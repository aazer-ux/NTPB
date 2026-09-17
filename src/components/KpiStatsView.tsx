import React, { useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Donation, Edition } from '../types';

interface KpiStatsViewProps {
  currentEdition: Edition;
  donations: Donation[];
}

export const KpiStatsView: React.FC<KpiStatsViewProps> = ({
  currentEdition,
  donations,
}) => {

  // Helper formatting numbers in French standard (with space separators)
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  // Helper to parse 'YYYY-MM-DD' into local midnight Date
  const parseDateToMidnight = (dateStr?: string): Date => {
    if (!dateStr) return new Date();
    const parts = dateStr.split('-').map(Number);
    if (parts.length === 3) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return new Date(dateStr);
  };

  // Reference day J: highest date among donations or today
  const referenceToday = useMemo(() => {
    const realNow = new Date();
    const realMidnight = new Date(realNow.getFullYear(), realNow.getMonth(), realNow.getDate());

    let maxTime = realMidnight.getTime();
    donations.forEach((d) => {
      if (d.date) {
        const dt = parseDateToMidnight(d.date).getTime();
        if (!isNaN(dt) && dt > maxTime) {
          maxTime = dt;
        }
      }
    });
    return new Date(maxTime);
  }, [donations]);

  // Total encaissé (statut Reçu)
  const totalEncaissé = useMemo(() => {
    return donations
      .filter((d) => d.status === 'Reçu')
      .reduce((acc, d) => acc + d.amount, 0);
  }, [donations]);

  // Date de début et durée d'existence de l'édition
  const editionStartDate = useMemo(() => {
    if (currentEdition.startDate) {
      return parseDateToMidnight(currentEdition.startDate);
    }
    let earliest = referenceToday.getTime();
    donations.forEach((d) => {
      if (d.date) {
        const t = parseDateToMidnight(d.date).getTime();
        if (t < earliest) earliest = t;
      }
    });
    return new Date(earliest);
  }, [currentEdition.startDate, donations, referenceToday]);

  const editionAgeDays = useMemo(() => {
    const diffMs = referenceToday.getTime() - editionStartDate.getTime();
    return Math.max(0, Math.floor(diffMs / (24 * 60 * 60 * 1000)));
  }, [referenceToday, editionStartDate]);

  const hasAtLeast7Days = editionAgeDays >= 7;

  // 1. Nature des Dons (Diagramme circulaire / Donut)
  // Recalculé à partir des vraies données : Argent vs Nature
  const natureBreakdown = useMemo(() => {
    const total = donations.length;
    const natureCount = donations.filter((d) => d.isNature).length;
    const argentCount = donations.filter((d) => !d.isNature).length;

    const argentPct = total > 0 ? Math.round((argentCount / total) * 100) : 0;
    const naturePct = total > 0 ? 100 - argentPct : 0;

    return {
      total,
      natureCount,
      argentCount,
      argentPct,
      naturePct,
    };
  }, [donations]);

  // 2. Classement des donateurs (Barres horizontales)
  // Uniquement les dons en argent reçus, classés par ordre décroissant
  const rankedMoneyDonors = useMemo(() => {
    const map = new Map<string, number>();
    const promisesByDonor = new Map<string, number>();

    donations.forEach((d) => {
      const name = (d.donorName || '').trim() || 'Donateur Anonyme';
      if (!d.isNature && d.amount > 0) {
        if (d.status === 'Reçu') {
          map.set(name, (map.get(name) || 0) + d.amount);
        } else if (d.status === 'Promesse') {
          promisesByDonor.set(name, (promisesByDonor.get(name) || 0) + 1);
        }
      }
    });

    const totalMoney = Array.from(map.values()).reduce((sum, v) => sum + v, 0);

    const list = Array.from(map.entries())
      .map(([donorName, amount]) => {
        const percentage = totalMoney > 0 ? (amount / totalMoney) * 100 : 0;
        return {
          donorName,
          amount,
          percentage,
          percentageFormatted: percentage.toFixed(1) + '%',
          pendingPromises: promisesByDonor.get(donorName) || 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    return { list, totalMoney };
  }, [donations]);

  // 3. Rythme de collecte (Courbe par semaine)
  // Montant total collecté en argent (statut "Reçu" uniquement) regroupé par semaine
  const weeklyRythmeData = useMemo(() => {
    if (!hasAtLeast7Days) return [];

    const oneDayMs = 24 * 60 * 60 * 1000;
    const numWeeks = Math.max(1, Math.ceil((editionAgeDays + 1) / 7));
    const weeks: Array<{
      week: string;
      label: string;
      montant: number;
      dateRange: string;
    }> = [];

    for (let w = 1; w <= numWeeks; w++) {
      const weekStartMs = editionStartDate.getTime() + (w - 1) * 7 * oneDayMs;
      const weekEndMs = weekStartMs + 7 * oneDayMs;

      let weekAmount = 0;
      donations.forEach((d) => {
        if (!d.isNature && d.status === 'Reçu' && d.amount > 0 && d.date) {
          const dMs = parseDateToMidnight(d.date).getTime();
          if (dMs >= weekStartMs && dMs < weekEndMs) {
            weekAmount += d.amount;
          }
        }
      });

      const startLabel = new Date(weekStartMs).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
      });
      const endLabel = new Date(weekEndMs - oneDayMs).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
      });

      weeks.push({
        week: `S${w}`,
        label: `Semaine ${w}`,
        montant: weekAmount,
        dateRange: `${startLabel} - ${endLabel}`,
      });
    }

    return weeks;
  }, [hasAtLeast7Days, editionAgeDays, editionStartDate, donations]);

  // 4. Don moyen (chiffre unique = somme des dons en argent reçus ÷ nombre de ces dons)
  const { donMoyen, countDonsArgentRecus } = useMemo(() => {
    const moneyReceived = donations.filter((d) => !d.isNature && d.status === 'Reçu' && d.amount > 0);
    const sum = moneyReceived.reduce((acc, d) => acc + d.amount, 0);
    const avg = moneyReceived.length > 0 ? Math.round(sum / moneyReceived.length) : 0;
    return {
      donMoyen: avg,
      countDonsArgentRecus: moneyReceived.length,
    };
  }, [donations]);

  // 5. Donateurs uniques (comptant chaque "Anonyme" comme un donateur unique séparé)
  const { uniqueDonorsCount, totalDonationsCount } = useMemo(() => {
    const distinctNames = new Set<string>();
    let anonymousCount = 0;

    donations.forEach((d) => {
      const rawName = (d.donorName || '').trim();
      const isAnonymous =
        d.donorType === 'Anonyme' ||
        rawName.toLowerCase() === 'anonyme' ||
        rawName.toLowerCase().startsWith('donateur anonyme');

      if (isAnonymous) {
        anonymousCount += 1;
      } else if (rawName.length > 0) {
        distinctNames.add(rawName.toLowerCase());
      } else {
        anonymousCount += 1;
      }
    });

    return {
      uniqueDonorsCount: distinctNames.size + anonymousCount,
      totalDonationsCount: donations.length,
    };
  }, [donations]);

  // 6. Conversion des promesses
  const promiseStats = useMemo(() => {
    const argentDons = donations.filter((d) => !d.isNature);
    const argentRecus = argentDons.filter((d) => d.status === 'Reçu').length;
    const argentPromesses = argentDons.filter((d) => d.status === 'Promesse').length;
    const totalArgent = argentDons.length;
    const argentConversionPct = totalArgent > 0 ? Math.round((argentRecus / totalArgent) * 100) : 0;
    // Montant restant en promesses financières (réel, utilisé par la synthèse de relances)
    const argentPromessesMontant = argentDons
      .filter((d) => d.status === 'Promesse')
      .reduce((acc, d) => acc + (d.amount || 0), 0);
    const argentPromessesPct = totalArgent > 0 ? 100 - argentConversionPct : 0;

    const natureDons = donations.filter((d) => d.isNature);
    const natureRecus = natureDons.filter((d) => d.status === 'Reçu').length;
    const naturePromesses = natureDons.filter((d) => d.status === 'Promesse').length;
    const totalNature = natureDons.length;
    const natureConversionPct = totalNature > 0 ? Math.round((natureRecus / totalNature) * 100) : 0;

    return {
      argentRecus,
      argentPromesses,
      totalArgent,
      argentConversionPct,
      argentPromessesMontant,
      argentPromessesPct,
      natureRecus,
      naturePromesses,
      totalNature,
      natureConversionPct,
    };
  }, [donations]);

  return (
    <div className="flex flex-col w-full max-w-xl mx-auto px-4 space-y-4 pb-28 pt-2">
      {/* Content Header & Context Controls */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <div className="flex items-center gap-1.5 text-[#af101a]">
              <span className="material-symbols-outlined text-[18px]">insights</span>
              <span className="text-[11px] uppercase tracking-wider font-bold">
                Bilan Analytique
              </span>
            </div>
            <h2 className="text-[24px] text-[#111c2d] font-extrabold tracking-tight">
              Statistiques & KPI
            </h2>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#dee8ff] text-[#111c2d] shadow-xs">
            <span className="material-symbols-outlined text-[#1b6d24] text-[18px]">verified</span>
            <span className="text-[12px] font-bold">{donations.length} dons enregistrés</span>
          </div>
        </div>

        {/* Bandeau : édition analysée (une seule édition active à la fois) */}
        <div className="flex items-center justify-between p-2 rounded-2xl bg-[#f0f3ff] border border-[#d8e3fb]">
          <div className="flex items-center gap-2 px-2 py-1">
            <span className="material-symbols-outlined text-[#715300] text-[20px]">
              calendar_month
            </span>
            <span className="text-[13px] text-[#111c2d] font-semibold">{currentEdition.name}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                currentEdition.status === 'Clôturée'
                  ? 'bg-[#ffdfa0] text-[#261a00]'
                  : 'bg-[#a3f69c] text-[#002204]'
              }`}
            >
              {currentEdition.status === 'Clôturée' ? 'Clôturée' : 'Campagne Active'}
            </span>
          </div>
          <span className="px-3 py-1.5 text-[11px] text-[#5b403d] font-medium">
            {currentEdition.editionNumber}ᵉ édition
          </span>
        </div>
      </section>

      {donations.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-[#e7eeff] space-y-2">
          <span className="material-symbols-outlined text-[38px] text-[#8f6f6c]">monitoring</span>
          <p className="text-[15px] font-bold text-[#111c2d]">
            Les statistiques apparaîtront après le premier don
          </p>
          <p className="text-[12px] text-[#5b403d] max-w-sm mx-auto leading-relaxed">
            Enregistrez un premier don dans « {currentEdition.name} » pour activer les graphiques,
            le classement des donateurs et les indicateurs de collecte.
          </p>
        </div>
      ) : (
        <>

      {/* =================================================================== */}
      {/* ZONE 1 : CHIFFRES CLÉS (Simples chiffres sans graphique)            */}
      {/* =================================================================== */}
      <section id="kpi-zone-chiffres-cles" className="space-y-3">
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 text-[#af101a]">
            <span className="material-symbols-outlined text-[18px]">pin</span>
            <h3 className="text-[12px] font-extrabold uppercase tracking-wider">
              Chiffres Clés de la Collecte
            </h3>
          </div>
          <span className="text-[11px] text-[#5b403d] font-medium">Synthèse instantanée</span>
        </div>

        {/* Carte : Total Encaissé */}
        <div
          id="kpi-card-total-encaisse"
          className="p-4 rounded-2xl bg-white shadow-xs border border-[#e7eeff] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] text-[#5b403d] font-medium">Total Encaissé</span>
            <div className="w-8 h-8 rounded-full bg-[#ffdad6] flex items-center justify-center">
              <span className="material-symbols-outlined text-[#af101a] text-[18px]">savings</span>
            </div>
          </div>
          <span className="text-[20px] text-[#111c2d] font-extrabold leading-tight">
            {formatNumber(totalEncaissé)} <span className="text-[12px] font-bold text-[#5b403d]">FCFA</span>
          </span>
          <span className="text-[11px] text-[#5b403d] mt-1 font-medium">
            Encaissé sur {currentEdition.name}
          </span>
        </div>

        {/* Don moyen (Chiffre unique = somme des dons en argent reçus ÷ nombre de ces dons) */}
        <div
          id="kpi-don-moyen"
          className="p-4 rounded-2xl bg-white shadow-xs border border-[#e7eeff] flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#ffdad6]/60 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[#af101a] text-[22px]">payments</span>
            </div>
            <div>
              <span className="text-[11px] text-[#5b403d] font-semibold uppercase tracking-wider block">
                Don moyen
              </span>
              <span className="text-[18px] font-extrabold text-[#111c2d] tracking-tight">
                {formatNumber(donMoyen)} FCFA
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-[#f0f3ff] text-[#5b403d] text-[11px] font-bold border border-[#d8e3fb] whitespace-nowrap">
            {countDonsArgentRecus} dons reçus
          </span>
        </div>

        {/* Donateurs uniques (Chiffre affiché avec le nombre total de dons à côté) */}
        <div
          id="kpi-donateurs-uniques"
          className="p-4 rounded-2xl bg-white shadow-xs border border-[#e7eeff] flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ffdad6] flex items-center justify-center flex-shrink-0 text-[#af101a]">
              <span className="material-symbols-outlined text-[22px]">diversity_1</span>
            </div>
            <div>
              <span className="text-[11px] text-[#5b403d] font-semibold uppercase tracking-wider block">
                Donateurs uniques
              </span>
              <span className="text-[15px] font-bold text-[#111c2d] tracking-tight">
                <span className="text-[18px] font-extrabold text-[#af101a] mr-1">{uniqueDonorsCount}</span>
                donateurs uniques pour {totalDonationsCount} dons enregistrés
              </span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#a3f69c]/50 flex items-center justify-center text-[#1b6d24] flex-shrink-0">
            <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* ZONE 2 : LES 3 GRAPHIQUES (Camembert, Barres, Courbe) & JAUGES      */}
      {/* =================================================================== */}
      <section id="kpi-zone-graphiques" className="space-y-4 pt-3">
        <div className="flex items-center justify-between pt-2 border-t border-[#e7eeff]">
          <div className="flex items-center gap-1.5 text-[#111c2d]">
            <span className="material-symbols-outlined text-[18px] text-[#af101a]">bar_chart</span>
            <h3 className="text-[12px] font-extrabold uppercase tracking-wider text-[#111c2d]">
              Graphiques & Analyses
            </h3>
          </div>
          <span className="text-[11px] text-[#5b403d] font-medium">Visualisations</span>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* GRAPHIQUE 1 : Diagramme circulaire "Nature des Dons"              */}
        {/* ----------------------------------------------------------------- */}
        <section
          id="kpi-chart-nature-dons"
          className="p-4 rounded-2xl bg-white shadow-xs border border-[#e7eeff] flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[16px] text-[#111c2d] font-bold block">Nature des Dons</span>
              <span className="text-[12px] text-[#5b403d]">
                Répartition sur les {natureBreakdown.total} dons de l'édition
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#dee8ff] flex items-center justify-center text-[#111c2d]">
              <span className="material-symbols-outlined text-[20px]">pie_chart</span>
            </div>
          </div>

          {/* Donut Display avec Total réel au centre sans badge inventé */}
          <div className="flex items-center justify-center py-2">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                {/* Background Ring */}
                <circle cx="80" cy="80" fill="none" r="62" stroke="#f0f3ff" strokeWidth="20" />
                {/* Segment 1: Dons en Argent */}
                {natureBreakdown.argentPct > 0 && (
                  <circle
                    cx="80"
                    cy="80"
                    fill="none"
                    r="62"
                    stroke="#af101a"
                    strokeDasharray={`${(natureBreakdown.argentPct / 100) * 389.55} 389.55`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    strokeWidth="20"
                  />
                )}
                {/* Segment 2: Dons en Nature */}
                {natureBreakdown.naturePct > 0 && (
                  <circle
                    cx="80"
                    cy="80"
                    fill="none"
                    r="62"
                    stroke="#1b6d24"
                    strokeDasharray={`${(natureBreakdown.naturePct / 100) * 389.55} 389.55`}
                    strokeDashoffset={`-${(natureBreakdown.argentPct / 100) * 389.55}`}
                    strokeLinecap="round"
                    strokeWidth="20"
                  />
                )}
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center px-2">
                <span className="text-[24px] font-extrabold text-[#111c2d] tracking-tight leading-none">
                  {natureBreakdown.total}
                </span>
                <span className="text-[12px] text-[#5b403d] font-medium mt-1">Dons Totaux</span>
              </div>
            </div>
          </div>

          {/* Légende avec chiffres et pourcentages réels recalculés */}
          <div className="flex flex-col gap-2 pt-1">
            {/* Argent */}
            <div className="p-3 rounded-xl bg-[#f0f3ff] flex items-center justify-between border border-[#d8e3fb]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-3.5 h-3.5 rounded-full bg-[#af101a] flex-shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[13px] text-[#111c2d] font-bold truncate">Dons en Argent</span>
                  <span className="text-[11px] text-[#5b403d]">Virements, Mobile Money & Espèces</span>
                </div>
              </div>
              <div className="flex flex-col items-end flex-shrink-0 pl-2">
                <span className="text-[14px] text-[#af101a] font-extrabold">{natureBreakdown.argentPct}%</span>
                <span className="text-[11px] text-[#5b403d] font-medium">
                  {natureBreakdown.argentCount} don{natureBreakdown.argentCount > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Nature */}
            <div className="p-3 rounded-xl bg-[#f0f3ff] flex items-center justify-between border border-[#d8e3fb]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-3.5 h-3.5 rounded-full bg-[#1b6d24] flex-shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[13px] text-[#111c2d] font-bold truncate">Dons en Nature</span>
                  <span className="text-[11px] text-[#5b403d]">Jouets, vêtements, vivres & cadeaux</span>
                </div>
              </div>
              <div className="flex flex-col items-end flex-shrink-0 pl-2">
                <span className="text-[14px] text-[#1b6d24] font-extrabold">{natureBreakdown.naturePct}%</span>
                <span className="text-[11px] text-[#5b403d] font-medium">
                  {natureBreakdown.natureCount} don{natureBreakdown.natureCount > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------------------- */}
        {/* GRAPHIQUE 2 : Barres horizontales "Classement des donateurs"     */}
        {/* ----------------------------------------------------------------- */}
        <section
          id="kpi-chart-classement-donateurs"
          className="p-4 rounded-2xl bg-white shadow-xs border border-[#e7eeff] flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[16px] text-[#111c2d] font-bold">Classement des donateurs</span>
                <span className="material-symbols-outlined text-[#715300] text-[18px]">military_tech</span>
              </div>
              <span className="text-[11px] text-[#5b403d]">
                Dons en argent collectés ({formatNumber(rankedMoneyDonors.totalMoney)} FCFA)
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-[#dee8ff] text-[#111c2d] text-[11px] font-bold">
              {rankedMoneyDonors.list.length} donateurs
            </span>
          </div>

          {/* Liste des barres horizontales par donateur */}
          <div className="flex flex-col gap-3 pt-1">
            {rankedMoneyDonors.list.length > 0 ? (
              rankedMoneyDonors.list.map((donor, idx) => (
                <div key={donor.donorName + idx} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[#111c2d]">
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span
                        className={`w-5 h-5 rounded-full text-[11px] font-extrabold flex items-center justify-center flex-shrink-0 ${
                          idx === 0
                            ? 'bg-[#ffdfa0] text-[#261a00]'
                            : idx === 1
                            ? 'bg-[#dee8ff] text-[#111c2d]'
                            : idx === 2
                            ? 'bg-[#ffdad6] text-[#af101a]'
                            : 'bg-[#f0f3ff] text-[#5b403d] border border-[#d8e3fb]'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-[13px] font-bold truncate">{donor.donorName}</span>
                      {donor.pendingPromises > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-[#ffdfa0]/60 text-[#715300] text-[9px] font-bold whitespace-nowrap">
                          + {donor.pendingPromises}{' '}
                          {donor.pendingPromises > 1
                            ? 'promesses en attente'
                            : 'promesse en attente'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-2 flex-shrink-0">
                      <span className="text-[11px] text-[#5b403d] font-medium">
                        {formatNumber(donor.amount)} FCFA
                      </span>
                      <span className="text-[13px] text-[#af101a] font-extrabold min-w-[42px] text-right">
                        {donor.percentageFormatted}
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#f0f3ff] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#af101a] transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(donor.percentage, 1))}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3 text-center text-[12px] text-[#5b403d]">
                Aucun don en argent enregistré pour le moment.
              </div>
            )}
          </div>
        </section>

        {/* ----------------------------------------------------------------- */}
        {/* GRAPHIQUE 3 : Courbe "Rythme de collecte"                         */}
        {/* ----------------------------------------------------------------- */}
        <section
          id="kpi-chart-rythme-collecte"
          className="p-4 rounded-2xl bg-white shadow-xs border border-[#e7eeff] flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#dee8ff] flex items-center justify-center">
                <span className="material-symbols-outlined text-[#af101a] text-[18px]">show_chart</span>
              </div>
              <div>
                <span className="text-[16px] font-bold text-[#111c2d] block">Rythme de collecte</span>
                <span className="text-[11px] text-[#5b403d]">
                  Montant collecté par semaine (dons reçus en argent)
                </span>
              </div>
            </div>
          </div>

          {hasAtLeast7Days ? (
            <div className="w-full pt-2">
              <div className="w-full h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyRythmeData} margin={{ top: 10, right: 12, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7eeff" vertical={false} />
                    <XAxis
                      dataKey="week"
                      stroke="#5b403d"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#d8e3fb' }}
                    />
                    <YAxis
                      stroke="#5b403d"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => {
                        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                        if (value >= 1000) return `${Math.round(value / 1000)}k`;
                        return value;
                      }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-2.5 rounded-xl border border-[#d8e3fb] shadow-md text-[11px]">
                              <span className="font-bold text-[#111c2d] block">{data.label}</span>
                              <span className="text-[10px] text-[#5b403d] block mb-1">{data.dateRange}</span>
                              <span className="font-extrabold text-[#af101a] text-[13px]">
                                {formatNumber(data.montant)} FCFA
                              </span>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="montant"
                      stroke="#af101a"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#af101a', stroke: '#ffffff', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#af101a' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div
              id="kpi-rythme-message-indisponible"
              className="p-4 rounded-xl bg-[#fff3e0] border border-[#ffdfa0] flex items-center gap-2.5 text-[#715300]"
            >
              <span className="material-symbols-outlined text-[20px] flex-shrink-0">info</span>
              <span className="text-[12px] font-medium leading-snug">
                Courbe disponible après une semaine de collecte
              </span>
            </div>
          )}
        </section>

        {/* ----------------------------------------------------------------- */}
        {/* JAUGES / BARRES DE PROGRESSION : Conversion des promesses         */}
        {/* ----------------------------------------------------------------- */}
        <section
          id="kpi-jauges-promesses"
          className="p-4 rounded-2xl bg-white shadow-xs border border-[#e7eeff] flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[16px] text-[#111c2d] font-bold block">
                Concrétisation des Promesses
              </span>
              <span className="text-[12px] text-[#5b403d]">
                Taux d'encaissement et de réception effective
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#a3f69c]/50 flex items-center justify-center text-[#1b6d24]">
              <span className="material-symbols-outlined text-[20px]">task_alt</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {/* Jauge 1: Promesses d'argent */}
            <div className="p-3 rounded-xl bg-[#f0f3ff] flex items-center gap-3 border border-[#d8e3fb]">
              <div className="relative w-14 h-14 flex items-center justify-center flex-shrink-0">
                <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" fill="none" r="32" stroke="#e7eeff" strokeWidth="8" />
                  <circle
                    cx="40"
                    cy="40"
                    fill="none"
                    r="32"
                    stroke="#af101a"
                    strokeDasharray={`${(promiseStats.argentConversionPct / 100) * 201.06} 201.06`}
                    strokeLinecap="round"
                    strokeWidth="8"
                  />
                </svg>
                <span className="absolute text-[13px] font-extrabold text-[#af101a]">
                  {promiseStats.argentConversionPct}%
                </span>
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-[#111c2d] truncate">
                    Promesses en Argent
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#ffdad6] text-[#93000a] text-[10px] font-bold">
                    {promiseStats.argentPromesses} en attente
                  </span>
                </div>
                <p className="text-[11px] text-[#5b403d] mt-0.5">
                  <strong className="text-[#111c2d] font-semibold">
                    {promiseStats.argentRecus} don(s) en argent encaissé(s)
                  </strong>{' '}
                  sur {promiseStats.totalArgent} dons en argent enregistrés
                </p>
                <div className="w-full h-1.5 rounded-full bg-[#e7eeff] mt-1.5 overflow-hidden">
                  <div
                    className="h-full bg-[#af101a] rounded-full"
                    style={{ width: `${promiseStats.argentConversionPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Jauge 2: Promesses en Nature */}
            <div className="p-3 rounded-xl bg-[#f0f3ff] flex items-center gap-3 border border-[#d8e3fb]">
              <div className="relative w-14 h-14 flex items-center justify-center flex-shrink-0">
                <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" fill="none" r="32" stroke="#e7eeff" strokeWidth="8" />
                  <circle
                    cx="40"
                    cy="40"
                    fill="none"
                    r="32"
                    stroke="#1b6d24"
                    strokeDasharray={`${(promiseStats.natureConversionPct / 100) * 201.06} 201.06`}
                    strokeLinecap="round"
                    strokeWidth="8"
                  />
                </svg>
                <span className="absolute text-[13px] font-extrabold text-[#1b6d24]">
                  {promiseStats.natureConversionPct}%
                </span>
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-[#111c2d] truncate">
                    Promesses en Nature
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#a3f69c] text-[#002204] text-[10px] font-bold">
                    {promiseStats.naturePromesses} en attente
                  </span>
                </div>
                <p className="text-[11px] text-[#5b403d] mt-0.5">
                  <strong className="text-[#111c2d] font-semibold">
                    {promiseStats.natureRecus} don(s) en nature réceptionné(s)
                  </strong>{' '}
                  sur {promiseStats.totalNature} dons en nature enregistrés
                </p>
                <div className="w-full h-1.5 rounded-full bg-[#e7eeff] mt-1.5 overflow-hidden">
                  <div
                    className="h-full bg-[#1b6d24] rounded-full"
                    style={{ width: `${promiseStats.natureConversionPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </section>
        </>
      )}

    </div>
  );
};
