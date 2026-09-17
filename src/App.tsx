import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { DesktopSidebar } from './components/DesktopSidebar';
import { HomeEditionView } from './components/HomeEditionView';
import { AllDonationsView } from './components/AllDonationsView';
import { NewDonationView } from './components/NewDonationView';
import { KpiStatsView } from './components/KpiStatsView';
import { OfficialReportView } from './components/OfficialReportView';
import { ManagerLoginView } from './components/ManagerLoginView';
import { CreateEditionModal } from './components/CreateEditionModal';
import { ImageManagerModal } from './components/ImageManagerModal';
import { EditDonationModal } from './components/EditDonationModal';
import { EditionsListView } from './components/EditionsListView';
import { EmptyConsultationView } from './components/EmptyConsultationView';
import {
  Donation,
  Edition,
  UserSession,
  NavigationTab,
  DonationStatus,
  SyncState,
} from './types';
import { formatFCFA } from './utils/format';
import { APP_IMAGES, INITIAL_USER } from './data/initialData';
// Connexion au backend Supabase (Auth + base de données + RLS). Chaque
// gestionnaire ne voit que ses propres lignes (user_id = auth.uid()).
import { supabase } from './supabaseClient';
import {
  fetchDonations,
  createDonation,
  updateDonation as apiUpdateDonation,
  deleteDonation as apiDeleteDonation,
  fetchEditions,
  createEdition,
  updateEdition as apiUpdateEdition,
} from './services/supabaseService';

type AuthUser = import('@supabase/supabase-js').User;

export default function App() {
  // Navigation State — libre avec ou sans compte. Les actions modifiant des
  // données déclenchent seules la demande de connexion.
  const [currentView, setCurrentView] = useState<NavigationTab>(() => {
    try {
      return localStorage.getItem('ntpb_current_edition_id') ? 'home' : 'editions';
    } catch {
      return 'editions';
    }
  });

  // Données (éditions / dons) : la source de vérité est Supabase. Elles sont
  // rechargées à chaque changement de session, jamais conservées localement.
  const [donations, setDonations] = useState<Donation[]>([]);
  const [editions, setEditions] = useState<Edition[]>([]);

  // Édition active — simple préférence du gestionnaire (persistée sur l'appareil).
  const [currentEditionId, setCurrentEditionId] = useState<string>(() => {
    try {
      return localStorage.getItem('ntpb_current_edition_id') || '';
    } catch {
      return '';
    }
  });

  // Liens d'images personnalisés (préférence d'affichage uniquement).
  const [images, setImages] = useState<typeof APP_IMAGES>(() => {
    try {
      const saved = localStorage.getItem('ntpb_images');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return { ...APP_IMAGES, ...parsed };
        }
      }
      return APP_IMAGES;
    } catch {
      return APP_IMAGES;
    }
  });

  // Session Supabase Auth (restaurée automatiquement au chargement).
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  // État de synchronisation réel : le badge « Sync Cloud » ne s'affiche que
  // lorsque les données sont bien confirmées côté serveur.
  const [syncState, setSyncState] = useState<SyncState>('idle');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImageManagerOpen, setIsImageManagerOpen] = useState(false);
  const [donationToEdit, setDonationToEdit] = useState<Donation | null>(null);

  // Message affiché sur l'écran de connexion lorsqu'un invité tente de modifier des données
  const [loginNotice, setLoginNotice] = useState('');

  // Session utilisateur dérivée du compte Supabase connecté.
  const user: UserSession = useMemo<UserSession>(() => {
    if (!authUser) return INITIAL_USER;
    const meta = (authUser.user_metadata || {}) as Record<string, unknown>;
    return {
      isLoggedIn: true,
      phone: typeof meta.phone === 'string' ? meta.phone : '',
      name:
        typeof meta.name === 'string' && meta.name
          ? meta.name
          : authUser.email || 'Gestionnaire NTPB',
      role: typeof meta.role === 'string' && meta.role ? meta.role : 'Gestionnaire',
      avatarUrl: APP_IMAGES.userAvatar,
    };
  }, [authUser]);

  // Persistance des préférences locales (uniquement celles qui sont locales).
  useEffect(() => {
    try {
      localStorage.setItem('ntpb_current_edition_id', currentEditionId);
    } catch (e) {
      console.warn('LocalStorage error', e);
    }
  }, [currentEditionId]);

  useEffect(() => {
    try {
      localStorage.setItem('ntpb_images', JSON.stringify(images));
    } catch (e) {
      console.warn('LocalStorage error', e);
    }
  }, [images]);

  // Restauration + écoute de la session Supabase Auth.
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setAuthUser(data.session?.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // Chargement des données depuis les tables Supabase à chaque session.
  // Hors session : liste vide (lecture consultative possible sans les lignes).
  useEffect(() => {
    if (!authUser) {
      setDonations([]);
      setEditions([]);
      setSyncState('idle');
      return;
    }

    let cancelled = false;
    setSyncState('syncing');
    Promise.all([fetchEditions(), fetchDonations()])
      .then(([editionsList, donationsList]) => {
        if (cancelled) return;
        setEditions(editionsList);
        setDonations(donationsList);
        setSyncState('synced');
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Échec de la synchronisation Supabase', err);
        setSyncState('error');
      });

    return () => {
      cancelled = true;
    };
  }, [authUser]);

  // Derived current edition
  const currentEdition =
    editions.find((e) => e.id === currentEditionId) ||
    editions.find((e) => e.status === 'En cours') ||
    editions.find((e) => e.status === 'Clôturée' || e.status === 'Planifiée') ||
    editions[0];

  // Gate d'authentification : toute action modifiant des données redirige vers la
  // connexion gestionnaire si l'utilisateur n'est pas connecté (mode consultation).
  const guard = (): boolean => {
    if (!user.isLoggedIn) {
      setLoginNotice('Connexion requise pour cette action. Identifiez-vous pour enregistrer ou modifier des données.');
      setDonationToEdit(null);
      setCurrentView('login');
      return false;
    }
    setLoginNotice('');
    return true;
  };

  const handleOpenCreateModal = () => {
    if (!guard()) return;
    setIsCreateModalOpen(true);
  };

  // Navigation libre entre les écrans de consultation. Seul l'accès à la saisie
  // d'un don ("Nouveau Don") exige la connexion : on y crée des données.
  const handleNavigate = (tab: NavigationTab) => {
    if (tab === 'new' && !user.isLoggedIn) {
      setLoginNotice('Connexion requise pour enregistrer un don. Identifiez-vous pour la saisie.');
      setCurrentView('login');
      return;
    }
    setCurrentView(tab);
  };

  const handleOpenEdition = (id: string) => {
    setCurrentEditionId(id);
    setCurrentView('home');
  };

  // Actions
  // Last assigned receipt sequence per session — incremented synchronously on
  // every creation so even a rapid double-click can never reuse a number.
  const receiptSeqRef = useRef<number | null>(null);

  // Met à jour le montant encaissé (achievedAmount) d'une édition côté serveur.
  const adjustAchievedAmount = async (editionId: string, delta: number): Promise<void> => {
    if (delta === 0) return;
    const target = editions.find((e) => e.id === editionId);
    const newValue = Math.max(0, (target?.achievedAmount || 0) + delta);
    const updated = await apiUpdateEdition(editionId, { achievedAmount: newValue });
    setEditions((prev) => prev.map((e) => (e.id === editionId ? updated : e)));
  };

  const handleAddDonation = async (
    newDonation: Omit<Donation, 'id' | 'receiptNumber'>
  ): Promise<boolean> => {
    if (!guard() || !authUser) return false;

    // Receipt number coherent with the official report format (BTA-{year}-XXX),
    // year taken from the active edition's end date (same source as the report).
    const endDateObj = currentEdition ? new Date(currentEdition.endDate) : null;
    const editionYear =
      endDateObj && !isNaN(endDateObj.getTime())
        ? endDateObj.getFullYear()
        : new Date().getFullYear();

    let maxSeq = 0;
    for (const d of donations) {
      const m = (d.receiptNumber || '').match(
        new RegExp(`^BTA-${editionYear}-(\\d+)$`)
      );
      if (m) maxSeq = Math.max(maxSeq, parseInt(m[1], 10));
    }
    if (receiptSeqRef.current === null || receiptSeqRef.current <= maxSeq) {
      receiptSeqRef.current = maxSeq + 1;
    }
    const seq = receiptSeqRef.current;
    receiptSeqRef.current += 1;
    const receiptNumber = `BTA-${editionYear}-${String(seq).padStart(3, '0')}`;

    try {
      setSyncState('syncing');
      const created = await createDonation(
        { ...newDonation, receiptNumber },
        authUser.id,
        currentEdition ? currentEdition.id : null
      );
      setDonations((prev) => [created, ...prev]);

      // Update active edition total if received
      if (newDonation.status === 'Reçu' && currentEdition && newDonation.amount > 0) {
        await adjustAchievedAmount(currentEdition.id, newDonation.amount);
      }
      setSyncState('synced');
      return true;
    } catch (err) {
      console.error('create donation failed', err);
      setSyncState('error');
      alert("Échec de l'enregistrement du don dans le Cloud. Vérifiez votre connexion puis réessayez.");
      return false;
    }
  };

  const handleCreateEdition = async (newEdition: Edition) => {
    if (!guard() || !authUser) return;
    const { id: _ignored, ...editionData } = newEdition;
    try {
      setSyncState('syncing');
      const created = await createEdition(editionData, authUser.id);
      setEditions((prev) => [created, ...prev]);
      setCurrentEditionId(created.id);
      setSyncState('synced');
      setCurrentView('home');
    } catch (err) {
      console.error('create edition failed', err);
      setSyncState('error');
      alert("Échec de la création de l'édition dans le Cloud. Vérifiez votre connexion puis réessayez.");
    }
  };

  const handleCloseEdition = async () => {
    if (!guard()) return;
    if (!currentEdition) return;
    try {
      setSyncState('syncing');
      const updated = await apiUpdateEdition(currentEdition.id, { status: 'Clôturée' });
      setEditions((prev) =>
        prev.map((ed) => (ed.id === currentEdition.id ? updated : ed))
      );
      setSyncState('synced');
      setCurrentView('close');
    } catch (err) {
      console.error('close edition failed', err);
      setSyncState('error');
      alert("Échec de la clôture de l'édition dans le Cloud. Réessayez.");
    }
  };

  const handleUpdateDonation = async (updatedDonation: Donation) => {
    if (!guard() || !authUser) return;
    const previous = donations.find((d) => d.id === updatedDonation.id);
    try {
      setSyncState('syncing');

      // Ajuste le montant encaissé de l'édition active si le statut ou le
      // montant de la contribution change (delta ancienne → nouvelle valeur).
      if (previous && currentEdition) {
        const previousValue = previous.status === 'Reçu' ? previous.amount : 0;
        const nextValue =
          updatedDonation.status === 'Reçu' ? updatedDonation.amount : 0;
        const delta = nextValue - previousValue;
        if (delta !== 0) {
          await adjustAchievedAmount(currentEdition.id, delta);
        }
      }

      const updated = await apiUpdateDonation(updatedDonation.id, updatedDonation);
      setDonations((prev) =>
        prev.map((d) => (d.id === updatedDonation.id ? updated : d))
      );
      setSyncState('synced');
    } catch (err) {
      console.error('update donation failed', err);
      setSyncState('error');
      alert("Échec de la modification du don dans le Cloud. Réessayez.");
    }
  };

  const handleToggleDonationStatus = (donation: Donation) => {
    const nextStatus: DonationStatus = donation.status === 'Reçu' ? 'Promesse' : 'Reçu';
    handleUpdateDonation({ ...donation, status: nextStatus });
  };

  const handleDeleteDonation = async (donationId: string) => {
    if (!guard() || !authUser) return;
    const toDelete = donations.find((d) => d.id === donationId);
    if (!toDelete) return;
    if (!window.confirm(`Supprimer le don de « ${toDelete.donorName} » (${formatFCFA(toDelete.amount)} FCFA) ?`)) {
      return;
    }
    try {
      setSyncState('syncing');
      if (toDelete.status === 'Reçu' && currentEdition && toDelete.amount > 0) {
        await adjustAchievedAmount(currentEdition.id, -toDelete.amount);
      }
      await apiDeleteDonation(donationId);
      setDonations((prev) => prev.filter((d) => d.id !== donationId));
      setSyncState('synced');
    } catch (err) {
      console.error('delete donation failed', err);
      setSyncState('error');
      alert("Échec de la suppression du don dans le Cloud. Réessayez.");
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('signOut failed', err);
    }
  };

  const handleUpdateImages = (newImages: typeof APP_IMAGES) => {
    setImages(newImages);
  };

  const handleResetImages = () => {
    setImages(APP_IMAGES);
  };

  // Header Title based on current tab
  const getHeaderTitle = () => {
    switch (currentView) {
      case 'home':
        return currentEdition ? currentEdition.name : 'Noël pour Tous à Batcha';
      case 'editions':
        return 'Liste des Éditions';
      case 'all-donations':
        return 'Tous les Dons';
      case 'new':
        return 'Nouveau Don';
      case 'kpi':
        return 'Statistiques & KPI';
      case 'close':
        return 'Clôture Officielle';
      case 'login':
        return 'Espace Gestionnaire';
      default:
        return 'Noël pour Tous à Batcha';
    }
  };

  const hasEdition = !!currentEdition;
  const shownView = currentView;

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#111c2d] flex flex-col font-sans selection:bg-[#ffdad6] selection:text-[#93000a]">
      {/* Desktop Sidebar (lg: >= 1024px) */}
      <DesktopSidebar
        currentView={shownView}
        onNavigate={handleNavigate}
        currentEdition={currentEdition}
        donationsCount={donations.length}
        user={user}
        onProfileClick={() => setCurrentView('login')}
        onOpenImageManager={() => setIsImageManagerOpen(true)}
        images={images}
      />

      {/* Top Application Bar */}
      <Header
        title={getHeaderTitle()}
        currentView={currentView}
        user={user}
        syncState={syncState}
        onProfileClick={() => setCurrentView('login')}
        onOpenLogin={() => setCurrentView('login')}
        onTitleClick={() => setCurrentView('editions')}
        onOpenImageManager={() => setIsImageManagerOpen(true)}
        images={images}
      />

      {/* Main Screen Views Container */}
      <main className="flex-1 w-full flex flex-col pt-16 lg:pl-64">
        {/* Connexion gestionnaire (obligatoire uniquement pour les actions de modification) */}
        {shownView === 'login' && (
          <ManagerLoginView
            user={user}
            notice={loginNotice}
            onLogout={handleLogout}
            onNavigate={(tab) => setCurrentView(tab as NavigationTab)}
            images={images}
          />
        )}

        {/* Liste des éditions — accessible librement */}
        {shownView === 'editions' && (
          <EditionsListView
            editions={editions}
            currentEditionId={currentEditionId}
            isLoggedIn={user.isLoggedIn}
            onOpenEdition={handleOpenEdition}
            onOpenCreateModal={handleOpenCreateModal}
          />
        )}

        {/* Vues liées à une édition : consultation libre si une édition existe,
            sinon aperçu vide à zéro (les actions de saisie restent gardées) */}
        {hasEdition && currentEdition ? (
          <>
        {shownView === 'home' && (
          <HomeEditionView
            currentEdition={currentEdition}
            donations={donations}
            onNavigate={(tab) => handleNavigate(tab as NavigationTab)}
            onOpenImageManager={() => setIsImageManagerOpen(true)}
            onToggleDonationStatus={handleToggleDonationStatus}
            onEditDonation={setDonationToEdit}
            onDeleteDonation={handleDeleteDonation}
            images={images}
          />
        )}

        {shownView === 'all-donations' && (
          <AllDonationsView
            currentEdition={currentEdition}
            donations={donations}
            onNavigate={handleNavigate}
            onToggleDonationStatus={handleToggleDonationStatus}
            onEditDonation={setDonationToEdit}
            onDeleteDonation={handleDeleteDonation}
          />
        )}

        {shownView === 'new' && (
          <NewDonationView
            isLoggedIn={user.isLoggedIn}
            onAddDonation={handleAddDonation}
            onLoginRequired={() => {
              setLoginNotice(
                'Connexion requise pour enregistrer un don. Identifiez-vous pour continuer la saisie.'
              );
              setCurrentView('login');
            }}
            onNavigate={(tab) => handleNavigate(tab as NavigationTab)}
          />
        )}

        {shownView === 'kpi' && (
          <KpiStatsView
            currentEdition={currentEdition}
            donations={donations}
          />
        )}

        {shownView === 'close' && (
          <OfficialReportView
            currentEdition={currentEdition}
            donations={donations}
            onNavigate={(tab) => handleNavigate(tab as NavigationTab)}
            onOpenCreateModal={handleOpenCreateModal}
            onCloseEdition={handleCloseEdition}
            images={images}
          />
        )}
          </>
        ) : (
          <EmptyConsultationView
            currentView={shownView}
            isLoggedIn={user.isLoggedIn}
            onGoToEditions={() => setCurrentView('editions')}
            onOpenCreateEdition={handleOpenCreateModal}
          />
        )}
      </main>

      {/* Bottom Sticky Navigation */}
      <BottomNav
        currentView={shownView}
        onNavigate={handleNavigate}
        onTabChange={handleNavigate}
      />

      {/* Modal: Créer une nouvelle édition */}
      <CreateEditionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateEdition={handleCreateEdition}
      />

      {/* Modal: Gestionnaire de Liens Images Dynamiques */}
      <ImageManagerModal
        isOpen={isImageManagerOpen}
        onClose={() => setIsImageManagerOpen(false)}
        images={images}
        onUpdateImages={handleUpdateImages}
        onResetImages={handleResetImages}
      />

      {/* Modal: Modifier un don */}
      <EditDonationModal
        donation={donationToEdit}
        isOpen={donationToEdit !== null}
        onClose={() => setDonationToEdit(null)}
        onSave={handleUpdateDonation}
      />
    </div>
  );
}