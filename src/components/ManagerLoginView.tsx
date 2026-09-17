import React, { useState } from 'react';
import { UserSession } from '../types';
import { APP_IMAGES } from '../data/initialData';
import { UserAvatar } from './UserAvatar';
import { supabase } from '../supabaseClient';

type AuthMode = 'login' | 'register';

interface ManagerLoginViewProps {
  user: UserSession;
  notice?: string;
  onLogout: () => void;
  onNavigate: (view: string) => void;
  images?: typeof APP_IMAGES;
}

// Traduit les messages d'erreur renvoyés par Supabase Auth en messages clairs.
function translateAuthError(message: string): string {
  const m = (message || '').toLowerCase();
  if (m.includes('invalid login credentials')) {
    return 'Email ou mot de passe incorrect.';
  }
  if (m.includes('email not confirmed')) {
    return "Compte non confirmé : vérifiez votre boîte mail pour activer l'accès.";
  }
  if (m.includes('already registered')) {
    return 'Un compte existe déjà avec cet email.';
  }
  if (m.includes('at least 6 characters')) {
    return 'Le mot de passe doit contenir au moins 6 caractères.';
  }
  if (
    m.includes('network') ||
    m.includes('failed to fetch') ||
    m.includes('econnrefused') ||
    m.includes('timeout')
  ) {
    return 'Connexion impossible au service Cloud. Vérifiez votre réseau puis réessayez.';
  }
  return message || 'Une erreur est survenue. Veuillez réessayer.';
}

export const ManagerLoginView: React.FC<ManagerLoginViewProps> = ({
  user,
  notice,
  onLogout,
  onNavigate,
  images = APP_IMAGES,
}) => {
  const [mode, setMode] = useState<AuthMode>('login');

  // Champs partagés Connexion / Inscription
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Champs Inscription uniquement
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Drawer « Mot de passe oublié »
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [isSendingRecovery, setIsSendingRecovery] = useState(false);
  const [recoverySent, setRecoverySent] = useState('');
  const [recoveryError, setRecoveryError] = useState('');

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const cleanEmail = email.trim();

    if (mode === 'login') {
      if (!cleanEmail) {
        setError('Renseignez votre adresse e-mail.');
        return;
      }
      if (!password) {
        setError('Renseignez votre mot de passe.');
        return;
      }
      setIsLoading(true);
      try {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (authError) {
          setError(translateAuthError(authError.message));
          setIsLoading(false);
          return;
        }
        onNavigate('editions');
      } catch {
        setError('Connexion impossible au service Cloud. Vérifiez votre réseau.');
        setIsLoading(false);
      }
      return;
    }

    // Inscription (mode === 'register')
    if (!cleanEmail) {
      setError('Renseignez votre adresse e-mail.');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    setIsLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            name: name.trim() || null,
            phone: phone.replace(/\D/g, '').slice(-9) || null,
            role: 'Gestionnaire',
          },
        },
      });
      if (authError) {
        setError(translateAuthError(authError.message));
        setIsLoading(false);
        return;
      }
      if (data.session) {
        onNavigate('editions');
        return;
      }
      setSuccess(
        "Compte créé ! Un e-mail de confirmation vient d'être envoyé. Ouvrez-le pour activer votre accès gestionnaire."
      );
      setPassword('');
      setConfirmPassword('');
      setIsLoading(false);
    } catch {
      setError('Connexion impossible au service Cloud. Vérifiez votre réseau.');
      setIsLoading(false);
    }
  };

  const handleSendRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');
    setRecoverySent('');
    const cleanEmail = recoveryEmail.trim();
    if (!cleanEmail) {
      setRecoveryError('Renseignez votre adresse e-mail.');
      return;
    }
    setIsSendingRecovery(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: window.location.origin,
      });
      if (resetError) {
        setRecoveryError(translateAuthError(resetError.message));
        setIsSendingRecovery(false);
        return;
      }
      setRecoverySent(
        `Un e-mail de réinitialisation a été envoyé à « ${cleanEmail} ». Cliquez sur le lien reçu pour définir un nouveau mot de passe.`
      );
      setIsSendingRecovery(false);
    } catch {
      setRecoveryError('Connexion impossible au service Cloud. Vérifiez votre réseau.');
      setIsSendingRecovery(false);
    }
  };

  const isRegister = mode === 'register';

  return (
    <div className="flex flex-col w-full max-w-xl mx-auto px-4 space-y-4 pb-28 pt-2">
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center mt-2 mb-2">
        <div className="relative p-1 rounded-full bg-white shadow-md mb-2 flex items-center justify-center">
          <img
            alt="Logo NTPB"
            className="w-24 h-24 object-contain rounded-full"
            src={images?.logoNTPB || APP_IMAGES.logoNTPB}
          />
          <div className="absolute -bottom-1 -right-1 bg-[#1b6d24] text-white rounded-full p-1 shadow-xs flex items-center justify-center">
            <span className="material-symbols-outlined text-[16px] fill">verified_user</span>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#dee8ff] text-[#111c2d] text-[11px] font-bold mb-2 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-[#1b6d24] animate-pulse" />
          <span>Accès réservé • Batcha, Cameroun</span>
        </div>

        <h1 className="text-[24px] text-[#111c2d] font-extrabold tracking-tight">
          Espace Gestionnaire NTPB
        </h1>
        <p className="text-[13px] text-[#5b403d] mt-0.5">
          Plateforme d'administration exclusive de la campagne festive
        </p>
      </div>

      {/* Cloud Sync Reassurance Banner */}
      <div className="w-full bg-[#f0f3ff] rounded-2xl p-3.5 border border-[#d8e3fb] shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-[#dee8ff] text-[#1b6d24] flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[20px] fill">cloud_done</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[14px] font-bold text-[#111c2d] leading-tight">
              Sauvegarde Cloud 100% Sécurisée
            </span>
            <p className="text-[12px] text-[#5b403d] mt-0.5 leading-relaxed">
              Vos éditions et vos dons restent intacts et synchronisés, même en cas de changement
              de smartphone.
            </p>
          </div>
        </div>
      </div>

      {/* Notice de connexion requise (redirection depuis une action de modification) */}
      {notice && (
        <div className="w-full bg-[#ffdfa0]/40 rounded-2xl p-3 border border-[#715300]/30 flex items-start gap-2.5">
          <span className="material-symbols-outlined text-[#715300] text-[20px] flex-shrink-0">
            lock
          </span>
          <p className="text-[12px] text-[#261a00] font-semibold leading-snug">{notice}</p>
        </div>
      )}

      {/* Main Auth Card */}
      <div className="w-full bg-white rounded-2xl p-5 shadow-sm border border-[#e7eeff]">
        {user.isLoggedIn ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#f0f3ff] border border-[#d8e3fb]">
              <UserAvatar user={user} size="lg" className="ring-2 ring-[#af101a]/30" />
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-bold text-[#1b6d24] uppercase">
                  Session Active
                </span>
                <h3 className="text-[15px] font-bold text-[#111c2d] truncate">{user.name}</h3>
                <p className="text-[12px] text-[#5b403d] truncate">{user.role}</p>
                {user.phone && (
                  <p className="text-[11px] text-[#5b403d] font-mono mt-0.5">+237 {user.phone}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onNavigate('editions')}
                className="h-12 rounded-full bg-[#af101a] text-white font-bold text-[13px] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs hover:bg-[#d32f2f]"
              >
                <span className="material-symbols-outlined text-[18px]">dashboard</span>
                <span>Aller au tableau</span>
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="h-12 rounded-full bg-[#f0f3ff] text-[#ba1a1a] hover:bg-[#ffdad6] font-bold text-[13px] flex items-center justify-center gap-1.5 cursor-pointer border border-[#e4beba]"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                <span>Se déconnecter</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Mode Connexion / Inscription */}
            <div className="grid grid-cols-2 gap-1 bg-[#f0f3ff] p-1 rounded-xl">
              {(['login', 'register'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  className={`h-10 rounded-lg flex items-center justify-center gap-1.5 text-[12px] font-bold transition-all cursor-pointer ${
                    mode === m
                      ? 'bg-white text-[#af101a] shadow-xs'
                      : 'text-[#5b403d] hover:text-[#111c2d]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {m === 'login' ? 'login' : 'person_add'}
                  </span>
                  {m === 'login' ? 'Connexion' : 'Créer un compte'}
                </button>
              ))}
            </div>

            {success && (
              <div className="p-3 rounded-xl bg-[#a3f69c]/50 text-[#002204] text-[12px] font-semibold leading-snug flex items-start gap-2">
                <span className="material-symbols-outlined text-[18px]">mark_email_read</span>
                <span>{success}</span>
              </div>
            )}

            {isRegister && (
              <>
                {/* Nom complet (optionnel) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-[#111c2d]">
                    Nom complet du gestionnaire <span className="text-[11px] text-[#5b403d] font-normal">(Optionnel)</span>
                  </label>
                  <div className="relative flex items-center bg-[#f0f3ff] rounded-xl overflow-hidden border border-[#d8e3fb] focus-within:ring-2 focus-within:ring-[#af101a]">
                    <span className="material-symbols-outlined pl-3.5 text-[#8f6f6c] text-[19px]">badge</span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="ex : M. Jean-Pierre Talla"
                      className="w-full bg-transparent px-3 py-3 text-[#111c2d] text-[14px] font-bold outline-none"
                    />
                  </div>
                </div>

                {/* Téléphone (optionnel) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-[#111c2d]">
                    Numéro de téléphone <span className="text-[11px] text-[#5b403d] font-normal">(Optionnel)</span>
                  </label>
                  <div className="relative flex items-center bg-[#f0f3ff] rounded-xl overflow-hidden border border-[#d8e3fb] focus-within:ring-2 focus-within:ring-[#af101a]">
                    <div className="flex items-center gap-1 pl-3 pr-2 py-3 bg-[#dee8ff] select-none text-[13px] font-bold text-[#111c2d]">
                      <span>🇨🇲</span>
                      <span>+237</span>
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="690 12 34 56"
                      className="w-full bg-transparent px-3 py-3 text-[#111c2d] text-[14px] font-bold outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-bold text-[#111c2d] flex items-center justify-between">
                <span>Adresse e-mail</span>
                <span className="text-[#1b6d24] text-[11px] font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">lock</span>
                  Compte sécurisé
                </span>
              </label>
              <div className="relative flex items-center bg-[#f0f3ff] rounded-xl overflow-hidden border border-[#d8e3fb] focus-within:ring-2 focus-within:ring-[#af101a]">
                <span className="material-symbols-outlined pl-3.5 text-[#8f6f6c] text-[19px]">mail</span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="gestionnaire@ntpb.org"
                  className="w-full bg-transparent px-3 py-3 text-[#111c2d] text-[14px] font-bold outline-none"
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-bold text-[#111c2d]">
                  Mot de passe {isRegister && <span className="text-[11px] text-[#5b403d] font-normal">(6 caractères min.)</span>}
                </label>
                {!isRegister && (
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(true)}
                    className="text-[11px] text-[#af101a] font-semibold hover:underline cursor-pointer"
                  >
                    Mot de passe oublié ?
                  </button>
                )}
              </div>

              <div className="relative flex items-center bg-[#f0f3ff] rounded-xl border border-[#d8e3fb] focus-within:ring-2 focus-within:ring-[#af101a]">
                <span className="material-symbols-outlined pl-3.5 text-[#8f6f6c] text-[19px]">lock</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={isRegister ? 6 : undefined}
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full bg-transparent px-3 py-3 text-[#111c2d] text-[14px] tracking-[0.3em] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="pr-3.5 pl-2 text-[#8f6f6c] hover:text-[#111c2d] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Confirmation (inscription) */}
            {isRegister && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-[#111c2d]">
                  Confirmer le mot de passe
                </label>
                <div className="relative flex items-center bg-[#f0f3ff] rounded-xl border border-[#d8e3fb] focus-within:ring-2 focus-within:ring-[#af101a]">
                  <span className="material-symbols-outlined pl-3.5 text-[#8f6f6c] text-[19px]">lock</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••"
                    className="w-full bg-transparent px-3 py-3 text-[#111c2d] text-[14px] tracking-[0.3em] outline-none"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-[#ffdad6] text-[#93000a] text-[12px] font-semibold leading-snug flex items-start gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-1 h-[52px] rounded-full bg-[#af101a] hover:bg-[#d32f2f] text-white font-bold text-[15px] flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-75"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                  <span>{isRegister ? 'Création du compte...' : 'Vérification Cloud en cours...'}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px] fill">lock_open</span>
                  <span>{isRegister ? 'Créer le compte gestionnaire' : 'Se connecter à l\'espace NTPB'}</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Security & Trust Indicators */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#dee8ff]/50 text-[#111c2d] border border-[#d8e3fb]">
          <span className="material-symbols-outlined text-[#1b6d24] text-[18px] fill">shield</span>
          <span className="text-[11px] font-semibold leading-snug">Chiffrement AES Cloud</span>
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#dee8ff]/50 text-[#111c2d] border border-[#d8e3fb]">
          <span className="material-symbols-outlined text-[#715300] text-[18px] fill">
            lock_person
          </span>
          <span className="text-[11px] font-semibold leading-snug">Rôle Restreint NTPB</span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-4 mb-2 flex flex-col items-center gap-0.5">
        <p className="text-[11px] text-[#5b403d]">Version 2.4 Cloud Sync • Association Loi 1990</p>
        <p className="text-[11px] text-[#5b403d]/80">
          Batcha, Haut-Nkam, Région de l'Ouest Cameroun
        </p>
      </div>

      {/* Recovery Drawer — Mot de passe oublié */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs transition-opacity duration-300"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex-1 w-full" onClick={() => setIsDrawerOpen(false)} />
          <div className="w-full max-w-xl mx-auto bg-white rounded-t-3xl p-5 flex flex-col gap-3 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="w-12 h-1.5 rounded-full bg-[#dee8ff] mx-auto mb-1" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#ffdad6] flex items-center justify-center text-[#af101a]">
                  <span className="material-symbols-outlined text-[19px]">manage_accounts</span>
                </div>
                <h2 className="text-[17px] font-bold text-[#111c2d]">
                  Mot de passe oublié
                </h2>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-[#f0f3ff] flex items-center justify-center text-[#5b403d] hover:bg-[#dee8ff] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <p className="text-[12px] text-[#5b403d] leading-relaxed">
              Renseignez l'adresse e-mail de votre compte gestionnaire. Un lien de réinitialisation
              sécurisé vous sera envoyé automatiquement par e-mail.
            </p>

            <form onSubmit={handleSendRecovery} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold text-[#111c2d]">
                  Adresse e-mail du compte
                </label>
                <div className="relative flex items-center bg-[#f0f3ff] rounded-xl overflow-hidden border border-[#d8e3fb] focus-within:ring-2 focus-within:ring-[#af101a]">
                  <span className="material-symbols-outlined pl-3 text-[#8f6f6c] text-[18px]">mail</span>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder="gestionnaire@ntpb.org"
                    className="w-full bg-transparent px-3 py-2.5 text-[14px] text-[#111c2d] outline-none"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#dee8ff]/50 flex items-start gap-2 border border-[#d8e3fb]">
                <span className="material-symbols-outlined text-[#af101a] text-[18px] flex-shrink-0 mt-0.5">
                  info
                </span>
                <p className="text-[11px] text-[#5b403d] leading-tight">
                  Si cette adresse correspond à un compte actif, un e-mail de réinitialisation
                  arrive en quelques minutes (pensez aux courriers indésirables).
                </p>
              </div>

              {recoveryError && (
                <div className="p-3 rounded-xl bg-[#ffdad6] text-[#93000a] text-[12px] font-semibold leading-snug flex items-start gap-2">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  <span>{recoveryError}</span>
                </div>
              )}

              {recoverySent && (
                <div className="p-3 rounded-xl bg-[#a3f69c] text-[#002204] text-[12px] font-semibold leading-snug">
                  {recoverySent}
                </div>
              )}

              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isSendingRecovery}
                  className="w-full h-12 rounded-full bg-[#af101a] hover:bg-[#d32f2f] text-white font-bold text-[14px] flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isSendingRecovery ? 'sync' : 'mail_outline'}
                  </span>
                  <span>
                    {isSendingRecovery ? 'Envoi du lien...' : 'Envoyer le lien de réinitialisation'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-full py-2 text-center text-[#5b403d] text-[12px] font-semibold hover:underline cursor-pointer"
                >
                  Annuler et revenir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};