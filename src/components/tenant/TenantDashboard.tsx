import React, { useState, useEffect } from 'react';
import {
  FlatManagerData,
  CurrentUser,
  Invoice,
  PaymentRecord,
  Complaint,
  LegalDoc,
  PaymentRequest,
  Tenant,
  PhotoItem,
  MoveOut,
  Visitor
} from '../../types';
import { toBn } from '../../lib/storage';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { Header } from '../common/Header';
import { printInvoice, printReceipt, printLegalDoc, getInvoiceStats } from '../../lib/printUtils';
import { PoliceVerificationModal } from '../police/PoliceVerificationModal';
import { UtilityDetailModal } from '../common/UtilityDetailModal';
import { TenantDetailModal } from '../common/TenantDetailModal';
import { KitchenDutyCard } from '../common/KitchenDutyCard';
import { VisitorManager } from '../visitors/VisitorManager';
import { AppDownloadModal } from '../common/AppDownloadModal';

interface TenantDashboardProps {
  data: FlatManagerData;
  currentUser: CurrentUser;
  onUpdateData: (newData: FlatManagerData) => void;
  onLogout: () => void;
  showAlert: (msg: string, opts?: { title?: string; type?: 'info' | 'success' | 'error' | 'warning' }) => void;
  showConfirm: (msg: string, opts?: { title?: string; okText?: string; cancelText?: string; type?: 'danger' | 'warning' | 'info' }) => Promise<boolean>;
  onOpenNotifications: () => void;
  navTarget?: { tab: string; subTab?: string; timestamp: number; payload?: any } | null;
}

export const TenantDashboard: React.FC<TenantDashboardProps> = ({
  data,
  currentUser,
  onUpdateData,
  onLogout,
  showAlert,
  showConfirm,
  onOpenNotifications,
  navTarget
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  // React to deep navigation targets (e.g. from clicking notifications)
  useEffect(() => {
    if (navTarget && navTarget.tab) {
      setActiveTab(navTarget.tab);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [navTarget]);

  const myRoom = currentUser.room || 'রুম ২';
  const myRoomData = data.rooms.find(r => r.name === myRoom);
  const myPersons = data.tenants.filter(t => t.room === myRoom);
  const myMoveOutReq = (data.moveOuts || []).find(m => m.room === myRoom && (m.status === 'requested' || m.status === 'pending'));

  const [selectedMemberName, setSelectedMemberName] = useState(() => {
    return sessionStorage.getItem('activeMemberName') || '';
  });

  const activeMemberObj = myPersons.find(p => p.name === (selectedMemberName || (myPersons[0]?.name || ''))) || myPersons[0];

  // Set default if empty
  React.useEffect(() => {
    if (!selectedMemberName && myPersons[0]?.name) {
      setSelectedMemberName(myPersons[0].name);
      sessionStorage.setItem('activeMemberName', myPersons[0].name);
    }
  }, [selectedMemberName, myPersons]);
  const myInvoices = data.invoices.filter(i => i.room === myRoom);
  const myComplaints = data.complaints.filter(c => c.room === myRoom);

  // Sub-tab navigation states
  const [billSubTab, setBillSubTab] = useState<'invoices' | 'payments'>('invoices');
  const [tenantComplaintSubTab, setTenantComplaintSubTab] = useState<'complaints' | 'maintenance'>('complaints');
  const [tenantDocSubTab, setTenantDocSubTab] = useState<'police' | 'documents'>('police');
  const [tenantProfileSubTab, setTenantProfileSubTab] = useState<'profile' | 'deposit'>('profile');

  // Form states
  const [moveOutNoticeModal, setMoveOutNoticeModal] = useState<{
    isOpen: boolean;
    targetDate: string;
    reason: string;
    note: string;
  }>({
    isOpen: false,
    targetDate: new Date().toISOString().split('T')[0],
    reason: 'অন্যত্র বাসা স্থানান্তর',
    note: ''
  });

  const [paymentSubmit, setPaymentSubmit] = useState({
    invoiceId: '',
    amount: '',
    method: 'বিকাশ',
    trxId: '',
    date: new Date().toISOString().split('T')[0],
    note: ''
  });

  const [complaintForm, setComplaintForm] = useState({
    isOpen: false,
    title: '',
    desc: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    photo: ''
  });

  const [maintForm, setMaintForm] = useState({
    isOpen: false,
    title: '',
    desc: ''
  });

  const [disputeModal, setDisputeModal] = useState<{ isOpen: boolean; invoice: Invoice | null; desc: string }>({
    isOpen: false,
    invoice: null,
    desc: ''
  });

  const [policeModalState, setPoliceModalState] = useState<{
    isOpen: boolean;
    docId?: string;
    values: Record<string, string>;
    status?: 'pending' | 'verified' | 'rejected';
  }>({
    isOpen: false,
    values: {}
  });

  const [utilityDetailModal, setUtilityDetailModal] = useState<{
    isOpen: boolean;
    invoice: Invoice | null;
  }>({
    isOpen: false,
    invoice: null
  });
  const [selectedTenantForDetail, setSelectedTenantForDetail] = useState<Tenant | null>(null);
  const [photoFilter, setPhotoFilter] = useState<'all' | 'condition' | 'furniture' | 'meter'>('all');
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);
  const [photoTitle, setPhotoTitle] = useState('');
  const [photoCategory, setPhotoCategory] = useState<'condition' | 'furniture' | 'meter' | 'other'>('condition');
  const [photoData, setPhotoData] = useState('');
  const [previewPhoto, setPreviewPhoto] = useState<PhotoItem | null>(null);

  const [paymentHistoryFilter, setPaymentHistoryFilter] = useState<'all' | 'approved' | 'requests'>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [paymentSearchTerm, setPaymentSearchTerm] = useState<string>('');

  // Room Member Add / Edit Modal State
  const [memberModal, setMemberModal] = useState<{
    isOpen: boolean;
    mode: 'add' | 'edit';
    tenant: Partial<Tenant>;
    originalName?: string;
  }>({
    isOpen: false,
    mode: 'add',
    tenant: {
      name: '',
      room: myRoom,
      phone: '',
      rent: 0,
      initials: '',
      color: 'indigo',
      fatherName: '',
      motherName: '',
      occupation: '',
      nid: '',
      emergency: '',
      emergencyName: '',
      moveIn: new Date().toISOString().split('T')[0],
      deposit: 0,
      photo: '',
      email: '',
      permanentAddress: '',
      workplace: '',
      bloodGroup: ''
    }
  });

  const handleOpenAddMember = () => {
    const defaultRent = myRoomData?.rent 
      ? Math.round(Number(myRoomData.rent) / Math.max(1, myPersons.length + 1))
      : 0;

    setMemberModal({
      isOpen: true,
      mode: 'add',
      tenant: {
        name: '',
        room: myRoom,
        phone: '',
        rent: defaultRent,
        initials: '',
        color: 'indigo',
        fatherName: '',
        motherName: '',
        occupation: '',
        nid: '',
        emergency: '',
        emergencyName: '',
        moveIn: new Date().toISOString().split('T')[0],
        deposit: 0,
        photo: '',
        email: '',
        permanentAddress: '',
        workplace: '',
        bloodGroup: ''
      }
    });
  };

  const handleOpenEditMember = (t: Tenant) => {
    setMemberModal({
      isOpen: true,
      mode: 'edit',
      originalName: t.name,
      tenant: { ...t }
    });
  };

  const handleSaveMember = () => {
    const { tenant, mode, originalName } = memberModal;
    if (!tenant.name?.trim()) {
      showAlert('অনুগ্রহ করে সদস্যের নাম লিখুন', { type: 'warning' });
      return;
    }
    if (!tenant.phone?.trim()) {
      showAlert('অনুগ্রহ করে সদস্যের মোবাইল নম্বর লিখুন', { type: 'warning' });
      return;
    }

    const trimmedName = tenant.name.trim();
    const trimmedPhone = tenant.phone.trim();
    const initials = trimmedName.slice(0, 2);

    if (mode === 'add') {
      const exists = data.tenants.some(
        t => t.room === myRoom && t.name.toLowerCase() === trimmedName.toLowerCase()
      );
      if (exists) {
        showAlert('এই নামে ইতিমধ্যেই এই রুমে একজন সদস্য রয়েছে!', { type: 'error' });
        return;
      }

      const newTenant: Tenant = {
        name: trimmedName,
        room: myRoom,
        phone: trimmedPhone,
        rent: Number(tenant.rent) || 0,
        initials: tenant.initials || initials,
        color: tenant.color || 'indigo',
        fatherName: tenant.fatherName || '',
        motherName: tenant.motherName || '',
        occupation: tenant.occupation || '',
        nid: tenant.nid || '',
        emergency: tenant.emergency || '',
        emergencyName: tenant.emergencyName || '',
        moveIn: tenant.moveIn || new Date().toISOString().split('T')[0],
        deposit: Number(tenant.deposit) || 0,
        photo: tenant.photo || '',
        email: tenant.email || '',
        permanentAddress: tenant.permanentAddress || '',
        workplace: tenant.workplace || '',
        bloodGroup: tenant.bloodGroup || '',
        autoSplitRent: true
      };

      const updatedRooms = data.rooms.map(r => {
        if (r.name === myRoom && r.status === 'empty') {
          return { ...r, status: 'occupied' as const };
        }
        return r;
      });

      onUpdateData({
        ...data,
        rooms: updatedRooms,
        tenants: [...data.tenants, newTenant],
        notifications: [
          {
            id: 'NOTIF-' + Date.now(),
            forRole: 'owner',
            title: 'নতুন রুম মেম্বার যুক্ত হয়েছে',
            message: `${myRoom}-এ ভাড়াটিয়া নতুন সদস্য "${newTenant.name}" (${newTenant.phone}) যুক্ত করেছেন।`,
            read: false,
            createdAt: new Date().toISOString()
          },
          ...data.notifications
        ]
      });

      setMemberModal(prev => ({ ...prev, isOpen: false }));
      showAlert(`নতুন সদস্য "${newTenant.name}" সফলভাবে যুক্ত হয়েছে!`, { type: 'success' });
    } else {
      const updatedTenants = data.tenants.map(t => {
        if (t.room === myRoom && (t.name === originalName || t.name === tenant.name)) {
          return {
            ...t,
            ...tenant,
            name: trimmedName,
            phone: trimmedPhone,
            initials: tenant.initials || initials
          } as Tenant;
        }
        return t;
      });

      if (selectedMemberName === originalName && originalName !== trimmedName) {
        setSelectedMemberName(trimmedName);
        sessionStorage.setItem('activeMemberName', trimmedName);
      }

      onUpdateData({
        ...data,
        tenants: updatedTenants
      });

      setMemberModal(prev => ({ ...prev, isOpen: false }));
      showAlert(`সদস্য "${trimmedName}"-এর তথ্য সফলভাবে আপডেট হয়েছে!`, { type: 'success' });
    }
  };

  const handleDeleteMember = async (memberName: string) => {
    const confirmed = await showConfirm(
      `আপনি কি নিশ্চিত যে "${memberName}"-কে রুমের সদস্য তালিকা থেকে বাদ দিতে চান?`,
      {
        title: 'সদস্য অপসারণ',
        okText: 'হ্যাঁ, বাদ দিন',
        cancelText: 'বাতিল',
        type: 'danger'
      }
    );

    if (!confirmed) return;

    const updatedTenants = data.tenants.filter(t => !(t.room === myRoom && t.name === memberName));

    if (selectedMemberName === memberName) {
      const nextMember = updatedTenants.find(t => t.room === myRoom);
      if (nextMember) {
        setSelectedMemberName(nextMember.name);
        sessionStorage.setItem('activeMemberName', nextMember.name);
      }
    }

    onUpdateData({
      ...data,
      tenants: updatedTenants,
      notifications: [
        {
          id: 'NOTIF-' + Date.now(),
          forRole: 'owner',
          title: 'রুম মেম্বার রিমুভ করা হয়েছে',
          message: `${myRoom} থেকে সদস্য "${memberName}"-কে অপসারণ করা হয়েছে।`,
          read: false,
          createdAt: new Date().toISOString()
        },
        ...data.notifications
      ]
    });

    showAlert(`সদস্য "${memberName}"-কে সফলভাবে বাদ দেওয়া হয়েছে!`, { type: 'info' });
  };

  // Calculate stats
  let totalBill = 0, totalPaid = 0, totalDue = 0;
  myInvoices.forEach(inv => {
    const st = getInvoiceStats(inv);
    totalBill += st.total;
    totalPaid += st.totalPaid;
    totalDue += st.remaining;
  });

  // All approved payments
  const allMyPayments: Array<{ payment: PaymentRecord; invoice: Invoice }> = [];
  myInvoices.forEach(inv => {
    (inv.payments || []).forEach(p => allMyPayments.push({ payment: p, invoice: inv }));
  });
  allMyPayments.sort((a, b) => new Date(b.payment.date).getTime() - new Date(a.payment.date).getTime());

  // My payment requests
  const myPaymentRequests = (data.paymentRequests || []).filter(p => p.room === myRoom);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    showAlert('নম্বর কপি হয়েছে!', { type: 'success' });
  };

  return (
    <div className="flex min-h-screen bg-[#0f0f1e] text-white">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`glass w-64 p-6 flex flex-col gap-2 fixed h-full z-40 transition-transform overflow-y-auto ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-lg text-white">আমার রুম</h1>
            <p className="text-[10px] text-cyan-400 font-semibold tracking-wider">ভাড়াটিয়া প্যানেল ({myRoom})</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {[
            { id: 'overview', label: 'ওভারভিউ', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3' },
            { id: 'moveOutNotice', label: '🚪 বাসা ছাড়ার নোটিশ', icon: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1' },
            { id: 'invoices', label: 'আমার রুম ও হিসাব', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
            { id: 'submitPayment', label: 'পেমেন্ট জমা দিন', icon: 'M12 4v16m8-8H4' },
            { id: 'complaints', label: 'অভিযোগ ও মেরামত', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
            { id: 'documents', label: 'ডকুমেন্ট ও পুলিশ ফরম', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
            { id: 'notices', label: 'নোটিশ বোর্ড', icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6' },
            { id: 'rules', label: 'হাউস রুলস', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
            { id: 'kitchenDuty', label: 'কিচেন ক্লিন ডিউটি', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
            { id: 'visitors', label: 'ভিজিটর লগ', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
            { id: 'profile', label: 'প্রোফাইল ও জামানত', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setIsSidebarOpen(false);
              }}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-medium ${
                activeTab === tab.id
                  ? 'bg-white/10 text-white font-semibold shadow-xs'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon} />
              </svg>
              <span>{tab.label}</span>
            </button>
          ))}
          <button
            onClick={() => setShowDownloadModal(true)}
            className="w-full relative overflow-hidden group flex items-center justify-between p-3.5 rounded-2xl bg-blue-950/40 hover:bg-blue-900/60 border border-blue-500/20 hover:border-blue-400/50 transition-all duration-300 text-left mt-3"
          >
            {/* Background Accent overlay */}
            <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors duration-300" />
            
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:text-blue-300 transition-all duration-300">
                <svg className="w-5 h-5 transform group-hover:-translate-y-0.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Mobile App</span>
                <span className="text-xs font-bold text-blue-100 group-hover:text-white transition-colors duration-300">অ্যাপ ডাউনলোড করুন</span>
              </div>
            </div>
            
            <div className="w-6 h-6 rounded-full bg-white/5 group-hover:bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:text-blue-300 transition-all duration-300 relative z-10">
              <svg className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </nav>

        {/* User Card */}
        <div className="glass rounded-2xl p-3 flex items-center gap-3 mt-4">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-600 flex items-center justify-center font-bold text-white shadow-xs border border-white/10 flex-shrink-0">
            {activeMemberObj?.photo ? (
              <img 
                src={activeMemberObj.photo} 
                alt={activeMemberObj.name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span>{activeMemberObj?.initials || activeMemberObj?.name?.[0] || 'রু'}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate text-white">{activeMemberObj?.name || myRoom}</p>
            <p className="text-[10px] text-cyan-400 font-semibold">{myRoom}</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="mt-2 glass py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition hidden lg:flex items-center justify-center gap-2 font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          লগআউট
        </button>
      </aside>

      {/* Main Container */}
      <main className="flex-1 lg:ml-64 p-4 md:p-8 overflow-y-auto pb-28">
        <Header
          currentUser={{
            ...currentUser,
            name: activeMemberObj?.name || currentUser.name,
            photo: activeMemberObj?.photo || currentUser.photo
          }}
          notifications={data.notifications}
          subtitle="আপনার বিল ও রুমের তথ্য একনজরে"
          onRefresh={() => showAlert('ডেটা রিফ্রেশ হয়েছে!', { type: 'success' })}
          onOpenNotifications={onOpenNotifications}
          onOpenMobileMenu={() => setIsSidebarOpen(true)}
          onLogout={onLogout}
        />

        {/* TAB: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="gradient-border">
              <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-md flex-shrink-0">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs text-cyan-400 font-semibold tracking-widest uppercase">আমার ফ্ল্যাট</p>
                    <h3 className="text-xl sm:text-2xl font-bold mt-0.5 sm:mt-1 text-white truncate">{data.flatInfo.name}</h3>
                    <p className="text-gray-400 text-xs sm:text-sm mt-1 flex items-start gap-1">
                      <span className="flex-shrink-0">📍</span>
                      <span className="break-words line-clamp-2 sm:line-clamp-none">{data.flatInfo.address}</span>
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right flex-shrink-0">
                  <p className="text-xs text-gray-400">আমার রুম</p>
                  <p className="text-2xl font-bold text-cyan-400">{myRoom}</p>
                </div>
              </div>
            </div>

            {/* UNMISSABLE MOVE-OUT NOTICE BANNER */}
            <div className="glass rounded-2xl p-5 border-2 border-amber-500/50 bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-500/20 shadow-xl shadow-amber-500/10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/30 text-amber-200 flex items-center justify-center text-2xl flex-shrink-0 border border-amber-400/40 shadow-inner">
                    🚪
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-amber-200 flex items-center gap-2">
                      <span>বাসা ছাড়ার ১ মাস পূর্বের নোটিশ</span>
                      {myMoveOutReq && (
                        <span className="text-[10px] bg-amber-500/30 text-amber-200 px-2.5 py-0.5 rounded-full font-extrabold uppercase border border-amber-400/30 animate-pulse">
                          জমা দেওয়া আছে
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-gray-200 mt-1 leading-relaxed">
                      {myMoveOutReq 
                        ? `আপনার প্রস্থানের সম্ভাব্য তারিখ: ${myMoveOutReq.moveOutDate} (মালিকের নিকট অপেক্ষমাণ)`
                        : 'আগামী মাসে বাসা ছাড়তে চান? বাসা ছাড়ার ১ মাস পূর্বে এই বাটন চেপে বাড়িওয়ালাকে নোটিশ দিন।'}
                    </p>
                  </div>
                </div>

                <div className="w-full md:w-auto shrink-0">
                  {myMoveOutReq ? (
                    <button
                      onClick={() => setActiveTab('moveOutNotice')}
                      className="w-full md:w-auto px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition shadow-lg flex items-center justify-center gap-2"
                    >
                      <span>🔍</span> নোটিশের স্ট্যাটাস দেখুন
                    </button>
                  ) : (
                    <button
                      onClick={() => setMoveOutNoticeModal({ isOpen: true, targetDate: '', reason: 'ব্যক্তিগত কারণ', note: '' })}
                      className="w-full md:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-black font-black text-xs transition shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2 border border-amber-300 animate-pulse"
                    >
                      <span>🚪</span> বাসা ছাড়ার নোটিশ দিন (১ মাস আগে)
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="gradient-border"><div className="p-5"><p className="text-gray-400 text-xs">মাসিক ভাড়া</p><h3 className="text-2xl font-bold mt-1 text-pink-400">৳ {toBn(myRoomData?.rent || 0)}</h3></div></div>
              <div className="gradient-border"><div className="p-5"><p className="text-gray-400 text-xs">মোট বিল</p><h3 className="text-2xl font-bold mt-1 text-cyan-400">৳ {toBn(totalBill)}</h3></div></div>
              <div className="gradient-border"><div className="p-5"><p className="text-gray-400 text-xs">পরিশোধিত</p><h3 className="text-2xl font-bold mt-1 text-emerald-400">৳ {toBn(totalPaid)}</h3></div></div>
              <div className="gradient-border"><div className="p-5"><p className="text-gray-400 text-xs">বাকি</p><h3 className="text-2xl font-bold mt-1 text-rose-400">৳ {toBn(totalDue)}</h3></div></div>
            </div>

            {/* Kitchen Cleaning Duty Board */}
            <KitchenDutyCard
              data={data}
              onUpdateData={onUpdateData}
              currentUserRole="tenant"
              currentUserName={activeMemberObj?.name || currentUser.name}
              currentUserRoom={myRoomData?.name}
              showAlert={showAlert}
            />

            {/* Room Members Quick Management Card */}
            <div className="glass rounded-2xl p-6 border border-blue-500/10 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-xl flex-shrink-0">
                    👥
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <span>আমার রুমের সদস্যগণ ({toBn(myPersons.length)} জন)</span>
                    </h3>
                    <p className="text-xs text-gray-400">রুম {myRoom}-এর বসবাসরত সদস্যদের তালিকা ও এক্সেস</p>
                  </div>
                </div>
                <button
                  onClick={handleOpenAddMember}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg shadow-blue-600/25 flex items-center gap-1.5"
                >
                  <span>+</span> নতুন সদস্য যোগ করুন
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {myPersons.map((p, idx) => {
                  const isActive = p.name === activeMemberObj?.name;
                  return (
                    <div
                      key={`${p.name}-${p.phone || idx}`}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                        isActive
                          ? 'bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-11 h-11 rounded-2xl overflow-hidden flex-shrink-0 border ${isActive ? 'border-cyan-400' : 'border-white/10'}`}>
                          {p.photo ? (
                            <img src={p.photo} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm font-bold text-white bg-indigo-600">
                              {p.name[0]}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`font-bold text-sm truncate ${isActive ? 'text-cyan-300' : 'text-white'}`}>{p.name}</p>
                            {isActive && (
                              <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full font-bold border border-cyan-500/30">
                                ● সক্রিয়
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-300 truncate">📱 {p.phone}</p>
                          {p.occupation && <p className="text-[10px] text-gray-400 truncate">💼 {p.occupation}</p>}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => setSelectedTenantForDetail(p)}
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white text-xs transition border border-white/10"
                          title="বিস্তারিত"
                        >
                          🔍
                        </button>
                        <button
                          onClick={() => handleOpenEditMember(p)}
                          className="p-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 hover:text-indigo-100 text-xs transition border border-indigo-500/30"
                          title="এডিট"
                        >
                          ✏️
                        </button>
                        {myPersons.length > 1 && (
                          <button
                            onClick={() => handleDeleteMember(p.name)}
                            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 hover:text-rose-200 text-xs transition border border-rose-500/20"
                            title="রিমুভ"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Latest bill & quick payment */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 glass rounded-2xl p-6">
                <h3 className="font-bold text-lg mb-4">সর্বশেষ বিল</h3>
                {myInvoices.length > 0 ? (
                  (() => {
                    const latest = myInvoices[myInvoices.length - 1];
                    const st = getInvoiceStats(latest);
                    return (
                      <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-base">{latest.month} মাসের বিল</span>
                          <span className={`text-xs px-2.5 py-1 rounded-lg font-bold ${
                            st.status === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {st.status === 'paid' ? 'পরিশোধিত' : 'বাকি আছে'}
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-white">৳ {toBn(st.total)}</p>
                        {st.remaining > 0 && <p className="text-xs text-red-400">বাকি পরিমাণ: ৳ {toBn(st.remaining)} (Due: {latest.dueDate})</p>}
                        <div className="flex flex-wrap gap-2 pt-2">
                          <button
                            onClick={() => setUtilityDetailModal({ isOpen: true, invoice: latest })}
                            className="bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                          >
                            <span>⚡</span> ইউটিলিটি বিস্তারিত
                          </button>
                          <button onClick={() => setActiveTab('submitPayment')} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl text-xs font-semibold transition">
                            💳 টাকা পরিশোধ করুন
                          </button>
                          <button onClick={() => printInvoice(latest, data.flatInfo)} className="glass px-4 py-2 rounded-xl text-xs font-semibold">
                            📄 ইনভয়েস
                          </button>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <p className="text-gray-400 text-center py-6">কোনো বিল প্রস্তুত নেই</p>
                )}
              </div>

              <div className="glass rounded-2xl p-6">
                <h3 className="font-bold text-lg mb-4">সাম্প্রতিক পেমেন্ট</h3>
                <div className="space-y-2">
                  {allMyPayments.slice(0, 4).map((item, idx) => (
                    <div key={idx} className="p-3 bg-white/5 rounded-xl flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-green-400">৳ {toBn(item.payment.amount)}</p>
                        <p className="text-gray-400 text-[10px]">{item.payment.date} • {item.payment.method}</p>
                      </div>
                      <button onClick={() => printReceipt(item.payment, item.invoice, data.flatInfo)} className="glass px-2 py-1 rounded text-cyan-400 text-[10px]">
                        🧾 রিসিট
                      </button>
                    </div>
                  ))}
                  {allMyPayments.length === 0 && <p className="text-gray-400 text-center py-4 text-xs">কোনো পেমেন্ট লগ নেই</p>}
                </div>
              </div>
            </div>

            {/* WiFi & Internet Access Card */}
            <div className="glass rounded-2xl p-6 border border-indigo-500/10">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl">
                    📶
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">ওয়াইফাই ও ইন্টারনেট এক্সেস (WiFi Details)</h3>
                    <p className="text-xs text-gray-400">এই ফ্ল্যাটের ওয়াইফাই নেটওয়ার্ক আইডি ও পাসওয়ার্ড বিবরণ</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex flex-col justify-between">
                  <div>
                    <p className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">ওয়াইফাই নাম (SSID)</p>
                    <p className="text-lg font-mono font-bold text-white mt-1 select-all">{data.flatInfo.wifiName || 'Green_Villa_4B_5G'}</p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(data.flatInfo.wifiName || 'Green_Villa_4B_5G');
                      showAlert('ওয়াইফাই নাম কপি হয়েছে!', { type: 'success' });
                    }}
                    className="mt-3 w-full bg-white/5 hover:bg-white/10 text-xs py-1.5 rounded-lg border border-white/10 transition font-semibold"
                  >
                    📋 ওয়াইফাই নাম কপি করুন
                  </button>
                </div>

                <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex flex-col justify-between">
                  <div>
                    <p className="text-xs text-emerald-300 font-semibold uppercase tracking-wider">পাসওয়ার্ড (Password)</p>
                    <p className="text-lg font-mono font-bold text-white mt-1 select-all">{data.flatInfo.wifiPassword || 'villa_password_1234'}</p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(data.flatInfo.wifiPassword || 'villa_password_1234');
                      showAlert('ওয়াইফাই পাসওয়ার্ড কপি হয়েছে!', { type: 'success' });
                    }}
                    className="mt-3 w-full bg-indigo-600/25 hover:bg-indigo-600/45 text-xs py-1.5 rounded-lg border border-indigo-500/20 text-indigo-300 transition font-semibold"
                  >
                    📋 পাসওয়ার্ড কপি করুন
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: INVOICES & PAYMENTS HISTORY (UNIFIED) */}
        {(activeTab === 'invoices' || activeTab === 'payments') && (
          <div className="space-y-6">
            <div className="glass rounded-2xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xl flex-shrink-0">
                    🧾
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">আমার রুম ও হিসাব</h3>
                    <p className="text-xs text-gray-400">মাসিক ইউটিলিটি ইনভয়েস, জমা ও পেমেন্ট রিসিট তালিকা</p>
                  </div>
                </div>

                {/* Sub-tab Navigation */}
                <div className="flex p-1 bg-white/5 rounded-xl border border-white/10 w-full sm:w-auto">
                  <button
                    onClick={() => setBillSubTab('invoices')}
                    className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                      billSubTab === 'invoices'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <span>📄 আমার ইনভয়েস বিল</span>
                    <span className="px-1.5 py-0.2 bg-black/30 rounded text-[10px]">{toBn(myInvoices.length)}</span>
                  </button>
                  <button
                    onClick={() => setBillSubTab('payments')}
                    className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                      billSubTab === 'payments'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <span>💳 পেমেন্ট ইতিহাস ও রিসিট</span>
                    <span className="px-1.5 py-0.2 bg-black/30 rounded text-[10px]">{toBn(allMyPayments.length)}</span>
                  </button>
                </div>
              </div>

              {/* Sub-tab 1: Invoices */}
              {billSubTab === 'invoices' && (
                <div className="space-y-4 pt-2">
                  <div className="space-y-4">
                    {myInvoices.map(inv => {
                      const st = getInvoiceStats(inv);
                      return (
                        <div key={inv.id} className="p-5 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                          <div className="flex flex-wrap justify-between items-start gap-4">
                            <div>
                              <p className="font-bold text-lg">{inv.month} মাসের বিল</p>
                              <p className="text-xs text-gray-400">Due: {inv.dueDate} • মোট বিল: ৳ {toBn(st.total)}</p>
                            </div>
                            <span className={`text-xs px-3 py-1 rounded-lg font-bold ${
                              st.status === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                              {st.status === 'paid' ? '✓ সম্পূর্ণ পরিশোধিত' : `● বাকি ৳ ${toBn(st.remaining)}`}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-black/25 p-3 rounded-xl border border-white/5">
                            {inv.rent > 0 && <div className="flex justify-between"><span>🏠 রুম ভাড়া:</span><span className="text-pink-400 font-bold">৳ {toBn(inv.rent)}</span></div>}
                            {inv.breakdown?.electricity > 0 && <div className="flex justify-between"><span>⚡ বিদ্যুৎ:</span><span className="font-semibold text-amber-300">৳ {toBn(inv.breakdown.electricity)}</span></div>}
                            {inv.breakdown?.water > 0 && <div className="flex justify-between"><span>💧 পানি:</span><span className="text-cyan-300">৳ {toBn(inv.breakdown.water)}</span></div>}
                            {inv.breakdown?.gas > 0 && <div className="flex justify-between"><span>🔥 গ্যাস:</span><span className="text-orange-300">৳ {toBn(inv.breakdown.gas)}</span></div>}
                            {inv.breakdown?.wifi > 0 && <div className="flex justify-between"><span>📶 ওয়াইফাই:</span><span>৳ {toBn(inv.breakdown.wifi)}</span></div>}
                            {inv.breakdown?.garbage > 0 && <div className="flex justify-between"><span>🗑️ ময়লা:</span><span>৳ {toBn(inv.breakdown.garbage)}</span></div>}
                            {inv.breakdown?.service > 0 && <div className="flex justify-between"><span>🛠️ সার্ভিস:</span><span>৳ {toBn(inv.breakdown.service)}</span></div>}
                            <div className="flex justify-between border-t sm:border-t-0 sm:border-l border-white/10 pt-1 sm:pt-0 sm:pl-2">
                              <span className="text-gray-300">সর্বমোট:</span>
                              <span className="font-bold text-white">৳ {toBn(st.total)}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-2">
                            <button
                              onClick={() => setUtilityDetailModal({ isOpen: true, invoice: inv })}
                              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
                            >
                              <span>⚡</span> ইউটিলিটি বিস্তারিত দেখুন
                            </button>
                            <button onClick={() => printInvoice(inv, data.flatInfo)} className="glass px-4 py-2 rounded-xl text-xs font-semibold text-cyan-400 hover:bg-cyan-500/10">
                              📄 ইনভয়েস ডাউনলোড
                            </button>
                            <button onClick={() => setDisputeModal({ isOpen: true, invoice: inv, desc: '' })} className="glass px-4 py-2 rounded-xl text-xs font-semibold text-yellow-400 hover:bg-yellow-500/10">
                              ⚠️ সমস্যা রিপোর্ট
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {myInvoices.length === 0 && <p className="text-gray-400 text-center py-8">কোনো ইনভয়েস নেই</p>}
                  </div>
                </div>
              )}

              {/* Sub-tab 2: Payment History & Money Receipts */}
              {billSubTab === 'payments' && (
          <div className="space-y-6">
            {/* Top Summary Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass p-4 rounded-2xl border border-white/10 space-y-1">
                <span className="text-xs text-gray-400">সর্বমোট পরিশোধিত</span>
                <p className="text-xl font-bold text-emerald-400">৳ {toBn(totalPaid)}</p>
                <span className="text-[10px] text-gray-500 font-mono">ভাড়া ও ইউটিলিটি বাবদ</span>
              </div>
              <div className="glass p-4 rounded-2xl border border-white/10 space-y-1">
                <span className="text-xs text-gray-400">অনুমোদিত মানি রিসিট</span>
                <p className="text-xl font-bold text-cyan-300">{toBn(allMyPayments.length)} টি</p>
                <span className="text-[10px] text-gray-500">ডাউনলোড ও প্রিন্ট যোগ্য</span>
              </div>
              <div className="glass p-4 rounded-2xl border border-white/10 space-y-1">
                <span className="text-xs text-gray-400">অপেক্ষমাণ রিকোয়েস্ট</span>
                <p className="text-xl font-bold text-amber-400">
                  {toBn(myPaymentRequests.filter(r => r.status === 'pending').length)} টি
                </p>
                <span className="text-[10px] text-gray-500">মালিকের অনুমোদনের অপেক্ষায়</span>
              </div>
              <div className="glass p-4 rounded-2xl border border-white/10 space-y-1">
                <span className="text-xs text-gray-400">বর্তমান মোট বকেয়া</span>
                <p className={`text-xl font-bold ${totalDue > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  ৳ {toBn(totalDue)}
                </p>
                <span className="text-[10px] text-gray-500">{totalDue > 0 ? 'পরিশোধ করতে হবে' : 'সম্পূর্ণ পরিশোধিত'}</span>
              </div>
            </div>

            {/* Main Payment History Container */}
            <div className="glass rounded-2xl p-6 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span>💳</span> পেমেন্ট ইতিহাস ও মানি রিসিট বিস্তারিত
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    আপনার পরিশোধিত সকল ট্রানজ্যাকশন, অফিসিয়াল মানি রিসিট ও জমার স্ট্যাটাস
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setActiveTab('submitPayment')}
                    className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl text-xs font-bold text-white shadow transition flex items-center gap-1.5"
                  >
                    <span>+</span> নতুন পেমেন্ট জমা দিন
                  </button>
                </div>
              </div>

              {/* Sub-view switcher & Filter bar */}
              <div className="flex flex-col sm:flex-row justify-between gap-3">
                <div className="flex gap-1.5 p-1 bg-black/30 rounded-xl border border-white/10 overflow-x-auto">
                  <button
                    onClick={() => setPaymentHistoryFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                      paymentHistoryFilter === 'all'
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    সকল রেকর্ড ({toBn(allMyPayments.length + myPaymentRequests.length)})
                  </button>
                  <button
                    onClick={() => setPaymentHistoryFilter('approved')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap flex items-center gap-1 ${
                      paymentHistoryFilter === 'approved'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <span>✓</span> অনুমোদিত রিসিট ({toBn(allMyPayments.length)})
                  </button>
                  <button
                    onClick={() => setPaymentHistoryFilter('requests')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap flex items-center gap-1 ${
                      paymentHistoryFilter === 'requests'
                        ? 'bg-amber-600 text-white shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <span>⏳</span> পেমেন্ট ট্র্যাকার ({toBn(myPaymentRequests.length)})
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={paymentMethodFilter}
                    onChange={e => setPaymentMethodFilter(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-200 outline-none"
                  >
                    <option value="all">সকল মাধ্যম</option>
                    <option value="বিকাশ">বিকাশ</option>
                    <option value="নগদ">নগদ</option>
                    <option value="ক্যাশ">নগদ ক্যাশ</option>
                    <option value="ব্যাংক">ব্যাংক</option>
                  </select>

                  <input
                    type="text"
                    placeholder="মাসের নাম বা TrxID..."
                    value={paymentSearchTerm}
                    onChange={e => setPaymentSearchTerm(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 outline-none w-36 sm:w-44"
                  />
                </div>
              </div>

              {/* LIST: Approved Payments & Receipts */}
              {(paymentHistoryFilter === 'all' || paymentHistoryFilter === 'approved') && (
                <div className="space-y-4">
                  {paymentHistoryFilter === 'all' && allMyPayments.length > 0 && (
                    <div className="flex items-center justify-between pt-2">
                      <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                        <span>🧾</span> অনুমোদিত পেমেন্ট ও অফিসিয়াল মানি রিসিট
                      </h4>
                      <span className="text-[11px] text-gray-400">মোট: {toBn(allMyPayments.length)} টি</span>
                    </div>
                  )}

                  {(() => {
                    const filtered = allMyPayments.filter(item => {
                      if (paymentMethodFilter !== 'all' && !item.payment.method.toLowerCase().includes(paymentMethodFilter.toLowerCase())) {
                        return false;
                      }
                      if (paymentSearchTerm.trim()) {
                        const term = paymentSearchTerm.toLowerCase();
                        const matchMonth = item.invoice.month?.toLowerCase().includes(term);
                        const matchTrx = (item.payment.trxId || '').toLowerCase().includes(term) || (item.payment.note || '').toLowerCase().includes(term);
                        const matchMethod = item.payment.method?.toLowerCase().includes(term);
                        if (!matchMonth && !matchTrx && !matchMethod) return false;
                      }
                      return true;
                    });

                    if (filtered.length === 0 && paymentHistoryFilter === 'approved') {
                      return (
                        <div className="p-8 text-center bg-white/5 rounded-2xl border border-dashed border-white/10 space-y-2">
                          <span className="text-3xl block">🔍</span>
                          <p className="text-sm font-semibold text-gray-300">কোনো অনুমোদিত পেমেন্ট রিসিট পাওয়া যায়নি</p>
                          <p className="text-xs text-gray-500">ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন।</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3">
                        {filtered.map((item, idx) => {
                          const p = item.payment;
                          const inv = item.invoice;
                          const isBkash = p.method.includes('বিকাশ') || p.method.toLowerCase().includes('bkash');
                          const isNagad = p.method.includes('নগদ') || p.method.toLowerCase().includes('nagad');
                          const isCash = p.method.includes('ক্যাশ') || p.method.toLowerCase().includes('cash');

                          return (
                            <div
                              key={p.id || idx}
                              className="p-5 bg-white/5 rounded-2xl border border-white/10 hover:border-cyan-500/30 transition space-y-4"
                            >
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                <div className="flex items-start gap-3">
                                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                                    isBkash ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30' :
                                    isNagad ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
                                    isCash ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                                    'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                  }`}>
                                    {isBkash ? '🌸' : isNagad ? '🟠' : isCash ? '💵' : '🏦'}
                                  </div>

                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-lg font-bold text-emerald-400">৳ {toBn(p.amount)}</span>
                                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                                        {p.method}
                                      </span>
                                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-white/10 text-cyan-300 font-mono">
                                        মাস: {inv.month}
                                      </span>
                                      <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/10 text-green-400 font-semibold">
                                        ✓ অনুমোদিত
                                      </span>
                                    </div>

                                    <div className="text-xs text-gray-300 flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5">
                                      <p><strong className="text-gray-400">পরিশোধের তারিখ:</strong> {p.date}</p>
                                      {p.trxId && (
                                        <p className="flex items-center gap-1">
                                          <strong className="text-gray-400">TrxID:</strong>
                                          <span className="font-mono text-cyan-300 font-bold bg-black/30 px-1.5 py-0.5 rounded">{p.trxId}</span>
                                          <button
                                            onClick={() => handleCopy(p.trxId!)}
                                            className="text-[10px] text-gray-400 hover:text-white ml-0.5 underline"
                                            title="TrxID কপি করুন"
                                          >
                                            কপি
                                          </button>
                                        </p>
                                      )}
                                      <p><strong className="text-gray-400">রুম:</strong> {inv.room}</p>
                                    </div>

                                    {p.note && (
                                      <p className="text-xs text-gray-300 italic bg-black/20 px-3 py-1.5 rounded-lg border border-white/5 mt-1">
                                        📝 নোট: "{p.note}"
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 self-end md:self-center flex-wrap">
                                  <button
                                    onClick={() => setUtilityDetailModal({ isOpen: true, invoice: inv })}
                                    className="glass px-3 py-2 rounded-xl text-xs font-semibold text-cyan-300 hover:bg-cyan-500/10 border border-cyan-500/20 flex items-center gap-1.5 transition"
                                  >
                                    <span>⚡</span> ইউটিলিটি বিবরণী
                                  </button>
                                  <button
                                    onClick={() => printReceipt(p, inv, data.flatInfo)}
                                    className="bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow transition flex items-center gap-1.5"
                                  >
                                    <span>🧾</span> মানি রিসিট ডাউনলোড
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* LIST: Submitted Payment Requests Tracker */}
              {(paymentHistoryFilter === 'all' || paymentHistoryFilter === 'requests') && (
                <div className="space-y-4 pt-2">
                  {paymentHistoryFilter === 'all' && myPaymentRequests.length > 0 && (
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <h4 className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                        <span>⏳</span> আপনার পাঠানো পেমেন্ট রিকোয়েস্ট ট্র্যাকার
                      </h4>
                      <span className="text-[11px] text-gray-400">মোট: {toBn(myPaymentRequests.length)} টি</span>
                    </div>
                  )}

                  {(() => {
                    const filteredReqs = myPaymentRequests.filter(pr => {
                      if (paymentMethodFilter !== 'all' && !pr.method.toLowerCase().includes(paymentMethodFilter.toLowerCase())) {
                        return false;
                      }
                      if (paymentSearchTerm.trim()) {
                        const term = paymentSearchTerm.toLowerCase();
                        const matchMonth = pr.invoiceMonth?.toLowerCase().includes(term);
                        const matchTrx = (pr.trxId || '').toLowerCase().includes(term) || (pr.note || '').toLowerCase().includes(term);
                        const matchMethod = pr.method?.toLowerCase().includes(term);
                        if (!matchMonth && !matchTrx && !matchMethod) return false;
                      }
                      return true;
                    });

                    if (filteredReqs.length === 0) {
                      if (paymentHistoryFilter === 'requests') {
                        return (
                          <div className="p-8 text-center bg-white/5 rounded-2xl border border-dashed border-white/10 space-y-2">
                            <span className="text-3xl block">📋</span>
                            <p className="text-sm font-semibold text-gray-300">কোনো পেমেন্ট রিকোয়েস্ট জমা নেই</p>
                            <p className="text-xs text-gray-500">বিকাশ বা নগদে টাকা পাঠিয়ে "পেমেন্ট জমা দিন" ফরম পূরণ করুন।</p>
                          </div>
                        );
                      }
                      return null;
                    }

                    return (
                      <div className="space-y-3">
                        {filteredReqs.map((pr) => (
                          <div
                            key={pr.id}
                            className={`p-4 rounded-2xl border transition space-y-3 ${
                              pr.status === 'approved' ? 'bg-emerald-500/5 border-emerald-500/20' :
                              pr.status === 'rejected' ? 'bg-red-500/5 border-red-500/20' :
                              'bg-amber-500/5 border-amber-500/20'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-base font-bold text-white">৳ {toBn(pr.amount)}</span>
                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-gray-200 font-semibold">
                                  {pr.method}
                                </span>
                                <span className="text-xs text-cyan-300 font-mono">
                                  মাস: {pr.invoiceMonth}
                                </span>
                              </div>

                              <span className={`text-[11px] px-3 py-1 rounded-full font-bold self-start sm:self-auto ${
                                pr.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                pr.status === 'rejected' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              }`}>
                                {pr.status === 'approved' ? '✓ মালিক কর্তৃক অনুমোদিত' :
                                 pr.status === 'rejected' ? '✗ বাতিল করা হয়েছে' :
                                 '⏳ মালিকের যাচাইয়ের অপেক্ষায়'}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-gray-300 bg-black/20 p-2.5 rounded-xl">
                              <div>
                                <span className="text-gray-400 text-[10px] block">জমার তারিখ</span>
                                <strong>{pr.date}</strong>
                              </div>
                              <div>
                                <span className="text-gray-400 text-[10px] block">TrxID</span>
                                <strong className="font-mono text-cyan-300">{pr.trxId || 'প্রযোজ্য নয়'}</strong>
                              </div>
                              <div>
                                <span className="text-gray-400 text-[10px] block">আইডি</span>
                                <strong className="font-mono text-gray-400">{pr.id}</strong>
                              </div>
                            </div>

                            {pr.note && (
                              <p className="text-xs text-gray-300 italic">
                                আপনার নোট: "{pr.note}"
                              </p>
                            )}

                            {pr.status === 'rejected' && pr.rejectReason && (
                              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300 space-y-1">
                                <p className="font-bold">⚠️ বাতিলের কারণ:</p>
                                <p>{pr.rejectReason}</p>
                              </div>
                            )}

                            {pr.status === 'pending' && (
                              <p className="text-[11px] text-amber-300/80">
                                ℹ️ মালিক ট্রানজ্যাকশন যাচাই করে অনুমোদন দিলে তা স্বয়ংক্রিয়ভাবে আপনার ইনভয়েসে যুক্ত হবে ও অফিসিয়াল মানি রিসিট প্রস্তুত হবে।
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {allMyPayments.length === 0 && myPaymentRequests.length === 0 && (
                <div className="p-10 text-center bg-white/5 rounded-2xl border border-white/10 space-y-3">
                  <span className="text-4xl block">💳</span>
                  <h4 className="text-base font-bold text-white">এখনো কোনো পেমেন্ট রেকর্ড নেই</h4>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto">
                    ভাড়া বা ইউটিলিটি বিল পরিশোধ করার পর আপনার পেমেন্ট হিস্টোরি ও মানি রিসিট এখানে জমা হবে।
                  </p>
                  <button
                    onClick={() => setActiveTab('submitPayment')}
                    className="mt-2 bg-blue-600 hover:bg-blue-500 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow transition"
                  >
                    পেমেন্ট জমা দিন
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
            </div>
          </div>
        )}

        {/* TAB: SUBMIT PAYMENT */}
        {activeTab === 'submitPayment' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass rounded-2xl p-6 space-y-4">
              <h3 className="text-xl font-bold">💳 মালিকের পেমেন্ট মাধ্যম</h3>
              <p className="text-xs text-gray-400">টাকা পাঠানোর পর ডান পাশের ফরম পূরণ করে জমা দিন</p>

              {data.flatInfo.paymentMethods.cash?.enabled !== false && (
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                  <p className="font-bold text-green-400">💵 নগদ (Cash)</p>
                  <p className="text-xs text-gray-300 mt-1">সরাসরি মালিকের হাতে টাকা প্রদান করুন</p>
                </div>
              )}

              {data.flatInfo.paymentMethods.bkash?.enabled && data.flatInfo.paymentMethods.bkash.number && (
                <div className="p-4 rounded-xl bg-pink-500/10 border border-pink-500/30 space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-pink-400">বিকাশ (bKash) Send Money</p>
                    <button onClick={() => handleCopy(data.flatInfo.paymentMethods.bkash!.number!)} className="text-xs px-2 py-1 bg-pink-500/20 text-pink-300 rounded hover:bg-pink-500/40">কপি</button>
                  </div>
                  <p className="text-lg font-mono font-bold text-pink-300">{data.flatInfo.paymentMethods.bkash.number}</p>
                  <p className="text-[11px] text-gray-400">Reference এ আপনার রুম নম্বর লিখুন ({myRoom})</p>
                </div>
              )}

              {data.flatInfo.paymentMethods.nagad?.enabled && data.flatInfo.paymentMethods.nagad.number && (
                <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-orange-400">নগদ (Nagad) Send Money</p>
                    <button onClick={() => handleCopy(data.flatInfo.paymentMethods.nagad!.number!)} className="text-xs px-2 py-1 bg-orange-500/20 text-orange-300 rounded hover:bg-orange-500/40">কপি</button>
                  </div>
                  <p className="text-lg font-mono font-bold text-orange-300">{data.flatInfo.paymentMethods.nagad.number}</p>
                  <p className="text-[11px] text-gray-400">Reference এ আপনার রুম নম্বর লিখুন ({myRoom})</p>
                </div>
              )}
            </div>

            {/* Payment Submit Form */}
            <div className="glass rounded-2xl p-6 space-y-4">
              <h3 className="text-xl font-bold">📝 পেমেন্ট জমা দিন</h3>
              <div>
                <label className="block text-xs text-gray-300 mb-1">ইনভয়েস নির্বাচন করুন *</label>
                <select
                  value={paymentSubmit.invoiceId}
                  onChange={e => setPaymentSubmit({ ...paymentSubmit, invoiceId: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none"
                >
                  <option value="">ইনভয়েস সিলেক্ট করুন</option>
                  {myInvoices.map(inv => (
                    <option key={inv.id} value={inv.id}>{inv.month} — বাকি ৳ {toBn(getInvoiceStats(inv).remaining)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-300 mb-1">পরিমাণ (৳) *</label>
                <input
                  type="number"
                  placeholder="টাকার পরিমাণ"
                  value={paymentSubmit.amount}
                  onChange={e => setPaymentSubmit({ ...paymentSubmit, amount: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-300 mb-1">পেমেন্ট মাধ্যম *</label>
                <select
                  value={paymentSubmit.method}
                  onChange={e => setPaymentSubmit({ ...paymentSubmit, method: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none"
                >
                  <option value="বিকাশ">বিকাশ (bKash)</option>
                  <option value="নগদ">নগদ (Nagad)</option>
                  <option value="ক্যাশ">নগদ ক্যাশ (Cash)</option>
                  <option value="ব্যাংক">ব্যাংক ট্রান্সফার</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-300 mb-1">Transaction ID / TrxID</label>
                <input
                  type="text"
                  placeholder="যেমন: 8N7A2K9XYZ"
                  value={paymentSubmit.trxId}
                  onChange={e => setPaymentSubmit({ ...paymentSubmit, trxId: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-300 mb-1">নোট (ঐচ্ছিক)</label>
                <input
                  type="text"
                  placeholder="নোট লিখুন"
                  value={paymentSubmit.note}
                  onChange={e => setPaymentSubmit({ ...paymentSubmit, note: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none"
                />
              </div>
              <button
                onClick={() => {
                  if (!paymentSubmit.amount || Number(paymentSubmit.amount) <= 0) {
                    showAlert('সঠিক পরিমাণ লিখুন', { type: 'warning' });
                    return;
                  }
                  const req: PaymentRequest = {
                    id: 'PREQ-' + Date.now(),
                    invoiceId: paymentSubmit.invoiceId || myInvoices[0]?.id || '',
                    invoiceMonth: myInvoices.find(i => i.id === paymentSubmit.invoiceId)?.month || 'বর্তমান',
                    room: myRoom,
                    tenantName: myPersons[0]?.name || myRoom,
                    amount: Number(paymentSubmit.amount),
                    method: paymentSubmit.method,
                    trxId: paymentSubmit.trxId,
                    date: paymentSubmit.date,
                    note: paymentSubmit.note,
                    status: 'pending',
                    submittedAt: new Date().toISOString()
                  };
                  onUpdateData({
                    ...data,
                    paymentRequests: [req, ...data.paymentRequests],
                    notifications: [
                      {
                        id: 'NOTIF-' + Date.now(),
                        forRole: 'owner',
                        title: 'নতুন পেমেন্ট রিকুয়েস্ট',
                        message: `${myRoom} থেকে ৳ ${paymentSubmit.amount} (${paymentSubmit.method}) জমা দেওয়া হয়েছে`,
                        read: false,
                        createdAt: new Date().toISOString()
                      },
                      ...data.notifications
                    ]
                  });
                  setPaymentSubmit({ invoiceId: '', amount: '', method: 'বিকাশ', trxId: '', date: new Date().toISOString().split('T')[0], note: '' });
                  showAlert('পেমেন্ট সফলভাবে জমা দেওয়া হয়েছে — মালিক যাচাই করবেন', { type: 'success' });
                }}
                className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-semibold transition shadow-md"
              >
                জমা দিন
              </button>
            </div>
          </div>
        )}

        {/* TAB: COMPLAINTS & MAINTENANCE (UNIFIED) */}
        {(activeTab === 'complaints' || activeTab === 'maintenance') && (
          <div className="glass rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xl flex-shrink-0">
                  🚨
                </div>
                <div>
                  <h3 className="text-xl font-bold">অভিযোগ ও সার্ভিস মেরামত</h3>
                  <p className="text-xs text-gray-400">ফ্ল্যাটের যেকোনো সমস্যা, অভিযোগ ও মেরামত সংক্রান্ত সার্ভিস রিকোয়েস্ট</p>
                </div>
              </div>

              {/* Sub-tabs */}
              <div className="flex p-1 bg-white/5 rounded-xl border border-white/10 w-full sm:w-auto">
                <button
                  onClick={() => setTenantComplaintSubTab('complaints')}
                  className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                    tenantComplaintSubTab === 'complaints'
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <span>🚨 কমপ্লেইন ও সমস্যা</span>
                  <span className="px-1.5 py-0.2 bg-black/30 rounded text-[10px]">{toBn(myComplaints.length)}</span>
                </button>
                <button
                  onClick={() => setTenantComplaintSubTab('maintenance')}
                  className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                    tenantComplaintSubTab === 'maintenance'
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <span>🔧 ফ্ল্যাট মেরামত রিকোয়েস্ট</span>
                  <span className="px-1.5 py-0.2 bg-black/30 rounded text-[10px]">{toBn(data.maints.filter(m => m.room === myRoom).length)}</span>
                </button>
              </div>
            </div>

            {tenantComplaintSubTab === 'complaints' && (
              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-sm text-gray-200">আমার অভিযোগসমূহ</h4>
                  <button onClick={() => setComplaintForm({ isOpen: true, title: '', desc: '', priority: 'medium', photo: '' })} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl text-xs font-semibold transition">
                    + নতুন অভিযোগ
                  </button>
                </div>

                <div className="space-y-3">
                  {myComplaints.map((c, i) => (
                    <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-base">{c.title}</h4>
                        <span className={`text-xs px-2.5 py-1 rounded-lg font-bold ${c.status === 'solved' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                          {c.status === 'solved' ? '✓ সমাধান' : '⏳ প্রক্রিয়াধীন'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300">{c.desc}</p>
                      <p className="text-xs text-gray-500">📅 {c.date}</p>
                      {c.replies && c.replies.length > 0 && (
                        <div className="mt-2 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl space-y-1">
                          <p className="text-xs font-bold text-cyan-400">💬 মালিকের উত্তর:</p>
                          {c.replies.map((r, ri) => (
                            <p key={ri} className="text-xs text-gray-200">{r.message}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {myComplaints.length === 0 && <p className="text-gray-400 text-center py-8">কোনো অভিযোগ জমা নেই</p>}
                </div>
              </div>
            )}

            {tenantComplaintSubTab === 'maintenance' && (
              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-sm text-gray-200">সার্ভিস ও মেরামত রিকোয়েস্ট</h4>
                  <button 
                    onClick={() => setMaintForm({ isOpen: true, title: '', desc: '' })}
                    className="bg-amber-600 hover:bg-amber-500 px-4 py-2 rounded-xl text-xs font-bold text-white shadow transition flex items-center gap-1.5"
                  >
                    <span>+</span> নতুন মেরামত রিকোয়েস্ট
                  </button>
                </div>

                <div className="space-y-3">
                  {data.maints.filter(m => m.room === myRoom).map((m) => (
                    <div key={m.id} className="p-4 bg-white/5 rounded-xl border border-white/10 flex justify-between items-center">
                      <div>
                        <h5 className="font-bold text-sm text-white">{m.title}</h5>
                        <p className="text-xs text-gray-400">{m.date} • {m.category || 'মেরামত'}</p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-lg font-bold ${
                        m.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {m.status === 'completed' ? '✓ সম্পন্ন' : '⏳ প্রক্রিয়াধীন'}
                      </span>
                    </div>
                  ))}
                  {data.maints.filter(m => m.room === myRoom).length === 0 && (
                    <p className="text-gray-400 text-center py-8">কোনো মেরামত রিকোয়েস্ট নেই</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: DOCUMENTS & POLICE VERIFICATION (UNIFIED) */}
        {(activeTab === 'documents' || activeTab === 'police') && (
          <div className="glass rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-xl flex-shrink-0">
                  📁
                </div>
                <div>
                  <h3 className="text-xl font-bold">ডকুমেন্ট ও পুলিশ ভেরিফিকেশন</h3>
                  <p className="text-xs text-gray-400">বাংলাদেশ পুলিশ CIMS ফরম, হাউস রুলস ও ফ্ল্যাট চুক্তি ডকুমেন্টস</p>
                </div>
              </div>

              {/* Sub-tabs */}
              <div className="flex p-1 bg-white/5 rounded-xl border border-white/10 w-full sm:w-auto">
                <button
                  onClick={() => setTenantDocSubTab('police')}
                  className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                    tenantDocSubTab === 'police'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <span>📄 পুলিশ CIMS ভেরিফিকেশন</span>
                  <span className="px-1.5 py-0.2 bg-black/30 rounded text-[10px]">
                    {toBn(data.legalDocs.filter(d => d.type === 'policeVerification' && d.room === myRoom).length)}
                  </span>
                </button>
                <button
                  onClick={() => setTenantDocSubTab('documents')}
                  className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                    tenantDocSubTab === 'documents'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <span>📁 রুলস ও ফ্ল্যাট ডকুমেন্টস</span>
                  <span className="px-1.5 py-0.2 bg-black/30 rounded text-[10px]">{toBn(data.rules.length)}</span>
                </button>
              </div>
            </div>

            {tenantDocSubTab === 'police' && (
              <div className="space-y-4 pt-2">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
                  <h4 className="text-sm font-bold text-gray-200">পুলিশ ভেরিফিকেশন (CIMS) তথ্য</h4>
                  <button
                    onClick={() => {
                      const existingDoc = data.legalDocs.find(d => d.type === 'policeVerification' && d.room === myRoom);
                      setPoliceModalState({
                        isOpen: true,
                        docId: existingDoc?.id,
                        values: existingDoc?.values || {
                          applicantName: myPersons[0]?.name || currentUser.name,
                          phone: myPersons[0]?.phone || '',
                          nid: myPersons[0]?.nid || '',
                          presentAddress: `${myRoom}, ${data.flatInfo.name}, ${data.flatInfo.address}`,
                          landlordName: data.flatInfo.ownerName,
                          landlordPhone: data.flatInfo.phone
                        },
                        status: existingDoc?.status
                      });
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl text-xs font-bold shadow transition flex items-center gap-2"
                  >
                    <span>📝</span>
                    <span>{data.legalDocs.some(d => d.type === 'policeVerification' && d.room === myRoom) ? 'ফরম সম্পাদন / আপডেট' : '+ নতুন ফরম পূরণ করুন'}</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {data.legalDocs.filter(d => d.type === 'policeVerification' && d.room === myRoom).map(doc => (
                    <div key={doc.id} className="p-5 bg-white/5 rounded-2xl border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-cyan-500/30 transition">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-base text-white">{doc.values?.applicantName || '—'}</p>
                          {doc.values?.applicantNameEn && (
                            <span className="text-xs text-gray-400">({doc.values?.applicantNameEn})</span>
                          )}
                          <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                            doc.status === 'verified' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                            doc.status === 'rejected' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                            'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          }`}>
                            {doc.status === 'verified' ? '✓ মালিক কর্তৃক যাচাইকৃত' : doc.status === 'rejected' ? '✗ বাতিল' : '⏳ যাচাইয়ের অপেক্ষায়'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-300 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                          <p><strong className="text-gray-400">NID:</strong> <span className="font-mono text-cyan-300">{doc.values?.nid || '—'}</span></p>
                          <p><strong className="text-gray-400">মোবাইল:</strong> <span className="font-mono text-green-300">{doc.values?.phone || '—'}</span></p>
                          <p><strong className="text-gray-400">পেশা:</strong> {doc.values?.occupation || '—'} {doc.values?.organization ? `(${doc.values?.organization})` : ''}</p>
                          <p><strong className="text-gray-400">জমার তারিখ:</strong> {doc.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 self-end md:self-center">
                        <button
                          onClick={() => {
                            setPoliceModalState({
                              isOpen: true,
                              docId: doc.id,
                              values: doc.values || {},
                              status: doc.status
                            });
                          }}
                          className="glass px-3.5 py-2 rounded-xl text-xs font-semibold text-cyan-300 hover:bg-cyan-500/10 transition flex items-center gap-1.5"
                        >
                          <span>✏️</span> বিস্তারিত / সম্পাদন
                        </button>
                        <button
                          onClick={() => printLegalDoc(doc)}
                          className="bg-blue-600 hover:bg-blue-500 px-3.5 py-2 rounded-xl text-xs font-semibold text-white shadow transition flex items-center gap-1.5"
                        >
                          <span>🖨️</span> ডাউনলোড
                        </button>
                      </div>
                    </div>
                  ))}
                  {data.legalDocs.filter(d => d.type === 'policeVerification' && d.room === myRoom).length === 0 && (
                    <div className="p-8 text-center bg-white/5 rounded-2xl border border-dashed border-white/10 space-y-3">
                      <span className="text-4xl block">📋</span>
                      <h4 className="text-base font-bold text-white">এখনো কোনো পুলিশ ভেরিফিকেশন ফরম জমা দেওয়া হয়নি</h4>
                      <p className="text-xs text-gray-400 max-w-md mx-auto">
                        সরকারি ও ডিএমপি নিয়মাবলি অনুযায়ী নতুন বাসায় ওঠার পর বিস্তারিত তথ্যসহ পুলিশ ভেরিফিকেশন ফরম পূরণ করা বাধ্যতামূলক।
                      </p>
                      <button
                        onClick={() => {
                          setPoliceModalState({
                            isOpen: true,
                            values: {
                              applicantName: myPersons[0]?.name || currentUser.name,
                              phone: myPersons[0]?.phone || '',
                              nid: myPersons[0]?.nid || '',
                              presentAddress: `${myRoom}, ${data.flatInfo.name}, ${data.flatInfo.address}`,
                              landlordName: data.flatInfo.ownerName,
                              landlordPhone: data.flatInfo.phone
                            }
                          });
                        }}
                        className="mt-2 bg-indigo-600 hover:bg-indigo-500 px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow transition"
                      >
                        + পুলিশ ভেরিফিকেশন ফরম পূরণ করুন
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {tenantDocSubTab === 'documents' && (
              <div className="space-y-6 pt-2">
                <div className="p-5 bg-indigo-500/10 rounded-2xl border border-indigo-500/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📜</span>
                      <h4 className="font-bold text-base text-white">বাসা ভাড়া চুক্তিপত্র (RENT AGREEMENT)</h4>
                    </div>
                    <p className="text-xs text-gray-300">
                      বাংলাদেশ স্ট্যান্ডার্ড বাসা ভাড়া চুক্তিপত্র (২ পেজ) — রুম {myRoom}, ফ্ল্যাট: {data.flatInfo.name}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const existingAgreement = data.legalDocs.find(d => d.type === 'rentAgreement' && d.room === myRoom);
                      const docToPrint = existingAgreement || {
                        id: 'AGREEMENT-' + myRoom,
                        type: 'rentAgreement' as const,
                        typeName: 'বাসা ভাড়া চুক্তিপত্র',
                        values: {
                          landlordName: data.flatInfo.ownerName,
                          landlordPhone: data.flatInfo.phone,
                          tenantName: myPersons[0]?.name || currentUser.name,
                          tenantPhone: myPersons[0]?.phone || '',
                          tenantNid: myPersons[0]?.nid || '',
                          roomNo: myRoom,
                          monthlyRent: String(myPersons[0]?.rent || myRoomData?.rent || 8000),
                          advanceAmount: String(myPersons[0]?.deposit || myPersons[0]?.rent || 8000),
                          propertyAddress: `${data.flatInfo.name}, ${data.flatInfo.address}`,
                          startDate: myPersons[0]?.moveIn || new Date().toLocaleDateString('bn-BD'),
                          durationMonths: '১১',
                          paymentDate: '৫'
                        },
                        room: myRoom,
                        submittedBy: 'owner' as const,
                        submittedAt: new Date().toISOString(),
                        date: new Date().toLocaleDateString('bn-BD')
                      };
                      printLegalDoc(docToPrint);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow transition flex items-center gap-1.5 flex-shrink-0"
                  >
                    <span>🖨️</span>
                    <span>চুক্তিপত্র দেখুন / ডাউনলোড</span>
                  </button>
                </div>

                <div className="space-y-3 hidden">
                  <h4 className="text-sm font-bold text-gray-200">হাউস রুলস ও ফ্ল্যাটের নিয়মাবলি</h4>
                  <div className="space-y-2">
                    {data.rules.map((rule, idx) => (
                      <div key={idx} className="p-3.5 bg-white/5 rounded-xl text-xs flex gap-3 items-start border border-white/5">
                        <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded">{toBn(idx + 1)}</span>
                        <span className="text-gray-200 pt-0.5">{rule}</span>
                      </div>
                    ))}
                    {data.rules.length === 0 && <p className="text-gray-400 text-center py-6 text-xs">কোনো হাউস রুলস পাওয়া যায়নি</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: HOUSE RULES */}
        {activeTab === 'rules' && (
          <div className="glass rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/10">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl flex-shrink-0">
                📋
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">হাউস রুলস ও নিয়মাবলি</h3>
                <p className="text-xs text-gray-400">ফ্ল্যাটের সুস্থ ও সুন্দর পরিবেশ রক্ষার্থে সকলের জন্য পালনীয় নিয়মাবলি</p>
              </div>
            </div>

            <div className="space-y-3">
              {data.rules.map((rule, idx) => (
                <div key={idx} className="p-4 bg-white/5 rounded-xl text-sm flex gap-3 items-start border border-white/5 shadow-sm transition hover:bg-white/10">
                  <span className="text-indigo-400 font-bold bg-indigo-500/10 px-2.5 py-1 rounded-lg flex-shrink-0">{toBn(idx + 1)}</span>
                  <span className="text-gray-200 pt-1 leading-relaxed">{rule}</span>
                </div>
              ))}
              {data.rules.length === 0 && <p className="text-gray-400 text-center py-6 text-sm">কোনো হাউস রুলস যুক্ত করা হয়নি।</p>}
            </div>
          </div>
        )}

        {/* TAB: MOVE OUT NOTICE */}
        {activeTab === 'moveOutNotice' && (
          <div className="glass rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center text-2xl flex-shrink-0 border border-amber-500/30">
                  🚪
                </div>
                <div>
                  <h3 className="text-xl font-black text-amber-300">বাসা ছাড়ার ১ মাস পূর্বের নোটিশ</h3>
                  <p className="text-xs text-gray-300">মালিককে ১ মাস পূর্বে প্রস্থান নোটিশ প্রদান ও আবেদন ট্র্যাকিং</p>
                </div>
              </div>

              {!myMoveOutReq && (
                <button
                  onClick={() => setMoveOutNoticeModal({ isOpen: true, targetDate: '', reason: 'ব্যক্তিগত কারণ', note: '' })}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-black font-extrabold text-xs transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 border border-amber-300"
                >
                  <span>🚪</span> এখন নোটিশ জমা দিন
                </button>
              )}
            </div>

            {myMoveOutReq ? (
              <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-500/20 border-2 border-amber-500/50 rounded-2xl p-6 text-xs space-y-4 shadow-xl">
                <div className="flex items-center justify-between font-extrabold text-amber-200 text-sm pb-3 border-b border-amber-500/20">
                  <span className="flex items-center gap-2 text-base">
                    <span>📢</span>
                    <span>বাসা ছাড়ার লিখিত নোটিশ জমা রয়েছে</span>
                  </span>
                  <span className="text-xs bg-amber-500/30 text-amber-200 px-3 py-1 rounded-full uppercase border border-amber-400/30 animate-pulse font-bold">
                    মালিকের অনুমোদনের অপেক্ষায়
                  </span>
                </div>
                
                <div className="bg-black/40 p-4 rounded-xl border border-white/10 space-y-2">
                  <p className="text-gray-200 text-sm">
                    🗓️ প্রস্থান বা বাসা ছাড়ার সম্ভাব্য তারিখ: <strong className="text-amber-300 font-extrabold text-base ml-1">{myMoveOutReq.moveOutDate}</strong>
                  </p>
                  <p className="text-gray-300 text-xs">
                    📝 কারণ ও বিশেষ নোট: <span className="text-white font-semibold">{myMoveOutReq.reason}</span> {myMoveOutReq.note && `(${myMoveOutReq.note})`}
                  </p>
                </div>

                <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-gray-300 text-xs leading-relaxed">
                  💡 আপনার নোটিশটি পাওয়ার সাথে সাথেই মালিকের ড্যাশবোর্ডে সংকেত পাঠানো হয়েছে এবং অ্যাপের পাবলিক খালি রুম পেজে <strong>⏳ {myMoveOutReq.moveOutDate}-এ খালি হবে</strong> হিসেবে আগাম বুকিং উপযোগী তথ্য প্রদর্শন শুরু করা হয়েছে।
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      if (confirm('আপনি কি বাসা ছাড়ার নোটিশটি বাতিল করতে চান?')) {
                        const updated = (data.moveOuts || []).filter(m => m.id !== myMoveOutReq.id);
                        onUpdateData({ ...data, moveOuts: updated });
                        showAlert('বাসা ছাড়ার নোটিশ প্রত্যাহার করা হয়েছে', { type: 'info' });
                      }
                    }}
                    className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 px-4 py-2.5 rounded-xl font-bold transition flex items-center gap-2"
                  >
                    <span>✕</span>
                    <span>নোটিশ সম্পূর্ণ প্রত্যাহার / বাতিল করুন</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-black/20 rounded-2xl border border-dashed border-white/10 space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 mx-auto flex items-center justify-center text-3xl">
                  🚪
                </div>
                <h4 className="text-lg font-bold text-gray-200">আপনি এখনও বাসা ছাড়ার নোটিশ জমা দেননি</h4>
                <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                  বাসা ত্যাগের পূর্বে অন্তত ১ মাস আগে অফিশিয়াল নোটিশ প্রদান করা বাঞ্ছনীয়। নোটিশ প্রদানের জন্য নিচের বাটনটিতে ক্লিক করুন।
                </p>
                <button
                  onClick={() => setMoveOutNoticeModal({ isOpen: true, targetDate: '', reason: 'ব্যক্তিগত কারণ', note: '' })}
                  className="mt-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-black font-black text-xs transition shadow-xl shadow-amber-500/20 inline-flex items-center gap-2 border border-amber-300 animate-bounce"
                  style={{ animationDuration: '3s' }}
                >
                  <span>🚪</span> এখন বাসা ছাড়ার নোটিশ দিন (১ মাস আগে)
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB: NOTICES */}
        {activeTab === 'notices' && (
          <div className="glass rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/10">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-xl flex-shrink-0">
                📢
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">নোটিশ বোর্ড</h3>
                <p className="text-xs text-gray-400">মালিক কর্তৃক প্রকাশিত গুরুত্বপূর্ণ নোটিশ ও ঘোষণাসমূহ</p>
              </div>
            </div>

            <div className="space-y-4">
              {data.notices.map((n) => (
                <div key={n.id} className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-base text-white">{n.title}</h4>
                    <span className="text-xs text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-lg font-semibold">{n.date}</span>
                  </div>
                  <p className="text-sm text-gray-300 whitespace-pre-line">{n.content}</p>
                </div>
              ))}
              {data.notices.length === 0 && (
                <p className="text-gray-400 text-center py-8">কোনো নোটিশ পাওয়া যায়নি</p>
              )}
            </div>
          </div>
        )}

        {/* TAB: KITCHEN DUTY */}
        {activeTab === 'kitchenDuty' && (
          <div className="space-y-6">
            <KitchenDutyCard
              data={data}
              onUpdateData={onUpdateData}
              currentUserRole="tenant"
              currentUserName={activeMemberObj?.name || currentUser.name}
              currentUserRoom={myRoomData?.name}
              showAlert={showAlert}
            />
          </div>
        )}

        {/* TAB: PROFILE & DEPOSITS (UNIFIED) */}
        {/* VISITORS TAB */}
        {activeTab === 'visitors' && (
          <VisitorManager
            visitors={data.visitors || []}
            flatInfo={data.flatInfo}
            rooms={data.rooms}
            tenants={data.tenants}
            currentUserRole="tenant"
            currentUserRoom={myRoom}
            onUpdateVisitors={(newVisitors, notifInfo) => {
              const notifs = notifInfo ? [
                {
                  id: 'NOTIF-' + Date.now(),
                  title: notifInfo.title,
                  message: notifInfo.message,
                  forRole: notifInfo.forRole,
                  room: notifInfo.room,
                  read: false,
                  createdAt: new Date().toISOString()
                },
                ...data.notifications
              ] : data.notifications;

              onUpdateData({
                ...data,
                visitors: newVisitors,
                notifications: notifs
              });
            }}
            showAlert={showAlert}
            showConfirm={showConfirm}
          />
        )}

        {(activeTab === 'profile' || activeTab === 'deposit') && (
          <div className="space-y-6">
            <div className="glass rounded-2xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xl flex-shrink-0">
                    👤
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">প্রোফাইল ও জামানত হিসাব</h3>
                    <p className="text-xs text-gray-400">রুমের সদস্যদের প্রোফাইল ও সিকিউরিটি ডিপোজিট (এডভান্স) এর তথ্য</p>
                  </div>
                </div>

                {/* Sub-tabs */}
                <div className="flex p-1 bg-white/5 rounded-xl border border-white/10 w-full sm:w-auto">
                  <button
                    onClick={() => setTenantProfileSubTab('profile')}
                    className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                      tenantProfileSubTab === 'profile'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <span>👤 সদস্য ও রুম প্রোফাইল</span>
                  </button>
                  <button
                    onClick={() => setTenantProfileSubTab('deposit')}
                    className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                      tenantProfileSubTab === 'deposit'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <span>💰 জামানত (এডভান্স)</span>
                  </button>
                </div>
              </div>

              {tenantProfileSubTab === 'profile' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                  <div className="glass rounded-2xl p-6 space-y-4 border border-white/10">
                    <h4 className="text-lg font-bold text-white">রুম ও প্রোফাইল তথ্য</h4>
                    
                    <div className="flex flex-col items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/5">
                      <div className="relative group w-24 h-24 rounded-full overflow-hidden border-2 border-cyan-500/30">
                        {activeMemberObj?.photo ? (
                          <img 
                            src={activeMemberObj.photo} 
                            alt={activeMemberObj.name} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-cyan-500/20 to-pink-500/20 flex items-center justify-center text-white text-2xl font-bold">
                            {activeMemberObj?.name ? activeMemberObj.name[0] : '?'}
                          </div>
                        )}
                        <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center cursor-pointer text-[10px] text-white font-semibold">
                          <span>📷 ছবি বদলান</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 10 * 1024 * 1024) {
                                  showAlert('ছবির সাইজ ১০ মেগাবাইটের কম হতে হবে', { type: 'error' });
                                  return;
                                }
                                try {
                                  showAlert('ছবি আপলোড হচ্ছে...', { type: 'info' });
                                  const url = await uploadToCloudinary(file);
                                  const updatedTenants = data.tenants.map(t => {
                                    if (t.room === myRoom && t.name === activeMemberObj.name) {
                                      return { ...t, photo: url };
                                    }
                                    return t;
                                  });
                                  onUpdateData({ ...data, tenants: updatedTenants });
                                  showAlert('প্রোফাইল ছবি সফলভাবে আপডেট করা হয়েছে', { type: 'success' });
                                } catch (err: any) {
                                  showAlert('আপলোড ব্যর্থ হয়েছে: ' + (err?.message || err), { type: 'error' });
                                }
                              }
                            }}
                          />
                        </label>
                      </div>
                      <div className="text-center">
                        <h5 className="font-bold text-white text-base">{activeMemberObj?.name || currentUser.name}</h5>
                        <p className="text-xs text-gray-400">ভাড়াটিয়া প্রোফাইল</p>
                      </div>
                    </div>

                    <div className="p-4 bg-white/5 rounded-xl space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-400">রুম নম্বর:</span><span className="font-bold text-cyan-400">{myRoom}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">ধরন:</span><span>{myRoomData?.type === 'master' ? 'মাস্টার' : myRoomData?.type === 'double' ? 'ডাবল' : 'সিঙ্গেল'}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">মাসিক নির্ধারিত ভাড়া:</span><span className="font-bold text-pink-400">৳ {toBn(myRoomData?.rent || 0)}</span></div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2 pb-1">
                      <div>
                        <h4 className="font-bold text-base flex items-center gap-2 text-white">
                          <span>👥 রুমের সকল সদস্য ({toBn(myPersons.length)} জন)</span>
                        </h4>
                        <p className="text-[11px] text-gray-400">সক্রিয় প্রোফাইল পরিবর্তন করতে কার্ডে ক্লিক করুন</p>
                      </div>
                      <button
                        onClick={handleOpenAddMember}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/30 flex items-center gap-1.5"
                      >
                        <span>+</span> নতুন সদস্য যোগ করুন
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {myPersons.map((p, idx) => {
                        const isActive = p.name === activeMemberObj?.name;
                        return (
                          <div 
                            key={`${p.name}-${p.phone || idx}`} 
                            onClick={() => {
                              setSelectedMemberName(p.name);
                              sessionStorage.setItem('activeMemberName', p.name);
                              showAlert(`স্বাগতম, ${p.name}! আপনার প্রোফাইল সক্রিয় করা হয়েছে।`, { type: 'success' });
                            }}
                            className={`p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-all duration-300 relative overflow-hidden group border ${
                              isActive 
                                ? 'bg-cyan-500/10 border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.15)] scale-[1.01]' 
                                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-center gap-3.5">
                              <div className={`relative group/avatar w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0 border transition-all duration-300 ${
                                isActive ? 'border-cyan-400 scale-105 shadow-md' : 'border-white/10'
                              }`}>
                                {p.photo ? (
                                  <img 
                                    src={p.photo} 
                                    alt={p.name} 
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-sm font-bold text-white bg-indigo-600">
                                    {p.name[0]}
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className={`font-bold text-sm transition-colors ${isActive ? 'text-cyan-300' : 'text-white'}`}>
                                    {p.name}
                                  </p>
                                  {isActive && (
                                    <span className="text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-bold">
                                      ● সক্রিয়
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-300 mt-0.5">📱 {p.phone}</p>
                                <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                                  {p.occupation && <span>💼 {p.occupation}</span>}
                                  {p.nid && <span>• NID: {p.nid}</span>}
                                  {p.bloodGroup && <span className="text-rose-300 font-semibold">• 🩸 {p.bloodGroup}</span>}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1.5 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => setSelectedTenantForDetail(p)}
                                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white text-xs font-semibold transition border border-white/10 flex items-center gap-1"
                                title="বিস্তারিত প্রোফাইল দেখুন"
                              >
                                <span>🔍</span> <span className="hidden sm:inline">বিস্তারিত</span>
                              </button>
                              <button
                                onClick={() => handleOpenEditMember(p)}
                                className="px-2.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 hover:text-indigo-100 text-xs font-semibold transition border border-indigo-500/30 flex items-center gap-1"
                                title="তথ্য এডিট করুন"
                              >
                                <span>✏️</span> <span className="hidden sm:inline">এডিট</span>
                              </button>
                              {myPersons.length > 1 && (
                                <button
                                  onClick={() => handleDeleteMember(p.name)}
                                  className="px-2 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 hover:text-rose-200 text-xs font-semibold transition border border-rose-500/20"
                                  title="সদস্য রিমুভ করুন"
                                >
                                  <span>🗑️</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="glass rounded-2xl p-6 space-y-4 border border-white/10">
                    <h4 className="text-lg font-bold text-white">হাউস রুলস</h4>
                    <div className="space-y-2">
                      {data.rules.map((rule, idx) => (
                        <div key={idx} className="p-3 bg-white/5 rounded-xl text-xs flex gap-2">
                          <span className="text-yellow-400 font-bold">{toBn(idx + 1)}.</span>
                          <span>{rule}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {tenantProfileSubTab === 'deposit' && (() => {
                const myRoomAdvances = data.advances.filter(a => a.room === myRoom);
                const myActiveAdvSum = myRoomAdvances.filter(a => a.status === 'active').reduce((sum, a) => sum + Number(a.amount || 0), 0);
                const totalDeposit = myPersons.reduce((sum, p) => sum + (Number(p.deposit) || 0), 0);

                return (
                  <div className="space-y-6 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 space-y-2">
                        <p className="text-xs text-gray-400 font-semibold">মোট সিকিউরিটি ডিপোজিট (জামানত)</p>
                        <h3 className="text-3xl font-extrabold text-emerald-400">
                          ৳ {toBn(totalDeposit)}
                        </h3>
                        <p className="text-[11px] text-gray-400">বাসায় ওঠার সময় জমাকৃত সিকিউরিটি মানি</p>
                      </div>
                      <div className="p-5 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 space-y-2">
                        <p className="text-xs text-gray-400 font-semibold">মোট জমাকৃত এডভান্স (অগ্রিম)</p>
                        <h3 className="text-3xl font-extrabold text-cyan-400">
                          ৳ {toBn(myActiveAdvSum)}
                        </h3>
                        <p className="text-[11px] text-cyan-300/80">
                          বাসা ছাড়ার শেষ মাসের ভাড়ার সাথে অটো এডজাস্ট হবে
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl flex items-start gap-3">
                      <span className="text-2xl">💡</span>
                      <div className="space-y-1">
                        <h5 className="font-bold text-sm text-cyan-200">অগ্রিম ও জামানত সমন্বয় নিয়মাবলি</h5>
                        <p className="text-xs text-gray-300 leading-relaxed">
                          আপনার জমাকৃত অগ্রিম টাকা (৳ {toBn(myActiveAdvSum)}) বাসা ছাড়ার শেষ মাসের ভাড়ার সাথে স্বয়ংক্রিয়ভাবে সমন্বয় (Adjust) হয়ে যাবে। বাসা ছাড়ার সময় অবশিষ্ট জামানতের টাকা ফেরত প্রদান করা হবে।
                        </p>
                      </div>
                    </div>

                    {/* MOVE OUT REQUEST STATUS OR BUTTON */}
                    {(() => {
                      const myMoveOutReq = (data.moveOuts || []).find(m => m.room === myRoom && (m.status === 'requested' || m.status === 'pending'));
                      if (myMoveOutReq) {
                        return (
                          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2">
                            <div className="flex justify-between items-center">
                              <h5 className="font-bold text-sm text-amber-300 flex items-center gap-2">
                                <span>🚪</span> বাসা ছাড়ার নোটিশ জমা দেওয়া রয়েছে
                              </h5>
                              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full font-bold border border-amber-500/30">
                                ⏳ মালিকের পর্যালোচনার অপেক্ষায়
                              </span>
                            </div>
                            <p className="text-xs text-gray-300">
                              সম্ভাব্য প্রস্থান তারিখ: <strong className="text-white">{myMoveOutReq.moveOutDate}</strong> • বিবরণ: {myMoveOutReq.note || 'অনুরোধকৃত'}
                            </p>
                            <div className="pt-1">
                              <button
                                onClick={() => {
                                  const updated = (data.moveOuts || []).filter(m => m.id !== myMoveOutReq.id);
                                  onUpdateData({ ...data, moveOuts: updated });
                                  showAlert('বাসা ছাড়ার রিকোয়েস্ট বাতিল করা হয়েছে', { type: 'info' });
                                }}
                                className="text-xs text-rose-400 hover:text-rose-300 font-medium underline cursor-pointer"
                              >
                                ✕ বাসা ছাড়ার নোটিশ বাতিল করুন
                              </button>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div>
                            <h5 className="font-bold text-sm text-amber-300 flex items-center gap-2">
                              <span>🚪</span> বাসা ছাড়ার নোটিশ / রিকোয়েস্ট
                            </h5>
                            <p className="text-xs text-gray-400 mt-0.5">
                              বাসা ছেড়ে দেওয়ার পরিকল্পনা থাকলে আগেভাগে মালিককে নোটিশ প্রদান করুন
                            </p>
                          </div>
                          <button
                            onClick={() => setMoveOutNoticeModal({ isOpen: true, targetDate: new Date().toISOString().split('T')[0], reason: 'অন্যত্র বাসা স্থানান্তর', note: '' })}
                            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition shadow"
                          >
                            + নোটিশ পাঠান
                          </button>
                        </div>
                      );
                    })()}

                    {myRoomAdvances.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-bold text-sm text-gray-200">অগ্রিম ভাড়ার বিবরণ (Advance Records)</h4>
                        <div className="space-y-2">
                          {myRoomAdvances.map((adv, idx) => (
                            <div key={idx} className="p-4 bg-white/5 rounded-xl border border-white/10 flex justify-between items-center">
                              <div>
                                <p className="font-bold text-sm text-white">রুম {adv.room} — ৳ {toBn(adv.amount)}</p>
                                <p className="text-xs text-gray-400">{adv.months} মাসের এডভান্স • তারিখ: {adv.date} {adv.note ? `• ${adv.note}` : ''}</p>
                              </div>
                              <span className={`text-xs px-2.5 py-1 rounded font-bold ${adv.status === 'active' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-gray-500/20 text-gray-400'}`}>
                                {adv.status === 'active' ? 'শেষ মাসে সমন্বয়যোগ্য' : 'সমন্বিত/ব্যবহৃত'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <h4 className="font-bold text-sm text-gray-200">সদস্যভিত্তিক জামানতের বিবরণ</h4>
                      {myPersons.map((p, idx) => (
                        <div key={idx} className="p-4 bg-white/5 rounded-xl border border-white/10 flex justify-between items-center">
                          <div>
                            <p className="font-bold text-sm text-white">{p.name}</p>
                            <p className="text-xs text-gray-400">রুম: {p.room} • উঠার তারিখ: {p.moveIn || '—'}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-extrabold text-base text-emerald-400">৳ {toBn(Number(p.deposit) || 0)}</p>
                            <span className="text-[10px] text-gray-400">জামানত জমা</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* INTEGRATED ROOM PHOTO GALLERY & INSPECTION */}
            {(() => {
              const myRoomPhotos = data.photos.filter(p => (p.room === myRoom || (!p.room && p.shared)) && p.shared !== false);
              const filteredRoomPhotos = myRoomPhotos.filter(p => {
                if (photoFilter === 'all') return true;
                const titleLower = p.title.toLowerCase();
                if (photoFilter === 'condition') return titleLower.includes('কন্ডিশন') || titleLower.includes('condition') || titleLower.includes('ইনস্পেকশন');
                if (photoFilter === 'furniture') return titleLower.includes('ফার্নিচার') || titleLower.includes('furniture') || titleLower.includes('খাট');
                if (photoFilter === 'meter') return titleLower.includes('মিটার') || titleLower.includes('meter') || titleLower.includes('বিল');
                return true;
              });

              return (
                <div className="glass rounded-2xl p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-white/10">
                    <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <span>📸 {myRoom}-এর ফটো গ্যালারি ও ইনস্পেকশন</span>
                      </h3>
                      <p className="text-xs text-cyan-400 mt-0.5">রুমের কন্ডিশন, মুভ-ইন ছবি ও মিটার রিডিং প্রমাণাদি</p>
                    </div>
                    <button
                      onClick={() => setIsPhotoUploading(!isPhotoUploading)}
                      className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl text-xs font-bold text-white shadow transition"
                    >
                      {isPhotoUploading ? '✕ বাতিল' : '+ নতুন ছবি আপলোড'}
                    </button>
                  </div>

                  {/* Category filters */}
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { id: 'all', label: 'সব ছবি' },
                      { id: 'condition', label: 'ইনস্পেকশন ও কন্ডিশন' },
                      { id: 'furniture', label: 'ফার্নিচার' },
                      { id: 'meter', label: 'মিটার রিডিং' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setPhotoFilter(tab.id as any)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                          photoFilter === tab.id
                            ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40'
                            : 'glass text-gray-400 hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Upload Box */}
                  {isPhotoUploading && (
                    <div className="p-4 bg-white/5 border border-cyan-500/30 rounded-2xl space-y-3 animate-pop">
                      <p className="text-xs font-bold text-cyan-300">📸 {myRoom}-এর নতুন ছবি আপলোড</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] text-gray-300 mb-1">ক্যাটাগরি</label>
                          <select
                            value={photoCategory}
                            onChange={e => setPhotoCategory(e.target.value as any)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none"
                          >
                            <option value="condition">রুম কন্ডিশন / ইনস্পেকশন</option>
                            <option value="furniture">ফার্নিচার / আসবাবপত্র</option>
                            <option value="meter">বিদ্যুৎ/গ্যাস সাব-মিটার রিডিং</option>
                            <option value="other">অন্যান্য</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] text-gray-300 mb-1">ছবির বিবরণ / ক্যাপশন</label>
                          <input
                            type="text"
                            placeholder="যেমন: জানুয়ারির মিটার রিডিং ছবি"
                            value={photoTitle}
                            onChange={e => setPhotoTitle(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] text-gray-300 mb-1">ছবি ফাইল নির্বাচন করুন (সর্বোচ্চ 10MB)</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 10 * 1024 * 1024) {
                                showAlert('ছবির সাইজ ১০ মেগাবাইটের কম হতে হবে', { type: 'error' });
                                return;
                              }
                              try {
                                const url = await uploadToCloudinary(file);
                                setPhotoData(url);
                              } catch (err: any) {
                                showAlert('আপলোড ব্যর্থ হয়েছে: ' + (err?.message || err), { type: 'error' });
                              }
                            }
                          }}
                          className="w-full text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-cyan-500/20 file:text-cyan-300 hover:file:bg-cyan-500/30 cursor-pointer"
                        />
                      </div>

                      {photoData && (
                        <div className="flex items-center gap-3 p-2 bg-black/30 rounded-xl border border-white/10">
                          <img src={photoData} alt="Preview" className="w-16 h-16 rounded-lg object-cover border border-white/20" />
                          <div className="text-xs flex-1">
                            <p className="font-semibold text-white">{photoTitle || `${myRoom} ছবি`}</p>
                            <p className="text-[10px] text-emerald-400">আপলোডের জন্য প্রস্তুত</p>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end pt-2">
                        <button
                          onClick={() => {
                            if (!photoData) return;
                            const categoryTag = photoCategory === 'condition' ? '[কন্ডিশন]' : photoCategory === 'furniture' ? '[ফার্নিচার]' : photoCategory === 'meter' ? '[মিটার]' : '';
                            const fullTitle = `${categoryTag} ${photoTitle.trim() || `${myRoom} ছবি`}`.trim();
                            const newPhoto: PhotoItem = {
                              id: 'PH-' + Date.now(),
                              title: fullTitle,
                              room: myRoom,
                              shared: true,
                              data: photoData,
                              uploadedAt: new Date().toISOString(),
                              date: new Date().toLocaleDateString('bn-BD')
                            };
                            onUpdateData({
                              ...data,
                              photos: [newPhoto, ...data.photos],
                              notifications: [
                                {
                                  id: 'NOTIF-' + Date.now(),
                                  forRole: 'owner',
                                  title: 'নতুন রুম ফটো আপলোড',
                                  message: `${myRoom} থেকে "${fullTitle}" ছবি আপলোড করা হয়েছে`,
                                  read: false,
                                  createdAt: new Date().toISOString()
                                },
                                ...data.notifications
                              ]
                            });
                            setPhotoData('');
                            setPhotoTitle('');
                            setIsPhotoUploading(false);
                            showAlert('ছবি সফলভাবে আপলোড করা হয়েছে!', { type: 'success' });
                          }}
                          disabled={!photoData}
                          className={`px-5 py-2 rounded-xl text-xs font-bold transition shadow ${
                            photoData
                              ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                              : 'bg-white/10 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          সংরক্ষণ করুন
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Photo Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {filteredRoomPhotos.map(photo => (
                      <div
                        key={photo.id}
                        onClick={() => setPreviewPhoto(photo)}
                        className="glass rounded-2xl overflow-hidden group cursor-pointer border border-white/10 hover:border-cyan-400 transition bg-black/20"
                      >
                        <div className="h-28 w-full overflow-hidden relative bg-black/40">
                          <img
                            src={photo.data}
                            alt={photo.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        </div>
                        <div className="p-2.5">
                          <p className="text-xs font-bold text-white truncate" title={photo.title}>{photo.title}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{photo.date}</p>
                        </div>
                      </div>
                    ))}

                    {filteredRoomPhotos.length === 0 && (
                      <div className="p-8 text-center bg-white/5 rounded-2xl border border-dashed border-white/10 text-gray-400 text-xs col-span-full">
                        কোনো ছবি পাওয়া যায়নি। নতুন ছবি যোগ করতে উপরের বাটনে ক্লিক করুন।
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </main>

      {/* COMPLAINT MODAL */}
      {complaintForm.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade">
          <div className="relative bg-[#16162a]/95 backdrop-blur-xl rounded-3xl w-full max-w-md p-6 sm:p-7 animate-pop my-8 border border-blue-500/30 shadow-[0_0_40px_rgba(37,99,235,0.2)] overflow-hidden">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-lg">
                  📢
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">নতুন অভিযোগ জমা দিন</h3>
                  <p className="text-xs text-gray-400">রুম: {myRoom} • সরাসরি ফ্ল্যাট মালিককে পাঠানো হবে</p>
                </div>
              </div>
              <button 
                onClick={() => setComplaintForm({ isOpen: false, title: '', desc: '', priority: 'medium', photo: '' })}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">অভিযোগের শিরোনাম *</label>
                <input 
                  type="text" 
                  placeholder="যেমন: অতিরিক্ত শব্দ বা পরিষ্কার-পরিচ্ছন্নতা সমস্যা" 
                  value={complaintForm.title} 
                  onChange={e => setComplaintForm({ ...complaintForm, title: e.target.value })} 
                  className="w-full bg-black/40 border border-white/10 focus:border-blue-500/60 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition" 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">জরুরি মাত্রা (Priority)</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'low', label: 'সাধারণ', color: 'border-blue-500/40 text-blue-300 bg-blue-500/10' },
                    { id: 'medium', label: 'মাঝারি', color: 'border-amber-500/40 text-amber-300 bg-amber-500/10' },
                    { id: 'high', label: 'জরুরি ⚠️', color: 'border-rose-500/40 text-rose-300 bg-rose-500/10' }
                  ].map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setComplaintForm({ ...complaintForm, priority: p.id as any })}
                      className={`py-2 rounded-xl text-xs font-bold border transition ${
                        complaintForm.priority === p.id 
                          ? `${p.color} ring-1 ring-white/20 shadow-md` 
                          : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">বিস্তারিত বিবরণ</label>
                <textarea 
                  rows={3} 
                  placeholder="সমস্যার স্থান ও বিস্তারিত বিবরণ লিখুন..." 
                  value={complaintForm.desc} 
                  onChange={e => setComplaintForm({ ...complaintForm, desc: e.target.value })} 
                  className="w-full bg-black/40 border border-white/10 focus:border-blue-500/60 rounded-2xl p-4 text-sm text-white placeholder-gray-500 outline-none transition" 
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button 
                  type="button"
                  onClick={() => setComplaintForm({ isOpen: false, title: '', desc: '', priority: 'medium', photo: '' })} 
                  className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white py-3 rounded-2xl font-semibold border border-white/10 transition text-sm"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!complaintForm.title.trim()) {
                      showAlert('অনুগ্রহ করে অভিযোগের শিরোনাম লিখুন', { type: 'warning' });
                      return;
                    }
                    const newComplaint: Complaint = {
                      title: complaintForm.title.trim(),
                      room: myRoom,
                      tenantName: myPersons[0]?.name || myRoom,
                      desc: complaintForm.desc.trim(),
                      priority: complaintForm.priority,
                      status: 'pending',
                      date: new Date().toLocaleDateString('bn-BD'),
                      replies: []
                    };
                    onUpdateData({
                      ...data,
                      complaints: [newComplaint, ...data.complaints],
                      notifications: [
                        { id: 'NOTIF-' + Date.now(), forRole: 'owner', title: 'নতুন অভিযোগ', message: `${myRoom} থেকে: ${complaintForm.title}`, read: false, createdAt: new Date().toISOString() },
                        ...data.notifications
                      ]
                    });
                    setComplaintForm({ isOpen: false, title: '', desc: '', priority: 'medium', photo: '' });
                    showAlert('অভিযোগ সফলভাবে জমা দেওয়া হয়েছে!', { type: 'success' });
                  }}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3 rounded-2xl font-bold transition shadow-lg shadow-blue-600/30 text-sm"
                >
                  জমা দিন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAINTENANCE REQUEST MODAL */}
      {maintForm.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade">
          <div className="relative bg-[#16162a]/95 backdrop-blur-xl rounded-3xl w-full max-w-md p-6 sm:p-7 animate-pop my-8 border border-amber-500/30 shadow-[0_0_40px_rgba(245,158,11,0.2)] overflow-hidden">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 text-lg">
                  🛠️
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">নতুন মেরামত রিকোয়েস্ট</h3>
                  <p className="text-xs text-gray-400">রুম: {myRoom} • সার্ভিস ও মেরামত</p>
                </div>
              </div>
              <button 
                onClick={() => setMaintForm({ isOpen: false, title: '', desc: '' })}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">মেরামতের বিষয় *</label>
                <input 
                  type="text" 
                  placeholder="যেমন: বাথরুমের পানির কল নষ্ট বা ফ্যান চলছে না" 
                  value={maintForm.title} 
                  onChange={e => setMaintForm({ ...maintForm, title: e.target.value })} 
                  className="w-full bg-black/40 border border-white/10 focus:border-amber-500/60 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition" 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">ক্যাটাগরি</label>
                <select
                  value={maintForm.desc || 'প্লাম্বিং'}
                  onChange={e => setMaintForm({ ...maintForm, desc: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 focus:border-amber-500/60 rounded-2xl px-4 py-3 text-sm text-white outline-none transition"
                >
                  <option value="প্লাম্বিং">প্লাম্বিং / পানির লাইন</option>
                  <option value="ইলেকট্রিক">ইলেকট্রিক / ফ্যান / লাইট</option>
                  <option value="দরজা-জানালা">দরজা / লক / জানালা</option>
                  <option value="রং ও সিভিল">রং বা দেয়াল মেরামত</option>
                  <option value="অন্যান্য">অন্যান্য মেরামত</option>
                </select>
              </div>

              <div className="flex gap-3 pt-3">
                <button 
                  type="button"
                  onClick={() => setMaintForm({ isOpen: false, title: '', desc: '' })} 
                  className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white py-3 rounded-2xl font-semibold border border-white/10 transition text-sm"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!maintForm.title.trim()) {
                      showAlert('অনুগ্রহ করে মেরামতের বিষয় লিখুন', { type: 'warning' });
                      return;
                    }
                    const newMaint = {
                      id: 'MAINT-' + Date.now(),
                      room: myRoom,
                      title: maintForm.title.trim(),
                      category: maintForm.desc || 'মেরামত',
                      status: 'pending' as const,
                      date: new Date().toLocaleDateString('bn-BD')
                    };
                    onUpdateData({
                      ...data,
                      maints: [newMaint, ...data.maints],
                      notifications: [
                        {
                          id: 'NOTIF-' + Date.now(),
                          forRole: 'owner',
                          title: 'নতুন মেরামত রিকোয়েস্ট',
                          message: `${myRoom} থেকে: ${newMaint.title} (${newMaint.category})`,
                          read: false,
                          createdAt: new Date().toISOString()
                        },
                        ...data.notifications
                      ]
                    });
                    setMaintForm({ isOpen: false, title: '', desc: '' });
                    showAlert('মেরামত রিকোয়েস্ট সফলভাবে জমা দেওয়া হয়েছে!', { type: 'success' });
                  }}
                  className="flex-1 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white py-3 rounded-2xl font-bold transition shadow-lg shadow-amber-600/30 text-sm"
                >
                  রিকোয়েস্ট পাঠান
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INVOICE DISPUTE / ISSUE MODAL */}
      {disputeModal.isOpen && disputeModal.invoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade">
          <div className="relative bg-[#16162a]/95 backdrop-blur-xl rounded-3xl w-full max-w-md p-6 sm:p-7 animate-pop my-8 border border-yellow-500/30 shadow-[0_0_40px_rgba(234,179,8,0.2)] overflow-hidden">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center text-yellow-400 text-lg">
                  ⚠️
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">বিল সংক্রান্ত আপত্তি / রিপোর্ট</h3>
                  <p className="text-xs text-gray-400">{disputeModal.invoice.month} মাসের বিল • রুম: {myRoom}</p>
                </div>
              </div>
              <button 
                onClick={() => setDisputeModal({ isOpen: false, invoice: null, desc: '' })}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10 flex justify-between items-center text-xs">
                <span className="text-gray-400">ইনভয়েস নম্বর:</span>
                <span className="font-mono text-cyan-300 font-semibold">{disputeModal.invoice.id}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">সমস্যার বিস্তারিত বিবরণ *</label>
                <textarea 
                  rows={4} 
                  placeholder="যেমন: সাবমিটার রিডিং ভুল এসেছে অথবা কোনো অতিরিক্ত চার্জ যোগ হয়েছে..." 
                  value={disputeModal.desc} 
                  onChange={e => setDisputeModal({ ...disputeModal, desc: e.target.value })} 
                  className="w-full bg-black/40 border border-white/10 focus:border-yellow-500/60 rounded-2xl p-4 text-sm text-white placeholder-gray-500 outline-none transition" 
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button 
                  type="button"
                  onClick={() => setDisputeModal({ isOpen: false, invoice: null, desc: '' })} 
                  className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white py-3 rounded-2xl font-semibold border border-white/10 transition text-sm"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!disputeModal.desc.trim()) {
                      showAlert('অনুগ্রহ করে সমস্যার বিবরণ লিখুন', { type: 'warning' });
                      return;
                    }
                    const disputeComplaint: Complaint = {
                      title: `[বিল আপত্তি] ${disputeModal.invoice?.month} ইনভয়েস (${disputeModal.invoice?.id})`,
                      room: myRoom,
                      tenantName: myPersons[0]?.name || myRoom,
                      desc: disputeModal.desc.trim(),
                      priority: 'high',
                      status: 'pending',
                      date: new Date().toLocaleDateString('bn-BD'),
                      replies: []
                    };
                    onUpdateData({
                      ...data,
                      complaints: [disputeComplaint, ...data.complaints],
                      notifications: [
                        {
                          id: 'NOTIF-' + Date.now(),
                          forRole: 'owner',
                          title: '⚠️ বিল সংক্রান্ত আপত্তি জমা',
                          message: `${myRoom} থেকে ${disputeModal.invoice?.month} মাসের বিলে সমস্যা রিপোর্ট করা হয়েছে`,
                          read: false,
                          createdAt: new Date().toISOString()
                        },
                        ...data.notifications
                      ]
                    });
                    setDisputeModal({ isOpen: false, invoice: null, desc: '' });
                    showAlert('বিল আপত্তি সফলভাবে মালিকের কাছে পাঠানো হয়েছে!', { type: 'success' });
                  }}
                  className="flex-1 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white py-3 rounded-2xl font-bold transition shadow-lg shadow-yellow-600/30 text-sm"
                >
                  আপত্তি পাঠান
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POLICE VERIFICATION MODAL */}
      <PoliceVerificationModal
        isOpen={policeModalState.isOpen}
        onClose={() => setPoliceModalState(prev => ({ ...prev, isOpen: false }))}
        initialValues={policeModalState.values}
        currentUserRole="tenant"
        flatInfo={data.flatInfo}
        roomNumber={myRoom}
        tenantName={myPersons[0]?.name || currentUser.name}
        tenantPhone={myPersons[0]?.phone || ''}
        tenantNid={myPersons[0]?.nid || ''}
        status={policeModalState.status}
        onSave={(updatedValues) => {
          let updatedDocs = [...data.legalDocs];
          let targetDoc: LegalDoc;

          if (policeModalState.docId) {
            targetDoc = {
              ...data.legalDocs.find(d => d.id === policeModalState.docId)!,
              values: updatedValues,
              submittedAt: new Date().toISOString()
            };
            updatedDocs = updatedDocs.map(d => d.id === policeModalState.docId ? targetDoc : d);
          } else {
            targetDoc = {
              id: 'POLICE-' + Date.now(),
              type: 'policeVerification',
              typeName: 'পুলিশ ভেরিফিকেশন ফরম',
              values: updatedValues,
              room: myRoom,
              submittedBy: 'tenant',
              submittedAt: new Date().toISOString(),
              date: new Date().toLocaleDateString('bn-BD'),
              status: 'pending'
            };
            updatedDocs = [targetDoc, ...updatedDocs];
          }

          onUpdateData({
            ...data,
            legalDocs: updatedDocs,
            notifications: [
              {
                id: 'NOTIF-' + Date.now(),
                forRole: 'owner',
                title: 'পুলিশ ভেরিফিকেশন ফরম আপডেট',
                message: `${myRoom} থেকে বিস্তারিত পুলিশ ভেরিফিকেশন ফরম জমা দেওয়া হয়েছে`,
                read: false,
                createdAt: new Date().toISOString()
              },
              ...data.notifications
            ]
          });

          setPoliceModalState(prev => ({ ...prev, isOpen: false }));
          showAlert('পুলিশ ফরম সফলভাবে সংরক্ষিত হয়েছে! প্রিন্ট/ডাউনলোড ভিউ লোড হচ্ছে...', { type: 'success' });
          setTimeout(() => printLegalDoc(targetDoc), 600);
        }}
        onPrint={(formVals) => {
          printLegalDoc({
            id: policeModalState.docId || 'PREVIEW-' + Date.now(),
            type: 'policeVerification',
            typeName: 'পুলিশ ভেরিফিকেশন ফরম',
            values: formVals,
            room: myRoom,
            submittedBy: 'tenant',
            submittedAt: new Date().toISOString(),
            date: new Date().toLocaleDateString('bn-BD')
          });
        }}
      />

      {/* MOVE OUT REQUEST MODAL FOR TENANT */}
      {moveOutNoticeModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade">
          <div className="relative bg-[#16162a]/95 backdrop-blur-xl rounded-3xl w-full max-w-md p-6 sm:p-7 animate-pop border border-amber-500/30 space-y-4 my-8 shadow-[0_0_40px_rgba(245,158,11,0.2)] overflow-hidden">
            <div className="flex justify-between items-center pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 text-lg">
                  🚪
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">বাসা ছাড়ার নোটিশ / রিকোয়েস্ট</h3>
                  <p className="text-xs text-gray-400">রুম: {myRoom} • নোটিশ সাবমিশন</p>
                </div>
              </div>
              <button onClick={() => setMoveOutNoticeModal({ ...moveOutNoticeModal, isOpen: false })} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition">✕</button>
            </div>

            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-200 leading-relaxed">
              💡 বাসা ছেড়ে দেওয়ার অন্তত ১৫-৩০ দিন পূর্বে নোটিশ দেওয়ার অনুরোধ করা হলো। বাসা ছাড়ার পর সিকিউরিটি ডিপোজিট ও হিসাব স্বয়ংক্রিয়ভাবে সমন্বয় করা হবে।
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">সম্ভাব‍্য প্রস্থানের তারিখ *</label>
                <input
                  type="date"
                  value={moveOutNoticeModal.targetDate}
                  onChange={e => setMoveOutNoticeModal({ ...moveOutNoticeModal, targetDate: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 focus:border-amber-500/60 rounded-2xl px-4 py-3 text-sm outline-none text-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">বাসা ছাড়ার মূল কারণ</label>
                <select
                  value={moveOutNoticeModal.reason}
                  onChange={e => setMoveOutNoticeModal({ ...moveOutNoticeModal, reason: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 focus:border-amber-500/60 rounded-2xl px-4 py-3 text-sm outline-none text-white transition"
                >
                  <option value="অন্যত্র বাসা স্থানান্তর">অন্যত্র বাসা স্থানান্তর</option>
                  <option value="চাকুরি বা পড়াশোনা পরিবর্তন">চাকুরি বা পড়াশোনা পরিবর্তন</option>
                  <option value="নিজ গ্রামে/বাসায় প্রত্যাবর্তন">নিজ গ্রামে/বাসায় প্রত্যাবর্তন</option>
                  <option value="অন্যান্য কারণ">অন্যান্য কারণ</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">নোট / বিস্তারিত মন্তব্য (ঐচ্ছিক)</label>
                <textarea
                  rows={2}
                  placeholder="যেমন: আগামী মাসের ৩০ তারিখের মধ্যে রুম হস্তান্তর করে সিকিউরিটি জমা গ্রহণ করতে চাই।"
                  value={moveOutNoticeModal.note}
                  onChange={e => setMoveOutNoticeModal({ ...moveOutNoticeModal, note: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 focus:border-amber-500/60 rounded-2xl p-3.5 text-sm outline-none text-white placeholder-gray-500 transition"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button onClick={() => setMoveOutNoticeModal({ ...moveOutNoticeModal, isOpen: false })} className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white py-3 rounded-2xl text-sm font-semibold border border-white/10 transition">বাতিল</button>
              <button
                onClick={() => {
                  if (!moveOutNoticeModal.targetDate) {
                    showAlert('অনুগ্রহ করে প্রস্থানের তারিখ সিলেক্ট করুন', { type: 'warning' });
                    return;
                  }
                  const newMoveOutItem: MoveOut = {
                    id: 'MO-' + Date.now(),
                    tenantName: myPersons[0]?.name || currentUser.name,
                    room: myRoom,
                    phone: myPersons[0]?.phone || '',
                    moveOutDate: moveOutNoticeModal.targetDate,
                    refund: Number(myPersons[0]?.deposit || 0),
                    note: `${moveOutNoticeModal.reason}${moveOutNoticeModal.note ? ` — ${moveOutNoticeModal.note}` : ''}`,
                    status: 'requested',
                    createdAt: new Date().toISOString()
                  };
                  const notif = {
                    id: 'NOTIF-' + Date.now(),
                    forRole: 'owner' as const,
                    title: '🚪 বাসা ছাড়ার নোটিশ',
                    message: `রুম ${myRoom} (${newMoveOutItem.tenantName}) বাসা ছাড়ার নোটিশ জমা দিয়েছেন। সম্ভাব্য তারিখ: ${newMoveOutItem.moveOutDate}`,
                    read: false,
                    createdAt: new Date().toISOString()
                  };

                  onUpdateData({
                    ...data,
                    moveOuts: [newMoveOutItem, ...(data.moveOuts || [])],
                    notifications: [notif, ...data.notifications]
                  });

                  setMoveOutNoticeModal({ ...moveOutNoticeModal, isOpen: false });
                  showAlert('বাসা ছাড়ার নোটিশ সফলভাবে মালিকের কাছে পাঠানো হয়েছে!', { type: 'success' });
                }}
                className="flex-1 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 py-3 rounded-2xl text-sm font-bold text-white shadow-lg shadow-amber-600/30 transition"
              >
                নোটিশ জমা দিন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Utility Bill Detailed Breakdown Modal */}
      <UtilityDetailModal
        isOpen={utilityDetailModal.isOpen}
        onClose={() => setUtilityDetailModal({ isOpen: false, invoice: null })}
        invoice={utilityDetailModal.invoice}
        flatInfo={data.flatInfo}
        currentUserRole="tenant"
        onPayClick={(inv) => {
          setActiveTab('submitPayment');
        }}
      />

      {/* Tenant Profile & Room Details Modal */}
      <TenantDetailModal
        isOpen={!!selectedTenantForDetail}
        onClose={() => setSelectedTenantForDetail(null)}
        tenant={selectedTenantForDetail}
        room={data.rooms.find(r => r.name === (selectedTenantForDetail?.room || myRoom))}
        roommates={data.tenants.filter(t => t.room === (selectedTenantForDetail?.room || myRoom))}
        invoices={myInvoices}
        legalDocs={data.legalDocs}
        flatInfo={data.flatInfo}
        onSelectTenant={(t) => setSelectedTenantForDetail(t)}
        onEditTenant={(t) => {
          setSelectedTenantForDetail(null);
          handleOpenEditMember(t);
        }}
        onMoveOut={(t) => {
          setSelectedTenantForDetail(null);
          handleDeleteMember(t.name);
        }}
        onOpenPoliceForm={(t) => {
          setSelectedTenantForDetail(null);
          setActiveTab('police');
        }}
        onUpdatePhoto={async (tenantName, room, photoUrl) => {
          const updatedTenants = data.tenants.map(t => {
            if (t.name === tenantName && t.room === room) {
              return { ...t, photo: photoUrl };
            }
            return t;
          });
          onUpdateData({
            ...data,
            tenants: updatedTenants
          });
          if (selectedTenantForDetail && selectedTenantForDetail.name === tenantName) {
            setSelectedTenantForDetail({ ...selectedTenantForDetail, photo: photoUrl });
          }
          showAlert('মেম্বারের ছবি সফলভাবে পরিবর্তন করা হয়েছে!', { type: 'success' });
        }}
      />

      {/* ROOM MEMBER ADD / EDIT MODAL */}
      {memberModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade">
          <div className="relative bg-[#16162a]/95 backdrop-blur-xl rounded-3xl w-full max-w-lg p-5 sm:p-7 animate-pop border border-blue-500/30 space-y-4 my-8 shadow-[0_0_50px_rgba(59,130,246,0.2)] max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-lg">
                  {memberModal.mode === 'add' ? '➕' : '✏️'}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {memberModal.mode === 'add' ? 'নতুন রুম মেম্বার যোগ করুন' : 'সদস্যের তথ্য আপডেট করুন'}
                  </h3>
                  <p className="text-xs text-cyan-400">রুম: {myRoom} • মেম্বার প্রোফাইল</p>
                </div>
              </div>
              <button
                onClick={() => setMemberModal(prev => ({ ...prev, isOpen: false }))}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            {/* Avatar / Photo Upload */}
            <div className="flex items-center gap-4 p-3.5 bg-white/5 rounded-2xl border border-white/10">
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-indigo-600 border border-white/20 flex items-center justify-center text-xl font-bold flex-shrink-0">
                {memberModal.tenant.photo ? (
                  <img src={memberModal.tenant.photo} alt={memberModal.tenant.name || 'Member'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span>{memberModal.tenant.name?.[0] || '👤'}</span>
                )}
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-xs font-semibold text-white">সদস্যের ছবি (Photo)</p>
                <p className="text-[11px] text-gray-400">ক্লিয়ার পোর্ট্রেট ছবি আপলোড করুন</p>
                <label className="inline-block px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/30 text-cyan-300 rounded-xl text-xs font-semibold cursor-pointer transition">
                  📷 ছবি বেছে নিন
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const url = await uploadToCloudinary(file);
                          setMemberModal(prev => ({ ...prev, tenant: { ...prev.tenant, photo: url } }));
                          showAlert('ছবি আপলোড সফল হয়েছে!', { type: 'success' });
                        } catch (err: any) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            setMemberModal(prev => ({ ...prev, tenant: { ...prev.tenant, photo: reader.result as string } }));
                            showAlert('ছবি যুক্ত হয়েছে!', { type: 'success' });
                          };
                          reader.readAsDataURL(file);
                        }
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="space-y-3.5 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">সদস্যের পূর্ণ নাম *</label>
                  <input
                    type="text"
                    placeholder="যেমন: মোঃ সাকিব হাসান"
                    value={memberModal.tenant.name || ''}
                    onChange={e => setMemberModal(prev => ({ ...prev, tenant: { ...prev.tenant, name: e.target.value } }))}
                    className="w-full bg-black/40 border border-white/10 focus:border-blue-500/60 rounded-xl px-3.5 py-2.5 text-sm outline-none text-white transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">মোবাইল নম্বর *</label>
                  <input
                    type="tel"
                    placeholder="যেমন: 017xxxxxxxx"
                    value={memberModal.tenant.phone || ''}
                    onChange={e => setMemberModal(prev => ({ ...prev, tenant: { ...prev.tenant, phone: e.target.value } }))}
                    className="w-full bg-black/40 border border-white/10 focus:border-blue-500/60 rounded-xl px-3.5 py-2.5 text-sm outline-none text-white transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">পেশা / পদবী</label>
                  <input
                    type="text"
                    placeholder="যেমন: সফটওয়্যার ইঞ্জিনিয়ার / ছাত্র"
                    value={memberModal.tenant.occupation || ''}
                    onChange={e => setMemberModal(prev => ({ ...prev, tenant: { ...prev.tenant, occupation: e.target.value } }))}
                    className="w-full bg-black/40 border border-white/10 focus:border-blue-500/60 rounded-xl px-3.5 py-2.5 text-sm outline-none text-white transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">প্রতিষ্ঠান / কর্মস্থল</label>
                  <input
                    type="text"
                    placeholder="যেমন: ঢাকা বিশ্ববিদ্যালয়"
                    value={memberModal.tenant.workplace || ''}
                    onChange={e => setMemberModal(prev => ({ ...prev, tenant: { ...prev.tenant, workplace: e.target.value } }))}
                    className="w-full bg-black/40 border border-white/10 focus:border-blue-500/60 rounded-xl px-3.5 py-2.5 text-sm outline-none text-white transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">জাতীয় পরিচয়পত্র / জন্ম নিবন্ধন নং</label>
                  <input
                    type="text"
                    placeholder="NID / BRN নম্বর"
                    value={memberModal.tenant.nid || ''}
                    onChange={e => setMemberModal(prev => ({ ...prev, tenant: { ...prev.tenant, nid: e.target.value } }))}
                    className="w-full bg-black/40 border border-white/10 focus:border-blue-500/60 rounded-xl px-3.5 py-2.5 text-sm outline-none text-white transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">রক্তের গ্রুপ</label>
                  <select
                    value={memberModal.tenant.bloodGroup || ''}
                    onChange={e => setMemberModal(prev => ({ ...prev, tenant: { ...prev.tenant, bloodGroup: e.target.value } }))}
                    className="w-full bg-black/40 border border-white/10 focus:border-blue-500/60 rounded-xl px-3.5 py-2.5 text-sm outline-none text-white transition"
                  >
                    <option value="">নির্বাচন করুন (ঐচ্ছিক)</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">পিতার নাম</label>
                  <input
                    type="text"
                    placeholder="পিতার নাম"
                    value={memberModal.tenant.fatherName || ''}
                    onChange={e => setMemberModal(prev => ({ ...prev, tenant: { ...prev.tenant, fatherName: e.target.value } }))}
                    className="w-full bg-black/40 border border-white/10 focus:border-blue-500/60 rounded-xl px-3.5 py-2.5 text-sm outline-none text-white transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">মাতার নাম</label>
                  <input
                    type="text"
                    placeholder="মাতার নাম"
                    value={memberModal.tenant.motherName || ''}
                    onChange={e => setMemberModal(prev => ({ ...prev, tenant: { ...prev.tenant, motherName: e.target.value } }))}
                    className="w-full bg-black/40 border border-white/10 focus:border-blue-500/60 rounded-xl px-3.5 py-2.5 text-sm outline-none text-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">স্থায়ী ঠিকানা</label>
                <input
                  type="text"
                  placeholder="গ্রাম/রোড, থানা, জেলা"
                  value={memberModal.tenant.permanentAddress || ''}
                  onChange={e => setMemberModal(prev => ({ ...prev, tenant: { ...prev.tenant, permanentAddress: e.target.value } }))}
                  className="w-full bg-black/40 border border-white/10 focus:border-blue-500/60 rounded-xl px-3.5 py-2.5 text-sm outline-none text-white transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">জরুরি যোগাযোগের ব্যক্তি</label>
                  <input
                    type="text"
                    placeholder="নাম ও সম্পর্ক (যেমন: ভাই)"
                    value={memberModal.tenant.emergencyName || ''}
                    onChange={e => setMemberModal(prev => ({ ...prev, tenant: { ...prev.tenant, emergencyName: e.target.value } }))}
                    className="w-full bg-black/40 border border-white/10 focus:border-blue-500/60 rounded-xl px-3.5 py-2.5 text-sm outline-none text-white transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">জরুরি মোবাইল নম্বর</label>
                  <input
                    type="tel"
                    placeholder="01xxxxxxxxx"
                    value={memberModal.tenant.emergency || ''}
                    onChange={e => setMemberModal(prev => ({ ...prev, tenant: { ...prev.tenant, emergency: e.target.value } }))}
                    className="w-full bg-black/40 border border-white/10 focus:border-blue-500/60 rounded-xl px-3.5 py-2.5 text-sm outline-none text-white transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">ওঠার তারিখ</label>
                  <input
                    type="date"
                    value={memberModal.tenant.moveIn || ''}
                    onChange={e => setMemberModal(prev => ({ ...prev, tenant: { ...prev.tenant, moveIn: e.target.value } }))}
                    className="w-full bg-black/40 border border-white/10 focus:border-blue-500/60 rounded-xl px-3.5 py-2.5 text-sm outline-none text-white transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">সিকিউরিটি জামানত (ঐচ্ছিক ৳)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={memberModal.tenant.deposit ?? ''}
                    onChange={e => setMemberModal(prev => ({ ...prev, tenant: { ...prev.tenant, deposit: e.target.value } }))}
                    className="w-full bg-black/40 border border-white/10 focus:border-blue-500/60 rounded-xl px-3.5 py-2.5 text-sm outline-none text-white transition"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setMemberModal(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white py-3 rounded-2xl text-sm font-semibold border border-white/10 transition"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleSaveMember}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 py-3 rounded-2xl text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2"
              >
                <span>{memberModal.mode === 'add' ? '➕ সদস্য যোগ করুন' : '💾 তথ্য সংরক্ষণ করুন'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PHOTO LIGHTBOX MODAL */}
      {previewPhoto && (
        <div 
          onClick={() => setPreviewPhoto(null)}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade"
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="max-w-3xl w-full max-h-[90vh] bg-[#16162a]/95 backdrop-blur-xl rounded-3xl p-5 sm:p-7 border border-white/20 flex flex-col space-y-4 shadow-2xl animate-pop overflow-hidden"
          >
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-lg">
                  🖼️
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">{previewPhoto.title}</h4>
                  <p className="text-xs text-gray-400">{previewPhoto.room || myRoom} • {previewPhoto.date}</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewPhoto(null)}
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-white text-sm font-bold border border-white/10 transition"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center overflow-hidden rounded-2xl bg-black/70 p-3 border border-white/5">
              <img
                src={previewPhoto.data}
                alt={previewPhoto.title}
                className="max-h-[62vh] max-w-full object-contain rounded-xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (6 columns matching prompt) */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden"
        style={{
          background: 'rgba(15,15,30,0.95)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <div className="grid grid-cols-5 max-w-lg mx-auto">
          {[
            { id: 'overview', label: 'হোম', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3' },
            { id: 'invoices', label: 'বিল', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
            { id: 'submitPayment', label: 'পেমেন্ট', icon: 'M12 4v16m8-8H4' },
            { id: 'visitors', label: 'ভিজিটর', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
            { id: 'profile', label: 'প্রোফাইল', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }
          ].map((btn, index) => {
            const isMiddle = index === 2;
            const isActive = activeTab === btn.id;
            if (isMiddle) {
              return (
                <div key={btn.id} className="relative flex justify-center items-center">
                  <button
                    onClick={() => setActiveTab(btn.id)}
                    className={`absolute -top-5 w-14 h-14 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-300 border-4 border-[#0f0f1e] ${
                      isActive 
                        ? 'bg-blue-600 text-white scale-110' 
                        : 'bg-slate-800 hover:bg-slate-750 text-gray-300'
                    }`}
                  >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={btn.icon} />
                    </svg>
                    <span className="text-[9px] font-bold mt-0.5 leading-none">{btn.label}</span>
                  </button>
                </div>
              );
            }
            return (
              <button
                key={btn.id}
                onClick={() => setActiveTab(btn.id)}
                className={`flex flex-col items-center gap-1 py-3 transition ${
                  isActive ? 'text-cyan-400' : 'text-gray-400 hover:text-white'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={btn.icon} />
                </svg>
                <span className="text-[10px] font-semibold">{btn.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <AppDownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        showAlert={showAlert}
      />
    </div>
  );
};
