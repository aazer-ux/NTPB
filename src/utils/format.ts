// Formatage des montants en FCFA, norme française (séparateur de milliers : espace)
export const formatFCFA = (num: number) => new Intl.NumberFormat('fr-FR').format(num);

// Abréviation "M" réservée aux montants >= 1 000 000 ; en dessous, montant complet.
export const formatCompactFCFA = (num: number) => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(2).replace('.', ',')}M`;
  }
  return formatFCFA(num);
};

// Met en forme un montant en cours de saisie : chiffres seuls + séparateurs.
export const formatAmountInput = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 12);
  if (!digits) return '';
  return formatFCFA(Number(digits));
};

export const parseAmountInput = (value: string) => Number(value.replace(/\D/g, '')) || 0;