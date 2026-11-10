import React, { useState, useEffect } from 'react';
import {
  User,
  Bell,
  Cloud,
  Users,
  FolderTree,
  Tag,
  Database,
  Info,
  ChevronRight,
  Shield,
  CheckCircle2,
  Wifi,
  WifiOff,
  RefreshCw,
  Plus,
  Trash2,
  Edit2,
  Lock,
  X,
  Smartphone,
  Eye,
  EyeOff,
  AlertTriangle,
  KeyRound,
  Sparkles,
  Search,
  ShieldCheck,
  CreditCard,
  ChevronDown,
  Layers,
  Sliders,
  ArrowLeft,
} from 'lucide-react';
import { useAuth, hashPassword } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { UserProfile, UserRole, CategoryItem, PaymentMethodItem, DepositTypeItem, ActiveTab } from '../../types';
import { SUPPORTED_CURRENCIES } from '../../lib/constants';
import { CategoryIcon, searchLucideIcons, ICON_REGISTRY, SearchedIconItem } from '../common/CategoryIcon';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { ConfirmModal } from '../common/ConfirmModal';

export const SettingsView: React.FC = () => {
  const {
    userProfile,
    isAdmin,
    createMemberAccount,
    updateCurrentUserProfile,
  } = useAuth();
  const {
    familySettings,
    updateFamilySettings,
    members,
    toggleMemberActive,
    updateMemberRole,
    updateMember,
    deleteMember,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    paymentMethods,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    depositTypes,
    addDepositType,
    updateDepositType,
    deleteDepositType,
    activityLogs,
    syncStatus,
    pendingCount,
    manualSync,
    wipeAllData,
    showToast,
  } = useData();

  // Notification toggle state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Active Modals
  const [activeModal, setActiveModal] = useState<
    'profile' | 'members' | 'appSettingsHub' | 'categories' | 'paymentMethods' | 'depositTypes' | 'general' | 'logs' | 'sync' | 'about' | 'applock' | null
  >(null);

  // Deposit Types Admin State
  const [newDtName, setNewDtName] = useState('');
  const [editingDt, setEditingDt] = useState<DepositTypeItem | null>(null);
  const [editDtName, setEditDtName] = useState('');
  const [deletingDtId, setDeletingDtId] = useState<string | null>(null);
  const [dtFeedbackMsg, setDtFeedbackMsg] = useState<string | null>(null);

  // About & Version Control State
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [aboutVersionInput, setAboutVersionInput] = useState(familySettings.appVersion || '1.0.0');
  const [aboutDescInput, setAboutDescInput] = useState(
    familySettings.aboutDescription ||
      'Designed exclusively for family members to record daily expenses, track deposits and contributions, and preserve family financial wellness with offline synchronisation.'
  );
  const [aboutNotesInput, setAboutNotesInput] = useState(
    familySettings.releaseNotes ||
      'Initial release featuring multi-member ledger, offline PWA capability, instant analytics, deposit tracking, customizable payment methods and deposit types.'
  );

  // Payment Methods Admin State
  const [newPmName, setNewPmName] = useState('');
  const [editingPm, setEditingPm] = useState<PaymentMethodItem | null>(null);
  const [editPmName, setEditPmName] = useState('');
  const [deletingPmId, setDeletingPmId] = useState<string | null>(null);
  const [pmFeedbackMsg, setPmFeedbackMsg] = useState<string | null>(null);

  // Member Management Form State
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberUsername, setNewMemberUsername] = useState('');
  const [newMemberPassword, setNewMemberPassword] = useState('');
  const [showNewMemberPassword, setShowNewMemberPassword] = useState(false);
  const [newMemberRole, setNewMemberRole] = useState<UserRole>('user');
  const [memberActionMsg, setMemberActionMsg] = useState<string | null>(null);

  // Member Edit & Delete State
  const [editingMember, setEditingMember] = useState<UserProfile | null>(null);
  const [editMemberName, setEditMemberName] = useState('');
  const [editMemberRole, setEditMemberRole] = useState<UserRole>('user');
  const [editMemberPassword, setEditMemberPassword] = useState('');
  const [showEditMemberPassword, setShowEditMemberPassword] = useState(false);
  const [showEditMemberRoleDropdown, setShowEditMemberRoleDropdown] = useState(false);
  const [deletingMember, setDeletingMember] = useState<UserProfile | null>(null);

  // Category Management Form State
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#6366F1');
  const [newCatIcon, setNewCatIcon] = useState('Tag');
  const [iconSearchQuery, setIconSearchQuery] = useState('');
  const [fetchedIcons, setFetchedIcons] = useState<SearchedIconItem[]>(() => searchLucideIcons(''));
  const [deletingCatId, setDeletingCatId] = useState<string | null>(null);

  // Category Edit State
  const [editingCat, setEditingCat] = useState<CategoryItem | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatColor, setEditCatColor] = useState('#6366F1');
  const [editCatIcon, setEditCatIcon] = useState('Tag');
  const [editIconSearchQuery, setEditIconSearchQuery] = useState('');
  const [editFetchedIcons, setEditFetchedIcons] = useState<SearchedIconItem[]>(() => searchLucideIcons(''));

  // General Settings Form State
  const [familyNameInput, setFamilyNameInput] = useState(familySettings.familyName);
  const [currencyInput, setCurrencyInput] = useState(familySettings.currency);

  // Profile Edit & Security State (with Existing Password & Preferences)
  const [editDisplayName, setEditDisplayName] = useState(userProfile?.displayName || '');
  const [editDefaultPaymentMethod, setEditDefaultPaymentMethod] = useState<string>(
    userProfile?.defaultPaymentMethod || 'Cash'
  );
  const [editDefaultModule, setEditDefaultModule] = useState<ActiveTab>(
    userProfile?.defaultModule || 'dashboard'
  );
  const [showPaymentMethodDropdown, setShowPaymentMethodDropdown] = useState(false);
  const [showModuleDropdown, setShowModuleDropdown] = useState(false);
  const [showMemberRoleDropdown, setShowMemberRoleDropdown] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [profileSavedMsg, setProfileSavedMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  // App Security PIN State - scoped per userProfile.id
  const [appLockEnabled, setAppLockEnabled] = useState<boolean>(() => {
    return userProfile?.id
      ? localStorage.getItem(`family_app_lock_enabled_${userProfile.id}`) === 'true'
      : false;
  });
  const [pinInput, setPinInput] = useState('');
  const [pinConfirmInput, setPinConfirmInput] = useState('');
  const [appLockFeedback, setAppLockFeedback] = useState<string | null>(null);

  // Synchronize App Lock state if user changes
  useEffect(() => {
    if (userProfile?.id) {
      setAppLockEnabled(
        localStorage.getItem(`family_app_lock_enabled_${userProfile.id}`) === 'true'
      );
    }
  }, [userProfile?.id]);

  // Wipe Data State (Admin only)
  const [showWipeModal, setShowWipeModal] = useState(false);
  const [wipeConfirmInput, setWipeConfirmInput] = useState('');
  const [isWiping, setIsWiping] = useState(false);
  const [wipeStatusMsg, setWipeStatusMsg] = useState<string | null>(null);

  // Save General Settings
  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateFamilySettings({
      familyName: familyNameInput.trim() || 'Our Family',
      currency: currencyInput,
    });
    setActiveModal(null);
  };

  // Add Member
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemberActionMsg(null);
    if (!newMemberName.trim() || !newMemberUsername.trim()) {
      setMemberActionMsg('Please enter name and username');
      return;
    }
    const res = await createMemberAccount(
      newMemberName.trim(),
      newMemberUsername.trim(),
      newMemberPassword.trim() || 'family123',
      newMemberRole
    );
    if (res.success) {
      setNewMemberName('');
      setNewMemberUsername('');
      setNewMemberPassword('');
      setMemberActionMsg(`Member "${newMemberUsername.trim().toLowerCase()}" added successfully!`);
      setTimeout(() => setMemberActionMsg(null), 4000);
    } else {
      setMemberActionMsg(res.error || 'Failed to add member');
    }
  };

  // Start Editing Member
  const handleStartEditMember = (m: UserProfile) => {
    setMemberActionMsg(null);
    setEditingMember(m);
    setEditMemberName(m.displayName);
    setEditMemberRole(m.role);
    setEditMemberPassword('');
    setShowEditMemberPassword(false);
    setShowEditMemberRoleDropdown(false);
  };

  // Save Edited Member
  const handleSaveEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !editMemberName.trim()) return;

    if (editingMember.role === 'admin' && editMemberRole === 'user') {
      const activeAdmins = members.filter(
        (m) => m.role === 'admin' && m.isActive && m.id !== editingMember.id
      );
      if (activeAdmins.length === 0) {
        setMemberActionMsg('Cannot demote the only active admin. At least one active admin is required.');
        return;
      }
    }

    if (editMemberPassword.trim() && editMemberPassword.trim().length < 4) {
      setMemberActionMsg('Password must be at least 4 characters long.');
      return;
    }

    const success = await updateMember(editingMember.id, {
      displayName: editMemberName.trim(),
      role: editMemberRole,
      password: editMemberPassword.trim() || undefined,
    });

    if (success) {
      setMemberActionMsg(`Member "${editMemberName.trim()}" updated successfully!`);
      setEditingMember(null);
      setTimeout(() => setMemberActionMsg(null), 3500);
    }
  };

  // Request Delete Member (Validating extra admin rule)
  const handleRequestDeleteMember = (targetMember: UserProfile) => {
    setMemberActionMsg(null);

    // 1. Prevent deleting currently logged-in account
    if (targetMember.id === userProfile?.id || targetMember.username === userProfile?.username) {
      setMemberActionMsg('You cannot delete your own logged-in admin account.');
      return;
    }

    // 2. If target is an admin, check if extra active admins exist
    if (targetMember.role === 'admin') {
      const activeAdmins = members.filter(
        (m) => m.role === 'admin' && m.isActive
      );
      if (activeAdmins.length <= 1) {
        setMemberActionMsg('Cannot delete the only active admin. At least one active admin is required.');
        return;
      }
    }

    setDeletingMember(targetMember);
  };

  // Confirm Delete Member
  const handleConfirmDeleteMember = async () => {
    if (!deletingMember) return;
    const targetName = deletingMember.displayName;
    const success = await deleteMember(deletingMember.id);
    if (success) {
      setMemberActionMsg(`Member "${targetName}" deleted successfully.`);
      setTimeout(() => setMemberActionMsg(null), 3500);
    }
    setDeletingMember(null);
  };

  // Search Lucide Icons for Add form (Pulls from all 1400+ Lucide icons)
  const handleSearchIcons = (q: string) => {
    setIconSearchQuery(q);
    const results = searchLucideIcons(q);
    setFetchedIcons(results);
    if (q.trim() && results.length > 0) {
      const cleanQ = q.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const exact = results.find(
        (r) =>
          r.name.toLowerCase() === cleanQ ||
          r.label.toLowerCase().startsWith(q.trim().toLowerCase())
      );
      if (exact) {
        setNewCatIcon(exact.name);
      }
    }
  };

  // Search Lucide Icons for Edit form (Pulls from all 1400+ Lucide icons)
  const handleEditSearchIcons = (q: string) => {
    setEditIconSearchQuery(q);
    const results = searchLucideIcons(q);
    setEditFetchedIcons(results);
    if (q.trim() && results.length > 0) {
      const cleanQ = q.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const exact = results.find(
        (r) =>
          r.name.toLowerCase() === cleanQ ||
          r.label.toLowerCase().startsWith(q.trim().toLowerCase())
      );
      if (exact) {
        setEditCatIcon(exact.name);
      }
    }
  };

  // Add Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    await addCategory({
      name: newCatName.trim(),
      color: newCatColor,
      icon: newCatIcon,
    });
    setNewCatName('');
  };

  // Start Editing Category
  const handleStartEditCat = (cat: CategoryItem) => {
    setEditingCat(cat);
    setEditCatName(cat.name);
    setEditCatColor(cat.color);
    setEditCatIcon(cat.icon || 'Tag');
    setEditIconSearchQuery('');
    setEditFetchedIcons(searchLucideIcons(''));
  };

  // Save Edited Category
  const handleSaveEditCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat || !editCatName.trim()) return;
    await updateCategory(editingCat.id, {
      name: editCatName.trim(),
      color: editCatColor,
      icon: editCatIcon,
    });
    setEditingCat(null);
  };

  // Save Profile & Password with Existing Password verification
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErrorMsg(null);
    setProfileSavedMsg(null);

    if (!editDisplayName.trim()) {
      setProfileErrorMsg('Display name cannot be empty');
      return;
    }

    // If changing password, verify existing password first!
    if (newPasswordInput) {
      if (!currentPasswordInput) {
        setProfileErrorMsg('Please enter your existing password to authorize password change');
        return;
      }
      if (userProfile?.password && currentPasswordInput !== userProfile.password) {
        setProfileErrorMsg('Existing password does not match. Please check your credentials.');
        return;
      }
      if (newPasswordInput.length < 4) {
        setProfileErrorMsg('New password must be at least 4 characters');
        return;
      }
      if (newPasswordInput !== confirmPasswordInput) {
        setProfileErrorMsg('New passwords do not match');
        return;
      }
    }

    const res = await updateCurrentUserProfile(
      editDisplayName.trim(),
      undefined,
      newPasswordInput.trim() ? newPasswordInput.trim() : undefined,
      {
        defaultPaymentMethod: editDefaultPaymentMethod,
        defaultModule: editDefaultModule,
      }
    );

    if (res.success) {
      setProfileSavedMsg('Profile and preferences updated successfully!');
      setCurrentPasswordInput('');
      setNewPasswordInput('');
      setConfirmPasswordInput('');
      setTimeout(() => {
        setProfileSavedMsg(null);
        setActiveModal(null);
      }, 1500);
    } else {
      setProfileErrorMsg(res.error || 'Failed to update profile');
    }
  };

  // Payment Methods Admin Handlers
  const handleAddPaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPmName.trim()) return;
    const success = await addPaymentMethod({ name: newPmName.trim() });
    if (success) {
      setNewPmName('');
      setPmFeedbackMsg(`Payment method "${newPmName.trim()}" added successfully!`);
      setTimeout(() => setPmFeedbackMsg(null), 3000);
    }
  };

  const handleSaveEditPm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPm || !editPmName.trim()) return;
    const success = await updatePaymentMethod(editingPm.id, { name: editPmName.trim() });
    if (success) {
      setEditingPm(null);
      setEditPmName('');
      setPmFeedbackMsg('Payment method updated successfully!');
      setTimeout(() => setPmFeedbackMsg(null), 3000);
    }
  };

  // Deposit Types Admin Handlers
  const handleAddDepositType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDtName.trim()) return;
    const name = newDtName.trim();
    if (depositTypes.some((d) => d.name.toLowerCase() === name.toLowerCase())) {
      setDtFeedbackMsg(`Deposit type "${name}" already exists!`);
      setTimeout(() => setDtFeedbackMsg(null), 3000);
      return;
    }
    const success = await addDepositType({ name, isDefault: false });
    if (success) {
      setNewDtName('');
      setDtFeedbackMsg(`Added "${name}" successfully!`);
      setTimeout(() => setDtFeedbackMsg(null), 3000);
    }
  };

  const handleSaveEditDepositType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDt || !editDtName.trim()) return;
    const name = editDtName.trim();
    const success = await updateDepositType(editingDt.id, { name });
    if (success) {
      setEditingDt(null);
      setEditDtName('');
      setDtFeedbackMsg('Deposit type updated successfully!');
      setTimeout(() => setDtFeedbackMsg(null), 3000);
    }
  };

  const handleConfirmDeleteDepositType = async () => {
    if (!deletingDtId) return;
    if (depositTypes.length <= 1) {
      setDtFeedbackMsg('At least one deposit type is required.');
      setDeletingDtId(null);
      setTimeout(() => setDtFeedbackMsg(null), 3000);
      return;
    }
    await deleteDepositType(deletingDtId);
    setDeletingDtId(null);
  };

  // Save About & Version Control
  const handleSaveAbout = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateFamilySettings({
      appVersion: aboutVersionInput.trim() || '1.0.0',
      aboutDescription: aboutDescInput.trim(),
      releaseNotes: aboutNotesInput.trim(),
    });
    setIsEditingAbout(false);
  };

  // Save App Lock PIN & Settings - scoped to userProfile.id
  const handleSaveAppLock = async (e: React.FormEvent) => {
    e.preventDefault();
    setAppLockFeedback(null);
    if (!userProfile?.id) return;

    const lockKey = `family_app_lock_enabled_${userProfile.id}`;
    const pinKey = `family_app_lock_pin_${userProfile.id}`;

    if (appLockEnabled) {
      // Must provide and confirm 4-digit PIN
      if (pinInput.length !== 4 || !/^\d{4}$/.test(pinInput)) {
        setAppLockFeedback('Security PIN must be exactly 4 digits');
        return;
      }
      if (pinInput !== pinConfirmInput) {
        setAppLockFeedback('PIN confirmation does not match');
        return;
      }
      localStorage.setItem(lockKey, 'true');
      const hashedPin = await hashPassword(pinInput);
      localStorage.setItem(pinKey, hashedPin);

      // Clean up any legacy biometric keys
      try {
        localStorage.removeItem(`family_app_lock_biometric_${userProfile.id}`);
        localStorage.removeItem(`family_app_lock_cred_id_${userProfile.id}`);
        localStorage.removeItem('family_app_lock_enabled');
        localStorage.removeItem('family_app_lock_pin');
        localStorage.removeItem('family_app_lock_biometric');
      } catch {
        // ignore
      }

      setAppLockFeedback('App Security PIN activated successfully!');
      setTimeout(() => {
        setAppLockFeedback(null);
        setActiveModal(null);
        setPinInput('');
        setPinConfirmInput('');
      }, 1500);
    } else {
      // Disabled for this user
      localStorage.setItem(lockKey, 'false');
      localStorage.removeItem(pinKey);

      try {
        localStorage.removeItem(`family_app_lock_biometric_${userProfile.id}`);
        localStorage.removeItem(`family_app_lock_cred_id_${userProfile.id}`);
        localStorage.removeItem('family_app_lock_enabled');
        localStorage.removeItem('family_app_lock_pin');
        localStorage.removeItem('family_app_lock_biometric');
      } catch {
        // ignore
      }

      setAppLockFeedback('App PIN disabled for your account.');
      setTimeout(() => {
        setAppLockFeedback(null);
        setActiveModal(null);
      }, 1200);
    }
  };

  // Execute Wipe All Data (Admin Only)
  const handleWipeData = async () => {
    if (wipeConfirmInput.trim().toUpperCase() !== 'WIPE') return;
    setIsWiping(true);
    setWipeStatusMsg(null);
    const success = await wipeAllData();
    setIsWiping(false);
    if (success) {
      setWipeStatusMsg('Ledger wiped clean! All expenses and deposits removed.');
      setTimeout(() => {
        setShowWipeModal(false);
        setWipeConfirmInput('');
        setWipeStatusMsg(null);
      }, 2000);
    } else {
      setWipeStatusMsg('Failed to wipe data. Please verify your connection.');
    }
  };

  return (
    <div className="space-y-5 pb-24 md:pb-12 max-w-xl mx-auto px-4 md:px-6 pt-2">
      {/* 1. Member Identity Card */}
      <div className="bg-white rounded-3xl p-4 md:p-5 shadow-xs border border-slate-100 flex items-center justify-between gap-3.5">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-extrabold text-xl flex items-center justify-center shadow-md shadow-indigo-600/20 shrink-0">
            {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'A'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                {userProfile?.displayName || 'Family Member'}
              </h2>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  isAdmin ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {isAdmin ? 'Admin' : 'Member'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">@{userProfile?.username || 'member'}</p>
          </div>
        </div>
      </div>

      {/* 2. My Settings Group (Matches Screen 3!) */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          My Settings
        </h3>

        <div className="divide-y divide-slate-100">
          {/* My Profile */}
          <button
            onClick={() => setActiveModal('profile')}
            className="w-full py-3 flex items-center justify-between text-left hover:bg-slate-50/50 rounded-xl px-1 transition cursor-pointer"
          >
            <div className="flex items-center gap-3 text-slate-700">
              <User className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-xs md:text-sm font-semibold block">My Profile & Security</span>
                <span className="text-[11px] text-slate-400">Edit name & change password</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          {/* App Lock & Security PIN */}
          <button
            onClick={() => {
              const currentEnabled = userProfile?.id
                ? localStorage.getItem(`family_app_lock_enabled_${userProfile.id}`) === 'true'
                : false;
              setAppLockEnabled(currentEnabled);
              setPinInput('');
              setPinConfirmInput('');
              setAppLockFeedback(null);
              setActiveModal('applock');
            }}
            className="w-full py-3 flex items-center justify-between text-left hover:bg-slate-50/50 rounded-xl px-1 transition cursor-pointer"
          >
            <div className="flex items-center gap-3 text-slate-700">
              <Lock className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-xs md:text-sm font-semibold block">App Lock (4-Digit PIN)</span>
                <span className="text-[11px] text-slate-400">
                  {userProfile?.id &&
                  localStorage.getItem(`family_app_lock_enabled_${userProfile.id}`) === 'true'
                    ? 'Active (4-Digit PIN Enabled)'
                    : 'Disabled (Tap to setup)'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {userProfile?.id &&
              localStorage.getItem(`family_app_lock_enabled_${userProfile.id}`) === 'true' ? (
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Active
                </span>
              ) : (
                <span className="text-[10px] bg-slate-100 text-slate-500 font-medium px-2 py-0.5 rounded-full">
                  Disabled
                </span>
              )}
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </button>

          {/* Notifications Toggle */}
          <div className="py-3 flex items-center justify-between px-1">
            <div className="flex items-center gap-3 text-slate-700">
              <Bell className="w-4 h-4 text-slate-400" />
              <span className="text-xs md:text-sm font-semibold">Notifications</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Sync & Offline */}
          <button
            onClick={() => setActiveModal('sync')}
            className="w-full py-3 flex items-center justify-between text-left hover:bg-slate-50/50 rounded-xl px-1 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Cloud className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-xs md:text-sm font-semibold text-slate-700 block">
                  Sync & Offline
                </span>
                <span className="text-[11px] text-slate-400">
                  Save offline and sync when online
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {syncStatus === 'synced' && (
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Synced
                </span>
              )}
              {syncStatus === 'syncing' && (
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Syncing
                </span>
              )}
              {syncStatus === 'offline' && (
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <WifiOff className="w-3.5 h-3.5" />
                  Offline
                </span>
              )}
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </button>
        </div>
      </div>

      {/* 3. Admin Settings Group (Admin only!) */}
      {isAdmin && (
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100 space-y-4 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Admin Settings
            </h3>
          </div>

          <div className="divide-y divide-slate-100">
            {/* Manage Members */}
            <button
              onClick={() => setActiveModal('members')}
              className="w-full py-3 flex items-center justify-between text-left hover:bg-slate-50/50 rounded-xl px-1 transition cursor-pointer"
            >
              <div className="flex items-center gap-3 text-slate-700">
                <Users className="w-4 h-4 text-slate-400" />
                <span className="text-xs md:text-sm font-semibold">Manage Members</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            {/* App Settings Hub */}
            <button
              onClick={() => setActiveModal('appSettingsHub')}
              className="w-full py-3 flex items-center justify-between text-left hover:bg-slate-50/50 rounded-xl px-1 transition cursor-pointer"
            >
              <div className="flex items-center gap-3 text-slate-700">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <div>
                  <span className="text-xs md:text-sm font-semibold block text-slate-900">
                    App Settings
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Categories, payment methods, deposit types, currency & family name
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                  Hub
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </button>

            {/* Backup, Sync & Activity Logs */}
            <button
              onClick={() => setActiveModal('logs')}
              className="w-full py-3 flex items-center justify-between text-left hover:bg-slate-50/50 rounded-xl px-1 transition cursor-pointer"
            >
              <div className="flex items-center gap-3 text-slate-700">
                <Database className="w-4 h-4 text-slate-400" />
                <span className="text-xs md:text-sm font-semibold">Activity Logs & Audit</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            {/* Wipe Out All Data (Danger Zone) */}
            <button
              onClick={() => {
                setWipeConfirmInput('');
                setWipeStatusMsg(null);
                setShowWipeModal(true);
              }}
              className="w-full py-3 flex items-center justify-between text-left hover:bg-rose-50/60 rounded-xl px-1 transition cursor-pointer"
            >
              <div className="flex items-center gap-3 text-rose-600">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <div>
                  <span className="text-xs md:text-sm font-semibold block text-rose-700">
                    Wipe Out Ledger Data
                  </span>
                  <span className="text-[11px] text-rose-400">
                    Permanently delete all expenses and deposits
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-rose-400" />
            </button>
          </div>
        </div>
      )}

      {/* 4. App Section (Visible to ALL users: standard & admin) */}
      <div className="bg-white rounded-2xl p-3 sm:p-3.5 shadow-xs border border-slate-100">
        <button
          onClick={() => {
            setIsEditingAbout(false);
            setActiveModal('about');
          }}
          className="w-full flex items-center justify-between text-left hover:bg-slate-50/70 rounded-xl p-1.5 transition cursor-pointer"
        >
          <div className="flex items-center gap-3 text-slate-700 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center shadow-xs p-1.5 shrink-0">
              <svg
                className="w-full h-full drop-shadow-2xs"
                viewBox="0 0 200 200"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M 100,25 L 170,85 L 170,165 Q 170,175 160,175 L 40,175 Q 30,175 30,165 L 30,85 Z"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M 100,62 C 92,50 78,56 78,70 C 78,85 95,98 100,105 C 105,98 122,85 122,70 C 122,56 108,50 100,62 Z"
                  fill="#F472B6"
                />
                <circle cx="65" cy="115" r="14" fill="#FFFFFF" />
                <circle cx="135" cy="115" r="14" fill="#FFFFFF" />
                <circle cx="100" cy="125" r="12" fill="#FFFFFF" />
              </svg>
            </div>
            <div className="min-w-0">
              <span className="text-xs md:text-sm font-semibold block text-slate-800">About App</span>
              <span className="text-[11px] text-slate-400 truncate block">
                Version {familySettings.appVersion || '1.0.0'} • Tap to view details
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
        </button>
      </div>

      {/* ================= MODALS ================= */}

      {/* MODAL 1: Profile & Security Hub */}
      {activeModal === 'profile' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setActiveModal(null);
                setProfileErrorMsg(null);
                setProfileSavedMsg(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-1">
              <KeyRound className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">My Profile & Security</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Manage your profile details, password, and contribution overview.
            </p>

            {profileSavedMsg && (
              <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{profileSavedMsg}</span>
              </div>
            )}

            {profileErrorMsg && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{profileErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Account Credentials (Read-only) */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Username</label>
                  <div className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700">
                    @{userProfile?.username || 'member'}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Role</label>
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2 text-xs font-bold text-indigo-700 capitalize">
                    {userProfile?.role || 'user'}
                  </div>
                </div>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800"
                  placeholder="Enter full name"
                  required
                />
              </div>

              {/* Default Preferences */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800">My App Preferences</span>
                </div>

                {/* Default Payment Method */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Default Payment Method
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPaymentMethodDropdown(!showPaymentMethodDropdown);
                        setShowModuleDropdown(false);
                      }}
                      className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 flex items-center justify-between cursor-pointer focus:outline-none transition shadow-2xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{editDefaultPaymentMethod}</span>
                      </div>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${
                          showPaymentMethodDropdown ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {showPaymentMethodDropdown && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 max-h-48 overflow-y-auto animate-in fade-in zoom-in-95">
                        {(paymentMethods.length > 0 ? paymentMethods.map((pm) => pm.name) : ['Cash']).map((pmName) => (
                          <button
                            key={pmName}
                            type="button"
                            onClick={() => {
                              setEditDefaultPaymentMethod(pmName);
                              setShowPaymentMethodDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs font-semibold transition flex items-center justify-between cursor-pointer ${
                              editDefaultPaymentMethod === pmName
                                ? 'bg-indigo-50 text-indigo-700 font-bold'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span>{pmName}</span>
                            {editDefaultPaymentMethod === pmName && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Pre-selected when creating new expenses or deposits (Default: Cash)
                  </span>
                </div>

                {/* Default Module on Login */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Default Module When Logged In
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModuleDropdown(!showModuleDropdown);
                        setShowPaymentMethodDropdown(false);
                      }}
                      className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 flex items-center justify-between cursor-pointer focus:outline-none transition shadow-2xs"
                    >
                      <span className="truncate capitalize">
                        {editDefaultModule === 'reports' ? 'Reports / Analytics' : editDefaultModule}
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${
                          showModuleDropdown ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {showModuleDropdown && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 max-h-48 overflow-y-auto animate-in fade-in zoom-in-95">
                        {[
                          { val: 'dashboard', label: 'Dashboard' },
                          { val: 'expenses', label: 'Expenses' },
                          { val: 'deposits', label: 'Deposits' },
                          { val: 'reports', label: 'Reports / Analytics' },
                          { val: 'settings', label: 'Settings' },
                        ].map((mod) => (
                          <button
                            key={mod.val}
                            type="button"
                            onClick={() => {
                              setEditDefaultModule(mod.val as ActiveTab);
                              setShowModuleDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs font-semibold transition flex items-center justify-between cursor-pointer ${
                              editDefaultModule === mod.val
                                ? 'bg-indigo-50 text-indigo-700 font-bold'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span>{mod.label}</span>
                            {editDefaultModule === mod.val && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Automatically opens this tab when you log into the app
                  </span>
                </div>
              </div>

              {/* Change Password Section */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Change Password</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">Leave blank to keep current</span>
                </div>

                {/* Existing Password Field */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Existing Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPasswordInput}
                      onChange={(e) => setCurrentPasswordInput(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password Field */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      placeholder="New password (min. 4 characters)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password Field */}
                {newPasswordInput && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={confirmPasswordInput}
                      onChange={(e) => setConfirmPasswordInput(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveModal(null);
                    setProfileErrorMsg(null);
                    setProfileSavedMsg(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-xs hover:bg-indigo-700 cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Manage Members (Admin Only) */}
      {isAdmin && activeModal === 'members' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <Users className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">Family Members Management</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Only admins can create, activate, or deactivate family members.
            </p>

            {memberActionMsg && (
              <div className="mb-4 p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-medium">
                {memberActionMsg}
              </div>
            )}

            {/* Form: Edit Member OR Add New Member */}
            {editingMember ? (
              <form
                onSubmit={handleSaveEditMember}
                className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-200 mb-5 space-y-3 animate-in fade-in"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                    <Edit2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Edit Member: {editingMember.displayName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingMember(null)}
                    className="text-[11px] font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <div className="text-[11px] text-slate-500">
                  Username: <strong className="text-slate-800">@{editingMember.username || editingMember.id.replace('user_', '')}</strong>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={editMemberName}
                    onChange={(e) => setEditMemberName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                    required
                  />
                </div>

                {/* Optional reset password */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-600">
                      Reset Password (Optional)
                    </label>
                    <span className="text-[10px] text-slate-400">Leave blank to keep existing</span>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type={showEditMemberPassword ? 'text' : 'password'}
                      value={editMemberPassword}
                      onChange={(e) => setEditMemberPassword(e.target.value)}
                      placeholder="Enter new password (min. 4 chars)"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 pr-8 text-xs font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditMemberPassword(!showEditMemberPassword)}
                      className="absolute right-2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                      tabIndex={-1}
                    >
                      {showEditMemberPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Role Selector & Submit */}
                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowEditMemberRoleDropdown(!showEditMemberRoleDropdown)}
                      className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 cursor-pointer shadow-2xs transition"
                    >
                      <span>{editMemberRole === 'admin' ? 'Admin Role' : 'User Role'}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                          showEditMemberRoleDropdown ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {showEditMemberRoleDropdown && (
                      <div className="absolute left-0 top-full mt-1.5 w-36 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50 animate-in fade-in zoom-in-95">
                        <button
                          type="button"
                          onClick={() => {
                            setEditMemberRole('user');
                            setShowEditMemberRoleDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center justify-between cursor-pointer ${
                            editMemberRole === 'user'
                              ? 'bg-indigo-50 text-indigo-700 font-bold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span>User Role</span>
                          {editMemberRole === 'user' && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditMemberRole('admin');
                            setShowEditMemberRoleDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center justify-between cursor-pointer ${
                            editMemberRole === 'admin'
                              ? 'bg-indigo-50 text-indigo-700 font-bold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span>Admin Role</span>
                          {editMemberRole === 'admin' && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingMember(null)}
                      className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition cursor-pointer"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              /* Add New Member Form with Eye Icon on Password */
              <form
                onSubmit={handleAddMember}
                className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 mb-5 space-y-3"
              >
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Add Family Member
                </h4>

                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="Full Name (e.g. Sarah Smith)"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                  required
                />

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newMemberUsername}
                    onChange={(e) => setNewMemberUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    placeholder="Username (e.g. sarah)"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                    required
                  />
                  <div className="relative flex items-center">
                    <input
                      type={showNewMemberPassword ? 'text' : 'password'}
                      value={newMemberPassword}
                      onChange={(e) => setNewMemberPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 pr-8 text-xs font-medium"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewMemberPassword(!showNewMemberPassword)}
                      className="absolute right-2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                      tabIndex={-1}
                      title={showNewMemberPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewMemberPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowMemberRoleDropdown(!showMemberRoleDropdown)}
                      className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 cursor-pointer shadow-2xs transition"
                    >
                      <span>{newMemberRole === 'admin' ? 'Admin Role' : 'User Role'}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                          showMemberRoleDropdown ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {showMemberRoleDropdown && (
                      <div className="absolute left-0 top-full mt-1.5 w-36 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50 animate-in fade-in zoom-in-95">
                        <button
                          type="button"
                          onClick={() => {
                            setNewMemberRole('user');
                            setShowMemberRoleDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center justify-between cursor-pointer ${
                            newMemberRole === 'user'
                              ? 'bg-indigo-50 text-indigo-700 font-bold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span>User Role</span>
                          {newMemberRole === 'user' && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNewMemberRole('admin');
                            setShowMemberRoleDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center justify-between cursor-pointer ${
                            newMemberRole === 'admin'
                              ? 'bg-indigo-50 text-indigo-700 font-bold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span>Admin Role</span>
                          {newMemberRole === 'admin' && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition cursor-pointer"
                  >
                    + Add Member
                  </button>
                </div>
              </form>
            )}

            {/* Existing Members List with Edit & Delete */}
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Existing Members ({members.length})
            </h4>

            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
              {members.map((m) => (
                <div key={m.id} className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50/50 px-1 rounded-xl transition">
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-900 truncate">{m.displayName}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                          m.role === 'admin'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {m.role}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium block truncate">
                      @{m.username || m.id.replace('user_', '')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Toggle Active status */}
                    <button
                      type="button"
                      onClick={() => toggleMemberActive(m.id, m.isActive)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition ${
                        m.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-rose-50 hover:text-rose-700'
                          : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-emerald-50 hover:text-emerald-700'
                      }`}
                    >
                      {m.isActive ? 'Active' : 'Deactivated'}
                    </button>

                    {/* Edit Member */}
                    <button
                      type="button"
                      onClick={() => handleStartEditMember(m)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer transition"
                      title="Edit Member"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Member (Validating extra admin rule) */}
                    <button
                      type="button"
                      onClick={() => handleRequestDeleteMember(m)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition"
                      title="Delete Member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: App Settings Hub (Admin Only) */}
      {isAdmin && activeModal === 'appSettingsHub' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 sm:p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-tight">App Settings Hub</h3>
                <p className="text-xs text-slate-400">Manage categories, payment options, deposits, currency & version</p>
              </div>
            </div>

            <div className="mt-4 divide-y divide-slate-100 overflow-y-auto pr-1">
              {/* Categories */}
              <button
                onClick={() => setActiveModal('categories')}
                className="w-full py-3 flex items-center justify-between text-left hover:bg-slate-50/80 rounded-xl px-2 transition cursor-pointer"
              >
                <div className="flex items-center gap-3 text-slate-700">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <FolderTree className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs md:text-sm font-semibold block text-slate-800">Categories</span>
                    <span className="text-[11px] text-slate-400">
                      Edit names & custom icons ({categories.length} configured)
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Payment Methods */}
              <button
                onClick={() => {
                  setEditingPm(null);
                  setNewPmName('');
                  setPmFeedbackMsg(null);
                  setActiveModal('paymentMethods');
                }}
                className="w-full py-3 flex items-center justify-between text-left hover:bg-slate-50/80 rounded-xl px-2 transition cursor-pointer"
              >
                <div className="flex items-center gap-3 text-slate-700">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs md:text-sm font-semibold block text-slate-800">Payment Methods</span>
                    <span className="text-[11px] text-slate-400">
                      Add, edit & delete options ({paymentMethods.length} options)
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Deposit Types */}
              <button
                onClick={() => {
                  setEditingDt(null);
                  setNewDtName('');
                  setDtFeedbackMsg(null);
                  setActiveModal('depositTypes');
                }}
                className="w-full py-3 flex items-center justify-between text-left hover:bg-slate-50/80 rounded-xl px-2 transition cursor-pointer"
              >
                <div className="flex items-center gap-3 text-slate-700">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs md:text-sm font-semibold block text-slate-800">Deposit Types</span>
                    <span className="text-[11px] text-slate-400">
                      Add, edit & delete deposit types ({depositTypes.length} types)
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Currency & Family Name */}
              <button
                onClick={() => setActiveModal('general')}
                className="w-full py-3 flex items-center justify-between text-left hover:bg-slate-50/80 rounded-xl px-2 transition cursor-pointer"
              >
                <div className="flex items-center gap-3 text-slate-700">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs md:text-sm font-semibold block text-slate-800">
                      Currency & Family Name
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {familySettings.familyName} • {familySettings.currency}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* About & Version Control */}
              <button
                onClick={() => {
                  setIsEditingAbout(true);
                  setAboutVersionInput(familySettings.appVersion || '1.0.0');
                  setAboutDescInput(
                    familySettings.aboutDescription ||
                      'Designed exclusively for family members to record daily expenses, track deposits and contributions, and preserve family financial wellness with offline synchronisation.'
                  );
                  setAboutNotesInput(
                    familySettings.releaseNotes ||
                      'Initial release featuring multi-member ledger, offline PWA capability, instant analytics, deposit tracking, customizable payment methods and deposit types.'
                  );
                  setActiveModal('about');
                }}
                className="w-full py-3 flex items-center justify-between text-left hover:bg-slate-50/80 rounded-xl px-2 transition cursor-pointer"
              >
                <div className="flex items-center gap-3 text-slate-700">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <Info className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs md:text-sm font-semibold block text-slate-800">
                      About & Version Control
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Version {familySettings.appVersion || '1.0.0'} • Edit details & release notes
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Manage Categories (Admin Only) */}
      {isAdmin && activeModal === 'categories' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-4 sm:p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => {
                setActiveModal(null);
                setEditingCat(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <button
                type="button"
                onClick={() => {
                  setActiveModal('appSettingsHub');
                  setEditingCat(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer -ml-1"
                title="Back to App Settings"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <FolderTree className="w-5 h-5 text-indigo-600 shrink-0" />
              <h3 className="text-base font-bold text-slate-900">Expense Categories</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Add or edit categories using Lucide icons. Search by name (e.g., &quot;brush&quot;, &quot;cleaning&quot;, &quot;food&quot;) and fetch matches.
            </p>

            {/* Editing Existing Category Form (Inline) */}
            {editingCat ? (
              <form onSubmit={handleSaveEditCat} className="bg-indigo-50/70 p-3 sm:p-4 rounded-2xl border border-indigo-200 mb-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                    <Edit2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Edit Category: {editingCat.name}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingCat(null)}
                    className="text-slate-500 hover:text-slate-700 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    value={editCatName}
                    onChange={(e) => setEditCatName(e.target.value)}
                    placeholder="Category Name"
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                    required
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 font-medium sm:hidden">Color:</span>
                    <input
                      type="color"
                      value={editCatColor}
                      onChange={(e) => setEditCatColor(e.target.value)}
                      className="w-10 h-9 p-0.5 rounded-xl border border-slate-200 cursor-pointer shrink-0"
                      title="Category Color"
                    />
                  </div>
                </div>

                {/* Lucide Icon Search & Fetch for Edit */}
                <div>
                  <label className="text-[11px] text-slate-700 font-bold block mb-1">
                    Search & Fetch Lucide Icon:
                  </label>
                  <div className="flex gap-2 mb-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={editIconSearchQuery}
                        onChange={(e) => handleEditSearchIcons(e.target.value)}
                        placeholder="Type any name from lucide.dev (e.g. spray-can, anvil, cookie)..."
                        className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleEditSearchIcons(editIconSearchQuery)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-2 rounded-xl shrink-0 cursor-pointer transition shadow-xs"
                    >
                      Fetch Icons
                    </button>
                  </div>

                  {/* Selected Icon Preview */}
                  <div className="flex items-center gap-2 mb-2 p-2 bg-white rounded-xl border border-indigo-100">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-2xs"
                      style={{ backgroundColor: `${editCatColor}20`, color: editCatColor }}
                    >
                      <CategoryIcon name={editCatIcon} className="w-4 h-4" color={editCatColor} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 block">Selected Icon:</span>
                      <span className="text-xs font-bold text-slate-800 truncate block">{editCatIcon}</span>
                    </div>
                  </div>

                  {/* Fetched Lucide Icons Grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-40 overflow-y-auto p-1.5 bg-white rounded-xl border border-slate-200">
                    {editFetchedIcons.length > 0 ? (
                      editFetchedIcons.map((item) => (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => setEditCatIcon(item.name)}
                          className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-left cursor-pointer transition ${
                            editCatIcon === item.name
                              ? 'bg-indigo-50 border-indigo-600 text-indigo-700 font-bold shadow-2xs'
                              : 'border-slate-100 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <span
                            className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${editCatColor}20`, color: editCatColor }}
                          >
                            <CategoryIcon name={item.name} className="w-3.5 h-3.5" color={editCatColor} />
                          </span>
                          <span className="text-[11px] truncate">{item.label}</span>
                        </button>
                      ))
                    ) : (
                      <div className="col-span-3 sm:col-span-4 text-center py-4 text-xs text-slate-400">
                        No icons matched &quot;{editIconSearchQuery}&quot;. Try typing &quot;clean&quot;, &quot;food&quot;, &quot;card&quot;, etc.
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditingCat(null)}
                    className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-xs hover:bg-indigo-700 cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              /* Add Category Form with Lucide Icon Search & Fetch */
              <form onSubmit={handleAddCategory} className="flex flex-col gap-3 mb-5 bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Add New Category
                </span>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => {
                      setNewCatName(e.target.value);
                      if (!iconSearchQuery) {
                        handleSearchIcons(e.target.value);
                      }
                    }}
                    placeholder="Category Name (e.g. Cleaning, Gym, Groceries)"
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                    required
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 font-medium sm:hidden">Color:</span>
                    <input
                      type="color"
                      value={newCatColor}
                      onChange={(e) => setNewCatColor(e.target.value)}
                      className="w-10 h-9 p-0.5 rounded-xl border border-slate-200 cursor-pointer shrink-0"
                      title="Category Color"
                    />
                  </div>
                </div>

                {/* Lucide Icon Search & Fetch UI */}
                <div>
                  <label className="text-[11px] text-slate-700 font-bold block mb-1">
                    Search & Fetch Lucide Icon:
                  </label>
                  <div className="flex gap-2 mb-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={iconSearchQuery}
                        onChange={(e) => handleSearchIcons(e.target.value)}
                        placeholder="Type any name from lucide.dev (e.g. spray-can, anvil, cookie)..."
                        className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSearchIcons(iconSearchQuery)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-2 rounded-xl shrink-0 cursor-pointer transition shadow-xs"
                    >
                      Fetch Icons
                    </button>
                  </div>

                  {/* Selected Icon Live Preview */}
                  <div className="flex items-center gap-2 mb-2 p-2 bg-white rounded-xl border border-slate-200">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-2xs"
                      style={{ backgroundColor: `${newCatColor}20`, color: newCatColor }}
                    >
                      <CategoryIcon name={newCatIcon} className="w-4 h-4" color={newCatColor} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 block">Selected Icon:</span>
                      <span className="text-xs font-bold text-slate-800 truncate block">{newCatIcon}</span>
                    </div>
                  </div>

                  {/* Fetched Lucide Icons Responsive Grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-40 overflow-y-auto p-1.5 bg-white rounded-xl border border-slate-200">
                    {fetchedIcons.length > 0 ? (
                      fetchedIcons.map((item) => (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => setNewCatIcon(item.name)}
                          className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-left cursor-pointer transition ${
                            newCatIcon === item.name
                              ? 'bg-indigo-50 border-indigo-600 text-indigo-700 font-bold shadow-2xs'
                              : 'border-slate-100 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <span
                            className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${newCatColor}20`, color: newCatColor }}
                          >
                            <CategoryIcon name={item.name} className="w-3.5 h-3.5" color={newCatColor} />
                          </span>
                          <span className="text-[11px] truncate">{item.label}</span>
                        </button>
                      ))
                    ) : (
                      <div className="col-span-3 sm:col-span-4 text-center py-4 text-xs text-slate-400">
                        No icons matched &quot;{iconSearchQuery}&quot;. Try typing &quot;clean&quot;, &quot;food&quot;, &quot;bill&quot;, etc.
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-xs cursor-pointer mt-1 transition"
                >
                  + Add Category
                </button>
              </form>
            )}

            {/* Categories List with Edit and Delete options */}
            <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto pr-1">
              {categories.map((cat) => (
                <div key={cat.id} className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50/50 px-1 rounded-xl transition">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center shadow-2xs font-bold"
                      style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                    >
                      <CategoryIcon name={cat.icon || 'Tag'} className="w-4 h-4" color={cat.color} />
                    </span>
                    <div className="min-w-0">
                      <span className="font-bold text-slate-800 block truncate">{cat.name}</span>
                      <span className="text-[10px] text-slate-400">
                        {cat.isDefault ? 'Default' : 'Custom'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Edit button */}
                    <button
                      onClick={() => handleStartEditCat(cat)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer transition"
                      title="Edit Category"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete button (available for all categories) */}
                    <button
                      onClick={() => setDeletingCatId(cat.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Payment Methods (Admin Only) */}
      {isAdmin && activeModal === 'paymentMethods' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => {
                setActiveModal(null);
                setEditingPm(null);
                setPmFeedbackMsg(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-1">
              <button
                type="button"
                onClick={() => {
                  setActiveModal('appSettingsHub');
                  setEditingPm(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer -ml-1"
                title="Back to App Settings"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-tight">Payment Methods</h3>
                <p className="text-xs text-slate-400">Manage available payment options across the family</p>
              </div>
            </div>

            {pmFeedbackMsg && (
              <div className="my-2.5 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold text-center animate-in fade-in">
                {pmFeedbackMsg}
              </div>
            )}

            {/* Form: Add or Edit Payment Method */}
            {editingPm ? (
              <form onSubmit={handleSaveEditPm} className="mt-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Edit Payment Method</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPm(null);
                      setEditPmName('');
                    }}
                    className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Method Name</label>
                  <input
                    type="text"
                    value={editPmName}
                    onChange={(e) => setEditPmName(e.target.value)}
                    placeholder="e.g. Credit Card, UPI, Amazon Pay"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    required
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPm(null);
                      setEditPmName('');
                    }}
                    className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer transition"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAddPaymentMethod} className="mt-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Add New Payment Method</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPmName}
                      onChange={(e) => setNewPmName(e.target.value)}
                      placeholder="e.g. PayPal, Apple Pay, Cheque"
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                      required
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition shrink-0"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* List of existing payment methods */}
            <div className="mt-3.5 flex-1 overflow-y-auto pr-1 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Configured Methods ({paymentMethods.length})
              </span>
              {paymentMethods.map((pm) => (
                <div
                  key={pm.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800">{pm.name}</span>
                      {pm.name.toLowerCase() === 'cash' && (
                        <span className="ml-2 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold">
                          System Default
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPm(pm);
                        setEditPmName(pm.name);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer transition"
                      title="Edit Payment Method"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingPmId(pm.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition"
                      title="Delete Payment Method"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Deposit Types (Admin Only) */}
      {isAdmin && activeModal === 'depositTypes' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => {
                setActiveModal(null);
                setEditingDt(null);
                setDtFeedbackMsg(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-1">
              <button
                type="button"
                onClick={() => {
                  setActiveModal('appSettingsHub');
                  setEditingDt(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer -ml-1"
                title="Back to App Settings"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-tight">Deposit Types</h3>
                <p className="text-xs text-slate-400">Manage available deposit categories and income sources</p>
              </div>
            </div>

            {dtFeedbackMsg && (
              <div className="my-2.5 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold text-center animate-in fade-in">
                {dtFeedbackMsg}
              </div>
            )}

            {/* Form: Add or Edit Deposit Type */}
            {editingDt ? (
              <form onSubmit={handleSaveEditDepositType} className="mt-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Edit Deposit Type</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingDt(null);
                      setEditDtName('');
                    }}
                    className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Deposit Type Name</label>
                  <input
                    type="text"
                    value={editDtName}
                    onChange={(e) => setEditDtName(e.target.value)}
                    placeholder="e.g. Salary, Rental, Dividend, Gift"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    required
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingDt(null);
                      setEditDtName('');
                    }}
                    className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer transition"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAddDepositType} className="mt-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Add New Deposit Type</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newDtName}
                      onChange={(e) => setNewDtName(e.target.value)}
                      placeholder="e.g. Freelance, Royalty, Refund"
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                      required
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition shrink-0"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* List of existing deposit types */}
            <div className="mt-3.5 flex-1 overflow-y-auto pr-1 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Configured Types ({depositTypes.length})
              </span>
              {depositTypes.map((dt) => (
                <div
                  key={dt.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800">{dt.name}</span>
                      {(dt.isDefault || dt.name.toLowerCase() === 'contribution') && (
                        <span className="ml-2 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold">
                          Default
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingDt(dt);
                        setEditDtName(dt.name);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer transition"
                      title="Edit Deposit Type"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingDtId(dt.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition"
                      title="Delete Deposit Type"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: General Settings (Admin Only) */}
      {isAdmin && activeModal === 'general' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl relative">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <button
                type="button"
                onClick={() => setActiveModal('appSettingsHub')}
                className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer -ml-1"
                title="Back to App Settings"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h3 className="text-base font-bold text-slate-900">Currency & Family Name</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">Update family branding and currency</p>

            <form onSubmit={handleSaveGeneral} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Family Group Name</label>
                <input
                  type="text"
                  value={familyNameInput}
                  onChange={(e) => setFamilyNameInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Currency</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                    className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 flex items-center justify-between cursor-pointer focus:outline-none transition shadow-2xs"
                  >
                    <span className="truncate">
                      {SUPPORTED_CURRENCIES.find((c) => c.symbol === currencyInput)?.label || currencyInput}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${
                        showCurrencyDropdown ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {showCurrencyDropdown && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 max-h-52 overflow-y-auto animate-in fade-in zoom-in-95">
                      {SUPPORTED_CURRENCIES.map((cur) => (
                        <button
                          key={cur.code}
                          type="button"
                          onClick={() => {
                            setCurrencyInput(cur.symbol);
                            setShowCurrencyDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs font-semibold transition flex items-center justify-between cursor-pointer ${
                            currencyInput === cur.symbol
                              ? 'bg-indigo-50 text-indigo-700 font-bold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span>{cur.label}</span>
                          {currencyInput === cur.symbol && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-xs hover:bg-indigo-700"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Sync & Offline Status */}
      {activeModal === 'sync' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl relative">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <Cloud className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">Sync & Offline Status</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              All records are stored locally with IndexedDB and synced to Firestore.
            </p>

            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-700">
              <div className="flex items-center justify-between">
                <span>Network Connectivity:</span>
                <span className="font-bold flex items-center gap-1">
                  {typeof navigator !== 'undefined' && navigator.onLine ? (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <Wifi className="w-3.5 h-3.5" /> Online
                    </span>
                  ) : (
                    <span className="text-amber-600 flex items-center gap-1">
                      <WifiOff className="w-3.5 h-3.5" /> Offline
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span>Firestore Sync State:</span>
                <span className="font-bold capitalize">{syncStatus}</span>
              </div>

              <div className="flex items-center justify-between">
                <span>Pending Offline Writes:</span>
                <span className="font-bold text-indigo-600">{pendingCount} transactions</span>
              </div>
            </div>

            <button
              onClick={manualSync}
              className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Trigger Manual Sync</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL 6: Activity Logs (Admin Only) */}
      {isAdmin && activeModal === 'logs' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-1">Activity Audit Trail</h3>
            <p className="text-xs text-slate-400 mb-4">Recent operations performed by family members</p>

            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
              {activityLogs.length > 0 ? (
                activityLogs.map((log) => (
                  <div key={log.id} className="py-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{log.userName}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] mt-0.5">{log.details}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-slate-400">
                  No activity logs recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: About App & Version Control */}
      {activeModal === 'about' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setActiveModal(null);
                setIsEditingAbout(false);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {isEditingAbout && isAdmin ? (
              <form onSubmit={handleSaveAbout} className="space-y-3.5">
                <div className="flex items-center gap-2.5 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingAbout(false);
                      setActiveModal('appSettingsHub');
                    }}
                    className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer -ml-1"
                    title="Back to App Settings"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Edit2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-tight">Edit App & Version</h3>
                    <p className="text-xs text-slate-400">Update app version and release notes for family</p>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">App Version (e.g. 1.0.1)</label>
                  <input
                    type="text"
                    value={aboutVersionInput}
                    onChange={(e) => setAboutVersionInput(e.target.value)}
                    placeholder="1.0.0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">About App Description</label>
                  <textarea
                    rows={3}
                    value={aboutDescInput}
                    onChange={(e) => setAboutDescInput(e.target.value)}
                    placeholder="Describe the application purpose..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Release Notes & Version Log</label>
                  <textarea
                    rows={5}
                    value={aboutNotesInput}
                    onChange={(e) => setAboutNotesInput(e.target.value)}
                    placeholder="Describe latest release improvements and changes..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingAbout(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer transition"
                  >
                    Save Version & Info
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 p-2.5 mx-auto mb-3">
                  <svg
                    className="w-full h-full drop-shadow-xs"
                    viewBox="0 0 200 200"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M 100,25 L 170,85 L 170,165 Q 170,175 160,175 L 40,175 Q 30,175 30,165 L 30,85 Z"
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M 100,62 C 92,50 78,56 78,70 C 78,85 95,98 100,105 C 105,98 122,85 122,70 C 122,56 108,50 100,62 Z"
                      fill="#F472B6"
                    />
                    <path d="M 35,130 Q 15,115 10,95 Q 28,95 42,120 Z" fill="#34D399" />
                    <path d="M 165,130 Q 185,115 190,95 Q 172,95 158,120 Z" fill="#34D399" />
                    <circle cx="65" cy="115" r="14" fill="#FFFFFF" />
                    <path d="M 45,165 C 45,142 58,135 65,135 C 72,135 85,142 85,165 Z" fill="#C7D2FE" />
                    <circle cx="135" cy="115" r="14" fill="#FFFFFF" />
                    <path d="M 115,165 C 115,142 128,135 135,135 C 142,135 155,142 155,165 Z" fill="#67E8F9" />
                    <circle cx="100" cy="125" r="12" fill="#FFFFFF" />
                    <path d="M 85,165 C 85,148 95,142 100,142 C 105,142 115,148 115,165 Z" fill="#FBCFE8" />
                  </svg>
                </div>

                <h3 className="text-lg font-bold text-slate-900">
                  {familySettings.familyName || 'Family'} Expense Tracker
                </h3>
                <div className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-bold">
                  <span>Version {familySettings.appVersion || '1.0.0'}</span>
                </div>

                <p className="text-xs text-slate-600 mt-3.5 leading-relaxed text-left bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-line">
                  {familySettings.aboutDescription ||
                    'Designed exclusively for family members to record daily expenses, track deposits and contributions, and preserve family financial wellness with offline synchronisation.'}
                </p>

                {/* Release Notes / Version Control */}
                <div className="mt-3.5 text-left bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                  <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Version Details & Release Notes</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal whitespace-pre-line">
                    {familySettings.releaseNotes ||
                      'Initial release featuring multi-member ledger, offline capability, instant analytics, deposit tracking, customizable payment methods and deposit types.'}
                  </p>
                </div>

                {isAdmin && (
                  <button
                    onClick={() => {
                      setAboutVersionInput(familySettings.appVersion || '1.0.0');
                      setAboutDescInput(familySettings.aboutDescription || '');
                      setAboutNotesInput(familySettings.releaseNotes || '');
                      setIsEditingAbout(true);
                    }}
                    className="w-full mt-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Version & App Details</span>
                  </button>
                )}

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <PWAInstallButton compact={false} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 8: App Security PIN */}
      {activeModal === 'applock' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 sm:p-6 shadow-2xl relative">
            <button
              onClick={() => {
                setActiveModal(null);
                setAppLockFeedback(null);
                setPinInput('');
                setPinConfirmInput('');
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">App Security PIN</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Protect your family expense tracker with a private 4-digit PIN.
            </p>

            {appLockFeedback && (
              <div className="mb-4 p-3 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>{appLockFeedback}</span>
              </div>
            )}

            <form onSubmit={handleSaveAppLock} className="space-y-4">
              {/* Toggle Enable App Lock */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-2.5">
                  <KeyRound className="w-4 h-4 text-slate-500" />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Require App PIN</span>
                    <span className="text-[10px] text-slate-400">Lock on startup or switching apps</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={appLockEnabled}
                    onChange={(e) => setAppLockEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {appLockEnabled && (
                <div className="space-y-3 animate-in fade-in">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Set 4-Digit Security PIN
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="Enter 4 digits"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-center text-lg font-bold tracking-widest text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required={appLockEnabled}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Confirm 4-Digit PIN
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      value={pinConfirmInput}
                      onChange={(e) => setPinConfirmInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="Re-enter 4 digits"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-center text-lg font-bold tracking-widest text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required={appLockEnabled}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {localStorage.getItem('family_app_lock_enabled') === 'true' && (
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem('family_app_lock_enabled');
                      localStorage.removeItem('family_app_lock_pin');
                      localStorage.removeItem('family_app_lock_biometric');
                      if (userProfile?.id) {
                        localStorage.removeItem(`family_app_lock_biometric_${userProfile.id}`);
                        localStorage.removeItem(`family_app_lock_cred_id_${userProfile.id}`);
                      }
                      setAppLockEnabled(false);
                      setPinInput('');
                      setPinConfirmInput('');
                      setAppLockFeedback('App lock has been disabled.');
                      setTimeout(() => {
                        setAppLockFeedback(null);
                        setActiveModal(null);
                      }, 1200);
                    }}
                    className="flex-1 py-2.5 rounded-xl border border-rose-200 text-xs font-bold text-rose-600 hover:bg-rose-50 cursor-pointer"
                  >
                    Disable PIN
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer transition"
                >
                  Save Lock Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Category Delete */}
      <ConfirmModal
        isOpen={!!deletingCatId}
        title="Delete Category?"
        message="Are you sure you want to delete this category? Any future expenses will need a different category."
        onConfirm={async () => {
          if (deletingCatId) {
            await deleteCategory(deletingCatId);
            setDeletingCatId(null);
          }
        }}
        onCancel={() => setDeletingCatId(null)}
      />

      {/* Confirm Payment Method Delete */}
      <ConfirmModal
        isOpen={!!deletingPmId}
        title="Delete Payment Method?"
        message="Are you sure you want to delete this payment method? It will no longer appear as an option in new transactions."
        onConfirm={async () => {
          if (deletingPmId) {
            await deletePaymentMethod(deletingPmId);
            setDeletingPmId(null);
          }
        }}
        onCancel={() => setDeletingPmId(null)}
      />

      {/* Confirm Deposit Type Delete */}
      <ConfirmModal
        isOpen={!!deletingDtId}
        title="Delete Deposit Type?"
        message="Are you sure you want to delete this deposit type? It will no longer appear as an option in future deposits."
        onConfirm={handleConfirmDeleteDepositType}
        onCancel={() => setDeletingDtId(null)}
      />

      {/* Confirm Member Delete */}
      <ConfirmModal
        isOpen={!!deletingMember}
        title="Delete Family Member?"
        message={
          deletingMember
            ? `Are you sure you want to delete member "${deletingMember.displayName}" (@${deletingMember.username})? They will no longer be able to log in.`
            : ''
        }
        onConfirm={handleConfirmDeleteMember}
        onCancel={() => setDeletingMember(null)}
      />


      {/* Wipe Out Data Confirmation Modal (Admin Only) */}
      {showWipeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl relative border-2 border-rose-200">
            <button
              onClick={() => {
                setShowWipeModal(false);
                setWipeConfirmInput('');
                setWipeStatusMsg(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-extrabold text-slate-900 text-center">
              Wipe Out All Ledger Data?
            </h3>
            <p className="text-xs text-slate-500 text-center mt-1 leading-relaxed">
              This will <strong className="text-rose-600">permanently delete all expenses and deposits</strong> from Firestore. This action cannot be reversed.
            </p>

            {wipeStatusMsg && (
              <div className="my-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold text-center">
                {wipeStatusMsg}
              </div>
            )}

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 text-center">
                  Type <span className="text-rose-600 font-mono tracking-wider font-extrabold">WIPE</span> to confirm:
                </label>
                <input
                  type="text"
                  value={wipeConfirmInput}
                  onChange={(e) => setWipeConfirmInput(e.target.value)}
                  placeholder="Type WIPE"
                  className="w-full bg-slate-50 border border-rose-200 rounded-xl px-3 py-2 text-xs font-bold text-center tracking-wider text-rose-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowWipeModal(false);
                    setWipeConfirmInput('');
                    setWipeStatusMsg(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleWipeData}
                  disabled={wipeConfirmInput.trim().toUpperCase() !== 'WIPE' || isWiping}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs cursor-pointer disabled:cursor-not-allowed transition"
                >
                  {isWiping ? 'Wiping Data...' : 'Confirm Wipe'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
