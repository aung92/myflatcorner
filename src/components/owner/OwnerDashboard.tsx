import React, { useState, useEffect } from 'react';
import {
  FlatManagerData,
  CurrentUser,
  Room,
  Tenant,
  Invoice,
  Complaint,
  Notice,
  MaintenanceItem,
  DocumentItem,
  PaymentRequest,
  Deposit,
  Advance,
  Visitor,
  PhotoItem,
  LegalDoc
} from '../../types';
import { toBn, OWNER_CREDENTIALS } from '../../lib/storage';
import { uploadToCloudinary, deleteFromCloudinary } from '../../lib/cloudinary';
import { Header } from '../common/Header';
import { printInvoice, printTenantList, printLegalDoc, printUtilitySlip, getInvoiceStats, printReceipt } from '../../lib/printUtils';
import { LEGAL_TEMPLATES } from '../../lib/legalTemplates';
import { PoliceVerificationModal } from '../police/PoliceVerificationModal';
import { UtilityDetailModal } from '../common/UtilityDetailModal';
import { TenantDetailModal } from '../common/TenantDetailModal';
import { UtilityCreationDetailModal } from '../common/UtilityCreationDetailModal';
import { RoomDetailModal } from '../common/RoomDetailModal';
import { KitchenDutyCard } from '../common/KitchenDutyCard';
import { VisitorManager } from '../visitors/VisitorManager';
import { AppDownloadModal } from '../common/AppDownloadModal';

interface OwnerDashboardProps {
  data: FlatManagerData;
  currentUser: CurrentUser;
  onUpdateData: (newData: FlatManagerData) => void;
  onLogout: () => void;
  onNavigatePublic: () => void;
  showAlert: (msg: string, opts?: { title?: string; type?: 'info' | 'success' | 'error' | 'warning' }) => void;
  showConfirm: (msg: string, opts?: { title?: string; okText?: string; cancelText?: string; type?: 'danger' | 'warning' | 'info' }) => Promise<boolean>;
  onOpenNotifications: () => void;
  navTarget?: { tab: string; subTab?: string; timestamp: number; payload?: any } | null;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  data,
  currentUser,
  onUpdateData,
  onLogout,
  onNavigatePublic,
  showAlert,
  showConfirm,
  onOpenNotifications,
  navTarget
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [complaintSubTab, setComplaintSubTab] = useState<'complaints' | 'maintenance'>('complaints');
  const [legalSubTab, setLegalSubTab] = useState<'legal' | 'documents'>('legal');
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  // React to deep navigation targets (e.g. from clicking notifications)
  useEffect(() => {
    if (navTarget && navTarget.tab) {
      setActiveTab(navTarget.tab);
      if (navTarget.subTab) {
        if (navTarget.tab === 'complaints' && (navTarget.subTab === 'complaints' || navTarget.subTab === 'maintenance')) {
          setComplaintSubTab(navTarget.subTab as 'complaints' | 'maintenance');
        }
        if (navTarget.tab === 'legal' && (navTarget.subTab === 'legal' || navTarget.subTab === 'documents')) {
          setLegalSubTab(navTarget.subTab as 'legal' | 'documents');
        }
      }
      if (navTarget.payload?.invoiceId) {
        setSearchInvoice(navTarget.payload.invoiceId);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [navTarget]);

  // Search and Filter states
  const [searchTenant, setSearchTenant] = useState('');
  const [searchInvoice, setSearchInvoice] = useState('');
  const [filterInvoiceStatus, setFilterInvoiceStatus] = useState('all');
  const [filterPayReqStatus, setFilterPayReqStatus] = useState('all');

  // Utilities split state
  const [utilityInput, setUtilityInput] = useState({
    electric: 4560,
    water: 1200,
    gas: 1080,
    wifi: 800,
    garbage: 400,
    service: 1500,
    month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    dueDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0]
  });

  const [meterMode, setMeterMode] = useState(false);
  const [meterInput, setMeterInput] = useState({
    prevUnit: 1200,
    currentUnit: 1680,
    unitRate: 9.5,
    meterNo: 'DPDC-MAIN-01'
  });

  const [utilityDetailModal, setUtilityDetailModal] = useState<{
    isOpen: boolean;
    invoice: Invoice | null;
  }>({
    isOpen: false,
    invoice: null
  });
  const [utilityCreationModalOpen, setUtilityCreationModalOpen] = useState(false);
  const [selectedTenantForDetail, setSelectedTenantForDetail] = useState<Tenant | null>(null);

  // Modal states
  const [roomModal, setRoomModal] = useState<{
    isOpen: boolean;
    index: number;
    name: string;
    type: 'single' | 'double' | 'master';
    rent: number;
    status: 'empty' | 'occupied' | 'owner';
    loginId: string;
    loginPassword: string;
    meterNo: string;
    photos: string[];
    videos: string[];
    sizeSqFt: number;
    floor: string;
    facing: string;
    washroom: 'attached' | 'common';
    balcony: 'attached' | 'none';
    description: string;
  }>({
    isOpen: false,
    index: -1,
    name: '',
    type: 'single',
    rent: 0,
    status: 'empty',
    loginId: '',
    loginPassword: '',
    meterNo: '',
    photos: [],
    videos: [],
    sizeSqFt: 120,
    floor: '',
    facing: '',
    washroom: 'common',
    balcony: 'none',
    description: ''
  });
  const [roomDetailModal, setRoomDetailModal] = useState<Room | null>(null);
  const [tenantModal, setTenantModal] = useState<{ isOpen: boolean; index: number; name: string; fatherName: string; phone: string; room: string; rent: number; occupation: string; nid: string; emergency: string; moveIn: string; deposit: string; photo: string }>({
    isOpen: false, index: -1, name: '', fatherName: '', phone: '', room: '', rent: 0, occupation: '', nid: '', emergency: '', moveIn: '', deposit: '', photo: ''
  });
  const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean; invoice: Invoice | null; amount: number; method: string; trxId?: string; date: string; note: string }>({
    isOpen: false, invoice: null, amount: 0, method: 'নগদ', trxId: '', date: new Date().toISOString().split('T')[0], note: ''
  });
  const [rejectPayReqModal, setRejectPayReqModal] = useState<{ isOpen: boolean; id: string; reason: string }>({ isOpen: false, id: '', reason: '' });
  const [addMaintModal, setAddMaintModal] = useState<{ isOpen: boolean; title: string; room: string; cost: number }>({ isOpen: false, title: '', room: '', cost: 0 });
  const [complaintReplyModal, setComplaintReplyModal] = useState<{ isOpen: boolean; index: number; message: string }>({ isOpen: false, index: -1, message: '' });
  const [maintReplyModal, setMaintReplyModal] = useState<{ isOpen: boolean; index: number; status: 'pending' | 'progress' | 'completed'; message: string }>({ isOpen: false, index: -1, status: 'pending', message: '' });
  const [policeManagerModal, setPoliceManagerModal] = useState(false);
  const [policeModalState, setPoliceModalState] = useState<{
    isOpen: boolean;
    docId?: string;
    room?: string;
    tenantName?: string;
    tenantPhone?: string;
    tenantNid?: string;
    values: Record<string, string>;
    status?: 'pending' | 'verified' | 'rejected';
  }>({
    isOpen: false,
    values: {}
  });
  const [noticeModal, setNoticeModal] = useState<{ isOpen: boolean; index?: number; title: string; desc: string }>({ isOpen: false, index: -1, title: '', desc: '' });
  const [scheduledNoticeModal, setScheduledNoticeModal] = useState({ isOpen: false, title: '', desc: '', date: '' });
  const [docModal, setDocModal] = useState({ isOpen: false, name: '', type: 'pdf' as 'pdf' | 'image' | 'other', shared: true });
  const [ruleModal, setRuleModal] = useState({ isOpen: false, text: '' });
  const [bulkImportModal, setBulkImportModal] = useState({ isOpen: false, text: '' });
  const [rentIncreaseModal, setRentIncreaseModal] = useState<{ isOpen: boolean; tenantIndex: number; newRent: number; reason: string; date: string }>({ isOpen: false, tenantIndex: -1, newRent: 0, reason: '', date: new Date().toISOString().split('T')[0] });
  const [moveOutModal, setMoveOutModal] = useState<{ isOpen: boolean; tenantIndex: number; refund: number; date: string; note: string }>({ isOpen: false, tenantIndex: -1, refund: 0, date: new Date().toISOString().split('T')[0], note: '' });
  const [photoUploadModal, setPhotoUploadModal] = useState<{ isOpen: boolean; title: string; room: string; shared: boolean; data: string }>({ isOpen: false, title: '', room: '', shared: true, data: '' });
  const [depositModal, setDepositModal] = useState<{
    isOpen: boolean;
    id?: string;
    isEditing?: boolean;
    room: string;
    type: 'deposit' | 'refund';
    amount: number;
    note: string;
  }>({ isOpen: false, room: '', type: 'deposit', amount: 0, note: '' });

  const [advanceModal, setAdvanceModal] = useState<{
    isOpen: boolean;
    id?: string;
    isEditing?: boolean;
    room: string;
    amount: number;
    months: number;
    note: string;
    status?: 'active' | 'used';
  }>({ isOpen: false, room: '', amount: 0, months: 1, note: '' });
  const [visitorModal, setVisitorModal] = useState({ isOpen: false, name: '', phone: '', room: '', purpose: '' });
  const [legalTemplateModal, setLegalTemplateModal] = useState<{ isOpen: boolean; docId?: string; templateKey: string; values: Record<string, string> }>({ isOpen: false, templateKey: '', values: {} });
  const [autoSplitRoommates, setAutoSplitRoommates] = useState(true);

  // Settings form state
  const [flatSettings, setFlatSettings] = useState({
    name: data.flatInfo.name,
    tagline: data.flatInfo.tagline || 'PREMIUM EDITION',
    ownerName: data.flatInfo.ownerName,
    address: data.flatInfo.address,
    phone: data.flatInfo.phone,
    whatsapp: data.flatInfo.whatsapp || '',
    totalRooms: data.flatInfo.totalRooms,
    mainMeterNo: data.flatInfo.mainMeterNo || 'DPDC-MAIN-01',
    gasMeterNo: data.flatInfo.gasMeterNo || 'TGTD-G-8821',
    waterMeterNo: data.flatInfo.waterMeterNo || 'WASA-W-4402',
    wifiName: data.flatInfo.wifiName || '',
    wifiPassword: data.flatInfo.wifiPassword || '',
    cashEnabled: data.flatInfo.paymentMethods.cash?.enabled !== false,
    bkashEnabled: !!data.flatInfo.paymentMethods.bkash?.enabled,
    bkashNumber: data.flatInfo.paymentMethods.bkash?.number || '',
    nagadEnabled: !!data.flatInfo.paymentMethods.nagad?.enabled,
    nagadNumber: data.flatInfo.paymentMethods.nagad?.number || '',
    reminderDays: data.reminderSettings.days || 7,
    autoInvoice: data.autoInvoiceSettings.enabled,
    ownerPhoto: data.flatInfo.ownerPhoto || '',
    cloudinaryCloudName: data.flatInfo.cloudinaryCloudName || '',
    cloudinaryUploadPreset: data.flatInfo.cloudinaryUploadPreset || '',
    cloudinaryApiKey: data.flatInfo.cloudinaryApiKey || '',
    cloudinaryApiSecret: data.flatInfo.cloudinaryApiSecret || ''
  });

  // Password change states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  // Calculate Utilities
  const occupiedRooms = data.rooms.filter(r => r.status === 'owner' || r.status === 'occupied');
  const occupiedRoomCount = occupiedRooms.length;
  const totalRoomCount = data.rooms.length > 0 ? data.rooms.length : (data.flatInfo.totalRooms || occupiedRoomCount || 1);
  const roomCount = occupiedRoomCount; // fallback alias

  const utilityTotal = Number(utilityInput.electric) + Number(utilityInput.water) + Number(utilityInput.gas) + Number(utilityInput.wifi) + Number(utilityInput.garbage);
  const perRoomUtility = occupiedRoomCount > 0 ? Math.round(utilityTotal / occupiedRoomCount) : 0;
  // Service charge is split room-wise (all rooms), NOT occupied room-wise
  const perRoomService = totalRoomCount > 0 ? Math.round(Number(utilityInput.service) / totalRoomCount) : 0;
  const totalPerRoom = perRoomUtility + perRoomService;
  const grandTotal = utilityTotal + Number(utilityInput.service);

  // Generate Invoices
  const handleGenerateInvoices = async () => {
    if (!utilityInput.month || !utilityInput.dueDate) {
      showAlert('অনুগ্রহ করে মাস এবং Due তারিখ নির্বাচন করুন', { type: 'warning' });
      return;
    }
    if (occupiedRooms.length === 0) {
      showAlert('কোনো অকুপাইড রুম নেই', { type: 'warning' });
      return;
    }
    const existing = data.invoices.filter(i => i.month === utilityInput.month);
    if (existing.length > 0) {
      const ok = await showConfirm(`${utilityInput.month} মাসের ইনভয়েস আগেই তৈরি করা আছে। পুনরায় তৈরি করবেন?`, { type: 'warning' });
      if (!ok) return;
    }

    const filtered = data.invoices.filter(i => i.month !== utilityInput.month);
    const newInvoices: Invoice[] = [];
    const newNotifs = [...data.notifications];

    occupiedRooms.forEach(room => {
      const isOwner = room.status === 'owner';
      const roomPersons = data.tenants.filter(t => t.room === room.name);
      const primary = roomPersons[0];
      const roomRent = isOwner ? 0 : (primary?.rent ? Number(primary.rent) : Number(room.rent) || 0);
      const totalAmount = roomRent + totalPerRoom;

      const utilRatio = occupiedRoomCount > 0 ? 1 / occupiedRoomCount : 0;
      const consumedUnits = meterMode ? Math.max(0, meterInput.currentUnit - meterInput.prevUnit) : 0;
      const perRoomUnits = occupiedRoomCount > 0 ? Math.round(consumedUnits / occupiedRoomCount) : 0;
      const meterInfo = meterMode ? {
        prevUnit: meterInput.prevUnit,
        currentUnit: meterInput.currentUnit,
        consumedUnits: perRoomUnits || consumedUnits,
        unitRate: meterInput.unitRate,
        meterNo: meterInput.meterNo,
        readingDate: utilityInput.dueDate
      } : undefined;

      const occupantsCount = Math.max(1, roomPersons.length);
      const splitRentPerPerson = Math.round(roomRent / occupantsCount);
      const splitUtilPerPerson = Math.round(totalPerRoom / occupantsCount);

      const inv: Invoice = {
        id: 'INV-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase(),
        room: room.name,
        tenantName: isOwner ? '👑 আপনি (মালিক)' : (primary ? primary.name : '—'),
        personCount: roomPersons.length,
        persons: roomPersons.map(p => {
          const pRent = p.rent ? Number(p.rent) : splitRentPerPerson;
          return {
            name: p.name,
            phone: p.phone,
            rentShare: pRent,
            utilityShare: splitUtilPerPerson,
            totalShare: pRent + splitUtilPerPerson,
            paid: 0,
            status: 'due' as const
          };
        }),
        isOwner,
        month: utilityInput.month,
        dueDate: utilityInput.dueDate,
        createdAt: new Date().toISOString(),
        rent: roomRent,
        totalAmount,
        breakdown: {
          electricity: Math.round(Number(utilityInput.electric) * utilRatio),
          water: Math.round(Number(utilityInput.water) * utilRatio),
          gas: Math.round(Number(utilityInput.gas) * utilRatio),
          wifi: Math.round(Number(utilityInput.wifi) * utilRatio),
          garbage: Math.round(Number(utilityInput.garbage) * utilRatio),
          utility: perRoomUtility,
          service: perRoomService,
          electricityMeter: meterInfo
        },
        utilityDetails: {
          calculationType: meterMode ? 'sub_meter' : 'equal_split',
          totalFlatBill: {
            electricity: Number(utilityInput.electric),
            water: Number(utilityInput.water),
            gas: Number(utilityInput.gas),
            wifi: Number(utilityInput.wifi),
            garbage: Number(utilityInput.garbage),
            service: Number(utilityInput.service),
            total: grandTotal
          },
          roomShareRatio: `১/${occupiedRoomCount} (ইউটিলিটি) + ১/${totalRoomCount} (সার্ভিস)`,
          occupiedRoomCount: occupiedRoomCount,
          electricityMeter: meterInfo,
          notes: meterMode ? 'মিটার রিডিং ভিত্তিক বিদ্যুৎ ও সমবণ্টন' : 'ইউটিলিটি অকুপাইড রুম ও সার্ভিস চার্জ সকল রুমে সমবণ্টন'
        },
        payments: [],
        status: 'due'
      };
      newInvoices.push(inv);

      if (!isOwner) {
        newNotifs.push({
          id: 'NOTIF-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          forRole: 'tenant',
          room: room.name,
          type: 'invoice_created',
          title: 'নতুন বিল এসেছে 📄',
          message: `${inv.month} মাসের বিল — ৳ ${totalAmount}`,
          read: false,
          createdAt: new Date().toISOString()
        });
      }
    });

    onUpdateData({
      ...data,
      invoices: [...filtered, ...newInvoices],
      notifications: newNotifs
    });

    showAlert(`${toBn(newInvoices.length)} টি রুমের ইনভয়েস সফলভাবে তৈরি হয়েছে!`, { type: 'success' });
    setActiveTab('invoices');
  };

  // Stats calculation
  const totalPaidInvoices = data.invoices.filter(i => getInvoiceStats(i).status === 'paid').length;
  const totalDueInvoices = data.invoices.filter(i => getInvoiceStats(i).status !== 'paid').length;

  return (
    <div className="flex min-h-screen bg-[#0f0f1e] text-white">
      {/* Sidebar Overlay on mobile */}
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
          <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-lg text-white">আমার ফ্ল্যাট</h1>
            <p className="text-[10px] text-indigo-400 font-semibold tracking-wider">মালিক প্যানেল</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {[
            { id: 'overview', label: 'ওভারভিউ', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3' },
            { id: 'rooms', label: 'রুম', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16' },
            { id: 'tenants', label: 'ভাড়াটিয়া', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', badge: (data.moveOuts || []).filter(m => m.status === 'requested' || m.status === 'pending').length },
            { id: 'utilities', label: 'ইউটিলিটি ও মিটার', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
            { id: 'invoices', label: 'ইনভয়েস ও হিসাব', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
            { id: 'paymentRequests', label: 'পেমেন্ট রিকুয়েস্ট', icon: 'M12 4v16m8-8H4', badge: data.paymentRequests.filter(p => p.status === 'pending').length },
            { id: 'complaints', label: 'অভিযোগ ও মেইনটেন্যান্স', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', badge: (data.complaints.filter(c => c.status === 'pending').length + data.maints.filter(m => m.status === 'pending').length) },
            { id: 'legal', label: 'আইনি ও ডকুমেন্টস', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', badge: data.legalDocs.filter(d => d.type === 'policeVerification' && d.status === 'pending').length },
            { id: 'deposits', label: 'ডিপোজিট ও অগ্রিম', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
            { id: 'visitors', label: 'ভিজিটর লগ', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
            { id: 'notices', label: 'নোটিশ বোর্ড', icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6' },
            { id: 'kitchenDuty', label: 'কিচেন ক্লিন ডিউটি', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
            { id: 'settings', label: 'সেটিংস', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4' }
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
              {!!tab.badge && tab.badge > 0 && (
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-bold">
                  {toBn(tab.badge)}
                </span>
              )}
            </button>
          ))}

          <button
            onClick={onNavigatePublic}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all hover:bg-white/5 text-gray-400 hover:text-cyan-400 text-sm mt-2"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>পাবলিক পোর্টাল</span>
          </button>
          <button
            onClick={() => setShowDownloadModal(true)}
            className="w-full relative overflow-hidden group flex items-center justify-between p-3.5 rounded-2xl bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/20 hover:border-indigo-400/50 transition-all duration-300 text-left mt-3"
          >
            {/* Background Accent overlay */}
            <div className="absolute inset-0 bg-indigo-500/5 group-hover:bg-indigo-500/10 transition-colors duration-300" />
            
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 group-hover:bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:text-indigo-300 transition-all duration-300">
                <svg className="w-5 h-5 transform group-hover:-translate-y-0.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Mobile App</span>
                <span className="text-xs font-bold text-indigo-100 group-hover:text-white transition-colors duration-300">অ্যাপ ডাউনলোড করুন</span>
              </div>
            </div>
            
            <div className="w-6 h-6 rounded-full bg-white/5 group-hover:bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:text-indigo-300 transition-all duration-300 relative z-10">
              <svg className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </nav>

        {/* User Card */}
        <div className="glass rounded-2xl p-3 flex items-center gap-3 mt-4">
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white shadow-xs">
            ম
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{data.flatInfo.ownerName || 'মালিক'}</p>
            <p className="text-xs text-gray-400">ফ্ল্যাট মালিক</p>
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

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 p-4 md:p-8 overflow-y-auto pb-28">
        <Header
          currentUser={currentUser}
          notifications={data.notifications}
          subtitle={
            activeTab === 'overview' ? 'আপনার ফ্ল্যাটের সব তথ্য একনজরে' :
            activeTab === 'rooms' ? 'রুম যোগ, সম্পাদনা ও স্ট্যাটাস' :
            activeTab === 'tenants' ? 'ভাড়াটিয়াদের তথ্য ব্যবস্থাপনা' :
            activeTab === 'moveOutNotices' ? 'ভাড়াটিয়াদের বাসা ছাড়ার ১ মাসের নোটিশ অনুমোদন ও প্রসেস' :
            activeTab === 'utilities' ? 'রুম-ভিত্তিক ইউটিলিটি ভাগ ও ইনভয়েস তৈরি' :
            activeTab === 'invoices' ? 'সব ইনভয়েস ও পেমেন্ট লগ' :
            activeTab === 'paymentRequests' ? 'ভাড়াটিয়াদের জমা দেওয়া পেমেন্ট যাচাই' :
            activeTab === 'complaints' ? 'সমস্যা ট্র্যাক ও সমাধান' :
            activeTab === 'deposits' ? 'জমা ও অগ্রিম পেমেন্ট' :
            activeTab === 'visitors' ? 'ভিজিটর লগ' :
            activeTab === 'gallery' ? 'ফ্ল্যাটের ছবি' :
            activeTab === 'legal' ? 'আইনি ডকুমেন্ট ও পুলিশ ভেরিফিকেশন' :
            activeTab === 'notices' ? 'সব ভাড়াটিয়াকে নোটিশ দিন' :
            activeTab === 'kitchenDuty' ? 'রান্নাঘর পরিচ্ছন্নতা রুটিন ও সদস্য বণ্টন' :
            activeTab === 'documents' ? 'গুরুত্বপূর্ণ ফাইল সংরক্ষণ' :
            activeTab === 'maintenance' ? 'মেরামত ও সার্ভিসের রেকর্ড' : 'ফ্ল্যাট ও হাউস রুলস'
          }
          onRefresh={() => showAlert('ডেটা রিফ্রেশ হয়েছে!', { type: 'success' })}
          onOpenNotifications={onOpenNotifications}
          onOpenMobileMenu={() => setIsSidebarOpen(true)}
          onLogout={onLogout}
        />

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="gradient-border">
              <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-md flex-shrink-0">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs text-purple-400 font-semibold tracking-widest uppercase">আমার ফ্ল্যাট</p>
                    <h3 className="text-xl sm:text-2xl font-bold mt-0.5 sm:mt-1 text-white truncate">{data.flatInfo.name}</h3>
                    <p className="text-gray-400 text-xs sm:text-sm mt-1 flex items-start gap-1">
                      <span className="flex-shrink-0">📍</span>
                      <span className="break-words line-clamp-2 sm:line-clamp-none">{data.flatInfo.address}</span>
                    </p>
                  </div>
                </div>
                <div className="flex sm:justify-end flex-shrink-0">
                  <span className="text-[11px] sm:text-xs px-3 py-1.5 rounded-lg bg-green-400/10 text-green-400 border border-green-400/20 font-medium whitespace-nowrap">
                    ✓ আপনি এখানে থাকেন
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="gradient-border"><div className="p-5"><p className="text-gray-400 text-sm">মোট রুম</p><h3 className="text-3xl font-bold mt-1 text-purple-400">{toBn(data.rooms.length)}</h3></div></div>
              <div className="gradient-border"><div className="p-5"><p className="text-gray-400 text-sm">ভাড়াটিয়া</p><h3 className="text-3xl font-bold mt-1 text-cyan-400">{toBn(data.tenants.length)}</h3></div></div>
              <div className="gradient-border"><div className="p-5"><p className="text-gray-400 text-sm">পরিশোধিত</p><h3 className="text-3xl font-bold mt-1 text-emerald-400">{toBn(totalPaidInvoices)}</h3></div></div>
              <div className="gradient-border"><div className="p-5"><p className="text-gray-400 text-sm">বাকি</p><h3 className="text-3xl font-bold mt-1 text-rose-400">{toBn(totalDueInvoices)}</h3></div></div>
            </div>

            {/* MOVE OUT NOTICES / REQUESTS BANNER ON OVERVIEW */}
            {(data.moveOuts || []).some(m => m.status === 'requested' || m.status === 'pending') && (
              <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-500/20 border-2 border-amber-500/60 rounded-2xl p-5 shadow-xl shadow-amber-500/10 space-y-3">
                <div className="flex items-center justify-between font-extrabold text-amber-200 text-sm pb-2 border-b border-amber-500/30">
                  <span className="flex items-center gap-2">
                    <span className="text-xl">🚪</span>
                    <span>বাসা ছাড়ার ১ মাসের নোটিশ ({toBn((data.moveOuts || []).filter(m => m.status === 'requested' || m.status === 'pending').length)} টি)</span>
                  </span>
                  <span className="text-xs bg-amber-500/30 text-amber-200 font-extrabold px-3 py-1 rounded-full border border-amber-400/40 animate-pulse">
                    নতুন আবেদন
                  </span>
                </div>
                <div className="space-y-3">
                  {(data.moveOuts || []).filter(m => m.status === 'requested' || m.status === 'pending').map((req) => {
                    const tenantIdx = data.tenants.findIndex(t => t.room === req.room || t.name === req.tenantName);
                    const tenantObj = data.tenants[tenantIdx];
                    return (
                      <div key={req.id} className="bg-black/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 border border-amber-500/30 shadow-md">
                        <div>
                          <div className="flex items-center gap-2.5">
                            <span className="font-extrabold text-white text-sm bg-amber-500/20 px-2.5 py-0.5 rounded-lg border border-amber-500/30">রুম {req.room}</span>
                            <span className="text-xs font-bold text-amber-200">👤 {req.tenantName}</span>
                          </div>
                          <p className="text-xs text-gray-200 mt-2">
                            🗓️ সম্ভাব্য প্রস্থানের তারিখ: <strong className="text-amber-300 text-sm">{req.moveOutDate}</strong>
                            {req.note && <span className="block sm:inline sm:ml-2 text-gray-300">• নোট: {req.note}</span>}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => {
                              if (tenantIdx < 0) {
                                if (showAlert) showAlert('ভাড়াটিয়া পাওয়া যায়নি', { type: 'warning' });
                                return;
                              }
                              setMoveOutModal({
                                isOpen: true,
                                tenantIndex: tenantIdx,
                                refund: Number(tenantObj?.deposit) || 0,
                                date: req.moveOutDate,
                                note: req.note || 'ভাড়াটিয়ার প্রস্থান আবেদনের ভিত্তিতে'
                              });
                            }}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white text-xs font-extrabold transition shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 border border-emerald-400/40"
                          >
                            <span>✓</span>
                            <span>অনুমোদন ও হিসাব প্রসেস</span>
                          </button>
                          <button
                            onClick={() => {
                              const updated = data.moveOuts.map(m => m.id === req.id ? { ...m, status: 'rejected' } : m);
                              onUpdateData({ ...data, moveOuts: updated });
                              if (showAlert) showAlert('আবেদন বাতিল করা হয়েছে', { type: 'info' });
                            }}
                            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white text-xs font-bold transition border border-white/10"
                          >
                            ✕ বাতিল
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Kitchen Cleaning Duty Board */}
            <KitchenDutyCard
              data={data}
              onUpdateData={onUpdateData}
              currentUserRole="owner"
              currentUserName="মালিক"
              showAlert={showAlert}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 glass rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg">রুম তালিকা</h3>
                  <button onClick={() => setActiveTab('rooms')} className="text-xs text-indigo-400 hover:underline">সব দেখুন →</button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {data.rooms.map(room => {
                    const notice = (data.moveOuts || []).find(m => m.room === room.name && m.status !== 'rejected');
                    return (
                      <div
                        key={room.name}
                        onClick={() => setRoomDetailModal(room)}
                        className={`glass rounded-xl p-4 text-center cursor-pointer hover:bg-white/10 transition border-2 ${
                          room.status === 'owner' ? 'border-purple-500/40' : notice ? 'border-amber-500/50' : room.status === 'occupied' ? 'border-green-500/30' : 'border-transparent'
                        }`}
                      >
                        <p className="text-base font-bold">{room.name}</p>
                        <p className="text-xs text-gray-400 mt-1">{room.type === 'master' ? 'মাস্টার' : room.type === 'double' ? 'ডাবল' : 'সিঙ্গেল'}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded mt-2 inline-block font-semibold ${
                          room.status === 'owner' ? 'bg-purple-500/20 text-purple-400' : notice ? 'bg-amber-500/20 text-amber-300' : room.status === 'occupied' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {room.status === 'owner' ? '👑 আপনি' : notice ? `⏳ ${notice.moveOutDate || 'আগামী মাসে'} খালি হবে` : room.status === 'occupied' ? 'ভাড়াটিয়া আছে' : 'খালি'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="glass rounded-2xl p-6">
                <h3 className="font-bold text-lg mb-4">পেমেন্ট রিকুয়েস্ট</h3>
                <div className="space-y-3">
                  {data.paymentRequests.slice(0, 4).map(pr => (
                    <div key={pr.id} className="p-3 rounded-xl bg-white/5 text-xs flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{pr.room} — ৳ {toBn(pr.amount)}</p>
                        <p className="text-gray-400 text-[10px]">{pr.method} • {pr.date}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        pr.status === 'approved' ? 'bg-green-500/20 text-green-400' : pr.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {pr.status === 'approved' ? 'অনুমোদিত' : pr.status === 'rejected' ? 'বাতিল' : 'অপেক্ষমাণ'}
                      </span>
                    </div>
                  ))}
                  {data.paymentRequests.length === 0 && <p className="text-gray-400 text-center text-xs py-4">কোনো রিকুয়েস্ট নেই</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ROOMS */}
        {activeTab === 'rooms' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">রুম ব্যবস্থাপনা ({toBn(data.rooms.length)} টি)</h3>
              <button
                onClick={() => setRoomModal({ 
                  isOpen: true, 
                  index: -1, 
                  name: `রুম ${data.rooms.length + 1}`, 
                  type: 'single', 
                  rent: 6000, 
                  status: 'empty', 
                  loginId: '', 
                  loginPassword: '', 
                  meterNo: `Sub-0${data.rooms.length + 1}`,
                  photos: [],
                  videos: [],
                  sizeSqFt: 120,
                  floor: '৪র্থ তলা',
                  facing: 'দক্ষিণমুখী',
                  washroom: 'common',
                  balcony: 'none',
                  description: ''
                })}
                className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl text-sm font-semibold transition shadow-md"
              >
                + নতুন রুম
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.rooms.map((room, i) => {
                const occupants = data.tenants.filter(t => t.room === room.name);
                const roomPhotos = data.photos.filter(p => p.room === room.name || (!p.room && p.shared));
                return (
                  <div
                    key={room.name}
                    onClick={() => setRoomDetailModal(room)}
                    className="glass rounded-2xl p-5 hover:bg-white/10 transition cursor-pointer border border-white/10 group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3" />
                          </svg>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${
                          room.status === 'owner' ? 'bg-purple-500/20 text-purple-400' : (data.moveOuts || []).some(m => m.room === room.name && m.status !== 'rejected') ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : room.status === 'occupied' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {room.status === 'owner' ? '👑 আপনি' : (() => {
                            const notice = (data.moveOuts || []).find(m => m.room === room.name && m.status !== 'rejected');
                            if (notice) return `⏳ ${notice.moveOutDate || 'আগামী মাসে'} খালি হবে`;
                            return room.status === 'occupied' ? 'ভাড়াটিয়া আছে' : 'খালি';
                          })()}
                        </span>
                      </div>
                      <h4 className="text-xl font-bold group-hover:text-purple-400 transition">{room.name}</h4>
                      <p className="text-xs text-gray-400 mt-0.5">{room.type === 'master' ? 'মাস্টার' : room.type === 'double' ? 'ডাবল' : 'সিঙ্গেল'} রুম</p>
                      {room.rent > 0 && <p className="text-sm font-semibold text-pink-400 mt-2">৳ {toBn(room.rent)} / মাস</p>}
                      {occupants.length > 0 ? (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex -space-x-2 overflow-hidden flex-shrink-0">
                            {occupants.slice(0, 4).map((o, idx) => (
                              <div 
                                key={idx} 
                                className="inline-block h-6 w-6 rounded-full ring-2 ring-[#121226] overflow-hidden bg-indigo-600 flex items-center justify-center text-[9px] text-white font-bold" 
                                title={o.name}
                              >
                                {o.photo ? (
                                  <img src={o.photo} alt={o.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <span>{o.initials || o.name[0]}</span>
                                )}
                              </div>
                            ))}
                          </div>
                          <span className="text-xs text-gray-300 truncate">
                            {occupants.map(o => o.name).join(', ')}
                          </span>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 mt-2">
                          👥 {room.status === 'owner' ? '👑 আপনি' : 'কেউ নেই'}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {room.meterNo && (
                          <span className="text-[11px] text-cyan-300 font-mono bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                            <span>🔌 মিটার:</span>
                            <span className="font-bold">{room.meterNo}</span>
                          </span>
                        )}
                        {room.loginId && (
                          <span className="text-[11px] text-emerald-300 font-mono bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                            <span>🔑</span>
                            <span>{room.loginId}</span>
                          </span>
                        )}
                      </div>

                      {/* Integrated Room Photos & Videos Badge */}
                      <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-cyan-300 flex items-center gap-1.5 font-medium">
                            <span>📸</span>
                            <span>{roomPhotos.length > 0 ? `${toBn(roomPhotos.length)}টি ছবি সংরক্ষিত` : 'ছবি নেই'}</span>
                          </span>
                          <span className="text-[10px] text-purple-300 flex items-center gap-1.5 font-medium">
                            <span>🎥</span>
                            <span>{room.videos && room.videos.length > 0 ? `${toBn(room.videos.length)}টি ভিডিও আছে` : 'ভিডিও যোগ করুন'}</span>
                          </span>
                        </div>
                        {(roomPhotos.length > 0 || (room.videos && room.videos.length > 0)) && (
                          <div className="flex -space-x-2">
                            {roomPhotos.slice(0, 3).map(p => (
                              <img key={p.id} src={p.data} alt="" className="w-6 h-6 rounded-full object-cover border border-white/20 shadow-xs" />
                            ))}
                            {room.videos && room.videos.slice(0, 1).map((_, idx) => (
                              <div key={idx} className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-[8px] border border-white/20 shadow-xs">🎥</div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4 pt-3 border-t border-white/10" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => setRoomDetailModal(room)}
                        className="flex-1 text-xs text-cyan-300 hover:bg-cyan-500/10 py-1.5 rounded-lg transition flex items-center justify-center gap-1 font-semibold border border-white/5"
                        title="রুমের বিস্তারিত ও ফটো গ্যালারি"
                      >
                        📊 বিস্তারিত
                      </button>
                      <button
                        onClick={() => setRoomModal({ 
                          isOpen: true, 
                          index: i, 
                          name: room.name, 
                          type: room.type, 
                          rent: room.rent, 
                          status: room.status, 
                          loginId: room.loginId || '', 
                          loginPassword: room.loginPassword || '', 
                          meterNo: room.meterNo || '',
                          photos: room.photos || [],
                          videos: room.videos || [],
                          sizeSqFt: room.sizeSqFt || 120,
                          floor: room.floor || '',
                          facing: room.facing || '',
                          washroom: room.washroom || 'common',
                          balcony: room.balcony || 'none',
                          description: room.description || ''
                        })}
                        className="flex-[1.5] text-xs text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 py-1.5 rounded-lg transition flex items-center justify-center gap-1 font-semibold border border-indigo-500/30"
                        title="রুম ও মিটার সম্পাদনা (ভিডিও আপলোড)"
                      >
                        ✏️ এডিট / ভিডিও
                      </button>
                      <button
                        onClick={async () => {
                          const ok = await showConfirm(`"${room.name}" মুছে ফেলতে চান?`, { type: 'danger' });
                          if (ok) {
                            const updated = data.rooms.filter((_, idx) => idx !== i);
                            onUpdateData({ ...data, rooms: updated });
                            showAlert('রুম মুছে ফেলা হয়েছে', { type: 'success' });
                          }
                        }}
                        className="p-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition"
                        title="মুছুন"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: MOVE OUT NOTICES MANAGEMENT */}
        {activeTab === 'moveOutNotices' && (
          <div className="glass rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center text-2xl flex-shrink-0 border border-amber-500/30">
                  🚪
                </div>
                <div>
                  <h3 className="text-xl font-black text-amber-300">বাসা ছাড়ার নোটিশ ব্যবস্থাপনা</h3>
                  <p className="text-xs text-gray-300">ভাড়াটিয়াদের ১ মাস পূর্বের অগ্রিম প্রস্থান আবেদন অনুমোদন ও প্রসেসিং</p>
                </div>
              </div>
              <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3.5 py-1.5 rounded-full font-bold self-start sm:self-auto">
                পেন্ডিং আবেদন: {toBn((data.moveOuts || []).filter(m => m.status === 'requested' || m.status === 'pending').length)} টি
              </span>
            </div>

            {(data.moveOuts || []).length === 0 ? (
              <div className="text-center py-12 bg-black/20 rounded-2xl border border-dashed border-white/10 space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 mx-auto flex items-center justify-center text-3xl">
                  🚪
                </div>
                <h4 className="text-lg font-bold text-gray-200">কোনো বাসা ছাড়ার নোটিশ আবেদন নেই</h4>
                <p className="text-xs text-gray-400">কোনো ভাড়াটিয়া ১ মাস আগে বাসা ছাড়ার নোটিশ জমা দিলে তা সরাসরি এই তালিকায় ভেসে উঠবে।</p>
              </div>
            ) : (
              <div className="space-y-4">
                {(data.moveOuts || []).map((req) => {
                  const tenantIdx = data.tenants.findIndex(t => t.room === req.room || t.name === req.tenantName);
                  const tenantObj = data.tenants[tenantIdx];
                  const isPending = req.status === 'requested' || req.status === 'pending';

                  return (
                    <div 
                      key={req.id} 
                      className={`p-5 rounded-2xl border transition ${
                        isPending 
                          ? 'bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-500/20 border-amber-500/60 shadow-xl shadow-amber-500/10' 
                          : 'bg-black/40 border-white/10'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                          <div className="w-10 h-10 rounded-2xl bg-amber-500/30 text-amber-200 flex items-center justify-center text-base font-black shrink-0 border border-amber-400/30">
                            {req.room}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-extrabold text-white text-base">{req.tenantName}</h4>
                              <span className="text-xs text-amber-300 font-bold">• রুম {req.room}</span>
                              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-extrabold uppercase border ${
                                isPending 
                                  ? 'bg-amber-500/30 text-amber-200 border-amber-400/40 animate-pulse' 
                                  : req.status === 'approved'
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                    : 'bg-red-500/20 text-red-300 border-red-500/30'
                              }`}>
                                {isPending ? 'পেন্ডিং নোটিশ' : req.status === 'approved' ? 'অনুমোদিত' : 'বাতিলকৃত'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-200 mt-1">
                              🗓️ প্রস্থান বা বাসা ছাড়ার সম্ভাব্য তারিখ: <strong className="text-amber-300 text-sm">{req.moveOutDate}</strong>
                            </p>
                            {req.note && (
                              <p className="text-xs text-gray-300 mt-1 bg-black/30 p-2 rounded-xl border border-white/5">
                                📝 নোট: {req.note}
                              </p>
                            )}
                          </div>
                        </div>

                        {isPending && (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => {
                                if (tenantIdx < 0) {
                                  showAlert('সংশ্লিষ্ট ভাড়াটিয়াকে পাওয়া যায়নি', { type: 'warning' });
                                  return;
                                }
                                setMoveOutModal({
                                  isOpen: true,
                                  tenantIndex: tenantIdx,
                                  refund: Number(tenantObj?.deposit) || 0,
                                  date: req.moveOutDate,
                                  note: req.note || 'ভাড়াটিয়ার প্রস্থান আবেদনের ভিত্তিতে'
                                });
                              }}
                              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white text-xs font-black transition shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 border border-emerald-400/40"
                            >
                              <span>✓</span>
                              <span>অনুমোদন ও হিসাব প্রসেস</span>
                            </button>
                            <button
                              onClick={() => {
                                const updated = data.moveOuts.map(m => m.id === req.id ? { ...m, status: 'rejected' } : m);
                                onUpdateData({ ...data, moveOuts: updated });
                                showAlert('বাসা ছাড়ার রিকোয়েস্ট প্রত্যাখ্যান করা হয়েছে', { type: 'info' });
                              }}
                              className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white text-xs font-bold transition border border-white/10"
                            >
                              ✕ বাতিল
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TENANTS */}
        {activeTab === 'tenants' && (
          <div className="glass rounded-2xl p-6 space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <h3 className="text-xl font-bold">ভাড়াটিয়া তালিকা ({toBn(data.tenants.length)} জন)</h3>
              <div className="flex gap-2 flex-wrap">
                <input
                  type="text"
                  placeholder="খুঁজুন..."
                  value={searchTenant}
                  onChange={e => setSearchTenant(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-500 w-48"
                />
                <button onClick={() => setBulkImportModal({ isOpen: true, text: '' })} className="glass px-4 py-2 rounded-xl text-sm font-semibold hover:bg-white/10">📥 বাল্ক ইমপোর্ট</button>
                <button onClick={() => printTenantList(data.tenants, data.flatInfo)} className="glass px-4 py-2 rounded-xl text-sm font-semibold hover:bg-white/10">🖨️ প্রিন্ট</button>
                <button
                  onClick={() => {
                    const defaultRoom = data.rooms.find(r => r.status !== 'owner')?.name || data.rooms[0]?.name || '';
                    const roomObj = data.rooms.find(r => r.name === defaultRoom);
                    const existingOccupants = data.tenants.filter(t => t.room === defaultRoom);
                    const totalOccupants = existingOccupants.length + 1;
                    const roomRent = Number(roomObj?.rent) || 0;
                    const splitRent = totalOccupants > 0 ? Math.round(roomRent / totalOccupants) : roomRent;

                    setAutoSplitRoommates(true);
                    setTenantModal({
                      isOpen: true,
                      index: -1,
                      name: '',
                      fatherName: '',
                      phone: '',
                      room: defaultRoom,
                      rent: splitRent,
                      occupation: '',
                      nid: '',
                      emergency: '',
                      moveIn: new Date().toISOString().split('T')[0],
                      deposit: String(splitRent),
                      photo: ''
                    });
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl text-sm font-semibold transition"
                >
                  + নতুন
                </button>
              </div>
            </div>

            {/* PENDING MOVE OUT REQUESTS FROM TENANTS */}
            {(data.moveOuts || []).some(m => m.status === 'requested' || m.status === 'pending') && (
              <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-2xl space-y-3 mb-6">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-amber-300 text-sm flex items-center gap-2">
                    <span>🚪</span> বাসা ছাড়ার নোটিশ / আবেদনসমূহ ({toBn(data.moveOuts.filter(m => m.status === 'requested' || m.status === 'pending').length)})
                  </h4>
                  <span className="text-[10px] text-amber-400 font-medium">ভাড়াটিয়া কর্তৃক প্রেরিত প্রস্থান নোটিশ</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {data.moveOuts.filter(m => m.status === 'requested' || m.status === 'pending').map((req) => {
                    const tenantIdx = data.tenants.findIndex(t => t.room === req.room || t.name === req.tenantName);
                    const tenantObj = data.tenants[tenantIdx];

                    return (
                      <div key={req.id} className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full overflow-hidden bg-amber-600/30 border border-amber-500/30 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                              {tenantObj?.photo ? (
                                <img src={tenantObj.photo} alt={req.tenantName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <span>{req.tenantName[0]}</span>
                              )}
                            </div>
                            <span className="font-bold text-white text-sm">{req.tenantName} ({req.room})</span>
                          </div>
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold border border-amber-500/30">আবেদনকৃত</span>
                        </div>
                        <p className="text-gray-300">
                          প্রস্থানের তারিখ: <strong className="text-amber-300">{req.moveOutDate}</strong>
                        </p>
                        {req.note && <p className="text-gray-300 bg-black/20 p-2 rounded-lg italic">"{req.note}"</p>}
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => {
                              if (tenantIdx < 0) {
                                showAlert('সংশ্লিষ্ট ভাড়াটিয়াকে পাওয়া যায়নি', { type: 'warning' });
                                return;
                              }
                              setMoveOutModal({
                                isOpen: true,
                                tenantIndex: tenantIdx,
                                refund: Number(tenantObj?.deposit) || 0,
                                date: req.moveOutDate,
                                note: req.note || 'ভাড়াটিয়ার প্রস্থান আবেদনের ভিত্তিতে'
                              });
                            }}
                            className="flex-1 bg-amber-600 hover:bg-amber-500 px-3 py-1.5 rounded-lg text-white font-bold transition text-center shadow"
                          >
                            ✓ প্রস্থান প্রক্রিয়া শুরু করুন
                          </button>
                          <button
                            onClick={() => {
                              const updated = data.moveOuts.map(m => m.id === req.id ? { ...m, status: 'rejected' } : m);
                              onUpdateData({ ...data, moveOuts: updated });
                              showAlert('বাসা ছাড়ার রিকোয়েস্ট প্রত্যাখ্যান করা হয়েছে', { type: 'info' });
                            }}
                            className="px-3 py-1.5 glass text-gray-300 hover:text-white rounded-lg text-xs"
                          >
                            বাতিল
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 text-left border-b border-white/10">
                    <th className="pb-3 font-medium">ভাড়াটিয়া</th>
                    <th className="pb-3 font-medium">রুম</th>
                    <th className="pb-3 font-medium">ফোন</th>
                    <th className="pb-3 font-medium">ভাড়া</th>
                    <th className="pb-3 font-medium text-right">একশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.tenants
                    .filter(t => t.name.toLowerCase().includes(searchTenant.toLowerCase()) || t.room.toLowerCase().includes(searchTenant.toLowerCase()))
                    .map((t, i) => (
                      <tr 
                        key={i} 
                        onClick={() => setSelectedTenantForDetail(t)}
                        className="hover:bg-white/10 transition cursor-pointer group"
                      >
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full overflow-hidden bg-blue-600 flex items-center justify-center text-xs font-bold text-white shadow group-hover:scale-105 transition-transform">
                              {t.photo ? (
                                <img 
                                  src={t.photo} 
                                  alt={t.name} 
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <span>{t.initials || t.name[0]}</span>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-white group-hover:text-cyan-300 flex items-center gap-1.5">
                                <span>{t.name}</span>
                                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                  বিস্তারিত 🔍
                                </span>
                              </p>
                              {t.nid && <p className="text-[10px] text-gray-400">NID: {t.nid}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-gray-300 font-semibold text-cyan-400">{t.room}</td>
                        <td className="py-4 text-gray-300">{t.phone}</td>
                        <td className="py-4 text-pink-400 font-semibold">৳ {toBn(t.rent)}</td>
                        <td className="py-4 text-right space-x-1 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTenantForDetail(t);
                            }}
                            className="p-1.5 hover:bg-cyan-500/20 rounded-lg text-cyan-300 transition"
                            title="পূর্ণাঙ্গ প্রোফাইল ও অটো-স্প্লিট হিসাব"
                          >
                            👤
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setTenantModal({ isOpen: true, index: i, name: t.name, fatherName: t.fatherName || '', phone: t.phone, room: t.room, rent: t.rent, occupation: t.occupation || '', nid: t.nid || '', emergency: t.emergency || '', moveIn: t.moveIn || '', deposit: String(t.deposit || '') });
                            }}
                            className="p-1.5 hover:bg-white/10 rounded-lg text-indigo-400 transition"
                            title="সম্পাদনা"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRentIncreaseModal({ isOpen: true, tenantIndex: i, newRent: t.rent, reason: '', date: new Date().toISOString().split('T')[0] });
                            }}
                            className="p-1.5 hover:bg-white/10 rounded-lg text-pink-400 transition"
                            title="ভাড়া বৃদ্ধি"
                          >
                            💰
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMoveOutModal({ isOpen: true, tenantIndex: i, refund: Number(t.deposit) || 0, date: new Date().toISOString().split('T')[0], note: '' });
                            }}
                            className="p-1.5 hover:bg-white/10 rounded-lg text-orange-400 transition"
                            title="Move-out"
                          >
                            🚪
                          </button>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              const ok = await showConfirm(`"${t.name}" কে মুছে ফেলতে চান?`, { type: 'danger' });
                              if (ok) {
                                const updated = data.tenants.filter((_, idx) => idx !== i);
                                onUpdateData({ ...data, tenants: updated });
                                showAlert('ভাড়াটিয়া মুছে ফেলা হয়েছে', { type: 'success' });
                              }
                            }}
                            className="p-1.5 hover:bg-white/10 rounded-lg text-red-400 transition"
                            title="মুছুন"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: UTILITIES */}
        {activeTab === 'utilities' && (
          <div className="space-y-6">
            <div className="glass rounded-2xl p-6">
              <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <span>⚡</span> ইউটিলিটি বিল ক্যালকুলেটর ও বিস্তারিত হিসাব
                  </h3>
                  <p className="text-sm text-gray-400 mt-0.5">
                    রুম-ভিত্তিক সমবণ্টন ও সাব-মিটার রিডিং হিসাব — ইনভয়েস ও প্রিন্ট স্লিপ অটো তৈরি হবে
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      const newInvoices: Invoice[] = [...data.invoices];
                      const newNotifs = [...data.notifications];
                      let createdCount = 0;

                      // Generate for current month and past 2 months (total 3 months)
                      for (let i = 2; i >= 0; i--) {
                        const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
                        const year = targetDate.getFullYear();
                        const monthNum = String(targetDate.getMonth() + 1).padStart(2, '0');
                        const monthKey = `${year}-${monthNum}`;

                        // Check if invoices for this month already exist
                        const existingForMonth = newInvoices.filter(inv => inv.month === monthKey);
                        if (existingForMonth.length > 0) {
                          continue; // Skip if already exists
                        }

                        // Use baseline or existing utilityInput amounts
                        const utilTotal = Number(utilityInput.electric) + Number(utilityInput.water) + Number(utilityInput.gas) + Number(utilityInput.wifi) + Number(utilityInput.garbage);
                        const pRoomUtil = occupiedRoomCount > 0 ? Math.round(utilTotal / occupiedRoomCount) : 0;
                        const pRoomServ = totalRoomCount > 0 ? Math.round(Number(utilityInput.service) / totalRoomCount) : 0;
                        const tPerRoom = pRoomUtil + pRoomServ;
                        const utilRatio = occupiedRoomCount > 0 ? 1 / occupiedRoomCount : 0;

                        occupiedRooms.forEach(room => {
                          const isOwner = room.status === 'owner';
                          const roomPersons = data.tenants.filter(t => t.room === room.name);
                          const primary = roomPersons[0];
                          const roomRent = isOwner ? 0 : (primary?.rent ? Number(primary.rent) : Number(room.rent) || 0);
                          const totalAmount = roomRent + tPerRoom;

                          const occupantsCount = Math.max(1, roomPersons.length);
                          const splitRentPerPerson = Math.round(roomRent / occupantsCount);
                          const splitUtilPerPerson = Math.round(tPerRoom / occupantsCount);

                          const dueDateStr = new Date(year, targetDate.getMonth(), 10).toISOString().split('T')[0];

                          const inv: Invoice = {
                            id: 'INV-' + year + monthNum + '-' + room.name + '-' + Math.random().toString(36).substr(2, 4).toUpperCase(),
                            room: room.name,
                            tenantName: isOwner ? '👑 আপনি (মালিক)' : (primary ? primary.name : '—'),
                            personCount: roomPersons.length,
                            persons: roomPersons.map(p => {
                              const pRent = p.rent ? Number(p.rent) : splitRentPerPerson;
                              return {
                                name: p.name,
                                phone: p.phone,
                                rentShare: pRent,
                                utilityShare: splitUtilPerPerson,
                                totalShare: pRent + splitUtilPerPerson,
                                paid: 0,
                                status: 'due' as const
                              };
                            }),
                            isOwner,
                            month: monthKey,
                            dueDate: dueDateStr,
                            createdAt: new Date().toISOString(),
                            rent: roomRent,
                            totalAmount,
                            breakdown: {
                              electricity: Math.round(Number(utilityInput.electric) * utilRatio),
                              water: Math.round(Number(utilityInput.water) * utilRatio),
                              gas: Math.round(Number(utilityInput.gas) * utilRatio),
                              wifi: Math.round(Number(utilityInput.wifi) * utilRatio),
                              garbage: Math.round(Number(utilityInput.garbage) * utilRatio),
                              utility: pRoomUtil,
                              service: pRoomServ
                            },
                            utilityDetails: {
                              calculationType: 'equal_split',
                              totalFlatBill: {
                                electricity: Number(utilityInput.electric),
                                water: Number(utilityInput.water),
                                gas: Number(utilityInput.gas),
                                wifi: Number(utilityInput.wifi),
                                garbage: Number(utilityInput.garbage),
                                service: Number(utilityInput.service),
                                total: utilTotal + Number(utilityInput.service)
                              },
                              roomShareRatio: `১/${occupiedRoomCount}`,
                              occupiedRoomCount: occupiedRoomCount,
                              notes: 'বিগত ৩ মাসের অটো জেনারেটেড ইউটিলিটি ও বিল বিবরণ'
                            },
                            payments: [],
                            status: 'due'
                          };

                          newInvoices.push(inv);
                          createdCount++;

                          if (!isOwner) {
                            newNotifs.push({
                              id: 'NOTIF-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
                              forRole: 'tenant',
                              room: room.name,
                              type: 'invoice_created',
                              title: 'নতুন বিল এসেছে 📄',
                              message: `${monthKey} মাসের বিল — ৳ ${totalAmount}`,
                              read: false,
                              createdAt: new Date().toISOString()
                            });
                          }
                        });
                      }

                      if (createdCount === 0) {
                        showAlert('বিগত ৩ মাসের বিল ইতিমধ্যেই তৈরি করা আছে!', { type: 'info' });
                        return;
                      }

                      onUpdateData({
                        ...data,
                        invoices: newInvoices,
                        notifications: newNotifs
                      });

                      showAlert(`সফলভাবে বিগত ৩ মাসের ইউটিলিটি বিলের বিবরণ (${toBn(createdCount)}টি ইনভয়েস) অটো-ক্রিয়েট করা হয়েছে!`, { type: 'success' });
                      setActiveTab('invoices');
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow"
                    title="বর্তমান মাসসহ বিগত ৩ মাসের ইউটিলিটি বিল এক ক্লিকে অটো-জেনারেট করুন"
                  >
                    <span>⚡</span> বিগত ৩ মাসের বিল অটো-ক্রিয়েট
                  </button>
                  <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setMeterMode(false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      !meterMode ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    🧮 সরাসরি টাকার হিসাব
                  </button>
                  <button
                    type="button"
                    onClick={() => setMeterMode(true)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      meterMode ? 'bg-cyan-600 text-white shadow' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    ⚡ মিটার রিডিং মোড
                  </button>
                </div>
                </div>
              </div>

              {/* Meter Reading Sub-Panel */}
              {meterMode && (
                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 mb-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="font-bold text-sm text-cyan-300 flex items-center gap-1.5">
                      <span>🔌</span> বিদ্যুৎ মিটার রিডিং ক্যালকুলেটর ও মিটার নম্বর
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">কুইক সিলেক্ট:</span>
                      <button
                        type="button"
                        onClick={() => setMeterInput({ ...meterInput, meterNo: data.flatInfo.mainMeterNo || 'DPDC-MAIN-01' })}
                        className="text-[11px] bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 px-2.5 py-1 rounded-lg border border-cyan-500/30 font-mono transition"
                      >
                        মূল মিটার ({data.flatInfo.mainMeterNo || 'MAIN'})
                      </button>
                      {data.rooms.filter(r => r.meterNo).map(r => (
                        <button
                          key={r.name}
                          type="button"
                          onClick={() => setMeterInput({ ...meterInput, meterNo: r.meterNo || '' })}
                          className="text-[11px] bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 px-2.5 py-1 rounded-lg border border-indigo-500/30 font-mono transition"
                        >
                          {r.name} ({r.meterNo})
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-xs text-cyan-300 mb-1 font-semibold flex items-center gap-1">
                        <span>🏷️</span> মিটার নম্বর (Edit Meter No)
                      </label>
                      <input
                        type="text"
                        value={meterInput.meterNo}
                        onChange={e => setMeterInput({ ...meterInput, meterNo: e.target.value })}
                        placeholder="যেমন: DPDC-MAIN-01 বা Sub-02"
                        className="w-full bg-black/40 border border-cyan-500/40 rounded-xl px-3 py-2 text-sm outline-none focus:border-cyan-300 text-cyan-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-300 mb-1">পূর্ববর্তী রিডিং (kWh)</label>
                      <input
                        type="number"
                        value={meterInput.prevUnit}
                        onChange={e => {
                          const prev = Number(e.target.value);
                          const units = Math.max(0, meterInput.currentUnit - prev);
                          const cost = Math.round(units * meterInput.unitRate);
                          setMeterInput({ ...meterInput, prevUnit: prev });
                          setUtilityInput({ ...utilityInput, electric: cost });
                        }}
                        className="w-full bg-black/40 border border-cyan-500/30 rounded-xl px-3 py-2 text-sm outline-none focus:border-cyan-400 text-cyan-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-300 mb-1">বর্তমান রিডিং (kWh)</label>
                      <input
                        type="number"
                        value={meterInput.currentUnit}
                        onChange={e => {
                          const curr = Number(e.target.value);
                          const units = Math.max(0, curr - meterInput.prevUnit);
                          const cost = Math.round(units * meterInput.unitRate);
                          setMeterInput({ ...meterInput, currentUnit: curr });
                          setUtilityInput({ ...utilityInput, electric: cost });
                        }}
                        className="w-full bg-black/40 border border-cyan-500/30 rounded-xl px-3 py-2 text-sm outline-none focus:border-cyan-400 text-cyan-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-300 mb-1">ইউনিট প্রতি দর (৳/Unit)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={meterInput.unitRate}
                        onChange={e => {
                          const rate = Number(e.target.value);
                          const units = Math.max(0, meterInput.currentUnit - meterInput.prevUnit);
                          const cost = Math.round(units * rate);
                          setMeterInput({ ...meterInput, unitRate: rate });
                          setUtilityInput({ ...utilityInput, electric: cost });
                        }}
                        className="w-full bg-black/40 border border-cyan-500/30 rounded-xl px-3 py-2 text-sm outline-none focus:border-cyan-400 text-cyan-200"
                      />
                    </div>
                    <div className="bg-black/30 border border-white/10 rounded-xl p-3 flex flex-col justify-center">
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>ব্যবহৃত ইউনিট:</span>
                        <span className="font-bold text-cyan-300">{toBn(Math.max(0, meterInput.currentUnit - meterInput.prevUnit))} kWh</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-300 mt-1 font-semibold">
                        <span>মোট বিদ্যুৎ:</span>
                        <span className="font-bold text-amber-400">৳ {toBn(Math.round(Math.max(0, meterInput.currentUnit - meterInput.prevUnit) * meterInput.unitRate))}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Utility Bills Input Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
                <div>
                  <label className="block text-xs text-gray-300 mb-1 flex items-center justify-between">
                    <span>⚡ বিদ্যুৎ বিল</span>
                    {roomCount > 0 && <span className="text-[10px] text-cyan-400">রুম প্রতি ৳ {toBn(Math.round(utilityInput.electric / roomCount))}</span>}
                  </label>
                  <input type="number" value={utilityInput.electric || ''} onChange={e => setUtilityInput({ ...utilityInput, electric: Number(e.target.value) })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 font-semibold" />
                </div>
                <div>
                  <label className="block text-xs text-gray-300 mb-1 flex items-center justify-between">
                    <span>💧 পানি বিল</span>
                    {roomCount > 0 && <span className="text-[10px] text-cyan-400">রুম প্রতি ৳ {toBn(Math.round(utilityInput.water / roomCount))}</span>}
                  </label>
                  <input type="number" value={utilityInput.water || ''} onChange={e => setUtilityInput({ ...utilityInput, water: Number(e.target.value) })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 font-semibold" />
                </div>
                <div>
                  <label className="block text-xs text-gray-300 mb-1 flex items-center justify-between">
                    <span>🔥 গ্যাস বিল</span>
                    {roomCount > 0 && <span className="text-[10px] text-cyan-400">রুম প্রতি ৳ {toBn(Math.round(utilityInput.gas / roomCount))}</span>}
                  </label>
                  <input type="number" value={utilityInput.gas || ''} onChange={e => setUtilityInput({ ...utilityInput, gas: Number(e.target.value) })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 font-semibold" />
                </div>
                <div>
                  <label className="block text-xs text-gray-300 mb-1 flex items-center justify-between">
                    <span>📶 ওয়াইফাই</span>
                    {roomCount > 0 && <span className="text-[10px] text-cyan-400">রুম প্রতি ৳ {toBn(Math.round(utilityInput.wifi / roomCount))}</span>}
                  </label>
                  <input type="number" value={utilityInput.wifi || ''} onChange={e => setUtilityInput({ ...utilityInput, wifi: Number(e.target.value) })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 font-semibold" />
                </div>
                <div>
                  <label className="block text-xs text-gray-300 mb-1 flex items-center justify-between">
                    <span>🗑️ ময়লা বিল</span>
                    {roomCount > 0 && <span className="text-[10px] text-cyan-400">রুম প্রতি ৳ {toBn(Math.round(utilityInput.garbage / roomCount))}</span>}
                  </label>
                  <input type="number" value={utilityInput.garbage || ''} onChange={e => setUtilityInput({ ...utilityInput, garbage: Number(e.target.value) })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 font-semibold" />
                </div>
                <div>
                  <label className="block text-xs text-gray-300 mb-1 flex items-center justify-between">
                    <span>🛠️ সার্ভিস চার্জ</span>
                    {totalRoomCount > 0 && <span className="text-[10px] text-green-400">সকল রুম প্রতি ৳ {toBn(perRoomService)} (১/{totalRoomCount})</span>}
                  </label>
                  <input type="number" value={utilityInput.service || ''} onChange={e => setUtilityInput({ ...utilityInput, service: Number(e.target.value) })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 font-semibold" />
                </div>
              </div>

              {/* KPI Summary Cards */}
              <div className="p-5 glass rounded-2xl mb-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-center border border-white/10">
                <div className="bg-black/20 p-3 rounded-xl">
                  <p className="text-xs text-gray-400">মোট ইউটিলিটি বিল</p>
                  <p className="text-xl font-bold text-purple-400 mt-1">৳ {toBn(utilityTotal)}</p>
                </div>
                <div className="bg-black/20 p-3 rounded-xl">
                  <p className="text-xs text-gray-400">অকুপাইড রুম সংখ্যা</p>
                  <p className="text-xl font-bold text-cyan-400 mt-1">{toBn(roomCount)} টি</p>
                </div>
                <div className="bg-black/20 p-3 rounded-xl">
                  <p className="text-xs text-gray-400">রুম প্রতি ইউটিলিটি</p>
                  <p className="text-xl font-bold text-blue-400 mt-1">৳ {toBn(perRoomUtility)}</p>
                </div>
                <div className="bg-black/20 p-3 rounded-xl">
                  <p className="text-xs text-gray-400">রুম প্রতি ইউটিলিটি+সার্ভিস</p>
                  <p className="text-xl font-bold text-emerald-400 mt-1">৳ {toBn(totalPerRoom)}</p>
                </div>
                <div className="bg-black/20 p-3 rounded-xl col-span-2 sm:col-span-1">
                  <p className="text-xs text-gray-400">ফ্ল্যাটের মোট ইউটিলিটি</p>
                  <p className="text-xl font-bold text-amber-400 mt-1">৳ {toBn(grandTotal)}</p>
                </div>
              </div>

              <div className="p-5 glass rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">হিসাবের মাস</label>
                  <input type="month" value={utilityInput.month} onChange={e => setUtilityInput({ ...utilityInput, month: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">পরিশোধের শেষ তারিখ (Due Date)</label>
                  <input type="date" value={utilityInput.dueDate} onChange={e => setUtilityInput({ ...utilityInput, dueDate: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500" />
                </div>
                <button
                  type="button"
                  onClick={() => setUtilityCreationModalOpen(true)}
                  className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 shadow-lg text-sm"
                >
                  🔍 বিস্তারিত হিসাব ও স্প্লিট প্রিভিউ
                </button>
                <button
                  type="button"
                  onClick={handleGenerateInvoices}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 shadow-lg text-sm"
                >
                  ⚡ ইনভয়েস তৈরি ও সেন্ড
                </button>
              </div>
            </div>

            {/* Room-wise split breakdown */}
            <div className="glass rounded-2xl p-6">
              <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
                <div>
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <span>📋</span> রুম-ভিত্তিক ইউটিলিটি হিসাব ও বিস্তারিত স্লিপ
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    প্রতিটি রুমের জন্য পৃথক ইউটিলিটি বিবরণী দেখুন এবং প্রিন্ট করুন
                  </p>
                </div>
                <span className="text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 rounded-lg">
                  মাস: {utilityInput.month} • বণ্টন অনুপাত: ১/{roomCount}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {occupiedRooms.map(room => {
                  const isOwner = room.status === 'owner';
                  const roomPersons = data.tenants.filter(t => t.room === room.name);
                  const primary = roomPersons[0];
                  const roomRent = isOwner ? 0 : (primary?.rent ? Number(primary.rent) : Number(room.rent) || 0);
                  const total = roomRent + totalPerRoom;

                  // Find if an existing invoice exists for this room & month, or build a preview invoice
                  const existingInv = data.invoices.find(i => i.room === room.name && i.month === utilityInput.month);
                  const ratio = roomCount > 0 ? 1 / roomCount : 0;
                  const consumedUnits = meterMode ? Math.max(0, meterInput.currentUnit - meterInput.prevUnit) : 0;
                  const perRoomUnits = roomCount > 0 ? Math.round(consumedUnits / roomCount) : 0;
                  const meterInfo = meterMode ? {
                    prevUnit: meterInput.prevUnit,
                    currentUnit: meterInput.currentUnit,
                    consumedUnits: perRoomUnits || consumedUnits,
                    unitRate: meterInput.unitRate,
                    meterNo: meterInput.meterNo,
                    readingDate: utilityInput.dueDate
                  } : undefined;

                  const previewInvoice: Invoice = existingInv || {
                    id: 'PREVIEW-' + room.name + '-' + utilityInput.month,
                    room: room.name,
                    tenantName: isOwner ? '👑 আপনি (মালিক)' : (primary ? primary.name : '—'),
                    personCount: roomPersons.length,
                    persons: roomPersons.map(p => ({ name: p.name, phone: p.phone })),
                    isOwner,
                    month: utilityInput.month,
                    dueDate: utilityInput.dueDate,
                    createdAt: new Date().toISOString(),
                    rent: roomRent,
                    totalAmount: total,
                    breakdown: {
                      electricity: Math.round(Number(utilityInput.electric) * ratio),
                      water: Math.round(Number(utilityInput.water) * ratio),
                      gas: Math.round(Number(utilityInput.gas) * ratio),
                      wifi: Math.round(Number(utilityInput.wifi) * ratio),
                      garbage: Math.round(Number(utilityInput.garbage) * ratio),
                      utility: perRoomUtility,
                      service: perRoomService,
                      electricityMeter: meterInfo
                    },
                    utilityDetails: {
                      calculationType: meterMode ? 'sub_meter' : 'equal_split',
                      totalFlatBill: {
                        electricity: Number(utilityInput.electric),
                        water: Number(utilityInput.water),
                        gas: Number(utilityInput.gas),
                        wifi: Number(utilityInput.wifi),
                        garbage: Number(utilityInput.garbage),
                        service: Number(utilityInput.service),
                        total: grandTotal
                      },
                      roomShareRatio: `১/${roomCount}`,
                      occupiedRoomCount: roomCount,
                      electricityMeter: meterInfo,
                      notes: meterMode ? 'মিটার রিডিং ভিত্তিক বিদ্যুৎ ও সমবণ্টন' : 'সমবণ্টন ভিত্তিক ইউটিলিটি'
                    },
                    payments: [],
                    status: 'due'
                  };

                  return (
                    <div key={room.name} className={`p-4 rounded-xl border flex flex-col justify-between ${
                      isOwner ? 'bg-purple-500/10 border-purple-500/30' : 'bg-white/5 border-white/10'
                    }`}>
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-base">{room.name}</span>
                            {isOwner ? (
                              <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-md font-semibold">
                                👑 আপনি
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400 font-medium">
                                {primary?.name || 'ভাড়াটিয়া'}
                              </span>
                            )}
                          </div>
                          {existingInv ? (
                            <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-semibold">
                              ইনভয়েস তৈরি আছে
                            </span>
                          ) : (
                            <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-semibold">
                              পূর্বরূপ
                            </span>
                          )}
                        </div>

                        {/* Breakdown line items */}
                        <div className="space-y-1.5 text-xs text-gray-300 bg-black/20 p-3 rounded-xl mb-3">
                          {roomRent > 0 && (
                            <div className="flex justify-between pb-1 border-b border-white/5">
                              <span>🏠 রুম ভাড়া:</span>
                              <span className="text-pink-400 font-semibold">৳ {toBn(roomRent)}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-amber-300/90">⚡ বিদ্যুৎ (১/{roomCount}):</span>
                            <span>৳ {toBn(Math.round(utilityInput.electric * ratio))}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-cyan-300/90">💧 পানি (১/{roomCount}):</span>
                            <span>৳ {toBn(Math.round(utilityInput.water * ratio))}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-orange-300/90">🔥 গ্যাস (১/{roomCount}):</span>
                            <span>৳ {toBn(Math.round(utilityInput.gas * ratio))}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-300/90">📶 ওয়াইফাই:</span>
                            <span>৳ {toBn(Math.round(utilityInput.wifi * ratio))}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">🗑️ ময়লা:</span>
                            <span>৳ {toBn(Math.round(utilityInput.garbage * ratio))}</span>
                          </div>
                          {perRoomService > 0 && (
                            <div className="flex justify-between text-indigo-300">
                              <span>🛠️ সার্ভিস চার্জ:</span>
                              <span>৳ {toBn(perRoomService)}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-bold pt-1.5 border-t border-white/10 text-green-400 text-sm">
                            <span>মোট প্রদেয়:</span>
                            <span>৳ {toBn(total)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Modal & Print Actions */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setUtilityDetailModal({ isOpen: true, invoice: previewInvoice })}
                          className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition"
                        >
                          <span>⚡</span> বিস্তারিত দেখুন
                        </button>
                        <button
                          type="button"
                          onClick={() => printUtilitySlip(previewInvoice, data.flatInfo)}
                          className="bg-white/10 hover:bg-white/20 text-white py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition"
                        >
                          <span>🖨️</span> স্লিপ প্রিন্ট
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: INVOICES */}
        {activeTab === 'invoices' && (
          <div className="glass rounded-2xl p-6 space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div>
                <h3 className="text-xl font-bold">ইনভয়েস সমূহ ({toBn(data.invoices.length)} টি)</h3>
                <p className="text-gray-400 text-xs mt-1">রুম-ভিত্তিক বিল ও পেমেন্ট লগ</p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="খুঁজুন..."
                  value={searchInvoice}
                  onChange={e => setSearchInvoice(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-500 w-48"
                />
                <select
                  value={filterInvoiceStatus}
                  onChange={e => setFilterInvoiceStatus(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-500"
                >
                  <option value="all">সব স্ট্যাটাস</option>
                  <option value="paid">পরিশোধিত</option>
                  <option value="partial">আংশিক</option>
                  <option value="due">বাকি</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {data.invoices
                .filter(inv => {
                  const stats = getInvoiceStats(inv);
                  if (filterInvoiceStatus !== 'all' && stats.status !== filterInvoiceStatus) return false;
                  if (searchInvoice && !inv.room.toLowerCase().includes(searchInvoice.toLowerCase()) && !inv.month.includes(searchInvoice)) return false;
                  return true;
                })
                .map(inv => {
                  const stats = getInvoiceStats(inv);
                  return (
                    <div key={inv.id} className="glass rounded-2xl p-5 border border-white/10">
                      <div className="flex flex-wrap justify-between items-start gap-4 mb-3">
                        <div>
                          <p className="font-bold text-lg">{inv.room} — {inv.month} মাসের বিল</p>
                          <p className="text-xs text-gray-400">প্রাপক: {inv.tenantName} • Due: {inv.dueDate}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs px-3 py-1 rounded-lg font-bold ${
                            stats.status === 'paid' ? 'bg-green-500/20 text-green-400' : stats.status === 'partial' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {stats.status === 'paid' ? '✓ পরিশোধিত' : stats.status === 'partial' ? '◐ আংশিক' : '● বাকি'}
                          </span>
                          <p className="text-2xl font-bold mt-1 text-white">৳ {toBn(stats.total)}</p>
                          {stats.totalPaid > 0 && <p className="text-xs text-green-400">জমা: ৳ {toBn(stats.totalPaid)}</p>}
                          {stats.remaining > 0 && <p className="text-xs text-red-400">বাকি: ৳ {toBn(stats.remaining)}</p>}
                        </div>
                      </div>

                      {/* Breakdown badges */}
                      {inv.breakdown && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-black/25 p-3 rounded-xl border border-white/5 my-2">
                          {inv.rent > 0 && <div className="flex justify-between"><span>🏠 রুম ভাড়া:</span><span className="text-pink-400 font-bold">৳ {toBn(inv.rent)}</span></div>}
                          {inv.breakdown.electricity > 0 && <div className="flex justify-between"><span>⚡ বিদ্যুৎ:</span><span className="font-semibold text-amber-300">৳ {toBn(inv.breakdown.electricity)}</span></div>}
                          {inv.breakdown.water > 0 && <div className="flex justify-between"><span>💧 পানি:</span><span className="text-cyan-300">৳ {toBn(inv.breakdown.water)}</span></div>}
                          {inv.breakdown.gas > 0 && <div className="flex justify-between"><span>🔥 গ্যাস:</span><span className="text-orange-300">৳ {toBn(inv.breakdown.gas)}</span></div>}
                          {inv.breakdown.wifi > 0 && <div className="flex justify-between"><span>📶 ওয়াইফাই:</span><span>৳ {toBn(inv.breakdown.wifi)}</span></div>}
                          {inv.breakdown.garbage > 0 && <div className="flex justify-between"><span>🗑️ ময়লা:</span><span>৳ {toBn(inv.breakdown.garbage)}</span></div>}
                          {inv.breakdown.service > 0 && <div className="flex justify-between"><span>🛠️ সার্ভিস:</span><span>৳ {toBn(inv.breakdown.service)}</span></div>}
                          <div className="flex justify-between border-t sm:border-t-0 sm:border-l border-white/10 pt-1 sm:pt-0 sm:pl-2">
                            <span className="text-gray-300">সর্বমোট:</span>
                            <span className="font-bold text-white">৳ {toBn(stats.total)}</span>
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-2 pt-3 border-t border-white/10">
                        <button
                          onClick={() => setUtilityDetailModal({ isOpen: true, invoice: inv })}
                          className="bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                        >
                          <span>⚡</span> ইউটিলিটি বিস্তারিত
                        </button>
                        {stats.status !== 'paid' && (
                          <button
                            onClick={() => setPaymentModal({ isOpen: true, invoice: inv, amount: stats.remaining, method: 'নগদ', date: new Date().toISOString().split('T')[0], note: '' })}
                            className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1"
                          >
                            + পেমেন্ট যোগ
                          </button>
                        )}
                        <button
                          onClick={() => printInvoice(inv, data.flatInfo)}
                          className="px-4 py-2 rounded-xl text-xs font-semibold text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/10 transition"
                        >
                          📄 ডাউনলোড / প্রিন্ট
                        </button>
                        <button
                          onClick={async () => {
                            const ok = await showConfirm(`এই ইনভয়েসটি মুছে ফেলতে চান?`, { type: 'danger' });
                            if (ok) {
                              const updated = data.invoices.filter(i => i.id !== inv.id);
                              onUpdateData({ ...data, invoices: updated });
                              showAlert('ইনভয়েস মুছে ফেলা হয়েছে', { type: 'success' });
                            }
                          }}
                          className="px-4 py-2 rounded-xl text-xs font-semibold text-red-400 border border-red-500/30 hover:bg-red-500/10 transition"
                        >
                          মুছুন
                        </button>
                      </div>
                    </div>
                  );
                })}
              {data.invoices.length === 0 && <p className="text-gray-400 text-center py-8">কোনো ইনভয়েস তৈরি করা হয়নি</p>}
            </div>
          </div>
        )}

        {/* TAB 6: PAYMENT REQUESTS */}
        {activeTab === 'paymentRequests' && (
          <div className="glass rounded-2xl p-6 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">পেমেন্ট রিকুয়েস্ট ({toBn(data.paymentRequests.length)})</h3>
                <p className="text-xs text-gray-400 mt-1">ভাড়াটিয়াদের জমা দেওয়া পেমেন্ট যাচাই ও অনুমোদন করুন</p>
              </div>
              <select
                value={filterPayReqStatus}
                onChange={e => setFilterPayReqStatus(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none"
              >
                <option value="all">সব</option>
                <option value="pending">⏳ অপেক্ষমাণ</option>
                <option value="approved">✓ অনুমোদিত</option>
                <option value="rejected">✗ বাতিল</option>
              </select>
            </div>

            <div className="space-y-3">
              {data.paymentRequests
                .filter(p => filterPayReqStatus === 'all' || p.status === filterPayReqStatus)
                .map(pr => (
                  <div key={pr.id} className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <p className="text-lg font-bold text-green-400">৳ {toBn(pr.amount)}</p>
                      <p className="text-xs text-gray-300">{pr.room} • {pr.invoiceMonth} • {pr.method}</p>
                      {pr.trxId && <p className="text-xs font-mono text-cyan-400 mt-0.5">TrxID: {pr.trxId}</p>}
                      {pr.note && <p className="text-xs text-gray-400 mt-0.5">নোট: {pr.note}</p>}
                      <p className="text-[10px] text-gray-500 mt-1">জমা: {pr.date}</p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      {pr.status === 'pending' ? (
                        <>
                          <button
                            onClick={async () => {
                              const ok = await showConfirm(`৳ ${toBn(pr.amount)} পেমেন্ট অনুমোদন করবেন?`, { type: 'info' });
                              if (ok) {
                                // Add to invoice
                                const updatedInvoices = data.invoices.map(inv => {
                                  if (inv.id === pr.invoiceId) {
                                    return {
                                      ...inv,
                                      payments: [
                                        ...(inv.payments || []),
                                        {
                                          id: 'PAY-' + Date.now(),
                                          amount: pr.amount,
                                          date: pr.date,
                                          method: pr.method,
                                          trxId: pr.trxId,
                                          note: pr.note || (pr.trxId ? `TrxID: ${pr.trxId}` : '')
                                        }
                                      ]
                                    };
                                  }
                                  return inv;
                                });
                                const updatedReqs = data.paymentRequests.map(p => p.id === pr.id ? { ...p, status: 'approved' as const, approvedAt: new Date().toISOString() } : p);
                                onUpdateData({ ...data, invoices: updatedInvoices, paymentRequests: updatedReqs });
                                showAlert('পেমেন্ট অনুমোদিত ও ইনভয়েসে যুক্ত হয়েছে!', { type: 'success' });
                              }
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-xl text-xs font-semibold transition"
                          >
                            ✓ অনুমোদন
                          </button>
                          <button
                            onClick={() => setRejectPayReqModal({ isOpen: true, id: pr.id, reason: '' })}
                            className="glass px-4 py-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10"
                          >
                            ✗ বাতিল
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-3 py-1 rounded-lg font-bold ${pr.status === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {pr.status === 'approved' ? '✓ অনুমোদিত' : '✗ বাতিল'}
                          </span>
                          {pr.status === 'approved' && (() => {
                            const relInv = data.invoices.find(i => i.id === pr.invoiceId);
                            if (relInv) {
                              const matchingPayment = (relInv.payments || []).find(p => p.trxId === pr.trxId || p.amount === pr.amount);
                              if (matchingPayment) {
                                return (
                                  <button
                                    onClick={() => printReceipt(matchingPayment, relInv, data.flatInfo)}
                                    className="glass px-2.5 py-1 rounded-lg text-xs font-semibold text-cyan-300 hover:bg-cyan-500/10 flex items-center gap-1"
                                  >
                                    <span>🧾</span> রিসিট
                                  </button>
                                );
                              }
                            }
                            return null;
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              {data.paymentRequests.length === 0 && <p className="text-gray-400 text-center py-6">কোনো পেমেন্ট রিকুয়েস্ট নেই</p>}
            </div>
          </div>
        )}

        {/* TAB 7: COMPLAINTS & MAINTENANCE (UNIFIED) */}
        {(activeTab === 'complaints' || activeTab === 'maintenance') && (
          <div className="glass rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center text-xl flex-shrink-0">
                  🛠️
                </div>
                <div>
                  <h3 className="text-xl font-bold">অভিযোগ ও মেইনটেন্যান্স</h3>
                  <p className="text-xs text-gray-400">ভাড়াটিয়াদের অভিযোগ ও ফ্ল্যাট মেরামতের সমন্বিত ড্যাশবোর্ড</p>
                </div>
              </div>

              {/* Sub-tab Navigation */}
              <div className="flex p-1 bg-white/5 rounded-xl border border-white/10 w-full sm:w-auto">
                <button
                  onClick={() => setComplaintSubTab('complaints')}
                  className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                    complaintSubTab === 'complaints'
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <span>🚨 ভাড়াটিয়াদের অভিযোগ</span>
                  <span className="px-1.5 py-0.2 bg-black/30 rounded text-[10px]">{toBn(data.complaints.length)}</span>
                </button>
                <button
                  onClick={() => setComplaintSubTab('maintenance')}
                  className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                    complaintSubTab === 'maintenance'
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <span>🔧 ফ্ল্যাট মেইনটেন্যান্স লগ</span>
                  <span className="px-1.5 py-0.2 bg-black/30 rounded text-[10px]">{toBn(data.maints.length)}</span>
                </button>
              </div>
            </div>

            {/* Sub-tab 1: Complaints */}
            {complaintSubTab === 'complaints' && (
              <div className="space-y-4">
                <div className="space-y-3">
                  {data.complaints.map((c, i) => (
                    <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col md:flex-row justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-bold text-base">{c.title}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${c.priority === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                            {c.priority === 'high' ? 'উচ্চ' : 'মধ্যম'}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${c.status === 'solved' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                            {c.status === 'solved' ? 'সমাধান' : c.status === 'progress' ? 'চলছে' : 'অপেক্ষমাণ'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300">{c.desc || '—'}</p>
                        <p className="text-xs text-gray-400 mt-1">{c.room} • {c.date}</p>
                        {c.photo && (
                          <img src={c.photo} alt="complaint" className="mt-2 max-h-32 rounded-lg border border-white/10" />
                        )}
                        {/* Replies */}
                        {c.replies && c.replies.length > 0 && (
                          <div className="mt-2 space-y-1 bg-white/5 p-2 rounded-lg">
                            {c.replies.map((r, ri) => (
                              <p key={ri} className="text-xs text-cyan-300">💬 {r.by === 'owner' ? '👑 আপনি:' : 'ভাড়াটিয়া:'} {r.message}</p>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 items-center flex-wrap self-end md:self-center">
                        <button
                          onClick={() => setComplaintReplyModal({ isOpen: true, index: i, message: '' })}
                          className="px-3 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg text-xs font-semibold hover:bg-cyan-500/30"
                        >
                          রিপ্লাই
                        </button>
                        <button
                          onClick={() => {
                            const order: Array<'pending' | 'progress' | 'solved'> = ['pending', 'progress', 'solved'];
                            const next = order[(order.indexOf(c.status) + 1) % order.length];
                            const updated = data.complaints.map((item, idx) => idx === i ? { ...item, status: next } : item);
                            onUpdateData({ ...data, complaints: updated });
                          }}
                          className="px-3 py-1.5 glass text-gray-300 rounded-lg text-xs hover:bg-white/10"
                        >
                          স্ট্যাটাস পরিবর্তন
                        </button>
                      </div>
                    </div>
                  ))}
                  {data.complaints.length === 0 && <p className="text-gray-400 text-center py-6">কোনো অভিযোগ নেই</p>}
                </div>
              </div>
            )}

            {/* Sub-tab 2: Maintenance */}
            {complaintSubTab === 'maintenance' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-400">ফ্ল্যাট মেরামত ও সংস্কার সংক্রান্ত রেকর্ড</p>
                  <button
                    onClick={() => setAddMaintModal({ isOpen: true, title: '', room: data.rooms[0]?.name || 'কমন স্পেস', cost: 0 })}
                    className="bg-amber-600 hover:bg-amber-500 px-4 py-2 rounded-xl text-xs font-bold shadow transition flex items-center gap-1.5"
                  >
                    + নতুন লগ
                  </button>
                </div>
                <div className="space-y-3">
                  {data.maints.map((m, i) => (
                    <div key={m.id || i} className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-base">{m.title}</span>
                          <span className={`text-[10px] px-2.5 py-0.5 rounded font-bold ${
                            m.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {m.status === 'completed' ? 'সম্পন্ন' : 'চলছে'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{m.room || 'কমন স্পেস'} • {m.date} • {m.requestedBy === 'tenant' ? '👤 ভাড়াটিয়া' : '👑 মালিক'}</p>
                        {m.ownerReply && <p className="text-xs text-cyan-400 mt-1">নোট: {m.ownerReply}</p>}
                      </div>
                      <div className="flex items-center gap-2 self-end md:self-center">
                        <button
                          onClick={() => setMaintReplyModal({ isOpen: true, index: i, status: m.status, message: m.ownerReply || '' })}
                          className="px-3 py-1.5 glass text-xs text-cyan-400 rounded-lg hover:bg-cyan-500/10"
                        >
                          আপডেট
                        </button>
                      </div>
                    </div>
                  ))}
                  {data.maints.length === 0 && <p className="text-gray-400 text-center py-6">কোনো মেইনটেন্যান্স রেকর্ড নেই</p>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 8: DEPOSITS & ADVANCES */}
        {activeTab === 'deposits' && (
          <div className="space-y-6">
            <div className="glass rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <span>🔒</span> সিকিউরিটি ডিপোজিট
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">ভাড়াটিয়াদের সিকিউরিটি মানি ও জামানত ট্র্যাকিং</p>
                </div>
                <button
                  onClick={() => setDepositModal({
                    isOpen: true,
                    isEditing: false,
                    room: data.rooms[1]?.name || data.rooms[0]?.name || '',
                    type: 'deposit',
                    amount: 8000,
                    note: ''
                  })}
                  className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl text-sm font-semibold transition"
                >
                  + নতুন জমা
                </button>
              </div>
              <div className="space-y-3">
                {data.deposits.map((d, i) => (
                  <div key={d.id || i} className="p-3.5 bg-white/5 border border-white/10 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{d.room} — {d.tenantName || 'ভাড়াটিয়া'}</span>
                        <span className={`text-[11px] px-2 py-0.5 rounded font-semibold ${d.type === 'refund' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                          {d.type === 'refund' ? 'জামানত ফেরত' : 'জামানত গ্রহণ'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{d.date} {d.note ? `• ${d.note}` : ''}</p>
                    </div>
                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <span className={`font-bold text-base ${d.type === 'refund' ? 'text-red-400' : 'text-green-400'}`}>
                        {d.type === 'refund' ? '−' : '+'} ৳ {toBn(d.amount)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setDepositModal({
                              isOpen: true,
                              id: d.id,
                              isEditing: true,
                              room: d.room,
                              type: d.type || 'deposit',
                              amount: d.amount,
                              note: d.note || ''
                            });
                          }}
                          className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-cyan-300 rounded-lg text-xs font-semibold transition"
                        >
                          ✏️ এডিট
                        </button>
                        <button
                          onClick={async () => {
                            const ok = await showConfirm(`আপনি কি এই ডিপোজিট রেকর্ডটি (${d.room} - ৳ ${toBn(d.amount)}) ডিলিট করতে চান?`, { type: 'danger' });
                            if (!ok) return;
                            const updatedDeposits = data.deposits.filter((_, idx) => idx !== i && (!d.id || _.id !== d.id));
                            onUpdateData({ ...data, deposits: updatedDeposits });
                            showAlert('ডিপোজিট রেকর্ড ডিলিট করা হয়েছে!', { type: 'info' });
                          }}
                          className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-xs font-semibold transition"
                        >
                          🗑️ মুছুন
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {data.deposits.length === 0 && <p className="text-gray-400 text-center py-4">কোনো ডিপোজিট রেকর্ড নেই</p>}
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <span>💵</span> অগ্রিম পেমেন্ট (Advance)
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">বাসা ছাড়ার শেষ মাসের ভাড়ার সাথে অগ্রিম স্বয়ংক্রিয়ভাবে সমন্বয় করা হয়</p>
                </div>
                <button
                  onClick={() => setAdvanceModal({
                    isOpen: true,
                    isEditing: false,
                    room: data.rooms[1]?.name || data.rooms[0]?.name || '',
                    amount: 16000,
                    months: 2,
                    note: '',
                    status: 'active'
                  })}
                  className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl text-sm font-semibold transition"
                >
                  + নতুন অগ্রিম
                </button>
              </div>
              <div className="space-y-3">
                {data.advances.map((a, i) => (
                  <div key={a.id || i} className="p-3.5 bg-white/5 border border-white/10 rounded-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 text-sm">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-base">{a.room} — ৳ {toBn(a.amount)}</span>
                        {a.tenantName && <span className="text-xs text-gray-300 font-medium">({a.tenantName})</span>}
                        <span className={`text-[11px] px-2 py-0.5 rounded font-bold ${a.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                          {a.status === 'active' ? 'সক্রিয়' : 'সমন্বিত (ব্যবহৃত)'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{a.months} মাসের জন্য • {a.date} {a.note ? `• ${a.note}` : ''}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 self-end lg:self-center">
                      {a.status === 'active' && (
                        <button
                          onClick={() => {
                            const inv = data.invoices.find(invItem => invItem.room === a.room && invItem.status !== 'paid');
                            if (!inv) {
                              showAlert('এই রুমের কোনো বকেয়া ইনভয়েস পাওয়া যায়নি। বাসা ছাড়ার সময় বা ইনভয়েস তৈরি হলে এটি অটো সমন্বয় হবে।', { type: 'warning' });
                              return;
                            }
                            const updatedAdvances = data.advances.map(item => (item.id === a.id || (!item.id && item === a)) ? { ...item, status: 'used' as const } : item);
                            const updatedInvoices = data.invoices.map(item => {
                              if (item.id === inv.id) {
                                const newPayments = [...item.payments, { amount: a.amount, date: new Date().toLocaleDateString('bn-BD'), method: 'অগ্রিম সমন্বয়', note: 'বাসা ছাড়ার শেষ মাসের ভাড়ার সাথে অগ্রিম সমন্বয়' }];
                                const stats = getInvoiceStats({ ...item, payments: newPayments });
                                return { ...item, payments: newPayments, status: stats.remaining <= 0 ? 'paid' as const : 'partial' as const };
                              }
                              return item;
                            });
                            onUpdateData({ ...data, advances: updatedAdvances, invoices: updatedInvoices });
                            showAlert(`রুম ${a.room}-এর অগ্রিম ৳ ${toBn(a.amount)} শেষ মাসের ভাড়ার সাথে সমন্বয় করা হয়েছে!`, { type: 'success' });
                          }}
                          className="text-[11px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2.5 py-1 rounded-lg hover:bg-cyan-500/30 transition font-medium"
                        >
                          শেষ মাসের সাথে সমন্বয় করুন
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setAdvanceModal({
                            isOpen: true,
                            id: a.id,
                            isEditing: true,
                            room: a.room,
                            amount: a.amount,
                            months: a.months || 1,
                            note: a.note || '',
                            status: a.status || 'active'
                          });
                        }}
                        className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-cyan-300 rounded-lg text-xs font-semibold transition"
                      >
                        ✏️ এডিট
                      </button>
                      <button
                        onClick={async () => {
                          const ok = await showConfirm(`আপনি কি এই অগ্রিম রেকর্ডটি (${a.room} - ৳ ${toBn(a.amount)}) ডিলিট করতে চান?`, { type: 'danger' });
                          if (!ok) return;
                          const updatedAdvances = data.advances.filter((_, idx) => idx !== i && (!a.id || _.id !== a.id));
                          onUpdateData({ ...data, advances: updatedAdvances });
                          showAlert('অগ্রিম রেকর্ড ডিলিট করা হয়েছে!', { type: 'info' });
                        }}
                        className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-xs font-semibold transition"
                      >
                        🗑️ মুছুন
                      </button>
                    </div>
                  </div>
                ))}
                {data.advances.length === 0 && <p className="text-gray-400 text-center py-4">কোনো অগ্রিম নেই</p>}
              </div>
            </div>
          </div>
        )}



        {/* TAB 8: LEGAL & DOCUMENTS (UNIFIED) */}
        {(activeTab === 'legal' || activeTab === 'documents') && (
          <div className="glass rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-xl flex-shrink-0">
                  ⚖️
                </div>
                <div>
                  <h3 className="text-xl font-bold">আইনি ও ফ্ল্যাট ডকুমেন্টস</h3>
                  <p className="text-xs text-gray-400">ভাড়া চুক্তিপত্র, পুলিশ CIMS ফরম এবং ফ্ল্যাটের গুরুত্বপূর্ণ ফাইল</p>
                </div>
              </div>

              {/* Sub-tab Navigation */}
              <div className="flex p-1 bg-white/5 rounded-xl border border-white/10 w-full sm:w-auto">
                <button
                  onClick={() => setLegalSubTab('legal')}
                  className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                    legalSubTab === 'legal'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <span>⚖️ চুক্তিপত্র ও পুলিশ ফরম</span>
                  <span className="px-1.5 py-0.2 bg-black/30 rounded text-[10px]">{toBn(data.legalDocs.length)}</span>
                </button>
                <button
                  onClick={() => setLegalSubTab('documents')}
                  className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                    legalSubTab === 'documents'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <span>📁 ফ্ল্যাট ফাইল স্টোর</span>
                  <span className="px-1.5 py-0.2 bg-black/30 rounded text-[10px]">{toBn(data.documents.length)}</span>
                </button>
              </div>
            </div>

            {/* Sub-tab 1: Legal Documents & Police Verification */}
            {legalSubTab === 'legal' && (
              <div className="space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3">
                  <p className="text-xs text-gray-400">চুক্তিপত্র, NOC, নোটিশ ও বাংলাদেশ পুলিশ ভেরিফিকেশন ফরম</p>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setPoliceManagerModal(true)} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow transition">
                      👮 পুলিশ ফরম ম্যানেজার
                    </button>
                    <button
                      onClick={() => setLegalTemplateModal({ isOpen: true, templateKey: 'rentAgreement', values: {} })}
                      className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl text-xs font-semibold shadow transition"
                    >
                      + নতুন চুক্তিপত্র
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {data.legalDocs.map(doc => (
                    <div key={doc.id} className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <p className="font-bold text-base">{doc.typeName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">রুম: {doc.room} • 📅 {doc.date} • জমাদানকারী: {doc.submittedBy === 'tenant' ? 'ভাড়াটিয়া' : 'মালিক'}</p>
                        {doc.status && (
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold mt-1 inline-block ${
                            doc.status === 'verified' ? 'bg-green-500/20 text-green-400' : doc.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {doc.status === 'verified' ? '✓ যাচাই হয়েছে' : doc.status === 'rejected' ? '✗ বাতিল' : '⏳ অপেক্ষমাণ'}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 flex-wrap self-end md:self-center">
                        {doc.type === 'policeVerification' && (
                          <button
                            onClick={() => {
                              setPoliceModalState({
                                isOpen: true,
                                docId: doc.id,
                                room: doc.room,
                                tenantName: doc.values?.applicantName,
                                tenantPhone: doc.values?.phone,
                                tenantNid: doc.values?.nid,
                                values: doc.values || {},
                                status: doc.status
                              });
                            }}
                            className="glass px-3 py-1.5 rounded-lg text-xs font-semibold text-cyan-300 hover:bg-cyan-500/10"
                          >
                            ✏️ বিস্তারিত দেখুন
                          </button>
                        )}
                        {doc.type === 'rentAgreement' && (
                          <button
                            onClick={() => {
                              setLegalTemplateModal({
                                isOpen: true,
                                docId: doc.id,
                                templateKey: 'rentAgreement',
                                values: doc.values || {}
                              });
                            }}
                            className="glass px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-300 hover:bg-indigo-500/10"
                          >
                            ✏️ সম্পাদন
                          </button>
                        )}
                        <button
                          onClick={() => {
                            const updated = data.legalDocs.filter(d => d.id !== doc.id);
                            onUpdateData({ ...data, legalDocs: updated });
                            showAlert('ডকুমেন্ট সফলভাবে মুছে ফেলা হয়েছে', { type: 'success' });
                          }}
                          className="glass px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/10"
                        >
                          🗑️ মুছুন
                        </button>
                        <button onClick={() => printLegalDoc(doc)} className="glass px-3 py-1.5 rounded-lg text-xs font-semibold text-cyan-400 hover:bg-cyan-500/10">
                          📄 ডাউনলোড / প্রিন্ট
                        </button>
                        {doc.type === 'policeVerification' && (
                          <button
                            onClick={() => {
                              const nextStatus = doc.status === 'verified' ? ('pending' as const) : ('verified' as const);
                              const updated = data.legalDocs.map(d => d.id === doc.id ? { ...d, status: nextStatus } : d);
                              onUpdateData({ ...data, legalDocs: updated });
                              showAlert(nextStatus === 'verified' ? 'পুলিশ ফরম যাচাই সম্পন্ন!' : 'যাচাই স্ট্যাটাস পরিবর্তন করা হয়েছে', { type: 'success' });
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                              doc.status === 'verified' ? 'bg-amber-600/30 text-amber-300 hover:bg-amber-600/50' : 'bg-green-600/30 text-green-400 hover:bg-green-600/50'
                            }`}
                          >
                            {doc.status === 'verified' ? '⏳ অপেক্ষমাণ করুন' : '✓ যাচাই অনুমোদন'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {data.legalDocs.length === 0 && <p className="text-gray-400 text-center py-8">কোনো আইনি ডকুমেন্ট নেই</p>}
                </div>
              </div>
            )}

            {/* Sub-tab 2: Flat Documents Store */}
            {legalSubTab === 'documents' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-400">ফ্ল্যাটের বিদ্যুৎ বিল কপি, গ্যাস অনুমোদন, হোল্ডিং ট্যাক্স ও শেয়ারড ফাইল</p>
                  <button onClick={() => setDocModal({ isOpen: true, name: '', type: 'pdf', shared: true })} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl text-xs font-bold shadow transition">
                    + ফাইল আপলোড
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.documents.map((doc, i) => (
                    <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center hover:border-cyan-500/30 transition">
                      <div>
                        <p className="font-bold text-sm text-white">{doc.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{doc.date} • {doc.shared ? '🔗 শেয়ারড (ভাড়াটিয়ার সাথে)' : '🔒 প্রাইভেট'}</p>
                      </div>
                      <button
                        onClick={() => {
                          const updated = data.documents.filter((_, idx) => idx !== i);
                          onUpdateData({ ...data, documents: updated });
                        }}
                        className="text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                  {data.documents.length === 0 && <p className="text-gray-400 text-center py-8 col-span-full">কোনো ডকুমেন্ট সংরক্ষিত নেই</p>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 9: NOTICES */}
        {activeTab === 'notices' && (
          <div className="glass rounded-2xl p-6 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">নোটিশ বোর্ড</h3>
                <p className="text-xs text-gray-400">সকল ভাড়াটিয়াদের তাৎক্ষণিক ও নির্ধারিত নোটিশ প্রেরণ</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setScheduledNoticeModal({ isOpen: true, title: '', desc: '', date: '' })} className="glass px-4 py-2 rounded-xl text-xs font-semibold">📅 শিডিউল</button>
                <button onClick={() => setNoticeModal({ isOpen: true, index: -1, title: '', desc: '' })} className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl text-xs font-semibold transition">+ নতুন নোটিশ</button>
              </div>
            </div>

            <div className="space-y-3">
              {data.notices.map((n, i) => (
                <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 flex justify-between items-start gap-4">
                  <div>
                    <h4 className="font-bold text-base text-white">{n.title}</h4>
                    <p className="text-sm text-gray-300 mt-1">{n.desc}</p>
                    <p className="text-xs text-gray-500 mt-2">📅 {n.date} • 👁️ {toBn((n.readBy || []).length)} জন পড়েছেন</p>
                  </div>
                  <div className="flex gap-2 items-center flex-shrink-0">
                    <button
                      onClick={() => setNoticeModal({ isOpen: true, index: i, title: n.title, desc: n.desc })}
                      className="glass px-2.5 py-1.5 rounded-lg text-xs font-semibold text-cyan-300 hover:bg-cyan-500/10"
                    >
                      ✏️ সম্পাদন
                    </button>
                    <button
                      onClick={() => {
                        const updated = data.notices.filter((_, idx) => idx !== i);
                        onUpdateData({ ...data, notices: updated });
                        showAlert('নোটিশ মুছে ফেলা হয়েছে', { type: 'success' });
                      }}
                      className="glass px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/10"
                    >
                      🗑️ মুছুন
                    </button>
                  </div>
                </div>
              ))}
              {data.notices.length === 0 && <p className="text-gray-400 text-center py-8">কোনো নোটিশ নেই</p>}
            </div>
          </div>
        )}

        {/* TAB 10: VISITORS */}
        {activeTab === 'visitors' && (
          <VisitorManager
            visitors={data.visitors || []}
            flatInfo={data.flatInfo}
            rooms={data.rooms}
            tenants={data.tenants}
            currentUserRole="owner"
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

        {/* TAB: KITCHEN DUTY */}
        {activeTab === 'kitchenDuty' && (
          <div className="space-y-6">
            <KitchenDutyCard
              data={data}
              onUpdateData={onUpdateData}
              currentUserRole="owner"
              currentUserName="মালিক"
              showAlert={showAlert}
            />
          </div>
        )}

        {/* TAB 15: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass rounded-2xl p-6 space-y-4">
              <h3 className="text-xl font-bold">ফ্ল্যাট তথ্য ও পেমেন্ট মাধ্যম</h3>
              
              {/* Owner Profile Image Uploader */}
              <div className="flex flex-col items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="relative group w-24 h-24 rounded-full overflow-hidden border-2 border-indigo-500/30">
                  {flatSettings.ownerPhoto ? (
                    <img 
                      src={flatSettings.ownerPhoto} 
                      alt="Owner" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 flex items-center justify-center text-white text-2xl font-bold">
                      👑
                    </div>
                  )}
                  <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center cursor-pointer text-[10px] text-white font-semibold">
                    <span>📷 ছবি আপলোড</span>
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
                            setFlatSettings({ ...flatSettings, ownerPhoto: url });
                            showAlert('ছবি আপলোড সফল হয়েছে, সংরক্ষণ করুন বাটনে ক্লিক করে সেভ করুন।', { type: 'success' });
                          } catch (err: any) {
                            showAlert('আপলোড ব্যর্থ হয়েছে: ' + (err?.message || err), { type: 'error' });
                          }
                        }
                      }}
                    />
                  </label>
                </div>
                <div className="text-center">
                  <h5 className="font-bold text-white text-sm">মালিকের প্রোফাইল ছবি</h5>
                  <p className="text-[10px] text-gray-400">আপলোড করার পর নিচে সংরক্ষণ করুন</p>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-300 mb-1">ফ্ল্যাটের নাম (লগইন পেজে শিরোনাম)</label>
                <input
                  type="text"
                  value={flatSettings.name}
                  onChange={e => setFlatSettings({ ...flatSettings, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none font-semibold text-cyan-300"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-300 mb-1">ট্যাগলাইন / স্লোগান (লগইন পেজের সাবটাইটেল)</label>
                <input
                  type="text"
                  placeholder="যেমন: PREMIUM FLAT MANAGEMENT"
                  value={flatSettings.tagline}
                  onChange={e => setFlatSettings({ ...flatSettings, tagline: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none text-purple-300"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-300 mb-1">মালিকের নাম</label>
                <input
                  type="text"
                  value={flatSettings.ownerName}
                  onChange={e => setFlatSettings({ ...flatSettings, ownerName: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-300 mb-1">ঠিকানা</label>
                <input
                  type="text"
                  value={flatSettings.address}
                  onChange={e => setFlatSettings({ ...flatSettings, address: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-300 mb-1">যোগাযোগের ফোন নম্বর</label>
                <input
                  type="tel"
                  value={flatSettings.phone}
                  onChange={e => setFlatSettings({ ...flatSettings, phone: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-300 mb-1">যোগাযোগের হোয়াটসঅ্যাপ নম্বর (WhatsApp - ঐচ্ছিক)</label>
                <input
                  type="tel"
                  placeholder="যেমন: +88017XXXXXXXX"
                  value={flatSettings.whatsapp}
                  onChange={e => setFlatSettings({ ...flatSettings, whatsapp: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500 text-emerald-300 placeholder:text-zinc-600"
                />
              </div>

              {/* Utility Meters Config */}
              <div className="pt-3 border-t border-white/10 space-y-3">
                <p className="text-sm font-semibold text-cyan-400">🔌 ইউটিলিটি মিটার নম্বর সমুহ (Default Meter IDs)</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">মূল বিদ্যুৎ মিটার (DPDC)</label>
                    <input
                      type="text"
                      placeholder="যেমন: DPDC-MAIN-01"
                      value={flatSettings.mainMeterNo}
                      onChange={e => setFlatSettings({ ...flatSettings, mainMeterNo: e.target.value })}
                      className="w-full bg-white/5 border border-cyan-500/30 rounded-xl px-3 py-2 text-xs font-mono outline-none text-cyan-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">গ্যাস মিটার নম্বর</label>
                    <input
                      type="text"
                      placeholder="যেমন: TGTD-G-8821"
                      value={flatSettings.gasMeterNo}
                      onChange={e => setFlatSettings({ ...flatSettings, gasMeterNo: e.target.value })}
                      className="w-full bg-white/5 border border-orange-500/30 rounded-xl px-3 py-2 text-xs font-mono outline-none text-orange-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">পানির মিটার নম্বর (WASA)</label>
                    <input
                      type="text"
                      placeholder="যেমন: WASA-W-4402"
                      value={flatSettings.waterMeterNo}
                      onChange={e => setFlatSettings({ ...flatSettings, waterMeterNo: e.target.value })}
                      className="w-full bg-white/5 border border-blue-500/30 rounded-xl px-3 py-2 text-xs font-mono outline-none text-blue-300"
                    />
                  </div>
                </div>
              </div>

              {/* WiFi Settings Config */}
              <div className="pt-3 border-t border-white/10 space-y-3">
                <p className="text-sm font-semibold text-indigo-400">📶 ওয়াইফাই ও ইন্টারনেট (WiFi Details for Tenants)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">ওয়াইফাই নাম (SSID)</label>
                    <input
                      type="text"
                      placeholder="যেমন: Green_Villa_5G"
                      value={flatSettings.wifiName}
                      onChange={e => setFlatSettings({ ...flatSettings, wifiName: e.target.value })}
                      className="w-full bg-white/5 border border-indigo-500/30 rounded-xl px-3 py-2 text-xs outline-none text-indigo-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">ওয়াইফাই পাসওয়ার্ড (Password)</label>
                    <input
                      type="text"
                      placeholder="যেমন: password123"
                      value={flatSettings.wifiPassword}
                      onChange={e => setFlatSettings({ ...flatSettings, wifiPassword: e.target.value })}
                      className="w-full bg-white/5 border border-indigo-500/30 rounded-xl px-3 py-2 text-xs outline-none text-indigo-300 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Cloudinary Settings Config */}
              <div className="pt-3 border-t border-white/10 space-y-3">
                <p className="text-sm font-semibold text-rose-400">☁️ Cloudinary ইমেজ আপলোড সেটিংস</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">Cloud Name</label>
                    <input
                      type="text"
                      placeholder="যেমন: dxxxxxx"
                      value={flatSettings.cloudinaryCloudName}
                      onChange={e => setFlatSettings({ ...flatSettings, cloudinaryCloudName: e.target.value })}
                      className="w-full bg-white/5 border border-rose-500/30 rounded-xl px-3 py-2 text-xs outline-none text-rose-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">Upload Preset</label>
                    <input
                      type="text"
                      placeholder="যেমন: my_preset"
                      value={flatSettings.cloudinaryUploadPreset}
                      onChange={e => setFlatSettings({ ...flatSettings, cloudinaryUploadPreset: e.target.value })}
                      className="w-full bg-white/5 border border-rose-500/30 rounded-xl px-3 py-2 text-xs outline-none text-rose-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">API Key</label>
                    <input
                      type="text"
                      placeholder="Cloudinary API Key"
                      value={flatSettings.cloudinaryApiKey}
                      onChange={e => setFlatSettings({ ...flatSettings, cloudinaryApiKey: e.target.value })}
                      className="w-full bg-white/5 border border-rose-500/30 rounded-xl px-3 py-2 text-xs outline-none text-rose-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">API Secret</label>
                    <input
                      type="password"
                      placeholder="Cloudinary API Secret"
                      value={flatSettings.cloudinaryApiSecret}
                      onChange={e => setFlatSettings({ ...flatSettings, cloudinaryApiSecret: e.target.value })}
                      className="w-full bg-white/5 border border-rose-500/30 rounded-xl px-3 py-2 text-xs outline-none text-rose-300 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Methods Config */}
              <div className="pt-3 border-t border-white/10 space-y-3">
                <p className="text-sm font-semibold text-emerald-400">💰 পেমেন্ট মাধ্যম (ভাড়াটিয়ার জন্য)</p>
                <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 cursor-pointer">
                  <span>নগদ (Cash)</span>
                  <input
                    type="checkbox"
                    checked={flatSettings.cashEnabled}
                    onChange={e => setFlatSettings({ ...flatSettings, cashEnabled: e.target.checked })}
                    className="w-5 h-5 accent-green-500 rounded"
                  />
                </label>

                <div className="p-3 rounded-xl bg-white/5 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm">বিকাশ (bKash)</span>
                    <input
                      type="checkbox"
                      checked={flatSettings.bkashEnabled}
                      onChange={e => setFlatSettings({ ...flatSettings, bkashEnabled: e.target.checked })}
                      className="w-5 h-5 accent-pink-500 rounded"
                    />
                  </div>
                  {flatSettings.bkashEnabled && (
                    <input
                      type="text"
                      placeholder="বিকাশ নম্বর: ০১৭১১-১১১১১১"
                      value={flatSettings.bkashNumber}
                      onChange={e => setFlatSettings({ ...flatSettings, bkashNumber: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-pink-500"
                    />
                  )}
                </div>

                <div className="p-3 rounded-xl bg-white/5 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm">নগদ (Nagad)</span>
                    <input
                      type="checkbox"
                      checked={flatSettings.nagadEnabled}
                      onChange={e => setFlatSettings({ ...flatSettings, nagadEnabled: e.target.checked })}
                      className="w-5 h-5 accent-orange-500 rounded"
                    />
                  </div>
                  {flatSettings.nagadEnabled && (
                    <input
                      type="text"
                      placeholder="নগদ নম্বর: ০১৭১১-১১১১১১"
                      value={flatSettings.nagadNumber}
                      onChange={e => setFlatSettings({ ...flatSettings, nagadNumber: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-orange-500"
                    />
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  const updatedFlatInfo = {
                    ...data.flatInfo,
                    name: flatSettings.name,
                    tagline: flatSettings.tagline,
                    ownerName: flatSettings.ownerName,
                    address: flatSettings.address,
                    phone: flatSettings.phone,
                    whatsapp: flatSettings.whatsapp,
                    totalRooms: Number(flatSettings.totalRooms),
                    mainMeterNo: flatSettings.mainMeterNo,
                    gasMeterNo: flatSettings.gasMeterNo,
                    waterMeterNo: flatSettings.waterMeterNo,
                    wifiName: flatSettings.wifiName,
                    wifiPassword: flatSettings.wifiPassword,
                    paymentMethods: {
                      cash: { enabled: flatSettings.cashEnabled },
                      bkash: { enabled: flatSettings.bkashEnabled, number: flatSettings.bkashNumber },
                      nagad: { enabled: flatSettings.nagadEnabled, number: flatSettings.nagadNumber }
                    },
                    ownerPhoto: flatSettings.ownerPhoto,
                    cloudinaryCloudName: flatSettings.cloudinaryCloudName,
                    cloudinaryUploadPreset: flatSettings.cloudinaryUploadPreset,
                    cloudinaryApiKey: flatSettings.cloudinaryApiKey,
                    cloudinaryApiSecret: flatSettings.cloudinaryApiSecret
                  };
                  onUpdateData({
                    ...data,
                    flatInfo: updatedFlatInfo,
                    reminderSettings: { ...data.reminderSettings, days: Number(flatSettings.reminderDays) },
                    autoInvoiceSettings: { ...data.autoInvoiceSettings, enabled: flatSettings.autoInvoice }
                  });
                  showAlert('ফ্ল্যাট ও পেমেন্ট তথ্য সফলভাবে সংরক্ষিত হয়েছে!', { type: 'success' });
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl font-semibold transition shadow-lg"
              >
                সংরক্ষণ করুন
              </button>
            </div>

            {/* House Rules & Data Management */}
            <div className="space-y-6">
              <div className="glass rounded-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">হাউস রুলস</h3>
                  <button onClick={() => setRuleModal({ isOpen: true, text: '' })} className="glass px-3 py-1.5 rounded-lg text-xs font-semibold">+ রুল যোগ</button>
                </div>
                <div className="space-y-2">
                  {data.rules.map((rule, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-white/5 flex justify-between items-center text-sm">
                      <span>{toBn(idx + 1)}. {rule}</span>
                      <button
                        onClick={() => {
                          const updated = data.rules.filter((_, i) => i !== idx);
                          onUpdateData({ ...data, rules: updated });
                        }}
                        className="text-red-400 hover:bg-red-500/10 p-1 rounded"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass rounded-2xl p-6 space-y-4">
                <h3 className="text-xl font-bold">ডেটা ব্যাকআপ ও রিস্টোর</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `flat-manager-backup-${new Date().toISOString().split('T')[0]}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                      showAlert('JSON ব্যাকআপ ডাউনলোড হয়েছে!', { type: 'success' });
                    }}
                    className="glass py-2.5 rounded-xl text-xs font-semibold hover:bg-white/10"
                  >
                    📥 JSON Backup
                  </button>
                  <label className="glass py-2.5 rounded-xl text-xs font-semibold hover:bg-white/10 text-center cursor-pointer flex items-center justify-center">
                    <span>📤 Restore JSON</span>
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = ev => {
                            try {
                              const parsed = JSON.parse(ev.target?.result as string);
                              if (parsed.rooms && parsed.tenants) {
                                onUpdateData(parsed);
                                showAlert('ডেটা সফলভাবে রিস্টোর হয়েছে!', { type: 'success' });
                              } else {
                                showAlert('ভুল ফাইল ফরম্যাট', { type: 'error' });
                              }
                            } catch {
                              showAlert('ফাইল পড়তে ব্যর্থ', { type: 'error' });
                            }
                          };
                          reader.readAsText(file);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Owner Password Change Card */}
              <div className="glass rounded-2xl p-6 space-y-4">
                <h3 className="text-xl font-bold text-rose-400 flex items-center gap-2">
                  <span>🔑</span> মালিকের পাসওয়ার্ড পরিবর্তন
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">বর্তমান পাসওয়ার্ড (Current Password)</label>
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      value={oldPassword}
                      onChange={e => setOldPassword(e.target.value)}
                      placeholder="বর্তমান পাসওয়ার্ড দিন"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">নতুন পাসওয়ার্ড (New Password)</label>
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">নতুন পাসওয়ার্ড নিশ্চিত করুন (Confirm Password)</label>
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="নতুন পাসওয়ার্ডটি আবার দিন"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={showPasswords}
                        onChange={e => setShowPasswords(e.target.checked)}
                        className="rounded accent-rose-500"
                      />
                      <span>পাসওয়ার্ড দেখান</span>
                    </label>
                  </div>

                  <button
                    onClick={async () => {
                      const currentPassword = data.flatInfo.ownerPassword || OWNER_CREDENTIALS.password;
                      
                      if (!oldPassword || !newPassword || !confirmPassword) {
                        showAlert('সবগুলো ইনপুট ফিল্ড পূরণ করুন!', { type: 'error' });
                        return;
                      }

                      if (oldPassword !== currentPassword) {
                        showAlert('বর্তমান পাসওয়ার্ডটি সঠিক নয়!', { type: 'error' });
                        return;
                      }

                      if (newPassword.length < 6) {
                        showAlert('নতুন পাসওয়ার্ডটি অবশ্যই কমপক্ষে ৬ অক্ষরের হতে হবে!', { type: 'error' });
                        return;
                      }

                      if (newPassword !== confirmPassword) {
                        showAlert('নতুন পাসওয়ার্ড এবং নিশ্চিতকরণ পাসওয়ার্ড মেলেনি!', { type: 'error' });
                        return;
                      }

                      const confirmChange = await showConfirm('আপনি কি নিশ্চিতভাবে আপনার পাসওয়ার্ড পরিবর্তন করতে চান?', {
                        title: 'পাসওয়ার্ড পরিবর্তন',
                        okText: 'হ্যাঁ, পরিবর্তন করুন',
                        cancelText: 'না'
                      });

                      if (confirmChange) {
                        // Update in flatInfo
                        const updatedFlatInfo = {
                          ...data.flatInfo,
                          ownerPassword: newPassword
                        };

                        onUpdateData({
                          ...data,
                          flatInfo: updatedFlatInfo
                        });

                        // Clear input fields
                        setOldPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                        setShowPasswords(false);

                        showAlert('আপনার লগইন পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে! পরবর্তী লগইনে এই নতুন পাসওয়ার্ড ব্যবহার করুন।', { type: 'success' });
                      }
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl font-semibold transition shadow-lg text-white text-sm"
                  >
                    পাসওয়ার্ড পরিবর্তন করুন
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: ROOM EDIT / ADD */}
      {roomModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 modal-backdrop overflow-y-auto">
          <div className="glass rounded-2xl w-full max-w-lg p-6 animate-pop my-8 border border-white/10 relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">{roomModal.index >= 0 ? 'রুম সম্পাদনা' : 'নতুন রুম যোগ'}</h3>
              <button onClick={() => setRoomModal({ ...roomModal, isOpen: false })} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-300 mb-1">রুম নম্বর *</label>
                <input type="text" value={roomModal.name} onChange={e => setRoomModal({ ...roomModal, name: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-300 mb-1">ধরন</label>
                <select value={roomModal.type} onChange={e => setRoomModal({ ...roomModal, type: e.target.value as any })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none">
                  <option value="single">সিঙ্গেল</option>
                  <option value="double">ডাবল</option>
                  <option value="master">মাস্টার</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-300 mb-1">মাসিক ভাড়া (৳)</label>
                <input type="number" value={roomModal.rent} onChange={e => setRoomModal({ ...roomModal, rent: Number(e.target.value) })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-300 mb-1">স্ট্যাটাস</label>
                <select value={roomModal.status} onChange={e => setRoomModal({ ...roomModal, status: e.target.value as any })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none">
                  <option value="empty">খালি</option>
                  <option value="occupied">ভাড়াটিয়া আছে</option>
                  <option value="owner">আমার রুম (মালিক)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-cyan-300 mb-1 font-semibold flex items-center gap-1">
                  <span>🔌</span> বিদ্যুৎ সাব-মিটার নম্বর (Sub-meter No)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: Sub-01 বা DPDC-102"
                  value={roomModal.meterNo}
                  onChange={e => setRoomModal({ ...roomModal, meterNo: e.target.value })}
                  className="w-full bg-white/5 border border-cyan-500/30 rounded-xl px-4 py-2.5 text-sm font-mono outline-none text-cyan-200 focus:border-cyan-400"
                />
              </div>
              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 space-y-3">
                <p className="text-xs font-semibold text-cyan-400">ভাড়াটিয়া লগইন তথ্য (Tenant Credentials)</p>
                <div>
                  <label className="block text-[10px] text-gray-300 mb-1">লগইন আইডি</label>
                  <input type="text" placeholder="যেমন: room2" value={roomModal.loginId} onChange={e => setRoomModal({ ...roomModal, loginId: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-300 mb-1">পাসওয়ার্ড</label>
                  <input type="text" placeholder="যেমন: karim123" value={roomModal.loginPassword} onChange={e => setRoomModal({ ...roomModal, loginPassword: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono outline-none" />
                </div>
              </div>

              {/* Room Specifications */}
              <div className="grid grid-cols-2 gap-4 p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="col-span-2 text-xs font-semibold text-gray-400 border-b border-white/5 pb-2">রুমের বিস্তারিত তথ্য (Room Details)</p>
                <div>
                  <label className="block text-[10px] text-gray-300 mb-1">আয়তন (বর্গফুট)</label>
                  <input type="number" value={roomModal.sizeSqFt} onChange={e => setRoomModal({ ...roomModal, sizeSqFt: Number(e.target.value) })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-300 mb-1">ফ্লোর</label>
                  <input type="text" placeholder="যেমন: ৪র্থ তলা" value={roomModal.floor} onChange={e => setRoomModal({ ...roomModal, floor: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-300 mb-1">অবস্থান (Facing)</label>
                  <input type="text" placeholder="যেমন: দক্ষিণমুখী" value={roomModal.facing} onChange={e => setRoomModal({ ...roomModal, facing: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-300 mb-1">বাথরুম</label>
                  <select value={roomModal.washroom} onChange={e => setRoomModal({ ...roomModal, washroom: e.target.value as any })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none">
                    <option value="common">কমন বাথরুম</option>
                    <option value="attached">সংযুক্ত বাথরুম</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-300 mb-1">বারান্দা</label>
                  <select value={roomModal.balcony} onChange={e => setRoomModal({ ...roomModal, balcony: e.target.value as any })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none">
                    <option value="none">নেই</option>
                    <option value="attached">সংযুক্ত বারান্দা</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] text-gray-300 mb-1">রুমের সংক্ষিপ্ত বর্ণনা (Description)</label>
                  <textarea rows={2} value={roomModal.description} onChange={e => setRoomModal({ ...roomModal, description: e.target.value })} placeholder="যেমন: টাইলস করা, পর্যাপ্ত আলো-বাতাস..." className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none resize-none" />
                </div>
              </div>

              {/* Room Specific Photos & Videos */}
              <div className="space-y-4 pt-2">
                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-semibold text-indigo-300">📸 রুমের ছবি (Photos)</p>
                    <label className="bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition">
                      + ছবি যোগ
                      <input 
                        type="file" 
                        accept="image/*" 
                        multiple 
                        className="hidden" 
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || []) as File[];
                          if (files.length === 0) return;
                          
                          showAlert(`${files.length}টি ছবি আপলোড হচ্ছে...`, { type: 'info' });
                          try {
                            const urls = await Promise.all(files.map(f => uploadToCloudinary(f)));
                            setRoomModal({ ...roomModal, photos: [...roomModal.photos, ...urls] });
                            showAlert('ছবি আপলোড সফল হয়েছে', { type: 'success' });
                          } catch (err: any) {
                            showAlert('আপলোড ব্যর্থ হয়েছে', { type: 'error' });
                          }
                        }}
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {roomModal.photos.map((p, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/10 group">
                        <img src={p} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <button 
                          onClick={async () => {
                            const urlToDelete = roomModal.photos[idx];
                            setRoomModal({ ...roomModal, photos: roomModal.photos.filter((_, i) => i !== idx) });
                            await deleteFromCloudinary(urlToDelete, 'image');
                          }}
                          className="absolute top-0 right-0 bg-red-600/80 hover:bg-red-600 text-white text-[10px] p-1 rounded-bl transition z-10 flex items-center justify-center w-5 h-5 shadow-md"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {roomModal.photos.length === 0 && <p className="text-[10px] text-gray-500 italic">কোনো ছবি যোগ করা হয়নি</p>}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-semibold text-purple-300">🎥 রুমের ভিডিও (Short Videos)</p>
                    <label className="bg-purple-600 hover:bg-purple-500 px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition">
                      + ভিডিও যোগ
                      <input 
                        type="file" 
                        accept="video/*" 
                        multiple 
                        className="hidden" 
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || []) as File[];
                          if (files.length === 0) return;
                          
                          showAlert(`${files.length}টি ভিডিও আপলোড হচ্ছে...`, { type: 'info' });
                          try {
                            const urls = await Promise.all(files.map(f => uploadToCloudinary(f)));
                            setRoomModal({ ...roomModal, videos: [...roomModal.videos, ...urls] });
                            showAlert('ভিডিও আপলোড সফল হয়েছে', { type: 'success' });
                          } catch (err: any) {
                            showAlert('আপলোড ব্যর্থ হয়েছে', { type: 'error' });
                          }
                        }}
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {roomModal.videos.map((v, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/10 group bg-black/40 flex items-center justify-center">
                        <span className="text-xl">🎬</span>
                        <button 
                          onClick={async () => {
                            const urlToDelete = roomModal.videos[idx];
                            setRoomModal({ ...roomModal, videos: roomModal.videos.filter((_, i) => i !== idx) });
                            await deleteFromCloudinary(urlToDelete, 'video');
                          }}
                          className="absolute top-0 right-0 bg-red-600/80 hover:bg-red-600 text-white text-[10px] p-1 rounded-bl transition z-10 flex items-center justify-center w-5 h-5 shadow-md"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {roomModal.videos.length === 0 && <p className="text-[10px] text-gray-500 italic">কোনো ভিডিও যোগ করা হয়নি</p>}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setRoomModal({ ...roomModal, isOpen: false })} className="flex-1 glass py-2.5 rounded-xl font-semibold">বাতিল</button>
                <button
                  onClick={() => {
                    if (!roomModal.name.trim()) return;
                    const newRoom: Room = {
                      name: roomModal.name,
                      type: roomModal.type,
                      rent: roomModal.rent,
                      status: roomModal.status,
                      loginId: roomModal.loginId,
                      loginPassword: roomModal.loginPassword,
                      meterNo: roomModal.meterNo,
                      photos: roomModal.photos,
                      videos: roomModal.videos,
                      sizeSqFt: roomModal.sizeSqFt,
                      floor: roomModal.floor,
                      facing: roomModal.facing,
                      washroom: roomModal.washroom,
                      balcony: roomModal.balcony,
                      description: roomModal.description
                    };
                    let updatedRooms: Room[];
                    if (roomModal.index >= 0) {
                      updatedRooms = data.rooms.map((r, idx) => idx === roomModal.index ? newRoom : r);
                    } else {
                      updatedRooms = [...data.rooms, newRoom];
                    }
                    onUpdateData({ ...data, rooms: updatedRooms });
                    setRoomModal({ ...roomModal, isOpen: false });
                    showAlert('রুম তথ্য সফলভাবে সংরক্ষিত হয়েছে', { type: 'success' });
                  }}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 py-2.5 rounded-xl font-semibold transition"
                >
                  সংরক্ষণ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: INTEGRATED ROOM DETAIL & PHOTO GALLERY */}
      <RoomDetailModal
        isOpen={!!roomDetailModal}
        onClose={() => setRoomDetailModal(null)}
        room={roomDetailModal}
        occupants={data.tenants.filter(t => t.room === roomDetailModal?.name)}
        photos={data.photos}
        flatInfo={data.flatInfo}
        invoices={data.invoices}
        isOwner={true}
        onUpdatePhotos={(updated) => onUpdateData({ ...data, photos: updated })}
        onEditRoom={(r) => {
          const idx = data.rooms.findIndex(x => x.name === r.name);
          setRoomDetailModal(null);
          setRoomModal({
            isOpen: true,
            index: idx,
            name: r.name,
            type: r.type,
            rent: r.rent,
            status: r.status,
            loginId: r.loginId || '',
            loginPassword: r.loginPassword || '',
            meterNo: r.meterNo || '',
            photos: r.photos || [],
            videos: r.videos || [],
            sizeSqFt: r.sizeSqFt || 120,
            floor: r.floor || '',
            facing: r.facing || '',
            washroom: r.washroom || 'common',
            balcony: r.balcony || 'none',
            description: r.description || ''
          });
        }}
        onSelectTenant={(t) => {
          setRoomDetailModal(null);
          setSelectedTenantForDetail(t);
        }}
      />

      {/* MODAL 3: TENANT EDIT / ADD */}
      {tenantModal.isOpen && (() => {
        const curRoomObj = data.rooms.find(r => r.name === tenantModal.room);
        const curRoomRent = Number(curRoomObj?.rent) || 0;
        const curRoomExistingOccupants = data.tenants.filter((t, idx) => t.room === tenantModal.room && idx !== tenantModal.index);
        const curTotalOccupants = curRoomExistingOccupants.length + 1;
        const curAutoSplitRent = curTotalOccupants > 0 ? Math.round(curRoomRent / curTotalOccupants) : curRoomRent;

        return (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 modal-backdrop overflow-y-auto">
            <div className="glass rounded-2xl w-full max-w-md p-6 animate-pop my-8 border border-white/10 relative">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">{tenantModal.index >= 0 ? 'ভাড়াটিয়া সম্পাদনা' : 'নতুন ভাড়াটিয়া যোগ'}</h3>
                <button onClick={() => setTenantModal({ ...tenantModal, isOpen: false })} className="text-gray-400 hover:text-white">✕</button>
              </div>
              <div className="space-y-3">
                {/* Member Profile Photo Uploader */}
                <div className="flex flex-col items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="relative group w-20 h-20 rounded-full overflow-hidden border border-white/20">
                    {tenantModal.photo ? (
                      <img 
                        src={tenantModal.photo} 
                        alt={tenantModal.name || 'Member'} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-500/20 to-pink-500/20 flex items-center justify-center text-white text-xl font-bold">
                        {tenantModal.name ? tenantModal.name[0] : '👤'}
                      </div>
                    )}
                    <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center cursor-pointer text-[9px] text-white font-semibold">
                      <span>📷 ছবি আপলোড</span>
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
                              setTenantModal({ ...tenantModal, photo: url });
                              showAlert('সদস্যের ছবি আপলোড সফল হয়েছে!', { type: 'success' });
                            } catch (err: any) {
                              showAlert('আপলোড ব্যর্থ হয়েছে: ' + (err?.message || err), { type: 'error' });
                            }
                          }
                        }}
                      />
                    </label>
                  </div>
                  <span className="text-[10px] text-gray-300">সদস্যের ছবি (বাধ্যতামূলক) <span className="text-red-400">*</span></span>
                </div>

                <div><label className="block text-xs text-gray-300 mb-1">নাম *</label><input type="text" value={tenantModal.name} onChange={e => setTenantModal({ ...tenantModal, name: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none" /></div>
                <div><label className="block text-xs text-gray-300 mb-1">ফোন নম্বর *</label><input type="text" value={tenantModal.phone} onChange={e => setTenantModal({ ...tenantModal, phone: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none" /></div>
                <div>
                  <label className="block text-xs text-gray-300 mb-1">রুম *</label>
                  <select
                    value={tenantModal.room}
                    onChange={e => {
                      const selectedRoomName = e.target.value;
                      const targetRoomObj = data.rooms.find(r => r.name === selectedRoomName);
                      const targetRoomRent = Number(targetRoomObj?.rent) || 0;
                      const existingInTarget = data.tenants.filter((t, idx) => t.room === selectedRoomName && idx !== tenantModal.index);
                      const targetTotalOccupants = existingInTarget.length + 1;
                      const targetSplitRent = targetTotalOccupants > 0 ? Math.round(targetRoomRent / targetTotalOccupants) : targetRoomRent;

                      setTenantModal({
                        ...tenantModal,
                        room: selectedRoomName,
                        rent: targetSplitRent,
                        deposit: tenantModal.index < 0 ? String(targetSplitRent) : tenantModal.deposit
                      });
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none"
                  >
                    {data.rooms.filter(r => r.status !== 'owner').map(r => (
                      <option key={r.name} value={r.name}>{r.name} (মোট ভাড়া ৳ {toBn(r.rent)})</option>
                    ))}
                  </select>
                </div>

                {/* Auto-Split Live Card */}
                <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-cyan-300 flex items-center gap-1">
                      <span>⚡</span>
                      <span>রুমের ভাড়া অটো-স্প্লিট হিসাব:</span>
                    </span>
                    <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2.5 py-0.5 rounded-full font-bold">
                      ৳ {toBn(curAutoSplitRent)} / জন
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-300 leading-relaxed">
                    রুম <strong>{tenantModal.room}</strong> এর মোট ভাড়া ৳ {toBn(curRoomRent)}। এই নতুন সদস্য সহ মোট সদস্য: {toBn(curTotalOccupants)} জন।
                  </p>
                  <button
                    type="button"
                    onClick={() => setTenantModal({ ...tenantModal, rent: curAutoSplitRent })}
                    className="text-[10px] bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 px-2 py-0.5 rounded transition font-semibold"
                  >
                    ↻ ভাড়া নির্ধারণ করুন (৳ {toBn(curAutoSplitRent)})
                  </button>
                </div>

                <div><label className="block text-xs text-gray-300 mb-1">মাসিক নির্ধারিত ব্যক্তিগত ভাড়া (৳) *</label><input type="number" value={tenantModal.rent} onChange={e => setTenantModal({ ...tenantModal, rent: Number(e.target.value) })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none font-bold text-pink-400" /></div>
                
                <label className="flex items-center gap-2 text-xs text-cyan-200 cursor-pointer p-2.5 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition">
                  <input
                    type="checkbox"
                    checked={autoSplitRoommates}
                    onChange={e => setAutoSplitRoommates(e.target.checked)}
                    className="w-4 h-4 accent-cyan-500 rounded"
                  />
                  <span>রুমের সকল বর্তমান সদস্যের ভাড়াও অটো-স্প্লিট করে ৳ {toBn(curAutoSplitRent)} সেট করুন</span>
                </label>

                <div><label className="block text-xs text-gray-300 mb-1">জাতীয় পরিচয়পত্র (NID)</label><input type="text" value={tenantModal.nid} onChange={e => setTenantModal({ ...tenantModal, nid: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none" /></div>
                <div><label className="block text-xs text-gray-300 mb-1">জরুরি যোগাযোগ নম্বর</label><input type="text" value={tenantModal.emergency} onChange={e => setTenantModal({ ...tenantModal, emergency: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none" /></div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setTenantModal({ ...tenantModal, isOpen: false })} className="flex-1 glass py-2.5 rounded-xl font-semibold">বাতিল</button>
                  <button
                    onClick={() => {
                      if (!tenantModal.name.trim()) return;
                      if (!tenantModal.photo) {
                        showAlert('অনুগ্রহ করে সদস্যের প্রোফাইল ছবি আপলোড করুন। সকল ভাড়াটিয়া সদস্যের ছবি থাকা বাধ্যতামূলক।', { type: 'warning' });
                        return;
                      }
                      const initials = tenantModal.name.split(' ').map(s => s[0]).join('').substring(0, 2);
                      const newTenant: Tenant = {
                        name: tenantModal.name,
                        fatherName: tenantModal.fatherName,
                        phone: tenantModal.phone,
                        room: tenantModal.room,
                        rent: tenantModal.rent,
                        occupation: tenantModal.occupation,
                        nid: tenantModal.nid,
                        emergency: tenantModal.emergency,
                        moveIn: tenantModal.moveIn,
                        deposit: tenantModal.deposit,
                        initials,
                        color: 'bg-blue-600',
                        photo: tenantModal.photo
                      };
                      let updatedTenants = [...data.tenants];
                      if (tenantModal.index >= 0) {
                        updatedTenants[tenantModal.index] = newTenant;
                      } else {
                        updatedTenants.push(newTenant);
                      }

                      if (autoSplitRoommates) {
                        updatedTenants = updatedTenants.map(t => {
                          if (t.room === tenantModal.room) {
                            return { ...t, rent: tenantModal.rent };
                          }
                          return t;
                        });
                      }

                      const updatedRooms = data.rooms.map(r => {
                        if (r.name === tenantModal.room && r.status === 'empty') {
                          return { ...r, status: 'occupied' as const };
                        }
                        return r;
                      });

                      onUpdateData({ ...data, tenants: updatedTenants, rooms: updatedRooms });
                      setTenantModal({ ...tenantModal, isOpen: false });
                      showAlert(`ভাড়াটিয়া তথ্য সংরক্ষিত হয়েছে! রুমের মোট ভাড়া (৳ ${toBn(curRoomRent)}) অনুযায়ী অটো-স্প্লিট করে ৳ ${toBn(tenantModal.rent)} নির্ধারণ করা হয়েছে।`, { type: 'success' });
                    }}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 py-2.5 rounded-xl font-semibold transition"
                  >
                    সংরক্ষণ
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL 4: PAYMENT MANUAL RECORD */}
      {paymentModal.isOpen && paymentModal.invoice && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 modal-backdrop overflow-y-auto">
          <div className="glass rounded-2xl w-full max-w-md p-6 animate-pop my-8 border border-white/10 relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">পেমেন্ট যোগ করুন</h3>
              <button onClick={() => setPaymentModal({ ...paymentModal, isOpen: false })} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-white/5 text-xs text-gray-300">
                <p>রুম: <strong className="text-white">{paymentModal.invoice.room}</strong></p>
                <p>মাস: <strong className="text-white">{paymentModal.invoice.month}</strong></p>
              </div>
              <div>
                <label className="block text-xs text-gray-300 mb-1">পরিমাণ (৳) *</label>
                <input type="number" value={paymentModal.amount} onChange={e => setPaymentModal({ ...paymentModal, amount: Number(e.target.value) })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-300 mb-1">পেমেন্ট পদ্ধতি</label>
                <select value={paymentModal.method} onChange={e => setPaymentModal({ ...paymentModal, method: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none">
                  <option value="নগদ">নগদ</option>
                  <option value="বিকাশ">বিকাশ</option>
                  <option value="নগদ (অ্যাপ)">নগদ (Nagad)</option>
                  <option value="ব্যাংক">ব্যাংক ট্রান্সফার</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-300 mb-1">Transaction ID / TrxID (বিকাশ/নগদ/ব্যাংকের ক্ষেত্রে)</label>
                <input
                  type="text"
                  placeholder="যেমন: 8N7A2K9XYZ"
                  value={paymentModal.trxId || ''}
                  onChange={e => setPaymentModal({ ...paymentModal, trxId: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm font-mono outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-300 mb-1">নোট</label>
                <input type="text" placeholder="ঐচ্ছিক" value={paymentModal.note} onChange={e => setPaymentModal({ ...paymentModal, note: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setPaymentModal({ ...paymentModal, isOpen: false })} className="flex-1 glass py-2.5 rounded-xl font-semibold">বাতিল</button>
                <button
                  onClick={() => {
                    const invId = paymentModal.invoice!.id;
                    const updatedInvoices = data.invoices.map(inv => {
                      if (inv.id === invId) {
                        return {
                          ...inv,
                          payments: [
                            ...(inv.payments || []),
                            {
                              id: 'PAY-' + Date.now(),
                              amount: paymentModal.amount,
                              date: paymentModal.date,
                              method: paymentModal.method,
                              trxId: paymentModal.trxId,
                              note: paymentModal.note || (paymentModal.trxId ? `TrxID: ${paymentModal.trxId}` : ''),
                              loggedAt: new Date().toISOString()
                            }
                          ]
                        };
                      }
                      return inv;
                    });
                    onUpdateData({ ...data, invoices: updatedInvoices });
                    setPaymentModal({ ...paymentModal, isOpen: false });
                    showAlert('পেমেন্ট সফলভাবে যুক্ত হয়েছে', { type: 'success' });
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 py-2.5 rounded-xl font-semibold transition"
                >
                  পেমেন্ট সংরক্ষণ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: POLICE FORM MANAGER MODAL */}
      {policeManagerModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 modal-backdrop overflow-y-auto">
          <div className="glass rounded-2xl w-full max-w-4xl p-6 animate-pop my-8 border border-white/10 space-y-5 relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-2xl shadow-lg border border-blue-400/30 flex-shrink-0">
                  👮
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">বাংলাদেশ পুলিশ ভাড়াটিয়া তথ্য নিবন্ধন (CIMS) ম্যানেজার</h3>
                  <p className="text-xs text-cyan-400">ভাড়াটিয়াদের ৭-ধাপের পূর্ণাঙ্গ তথ্য যাচাই, সম্পাদনা ও অফিসিয়াল প্রিন্ট</p>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    const firstTenant = data.tenants[0];
                    setPoliceModalState({
                      isOpen: true,
                      room: firstTenant?.room || data.rooms[1]?.name || data.rooms[0]?.name,
                      tenantName: firstTenant?.name || '',
                      tenantPhone: firstTenant?.phone || '',
                      tenantNid: firstTenant?.nid || '',
                      values: {
                        applicantName: firstTenant?.name || '',
                        phone: firstTenant?.phone || '',
                        nid: firstTenant?.nid || '',
                        presentAddress: `${firstTenant?.room || data.rooms[1]?.name}, ${data.flatInfo.name}, ${data.flatInfo.address}`,
                        landlordName: data.flatInfo.ownerName,
                        landlordPhone: data.flatInfo.phone
                      }
                    });
                  }}
                  className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl text-xs font-bold text-white shadow transition flex items-center gap-1.5"
                >
                  <span>+</span> নতুন পুলিশ ফরম তৈরি
                </button>
                <button onClick={() => setPoliceManagerModal(false)} className="glass px-3 py-2 rounded-xl text-gray-400 hover:text-white text-xs font-semibold">
                  ✕ বন্ধ করুন
                </button>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                <p className="text-[11px] text-gray-400">মোট ফরম</p>
                <p className="text-lg font-bold text-white">{toBn(data.legalDocs.filter(d => d.type === 'policeVerification').length)}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <p className="text-[11px] text-emerald-300">যাচাইকৃত</p>
                <p className="text-lg font-bold text-emerald-400">{toBn(data.legalDocs.filter(d => d.type === 'policeVerification' && d.status === 'verified').length)}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                <p className="text-[11px] text-amber-300">অপেক্ষমাণ</p>
                <p className="text-lg font-bold text-amber-400">{toBn(data.legalDocs.filter(d => d.type === 'policeVerification' && d.status !== 'verified').length)}</p>
              </div>
            </div>

            <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
              {data.legalDocs
                .filter(d => d.type === 'policeVerification')
                .map(d => (
                  <div key={d.id} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-base text-white">{d.values?.applicantName || 'অজ্ঞাত'}</span>
                        {d.values?.applicantNameEn && (
                          <span className="text-xs text-gray-400">({d.values?.applicantNameEn})</span>
                        )}
                        <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-cyan-300 font-semibold">
                          রুম: {d.room}
                        </span>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                          d.status === 'verified' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          d.status === 'rejected' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                          'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {d.status === 'verified' ? '✓ যাচাই সম্পন্ন' : d.status === 'rejected' ? '✗ বাতিল' : '⏳ যাচাই অপেক্ষমাণ'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-300 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1">
                        <p><strong className="text-gray-400">NID:</strong> <span className="font-mono text-cyan-300">{d.values?.nid || '—'}</span></p>
                        <p><strong className="text-gray-400">মোবাইল:</strong> <span className="font-mono text-emerald-300">{d.values?.phone || '—'}</span></p>
                        <p><strong className="text-gray-400">পেশা:</strong> {d.values?.occupation || '—'}</p>
                        <p><strong className="text-gray-400">পিতা:</strong> {d.values?.fatherName || '—'}</p>
                        <p><strong className="text-gray-400">জমার তারিখ:</strong> {d.date}</p>
                        <p><strong className="text-gray-400">জমা দিয়েছেন:</strong> {d.submittedBy === 'tenant' ? 'ভাড়াটিয়া' : 'বাড়িওয়ালা'}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap self-end md:self-center">
                      <button
                        onClick={() => {
                          setPoliceModalState({
                            isOpen: true,
                            docId: d.id,
                            room: d.room,
                            tenantName: d.values?.applicantName,
                            tenantPhone: d.values?.phone,
                            tenantNid: d.values?.nid,
                            values: d.values || {},
                            status: d.status
                          });
                        }}
                        className="px-3 py-1.5 glass text-xs font-semibold text-cyan-300 hover:bg-cyan-500/10 rounded-lg flex items-center gap-1"
                      >
                        <span>✏️</span> বিস্তারিত / সম্পাদন
                      </button>
                      <button onClick={() => printLegalDoc(d)} className="px-3 py-1.5 glass text-xs font-semibold text-white hover:bg-white/10 rounded-lg flex items-center gap-1">
                        <span>🖨️</span> অফিসিয়াল ফরম
                      </button>
                      <button
                        onClick={() => {
                          const nextStatus = d.status === 'verified' ? ('pending' as const) : ('verified' as const);
                          const updated = data.legalDocs.map(item => item.id === d.id ? { ...item, status: nextStatus } : item);
                          onUpdateData({ ...data, legalDocs: updated });
                          showAlert(nextStatus === 'verified' ? 'ফরম সফলভাবে যাচাই ও অনুমোদিত হয়েছে' : 'ফরম অপেক্ষমাণ স্ট্যাটাসে নেওয়া হয়েছে', { type: 'success' });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          d.status === 'verified' ? 'bg-amber-600/30 text-amber-300 hover:bg-amber-600/50' : 'bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/50'
                        }`}
                      >
                        {d.status === 'verified' ? 'অপেক্ষমাণ' : '✓ যাচাই'}
                      </button>
                    </div>
                  </div>
                ))}
              {data.legalDocs.filter(d => d.type === 'policeVerification').length === 0 && (
                <div className="text-center py-10 space-y-3">
                  <span className="text-4xl block">👮</span>
                  <p className="text-gray-300 font-semibold">কোনো পুলিশ ভেরিফিকেশন ফরম জমা পড়েনি</p>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    ভাড়াটিয়ারা তাদের ড্যাশবোর্ড থেকে ফরম জমা দিতে পারবেন অথবা আপনি উপরের বাটনে ক্লিক করে নতুন ফরম তৈরি করতে পারবেন।
                  </p>
                </div>
              )}
            </div>

            <button onClick={() => setPoliceManagerModal(false)} className="w-full glass py-2.5 rounded-xl font-semibold text-sm hover:bg-white/10">
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}

      {/* POLICE VERIFICATION DETAILED MODAL FOR OWNER */}
      <PoliceVerificationModal
        isOpen={policeModalState.isOpen}
        onClose={() => setPoliceModalState(prev => ({ ...prev, isOpen: false }))}
        initialValues={policeModalState.values}
        currentUserRole="owner"
        flatInfo={data.flatInfo}
        roomNumber={policeModalState.room || data.rooms[1]?.name || data.rooms[0]?.name}
        tenantName={policeModalState.tenantName || 'ভাড়াটিয়া'}
        tenantPhone={policeModalState.tenantPhone || ''}
        tenantNid={policeModalState.tenantNid || ''}
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
              room: policeModalState.room || data.rooms[1]?.name || 'রুম',
              submittedBy: 'owner',
              submittedAt: new Date().toISOString(),
              date: new Date().toLocaleDateString('bn-BD'),
              status: 'verified'
            };
            updatedDocs = [targetDoc, ...updatedDocs];
          }

          onUpdateData({
            ...data,
            legalDocs: updatedDocs,
            notifications: [
              {
                id: 'NOTIF-' + Date.now(),
                forRole: 'tenant',
                title: 'পুলিশ ভেরিফিকেশন ফরম আপডেট',
                message: `বাড়িওয়ালা কর্তৃক পুলিশ ভেরিফিকেশন ফরম আপডেট করা হয়েছে`,
                read: false,
                createdAt: new Date().toISOString()
              },
              ...data.notifications
            ]
          });

          setPoliceModalState(prev => ({ ...prev, isOpen: false }));
          showAlert('পুলিশ ফরম সফলভাবে সংরক্ষিত হয়েছে! প্রিন্ট ভিউ লোড হচ্ছে...', { type: 'success' });
          setTimeout(() => printLegalDoc(targetDoc), 600);
        }}
        onPrint={(formVals) => {
          printLegalDoc({
            id: policeModalState.docId || 'DOC-' + Date.now(),
            type: 'policeVerification',
            typeName: 'পুলিশ ভেরিফিকেশন ফরম',
            values: formVals,
            room: policeModalState.room || 'রুম',
            submittedBy: 'owner',
            submittedAt: new Date().toISOString(),
            date: new Date().toLocaleDateString('bn-BD')
          });
        }}
      />

      {/* MODAL 6: LEGAL TEMPLATE GENERATOR */}
      {legalTemplateModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 modal-backdrop overflow-y-auto">
          <div className="glass rounded-2xl w-full max-w-lg p-6 animate-pop my-8 border border-white/10 relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">বাসা ভাড়া চুক্তিপত্র তৈরি</h3>
              <button onClick={() => setLegalTemplateModal({ ...legalTemplateModal, isOpen: false })} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              <div>
                <label className="block text-xs text-gray-300 mb-1">বাড়িওয়ালার নাম</label>
                <input
                  type="text"
                  value={legalTemplateModal.values.landlordName || data.flatInfo.ownerName}
                  onChange={e => setLegalTemplateModal({ ...legalTemplateModal, values: { ...legalTemplateModal.values, landlordName: e.target.value } })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-300 mb-1">ভাড়াটিয়ার নাম *</label>
                <input
                  type="text"
                  placeholder="ভাড়াটিয়ার নাম লিখুন"
                  value={legalTemplateModal.values.tenantName || ''}
                  onChange={e => setLegalTemplateModal({ ...legalTemplateModal, values: { ...legalTemplateModal.values, tenantName: e.target.value } })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-300 mb-1">রুম নম্বর *</label>
                <select
                  value={legalTemplateModal.values.roomNo || data.rooms[1]?.name}
                  onChange={e => setLegalTemplateModal({ ...legalTemplateModal, values: { ...legalTemplateModal.values, roomNo: e.target.value } })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none"
                >
                  {data.rooms.map(r => (
                    <option key={r.name} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-300 mb-1">মাসিক ভাড়া (৳) *</label>
                <input
                  type="number"
                  placeholder="৮০০০"
                  value={legalTemplateModal.values.monthlyRent || ''}
                  onChange={e => setLegalTemplateModal({ ...legalTemplateModal, values: { ...legalTemplateModal.values, monthlyRent: e.target.value } })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-300 mb-1">অগ্রিম সিকিউরিটি জমা (৳) *</label>
                <input
                  type="number"
                  placeholder="৮০০০"
                  value={legalTemplateModal.values.advanceAmount || ''}
                  onChange={e => setLegalTemplateModal({ ...legalTemplateModal, values: { ...legalTemplateModal.values, advanceAmount: e.target.value } })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4 border-t border-white/10 mt-4">
              <button onClick={() => setLegalTemplateModal({ ...legalTemplateModal, isOpen: false })} className="flex-1 glass py-2.5 rounded-xl font-semibold">বাতিল</button>
              <button
                onClick={() => {
                  const doc: LegalDoc = {
                    id: legalTemplateModal.docId || ('DOC-' + Date.now()),
                    type: 'rentAgreement',
                    typeName: 'বাসা ভাড়া চুক্তিপত্র',
                    values: {
                      landlordName: legalTemplateModal.values.landlordName || data.flatInfo.ownerName,
                      tenantName: legalTemplateModal.values.tenantName || 'ভাড়াটিয়া',
                      roomNo: legalTemplateModal.values.roomNo || data.rooms[1]?.name || data.rooms[0]?.name,
                      monthlyRent: legalTemplateModal.values.monthlyRent || '৮০০০',
                      advanceAmount: legalTemplateModal.values.advanceAmount || '৮০০০',
                      propertyAddress: data.flatInfo.address,
                      startDate: legalTemplateModal.values.startDate || new Date().toLocaleDateString('bn-BD'),
                      durationMonths: legalTemplateModal.values.durationMonths || '১১'
                    },
                    room: legalTemplateModal.values.roomNo || data.rooms[1]?.name || data.rooms[0]?.name,
                    submittedBy: 'owner',
                    submittedAt: new Date().toISOString(),
                    date: new Date().toLocaleDateString('bn-BD')
                  };
                  const updatedDocs = legalTemplateModal.docId
                    ? data.legalDocs.map(d => d.id === legalTemplateModal.docId ? doc : d)
                    : [doc, ...data.legalDocs];
                  onUpdateData({ ...data, legalDocs: updatedDocs });
                  setLegalTemplateModal({ isOpen: false, templateKey: '', values: {} });
                  showAlert(legalTemplateModal.docId ? 'চুক্তিপত্র সফলভাবে আপডেট হয়েছে!' : 'চুক্তিপত্র তৈরি হয়েছে! ডাউনলোড শুরু হচ্ছে...', { type: 'success' });
                  if (!legalTemplateModal.docId) {
                    setTimeout(() => printLegalDoc(doc), 600);
                  }
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 py-2.5 rounded-xl font-semibold transition"
              >
                {legalTemplateModal.docId ? 'আপডেট করুন' : 'ডকুমেন্ট তৈরি ও ডাউনলোড'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: COMPLAINT REPLY */}
      {complaintReplyModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 modal-backdrop overflow-y-auto">
          <div className="glass rounded-2xl w-full max-w-md p-6 animate-pop my-8 border border-white/10 relative">
            <h3 className="text-xl font-bold mb-3">অভিযোগে উত্তর দিন</h3>
            <textarea
              rows={3}
              placeholder="আপনার উত্তর লিখুন..."
              value={complaintReplyModal.message}
              onChange={e => setComplaintReplyModal({ ...complaintReplyModal, message: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none"
            />
            <div className="flex gap-3 pt-3">
              <button onClick={() => setComplaintReplyModal({ ...complaintReplyModal, isOpen: false })} className="flex-1 glass py-2.5 rounded-xl font-semibold">বাতিল</button>
              <button
                onClick={() => {
                  if (!complaintReplyModal.message.trim()) return;
                  const updated = data.complaints.map((c, idx) => {
                    if (idx === complaintReplyModal.index) {
                      return {
                        ...c,
                        replies: [...(c.replies || []), { by: 'owner' as const, message: complaintReplyModal.message, date: new Date().toLocaleDateString('bn-BD') }]
                      };
                    }
                    return c;
                  });
                  onUpdateData({ ...data, complaints: updated });
                  setComplaintReplyModal({ ...complaintReplyModal, isOpen: false });
                  showAlert('উত্তর পাঠানো হয়েছে', { type: 'success' });
                }}
                className="flex-1 bg-cyan-600 hover:bg-cyan-500 py-2.5 rounded-xl font-semibold transition"
              >
                পাঠান
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 8: NOTICE CREATE */}
      {noticeModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop overflow-y-auto">
          <div className="glass rounded-2xl w-full max-w-md p-6 animate-pop my-8 border border-white/10">
            <h3 className="text-xl font-bold mb-3">{noticeModal.index !== undefined && noticeModal.index >= 0 ? 'নোটিশ সম্পাদনা' : 'নতুন নোটিশ প্রকাশ'}</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="শিরোনাম"
                value={noticeModal.title}
                onChange={e => setNoticeModal({ ...noticeModal, title: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none"
              />
              <textarea
                rows={4}
                placeholder="বিবরণ"
                value={noticeModal.desc}
                onChange={e => setNoticeModal({ ...noticeModal, desc: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none"
              />
              <div className="flex gap-3 pt-2">
                <button onClick={() => setNoticeModal({ isOpen: false, index: -1, title: '', desc: '' })} className="flex-1 glass py-2.5 rounded-xl font-semibold">বাতিল</button>
                <button
                  onClick={() => {
                    if (!noticeModal.title) return;
                    if (noticeModal.index !== undefined && noticeModal.index >= 0) {
                      const updatedNotices = data.notices.map((n, idx) =>
                        idx === noticeModal.index ? { ...n, title: noticeModal.title, desc: noticeModal.desc } : n
                      );
                      onUpdateData({ ...data, notices: updatedNotices });
                      showAlert('নোটিশ সফলভাবে আপডেট করা হয়েছে!', { type: 'success' });
                    } else {
                      const newNotice: Notice = {
                        title: noticeModal.title,
                        desc: noticeModal.desc,
                        date: new Date().toLocaleDateString('bn-BD'),
                        readBy: []
                      };
                      onUpdateData({ ...data, notices: [newNotice, ...data.notices] });
                      showAlert('নোটিশ প্রকাশিত হয়েছে!', { type: 'success' });
                    }
                    setNoticeModal({ isOpen: false, index: -1, title: '', desc: '' });
                  }}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 py-2.5 rounded-xl font-semibold transition"
                >
                  {noticeModal.index !== undefined && noticeModal.index >= 0 ? 'আপডেট করুন' : 'প্রকাশ করুন'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 9: RULE CREATE */}
      {ruleModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
          <div className="glass rounded-2xl w-full max-w-md p-6 animate-pop border border-white/10 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-cyan-300 flex items-center gap-1.5">
                <span>📜</span> নতুন ফ্ল্যাট রুল/নিয়ম যোগ
              </h3>
              <button onClick={() => setRuleModal({ isOpen: false, text: '' })} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div>
              <label className="block text-xs text-gray-300 mb-1">নিয়মের বিবরণ *</label>
              <textarea
                rows={3}
                placeholder="যেমন: রাত ১০:৩০ টার পর মেইন গেইট বন্ধ থাকবে..."
                value={ruleModal.text}
                onChange={e => setRuleModal({ ...ruleModal, text: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-cyan-400 resize-none"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setRuleModal({ isOpen: false, text: '' })} className="flex-1 glass py-2.5 rounded-xl text-xs font-semibold">বাতিল</button>
              <button
                onClick={() => {
                  if (!ruleModal.text.trim()) return;
                  const updatedRules = [...(data.rules || []), ruleModal.text.trim()];
                  onUpdateData({ ...data, rules: updatedRules });
                  setRuleModal({ isOpen: false, text: '' });
                  showAlert('নতুন ফ্ল্যাট রুল সফলভাবে যুক্ত হয়েছে!', { type: 'success' });
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 py-2.5 rounded-xl text-xs font-semibold transition"
              >
                যোগ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 10: DEPOSIT RECORD */}
      {depositModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
          <div className="glass rounded-2xl w-full max-w-md p-6 animate-pop border border-white/10 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-1.5">
                <span>💰</span> {depositModal.isEditing ? 'জামানত (ডিপোজিট) এডিট করুন' : 'নতুন জামানত (ডিপোজিট) রেকর্ড'}
              </h3>
              <button onClick={() => setDepositModal({ isOpen: false, room: '', type: 'deposit', amount: 0, note: '' })} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-300 mb-1">লেনদেনের ধরন</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDepositModal({ ...depositModal, type: 'deposit' })}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${depositModal.type === 'deposit' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'bg-white/5 border-white/10 text-gray-400'}`}
                  >
                    + জামানত গ্রহণ
                  </button>
                  <button
                    type="button"
                    onClick={() => setDepositModal({ ...depositModal, type: 'refund' })}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${depositModal.type === 'refund' ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-white/5 border-white/10 text-gray-400'}`}
                  >
                    - জামানত ফেরত (রিফান্ড)
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-300 mb-1">রুম নির্বাচন করুন *</label>
                <select
                  value={depositModal.room}
                  onChange={e => setDepositModal({ ...depositModal, room: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none"
                >
                  {data.rooms.map(r => (
                    <option key={r.name} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-300 mb-1">টাকার পরিমাণ (৳) *</label>
                <input
                  type="number"
                  value={depositModal.amount || ''}
                  onChange={e => setDepositModal({ ...depositModal, amount: Number(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none text-emerald-300 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-300 mb-1">মন্তব্য / নোট (ঐচ্ছিক)</label>
                <input
                  type="text"
                  placeholder="যেমন: ১ মাসের অগ্রিম সিকিউরিটি মানি"
                  value={depositModal.note}
                  onChange={e => setDepositModal({ ...depositModal, note: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setDepositModal({ isOpen: false, room: '', type: 'deposit', amount: 0, note: '' })} className="flex-1 glass py-2.5 rounded-xl text-xs font-semibold">বাতিল</button>
              <button
                onClick={() => {
                  if (!depositModal.amount || depositModal.amount <= 0) return;
                  const tenantInRoom = data.tenants.find(t => t.room === depositModal.room);

                  if (depositModal.isEditing && depositModal.id) {
                    const updatedDeposits = data.deposits.map(d => {
                      if (d.id === depositModal.id) {
                        return {
                          ...d,
                          room: depositModal.room,
                          tenantName: tenantInRoom?.name || d.tenantName || 'ভাড়াটিয়া',
                          amount: depositModal.amount,
                          type: depositModal.type,
                          note: depositModal.note
                        };
                      }
                      return d;
                    });
                    onUpdateData({ ...data, deposits: updatedDeposits });
                    showAlert('ডিপোজিট রেকর্ড সফলভাবে আপডেট করা হয়েছে!', { type: 'success' });
                  } else {
                    const newDeposit: Deposit = {
                      id: 'DEP-' + Date.now(),
                      room: depositModal.room || data.rooms[0]?.name || 'রুম',
                      tenantName: tenantInRoom?.name || 'ভাড়াটিয়া',
                      amount: depositModal.amount,
                      type: depositModal.type,
                      note: depositModal.note,
                      date: new Date().toLocaleDateString('bn-BD'),
                      createdAt: new Date().toISOString()
                    };
                    onUpdateData({ ...data, deposits: [newDeposit, ...data.deposits] });
                    showAlert(depositModal.type === 'deposit' ? 'জামানত সফলভাবে যুক্ত হয়েছে!' : 'জামানত ফেরত রেকর্ড করা হয়েছে!', { type: 'success' });
                  }

                  setDepositModal({ isOpen: false, room: '', type: 'deposit', amount: 0, note: '' });
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 py-2.5 rounded-xl text-xs font-semibold text-white transition"
              >
                {depositModal.isEditing ? 'আপডেট করুন' : 'সংরক্ষণ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 11: ADVANCE PAYMENT RECORD */}
      {advanceModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
          <div className="glass rounded-2xl w-full max-w-md p-6 animate-pop border border-white/10 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-cyan-300 flex items-center gap-1.5">
                <span>💵</span> {advanceModal.isEditing ? 'অগ্রিম ভাড়া (এডভান্স) এডিট করুন' : 'নতুন অগ্রিম ভাড়া (এডভান্স)'}
              </h3>
              <button onClick={() => setAdvanceModal({ isOpen: false, room: '', amount: 0, months: 1, note: '' })} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-300 mb-1">রুম নির্বাচন করুন *</label>
                <select
                  value={advanceModal.room}
                  onChange={e => setAdvanceModal({ ...advanceModal, room: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none"
                >
                  {data.rooms.map(r => (
                    <option key={r.name} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-300 mb-1">কয় মাসের অগ্রিম?</label>
                <input
                  type="number"
                  value={advanceModal.months || 1}
                  onChange={e => setAdvanceModal({ ...advanceModal, months: Number(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-300 mb-1">অগ্রিম মোট টাকা (৳) *</label>
                <input
                  type="number"
                  value={advanceModal.amount || ''}
                  onChange={e => setAdvanceModal({ ...advanceModal, amount: Number(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none text-cyan-300 font-bold"
                />
              </div>
              {advanceModal.isEditing && (
                <div>
                  <label className="block text-xs text-gray-300 mb-1">স্ট্যাটাস</label>
                  <select
                    value={advanceModal.status || 'active'}
                    onChange={e => setAdvanceModal({ ...advanceModal, status: e.target.value as 'active' | 'used' })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none"
                  >
                    <option value="active">সক্রিয় (Active)</option>
                    <option value="used">সমন্বিত/ব্যবহৃত (Used)</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs text-gray-300 mb-1">নোট / মন্তব্য</label>
                <input
                  type="text"
                  placeholder="যেমন: ২ মাসের অগ্রিম ভাড়া সমন্বয় করা হবে"
                  value={advanceModal.note}
                  onChange={e => setAdvanceModal({ ...advanceModal, note: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setAdvanceModal({ isOpen: false, room: '', amount: 0, months: 1, note: '' })} className="flex-1 glass py-2.5 rounded-xl text-xs font-semibold">বাতিল</button>
              <button
                onClick={() => {
                  if (!advanceModal.amount || advanceModal.amount <= 0) return;
                  const tenantInRoom = data.tenants.find(t => t.room === advanceModal.room);

                  if (advanceModal.isEditing && advanceModal.id) {
                    const updatedAdvances = data.advances.map(a => {
                      if (a.id === advanceModal.id) {
                        return {
                          ...a,
                          room: advanceModal.room,
                          tenantName: tenantInRoom?.name || a.tenantName || 'ভাড়াটিয়া',
                          amount: advanceModal.amount,
                          months: advanceModal.months || 1,
                          status: advanceModal.status || a.status || 'active',
                          note: advanceModal.note
                        };
                      }
                      return a;
                    });
                    onUpdateData({ ...data, advances: updatedAdvances });
                    showAlert('অগ্রিম রেকর্ড সফলভাবে আপডেট করা হয়েছে!', { type: 'success' });
                  } else {
                    const newAdv: Advance = {
                      id: 'ADV-' + Date.now(),
                      room: advanceModal.room || data.rooms[0]?.name || 'রুম',
                      tenantName: tenantInRoom?.name || 'ভাড়াটিয়া',
                      amount: advanceModal.amount,
                      months: advanceModal.months || 1,
                      note: advanceModal.note,
                      status: 'active',
                      date: new Date().toLocaleDateString('bn-BD'),
                      createdAt: new Date().toISOString()
                    };
                    onUpdateData({ ...data, advances: [newAdv, ...data.advances] });
                    showAlert('নতুন অগ্রিম সফলভাবে রেকর্ড করা হয়েছে!', { type: 'success' });
                  }

                  setAdvanceModal({ isOpen: false, room: '', amount: 0, months: 1, note: '' });
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 py-2.5 rounded-xl text-xs font-semibold text-white transition"
              >
                {advanceModal.isEditing ? 'আপডেট করুন' : 'সংরক্ষণ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 12: VISITOR RECORD */}
      {visitorModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
          <div className="glass rounded-2xl w-full max-w-md p-6 animate-pop border border-white/10 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-indigo-300 flex items-center gap-1.5">
                <span>👥</span> নতুন ভিজিটর এন্ট্রি
              </h3>
              <button onClick={() => setVisitorModal({ isOpen: false, name: '', phone: '', room: '', purpose: '' })} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-300 mb-1">ভিজিটরের নাম *</label>
                <input
                  type="text"
                  placeholder="নাম লিখুন"
                  value={visitorModal.name}
                  onChange={e => setVisitorModal({ ...visitorModal, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-300 mb-1">মোবাইল নম্বর</label>
                <input
                  type="text"
                  placeholder="০১৭XXXXXXXX"
                  value={visitorModal.phone}
                  onChange={e => setVisitorModal({ ...visitorModal, phone: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-300 mb-1">উদ্দেশ্য / কার দর্শনার্থী? *</label>
                <select
                  value={visitorModal.room}
                  onChange={e => setVisitorModal({ ...visitorModal, room: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none"
                >
                  {data.rooms.map(r => (
                    <option key={r.name} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-300 mb-1">আগমনের কারণ</label>
                <input
                  type="text"
                  placeholder="যেমন: আত্মীয় / ডেলিভারি / মেরামত কর্মী"
                  value={visitorModal.purpose}
                  onChange={e => setVisitorModal({ ...visitorModal, purpose: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setVisitorModal({ isOpen: false, name: '', phone: '', room: '', purpose: '' })} className="flex-1 glass py-2.5 rounded-xl text-xs font-semibold">বাতিল</button>
              <button
                onClick={() => {
                  if (!visitorModal.name.trim()) return;
                  const newVis: Visitor = {
                    id: 'VIS-' + Date.now(),
                    name: visitorModal.name,
                    phone: visitorModal.phone,
                    room: visitorModal.room || data.rooms[0]?.name || 'রুম',
                    purpose: visitorModal.purpose || 'ভিজিট',
                    entryTime: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
                    exitTime: null,
                    entryTimestamp: new Date().toISOString()
                  };
                  onUpdateData({ ...data, visitors: [newVis, ...data.visitors] });
                  setVisitorModal({ isOpen: false, name: '', phone: '', room: '', purpose: '' });
                  showAlert('ভিজিটর সফলভাবে রেকর্ড করা হয়েছে!', { type: 'success' });
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 py-2.5 rounded-xl text-xs font-semibold text-white transition"
              >
                এন্ট্রি করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 13: SCHEDULED NOTICE RECORD */}
      {scheduledNoticeModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
          <div className="glass rounded-2xl w-full max-w-md p-6 animate-pop border border-white/10 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-purple-300 flex items-center gap-1.5">
                <span>📅</span> শিডিউলড নোটিশ প্রকাশ
              </h3>
              <button onClick={() => setScheduledNoticeModal({ isOpen: false, title: '', desc: '', date: '' })} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-300 mb-1">নোটিশের শিরোনাম *</label>
                <input
                  type="text"
                  placeholder="যেমন: আগামী ১০ তারিখ পানির ট্যাংকি পরিষ্কার করা হবে"
                  value={scheduledNoticeModal.title}
                  onChange={e => setScheduledNoticeModal({ ...scheduledNoticeModal, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-300 mb-1">প্রকাশের শিডিউল তারিখ</label>
                <input
                  type="date"
                  value={scheduledNoticeModal.date}
                  onChange={e => setScheduledNoticeModal({ ...scheduledNoticeModal, date: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-300 mb-1">বিস্তারিত বিবরণ</label>
                <textarea
                  rows={3}
                  placeholder="নোটিশের বিস্তারিত লিখুন..."
                  value={scheduledNoticeModal.desc}
                  onChange={e => setScheduledNoticeModal({ ...scheduledNoticeModal, desc: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none resize-none"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setScheduledNoticeModal({ isOpen: false, title: '', desc: '', date: '' })} className="flex-1 glass py-2.5 rounded-xl text-xs font-semibold">বাতিল</button>
              <button
                onClick={() => {
                  if (!scheduledNoticeModal.title.trim()) return;
                  const newNotice: Notice = {
                    title: `[শিডিউলড: ${scheduledNoticeModal.date || 'আসন্ন'}] ${scheduledNoticeModal.title}`,
                    desc: scheduledNoticeModal.desc,
                    date: scheduledNoticeModal.date ? new Date(scheduledNoticeModal.date).toLocaleDateString('bn-BD') : new Date().toLocaleDateString('bn-BD'),
                    readBy: []
                  };
                  onUpdateData({ ...data, notices: [newNotice, ...data.notices] });
                  setScheduledNoticeModal({ isOpen: false, title: '', desc: '', date: '' });
                  showAlert('শিডিউলড নোটিশ সফলভাবে যুক্ত করা হয়েছে!', { type: 'success' });
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 py-2.5 rounded-xl text-xs font-semibold text-white transition"
              >
                শিডিউল সেট করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 14: RENT INCREASE */}
      {rentIncreaseModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
          <div className="glass rounded-2xl w-full max-w-md p-6 animate-pop border border-white/10 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-pink-300 flex items-center gap-1.5">
                <span>📈</span> ভাড়া বৃদ্ধি / পরিবর্তন
              </h3>
              <button onClick={() => setRentIncreaseModal({ isOpen: false, tenantIndex: -1, newRent: 0, reason: '', date: '' })} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-300 mb-1">নতুন মাসিক নির্ধারিত ভাড়া (৳) *</label>
                <input
                  type="number"
                  value={rentIncreaseModal.newRent || ''}
                  onChange={e => setRentIncreaseModal({ ...rentIncreaseModal, newRent: Number(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none text-pink-400 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-300 mb-1">কার্যকরের তারিখ</label>
                <input
                  type="date"
                  value={rentIncreaseModal.date}
                  onChange={e => setRentIncreaseModal({ ...rentIncreaseModal, date: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-300 mb-1">ভাড়া বৃদ্ধির কারণ / নোটিশ</label>
                <input
                  type="text"
                  placeholder="যেমন: বার্ষিক নিয়ম অনুযায়ী ৫% বৃদ্ধি"
                  value={rentIncreaseModal.reason}
                  onChange={e => setRentIncreaseModal({ ...rentIncreaseModal, reason: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setRentIncreaseModal({ isOpen: false, tenantIndex: -1, newRent: 0, reason: '', date: '' })} className="flex-1 glass py-2.5 rounded-xl text-xs font-semibold">বাতিল</button>
              <button
                onClick={() => {
                  if (rentIncreaseModal.tenantIndex < 0 || !rentIncreaseModal.newRent) return;
                  const updatedTenants = data.tenants.map((t, idx) =>
                    idx === rentIncreaseModal.tenantIndex ? { ...t, rent: rentIncreaseModal.newRent } : t
                  );
                  onUpdateData({ ...data, tenants: updatedTenants });
                  setRentIncreaseModal({ isOpen: false, tenantIndex: -1, newRent: 0, reason: '', date: '' });
                  showAlert('ভাড়া সফলভাবে আপডেট করা হয়েছে!', { type: 'success' });
                }}
                className="flex-1 bg-rose-600 hover:bg-rose-500 py-2.5 rounded-xl text-xs font-semibold text-white transition"
              >
                আপডেট করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 15: ROOM MOVE OUT */}
      {moveOutModal.isOpen && (() => {
        const leavingTenant = data.tenants[moveOutModal.tenantIndex];
        const roomName = leavingTenant?.room || '';
        const activeAdvList = data.advances.filter(a => a.room === roomName && a.status === 'active');
        const totalAdvAmount = activeAdvList.reduce((sum, a) => sum + Number(a.amount || 0), 0);
        const tenantDeposit = Number(leavingTenant?.deposit || 0);
        const roomInvoice = data.invoices.find(inv => inv.room === roomName && inv.status !== 'paid');
        const dueRentAmount = roomInvoice ? getInvoiceStats(roomInvoice).remaining : Number(leavingTenant?.rent || 0);
        const autoAdjusted = Math.min(totalAdvAmount, dueRentAmount);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
            <div className="glass rounded-2xl w-full max-w-md p-6 animate-pop border border-amber-500/30 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-amber-400 flex items-center gap-1.5">
                  <span>🚪</span> ভাড়াটিয়া প্রস্থান / রুম খালি করা
                </h3>
                <button onClick={() => setMoveOutModal({ isOpen: false, tenantIndex: -1, refund: 0, date: '', note: '' })} className="text-gray-400 hover:text-white">✕</button>
              </div>

              {leavingTenant && (
                <div className="p-3.5 bg-white/5 rounded-xl border border-white/10 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">ভাড়াটিয়ার নাম:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-indigo-600 flex items-center justify-center text-[9px] font-bold text-white border border-white/10 flex-shrink-0">
                        {leavingTenant.photo ? (
                          <img src={leavingTenant.photo} alt={leavingTenant.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <span>{leavingTenant.initials || leavingTenant.name[0]}</span>
                        )}
                      </div>
                      <span className="font-bold text-white">{leavingTenant.name} ({leavingTenant.room})</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">জমাকৃত এডভান্স (Advance):</span>
                    <span className="font-bold text-cyan-300">৳ {toBn(totalAdvAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">সিকিউরিটি জামানত (Deposit):</span>
                    <span className="font-bold text-emerald-300">৳ {toBn(tenantDeposit)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">শেষ মাসের বকেয়া/ভাড়া:</span>
                    <span className="font-bold text-rose-300">৳ {toBn(dueRentAmount)}</span>
                  </div>

                  {totalAdvAmount > 0 && (
                    <div className="mt-2 p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg space-y-1 text-cyan-200">
                      <div className="flex justify-between items-center font-bold">
                        <span>🔄 শেষ মাসের সাথে অগ্রিম সমন্বয়:</span>
                        <span>- ৳ {toBn(autoAdjusted)}</span>
                      </div>
                      <p className="text-[10px] text-cyan-300/80">
                        বাসা ছাড়ার সময় জমাকৃত অগ্রিম টাকা শেষ মাসের ভাড়ার সাথে স্বয়ংক্রিয়ভাবে সমন্বয় করা হচ্ছে।
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-300 mb-1">জামানত/এডভান্স ফেরত (রিফান্ড ৳)</label>
                  <input
                    type="number"
                    value={moveOutModal.refund}
                    onChange={e => setMoveOutModal({ ...moveOutModal, refund: Number(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none text-emerald-300 font-bold"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    হিসাব নিকাশ শেষে ভাড়াটিয়াকে যে পরিমাণ টাকা ফেরত দেওয়া হবে।
                  </p>
                </div>
                <div>
                  <label className="block text-xs text-gray-300 mb-1">প্রস্থানের তারিখ</label>
                  <input
                    type="date"
                    value={moveOutModal.date}
                    onChange={e => setMoveOutModal({ ...moveOutModal, date: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-300 mb-1">নোট / মন্তব্য</label>
                  <input
                    type="text"
                    placeholder="যেমন: শেষ মাসের ভাড়া অগ্রিমের সাথে সমন্বয় করে রুম হস্তান্তর"
                    value={moveOutModal.note}
                    onChange={e => setMoveOutModal({ ...moveOutModal, note: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={() => setMoveOutModal({ isOpen: false, tenantIndex: -1, refund: 0, date: '', note: '' })} className="flex-1 glass py-2.5 rounded-xl text-xs font-semibold">বাতিল</button>
                <button
                  onClick={() => {
                    if (moveOutModal.tenantIndex < 0) return;
                    const leavingTenantObj = data.tenants[moveOutModal.tenantIndex];
                    const room = leavingTenantObj?.room;

                    // 1. Mark active advances for this room as 'used'
                    const updatedAdvances = data.advances.map(a => 
                      a.room === room && a.status === 'active' ? { ...a, status: 'used' as const } : a
                    );

                    // 2. Adjust with room invoice if any
                    let updatedInvoices = data.invoices;
                    if (roomInvoice && autoAdjusted > 0) {
                      updatedInvoices = data.invoices.map(inv => {
                        if (inv.id === roomInvoice.id) {
                          const newPayments = [
                            ...inv.payments,
                            {
                              amount: autoAdjusted,
                              date: moveOutModal.date || new Date().toLocaleDateString('bn-BD'),
                              method: 'অগ্রিম সমন্বয়',
                              note: 'বাসা ছাড়ার সময় শেষ মাসের ভাড়ার সাথে অগ্রিম এডজাস্টমেন্ট'
                            }
                          ];
                          const stats = getInvoiceStats({ ...inv, payments: newPayments });
                          return {
                            ...inv,
                            payments: newPayments,
                            status: stats.remaining <= 0 ? ('paid' as const) : ('partial' as const)
                          };
                        }
                        return inv;
                      });
                    }

                    // 3. Record refund in deposits if refund > 0
                    let updatedDeposits = data.deposits;
                    if (moveOutModal.refund > 0) {
                      const refundRecord: Deposit = {
                        id: 'REF-' + Date.now(),
                        room: room || 'রুম',
                        tenantName: leavingTenantObj?.name,
                        amount: moveOutModal.refund,
                        type: 'refund',
                        note: moveOutModal.note || 'বাসা ছাড়ার প্রস্থানকালে জামানত/এডভান্স ফেরত',
                        date: moveOutModal.date || new Date().toLocaleDateString('bn-BD'),
                        createdAt: new Date().toISOString()
                      };
                      updatedDeposits = [refundRecord, ...data.deposits];
                    }

                    // 4. Update tenants and room status
                    const remainingInRoom = data.tenants.filter((_, idx) => idx !== moveOutModal.tenantIndex && _.room === room);
                    const updatedTenants = data.tenants.filter((_, idx) => idx !== moveOutModal.tenantIndex);
                    const updatedRooms = data.rooms.map(r => {
                      if (r.name === room && remainingInRoom.length === 0) {
                        return { ...r, status: 'empty' as const };
                      }
                      return r;
                    });

                    onUpdateData({
                      ...data,
                      advances: updatedAdvances,
                      invoices: updatedInvoices,
                      deposits: updatedDeposits,
                      tenants: updatedTenants,
                      rooms: updatedRooms
                    });

                    setMoveOutModal({ isOpen: false, tenantIndex: -1, refund: 0, date: '', note: '' });
                    showAlert('বাসা ছাড়ার শেষ মাসের সাথে অগ্রিম সমন্বয়সহ প্রস্থান সম্পন্ন করা হয়েছে!', { type: 'success' });
                  }}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 py-2.5 rounded-xl text-xs font-semibold text-white"
                >
                  প্রস্থান সম্পন্ন করুন
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Utility Bill Detailed Breakdown Modal */}
      <UtilityDetailModal
        isOpen={utilityDetailModal.isOpen}
        onClose={() => setUtilityDetailModal({ isOpen: false, invoice: null })}
        invoice={utilityDetailModal.invoice}
        flatInfo={data.flatInfo}
        currentUserRole="owner"
        onPayClick={(inv) => {
          setUtilityDetailModal({ isOpen: false, invoice: null });
          const stats = getInvoiceStats(inv);
          setPaymentModal({
            isOpen: true,
            invoice: inv,
            amount: stats.remaining,
            method: 'নগদ',
            date: new Date().toISOString().split('T')[0],
            note: 'ইউটিলিটি বিবরণী থেকে পেমেন্ট'
          });
        }}
      />

      {/* Utility Creation Pre-generation Detailed Breakdown Modal */}
      <UtilityCreationDetailModal
        isOpen={utilityCreationModalOpen}
        onClose={() => setUtilityCreationModalOpen(false)}
        utilityInput={utilityInput}
        meterInput={meterInput}
        meterMode={meterMode}
        allRooms={data.rooms}
        occupiedRooms={occupiedRooms}
        tenants={data.tenants}
        flatInfo={data.flatInfo}
        onConfirmGenerate={() => {
          setUtilityCreationModalOpen(false);
          handleGenerateInvoices();
        }}
      />

      {/* Tenant Profile & Room Auto-split Detail Popup Modal */}
      <TenantDetailModal
        isOpen={!!selectedTenantForDetail}
        onClose={() => setSelectedTenantForDetail(null)}
        tenant={selectedTenantForDetail}
        room={data.rooms.find(r => r.name === selectedTenantForDetail?.room)}
        roommates={data.tenants.filter(t => t.room === selectedTenantForDetail?.room)}
        invoices={data.invoices.filter(i => i.room === selectedTenantForDetail?.room)}
        legalDocs={data.legalDocs}
        flatInfo={data.flatInfo}
        onSelectTenant={(t) => setSelectedTenantForDetail(t)}
        onEditTenant={(t) => {
          const idx = data.tenants.findIndex(x => x.name === t.name && x.room === t.room);
          setSelectedTenantForDetail(null);
          setTenantModal({
            isOpen: true,
            index: idx,
            name: t.name,
            fatherName: t.fatherName || '',
            phone: t.phone,
            room: t.room,
            rent: t.rent,
            occupation: t.occupation || '',
            nid: t.nid || '',
            emergency: t.emergency || '',
            moveIn: t.moveIn || '',
            deposit: String(t.deposit || ''),
            photo: t.photo || ''
          });
        }}
        onOpenPoliceForm={(t) => {
          const existingDoc = data.legalDocs.find(d => d.type === 'policeVerification' && (d.room === t.room || d.values?.applicantName === t.name));
          setSelectedTenantForDetail(null);
          setPoliceModalState({
            isOpen: true,
            docId: existingDoc?.id,
            room: t.room,
            tenantName: t.name,
            tenantPhone: t.phone,
            tenantNid: t.nid,
            values: existingDoc?.values || {
              applicantName: t.name,
              phone: t.phone,
              nid: t.nid || '',
              presentAddress: `${t.room}, ${data.flatInfo.name}, ${data.flatInfo.address}`
            },
            status: existingDoc?.status
          });
        }}
        onRentIncrease={(t) => {
          const idx = data.tenants.findIndex(x => x.name === t.name && x.room === t.room);
          setSelectedTenantForDetail(null);
          setRentIncreaseModal({
            isOpen: true,
            tenantIndex: idx,
            newRent: t.rent,
            reason: '',
            date: new Date().toISOString().split('T')[0]
          });
        }}
        onMoveOut={(t) => {
          const idx = data.tenants.findIndex(x => x.name === t.name && x.room === t.room);
          setSelectedTenantForDetail(null);
          setMoveOutModal({
            isOpen: true,
            tenantIndex: idx,
            refund: Number(t.deposit) || 0,
            date: new Date().toISOString().split('T')[0],
            note: ''
          });
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
          showAlert('সদস্যের ছবি সফলভাবে আপডেট করা হয়েছে!', { type: 'success' });
        }}
      />

      {/* MODAL: Reject Payment Request */}
      {rejectPayReqModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
          <div className="glass rounded-2xl w-full max-w-sm p-6 animate-pop border border-red-500/30 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-red-400 flex items-center gap-1.5">
                <span>✗</span> পেমেন্ট বাতিল করুন
              </h3>
              <button onClick={() => setRejectPayReqModal({ isOpen: false, id: '', reason: '' })} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div>
              <label className="block text-xs text-gray-300 mb-1">বাতিল করার কারণ / মন্তব্য</label>
              <textarea
                placeholder="যেমন: TrxID অমিল অথবা ভুল অ্যামাউন্ট..."
                value={rejectPayReqModal.reason}
                onChange={e => setRejectPayReqModal({ ...rejectPayReqModal, reason: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs outline-none focus:border-red-500 h-24 resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setRejectPayReqModal({ isOpen: false, id: '', reason: '' })} className="flex-1 glass py-2 rounded-xl text-xs font-semibold">বাতিল</button>
              <button
                onClick={() => {
                  const updatedReqs = data.paymentRequests.map(p =>
                    p.id === rejectPayReqModal.id
                      ? { ...p, status: 'rejected' as const, rejectReason: rejectPayReqModal.reason || 'বাতিল করা হয়েছে' }
                      : p
                  );
                  onUpdateData({ ...data, paymentRequests: updatedReqs });
                  setRejectPayReqModal({ isOpen: false, id: '', reason: '' });
                  showAlert('পেমেন্ট রিকুয়েস্ট বাতিল করা হয়েছে', { type: 'warning' });
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 py-2 rounded-xl text-xs font-semibold text-white"
              >
                নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: New Maintenance Log */}
      {addMaintModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
          <div className="glass rounded-2xl w-full max-w-md p-6 animate-pop border border-white/10 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-cyan-300 flex items-center gap-1.5">
                <span>🔧</span> নতুন মেইনটেন্যান্স লগ
              </h3>
              <button onClick={() => setAddMaintModal({ isOpen: false, title: '', room: '', cost: 0 })} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div>
              <label className="block text-xs text-gray-300 mb-1">কাজের বিবরণ / সমস্যার ধরন</label>
              <input
                type="text"
                placeholder="যেমন: ফ্যান বা লাইট মেরামত, ট্যাপ পরিবর্তন..."
                value={addMaintModal.title}
                onChange={e => setAddMaintModal({ ...addMaintModal, title: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-300 mb-1">রুম / স্থান</label>
              <select
                value={addMaintModal.room}
                onChange={e => setAddMaintModal({ ...addMaintModal, room: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none"
              >
                <option value="কমন স্পেস">কমন স্পেস (ড্রয়িং/ডাইনিং/করিডোর)</option>
                {data.rooms.map(r => (
                  <option key={r.name} value={r.name}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-300 mb-1">আনুমানিক খরচ (৳)</label>
              <input
                type="number"
                placeholder="০"
                value={addMaintModal.cost || ''}
                onChange={e => setAddMaintModal({ ...addMaintModal, cost: Number(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-cyan-400"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setAddMaintModal({ isOpen: false, title: '', room: '', cost: 0 })} className="flex-1 glass py-2 rounded-xl text-xs font-semibold">বাতিল</button>
              <button
                onClick={() => {
                  if (!addMaintModal.title.trim()) return;
                  const newMaint: MaintenanceItem = {
                    id: 'MNT-' + Date.now(),
                    title: addMaintModal.title,
                    room: addMaintModal.room,
                    cost: addMaintModal.cost || 0,
                    date: new Date().toISOString().split('T')[0],
                    status: 'pending',
                    requestedBy: 'owner'
                  };
                  onUpdateData({ ...data, maints: [newMaint, ...data.maints] });
                  setAddMaintModal({ isOpen: false, title: '', room: '', cost: 0 });
                  showAlert('মেইনটেন্যান্স লগ যুক্ত হয়েছে!', { type: 'success' });
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 py-2 rounded-xl text-xs font-semibold transition"
              >
                সংরক্ষণ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (5 columns matching prompt) */}
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
            { id: 'rooms', label: 'রুম', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16' },
            { id: 'paymentRequests', label: 'পেমেন্ট', icon: 'M12 4v16m8-8H4' },
            { id: 'invoices', label: 'ইনভয়েস', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
            { id: 'settings', label: 'সেটিংস', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4' }
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
                        ? 'bg-indigo-600 text-white scale-110' 
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
                  isActive ? 'text-purple-400' : 'text-gray-400 hover:text-white'
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
