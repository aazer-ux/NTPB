import { supabase } from '../supabaseClient';
import { Donation, Edition } from '../types';

// === DB Row shapes (colonnes Supabase snake_case) ===

export interface EditionRow {
  id: string;
  user_id: string;
  nom: string;
  numero_edition: number;
  theme: string | null;
  date_debut: string | null;
  date_fin: string | null;
  budget_cible: number | null;
  objectifs: string | null;
  statut: string | null;
  created_at: string | null;
  banner_image: string | null;
  achieved_amount: number | null;
  vision: string | null;
}

export interface DonationRow {
  id: string;
  user_id: string;
  edition_id: string | null;
  donor_type: string | null;
  donor_name: string | null;
  donor_phone: string | null;
  date: string | null;
  amount: number | null;
  payment_method: string | null;
  is_nature: boolean | null;
  nature_description: string | null;
  status: string | null;
  receipt_number: string | null;
  created_at: string | null;
}

// === Mappers Edition <-> EditionRow ===

export const editionToRow = (e: Partial<Edition>): Partial<EditionRow> => ({
  nom: e.name ?? undefined,
  numero_edition: e.editionNumber ?? undefined,
  theme: e.theme ?? null,
  date_debut: e.startDate || null,
  date_fin: e.endDate || null,
  budget_cible: e.budgetGoal ?? undefined,
  statut: e.status ?? undefined,
  banner_image: e.bannerImage ?? null,
  achieved_amount: e.achievedAmount ?? null,
  vision: e.vision ?? null,
});

export const rowToEdition = (r: EditionRow): Edition => ({
  id: r.id,
  name: r.nom,
  editionNumber: r.numero_edition,
  theme: r.theme ?? '',
  startDate: r.date_debut ?? '',
  endDate: r.date_fin ?? '',
  budgetGoal: r.budget_cible ?? 0,
  status: (r.statut as Edition['status']) ?? 'Planifiée',
  bannerImage: r.banner_image ?? '',
  vision: r.vision ?? undefined,
  achievedAmount: r.achieved_amount ?? 0,
});

// === Mappers Donation <-> DonationRow ===

export const donationToRow = (d: Donation, userId: string, editionId: string | null): Partial<DonationRow> => ({
  user_id: userId,
  edition_id: editionId,
  donor_type: d.donorType,
  donor_name: d.donorName,
  donor_phone: d.phone ?? null,
  date: d.date || null,
  amount: d.amount,
  payment_method: d.paymentMethod,
  is_nature: d.isNature,
  nature_description: d.natureDescription ?? null,
  status: d.status,
  receipt_number: d.receiptNumber,
});

export const rowToDonation = (r: DonationRow): Donation => ({
  id: r.id,
  donorType: (r.donor_type as Donation['donorType']) ?? 'Particulier',
  donorName: r.donor_name ?? '',
  phone: r.donor_phone ?? undefined,
  date: r.date ?? '',
  amount: r.amount ?? 0,
  paymentMethod: (r.payment_method as Donation['paymentMethod']) ?? 'Espèces',
  isNature: r.is_nature ?? false,
  natureDescription: r.nature_description ?? undefined,
  status: (r.status as Donation['status']) ?? 'Reçu',
  receiptNumber: r.receipt_number ?? '',
});

// Mapper réservé aux UPDATE : ne touche JAMAIS à user_id / edition_id afin de
// ne pas casser le propriétaire (RLS) ni perdre le rattachement à l'édition.
export const donationUpdateToRow = (d: Partial<Donation>): Partial<DonationRow> => ({
  donor_type: d.donorType ?? undefined,
  donor_name: d.donorName ?? undefined,
  donor_phone: d.phone ?? undefined,
  date: d.date || undefined,
  amount: d.amount ?? undefined,
  payment_method: d.paymentMethod ?? undefined,
  is_nature: d.isNature ?? undefined,
  nature_description: d.natureDescription ?? undefined,
  status: d.status ?? undefined,
  receipt_number: d.receiptNumber ?? undefined,
});

// === Combine user_id on editions rows at read time ===
// (auth.uid() est géré par RLS ; on ne l'expose pas côté serveur au client.)

// === CRUD Editions ===

export async function fetchEditions(): Promise<Edition[]> {
  const { data, error } = await supabase
    .from('editions')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return (data as EditionRow[]).map(rowToEdition);
}

export async function createEdition(edition: Omit<Edition, 'id'>, userId: string): Promise<Edition> {
  const { data, error } = await supabase
    .from('editions')
    .insert({ user_id: userId, ...editionToRow(edition) })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToEdition(data as EditionRow);
}

export async function updateEdition(id: string, edition: Partial<Edition>): Promise<Edition> {
  const { data, error } = await supabase
    .from('editions')
    .update(editionToRow(edition as Edition))
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToEdition(data as EditionRow);
}

export async function deleteEdition(id: string): Promise<void> {
  const { error } = await supabase.from('editions').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// === CRUD Donations ===

export async function fetchDonations(): Promise<Donation[]> {
  const { data, error } = await supabase
    .from('donations')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return (data as DonationRow[]).map(rowToDonation);
}

export async function createDonation(
  donation: Omit<Donation, 'id'>,
  userId: string,
  editionId: string | null
): Promise<Donation> {
  const { data, error } = await supabase
    .from('donations')
    .insert(donationToRow({ ...donation, id: '' }, userId, editionId))
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToDonation(data as DonationRow);
}

export async function updateDonation(id: string, donation: Partial<Donation>): Promise<Donation> {
  const { data, error } = await supabase
    .from('donations')
    .update(donationUpdateToRow(donation))
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToDonation(data as DonationRow);
}

export async function deleteDonation(id: string): Promise<void> {
  const { error } = await supabase.from('donations').delete().eq('id', id);
  if (error) throw new Error(error.message);
}