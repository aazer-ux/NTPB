export type DonationStatus = 'Reçu' | 'Promesse';
export type DonorType = 'Particulier' | 'Sponsor' | 'Anonyme';
export type PaymentMethod = 'Espèces' | 'Orange Money' | 'MTN MoMo' | 'Virement' | 'Nature / Matériel' | 'Mixte';
export type NavigationTab = 'home' | 'editions' | 'new' | 'kpi' | 'close' | 'login' | 'all-donations';
export type SyncState = 'idle' | 'syncing' | 'synced' | 'error';

export interface Donation {
  id: string;
  donorName: string;
  donorType: DonorType;
  phone?: string;
  amount: number; // in FCFA
  isNature: boolean;
  natureDescription?: string;
  paymentMethod: PaymentMethod;
  status: DonationStatus;
  date: string;
  receiptNumber: string;
}

export interface Edition {
  id: string;
  name: string;
  theme: string;
  startDate: string;
  endDate: string;
  budgetGoal: number; // in FCFA
  bannerImage: string;
  status: 'En cours' | 'Clôturée' | 'Planifiée';
  achievedAmount?: number;
  vision?: string;
  editionNumber: number;
}

export interface UserSession {
  isLoggedIn: boolean;
  phone: string;
  name: string;
  role: string;
  avatarUrl: string;
}
