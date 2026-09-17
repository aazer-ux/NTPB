/**
 * Création d'un compte gestionnaire NTPB dans Supabase Auth (script serveur/CLI).
 *
 * Chaque gestionnaire = un utilisateur Supabase Auth :
 *   email   = {9 chiffres du téléphone}@ntpb.local   ← compte "synthétique"
 *   password = PIN à 4 chiffres saisi à la connexion
 *   user_metadata = { phone, name, role }
 *
 * ⚠️ NOTIFIEZ bien : ce script utilise la clé service_role (SECRET), qui
 * contourne RLS. Il doit être exécuté UNIQUEMENT depuis la ligne de commande
 * (jamais dans le bundle frontend — clé sans préfixe VITE_).
 *
 * Usage :
 *   npm run create:manager -- "690 12 34 56" "4821" "Mme Marthe Kamdem" "Gestionnaire"
 */
import 'dotenv/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) throw new Error('VITE_SUPABASE_URL manquant dans .env');
if (!serviceRoleKey) {
  throw new Error(
    'SUPABASE_SERVICE_ROLE_KEY manquant dans .env — ajoutez la clé "service_role" ' +
      '(à récupérer dans Supabase ≥ Dashboard → Settings → API). ' +
      'Ne PAS préfixer par VITE_ : par sécurité elle ne doit jamais être embarquée.'
  );
}

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
}) as SupabaseClient;

const [, , phoneArg, pinArg, nameArg = '', roleArg = 'Gestionnaire'] = process.argv;

if (!phoneArg || !pinArg) {
  console.error('Usage : npm run create:manager -- "690 12 34 56" "4821" "Nom" "Rôle"');
  process.exit(1);
}

if (typeof phoneArg !== 'string' || typeof pinArg !== 'string') {
  console.error('Arguments invalides.');
  process.exit(1);
}

const phone = (phoneArg.replace(/\D/g, '') || '').slice(-9);
if (phone.length !== 9) {
  console.error(`Numéro invalide (9 chiffres attendus) : "${phoneArg}"`);
  process.exit(1);
}
if (!/^\d{4}$/.test(pinArg)) {
  console.error(`PIN invalide (4 chiffres attendus) : "${pinArg}"`);
  process.exit(1);
}

const email = `${phone}@ntpb.local`;

async function main() {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: pinArg,
    email_confirm: true,
    user_metadata: {
      phone,
      name: nameArg || `Gestionnaire ${phone}`,
      role: roleArg,
    },
  });

  if (error) {
    if (error.message?.toLowerCase().includes('already registered')) {
      console.warn(`⚠ Le compte ${email} existe déjà — rien à faire.`);
      process.exit(0);
    }
    console.error('Erreur Supabase :', error.message);
    process.exit(1);
  }

  console.log(`✔ Gestionnaire créé :`);
  console.log(`   Téléphone : +237 ${phone}`);
  console.log(`   Email (synthétique) : ${email}`);
  console.log(`   PIN : ${pinArg} — Nom : ${nameArg || `Gestionnaire ${phone}`} — Rôle : ${roleArg}`);
  console.log('');
  console.log(`Rappel : connectez-vous dans l'application avec ce numéro + ce code PIN 4 chiffres.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
