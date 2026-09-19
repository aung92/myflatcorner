import { FlatManagerData, CurrentUser, Invoice, Room, Tenant } from '../types';
import { saveCloudData } from './firebase';

export const STORAGE_KEY = 'flatManagerData';
export const CURRENT_USER_KEY = 'currentUser';

export const OWNER_CREDENTIALS: CurrentUser = {
  login: 'owner',
  email: 'owner',
  password: 'owner123',
  role: 'owner',
  name: 'মালিক',
  id: 'OWN-001'
};

const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
export function toBn(num: number | string | undefined | null): string {
  if (num === undefined || num === null) return '০';
  return String(num).replace(/\d/g, d => bnDigits[parseInt(d, 10)]);
}

const curDate = new Date();
const curYear = curDate.getFullYear();
const curMonth = String(curDate.getMonth() + 1).padStart(2, '0');
const currentMonthStr = `${curYear}-${curMonth}`;

export const sampleInvoices: Invoice[] = [
  {
    id: `INV-${curYear}${curMonth}-002`,
    room: 'রুম ২',
    tenantName: 'করিম আহমেদ',
    personCount: 1,
    persons: [{ name: 'করিম আহমেদ', phone: '০১৭১১-১১১১১১' }],
    month: currentMonthStr,
    dueDate: `${curYear}-${curMonth}-10`,
    createdAt: `${curYear}-${curMonth}-01T10:00:00.000Z`,
    rent: 8000,
    totalAmount: 10385,
    breakdown: {
      electricity: 1140,
      water: 300,
      gas: 270,
      wifi: 200,
      garbage: 100,
      utility: 2010,
      service: 375,
      electricityMeter: {
        prevUnit: 1240,
        currentUnit: 1360,
        consumedUnits: 120,
        unitRate: 9.5,
        meterNo: 'DPDC-Sub-02',
        readingDate: `${curYear}-${curMonth}-01`
      }
    },
    utilityDetails: {
      calculationType: 'sub_meter',
      totalFlatBill: {
        electricity: 4560,
        water: 1200,
        gas: 1080,
        wifi: 800,
        garbage: 400,
        service: 1500,
        total: 9540
      },
      roomShareRatio: '১/৪',
      occupiedRoomCount: 4,
      electricityMeter: {
        prevUnit: 1240,
        currentUnit: 1360,
        consumedUnits: 120,
        unitRate: 9.5,
        meterNo: 'DPDC-Sub-02',
        readingDate: `${curYear}-${curMonth}-01`
      },
      notes: 'মাসিক গ্যাস, পানি ও ওয়াইফাই সমান বণ্টন; বিদ্যুৎ সাবমিটার রিডিং অনুসারে।'
    },
    payments: [
      {
        id: 'PAY-001',
        amount: 5000,
        date: `${curYear}-${curMonth}-05`,
        method: 'bKash',
        note: 'অগ্রিম ৫০% পরিশোধ'
      }
    ],
    status: 'partial'
  },
  {
    id: `INV-${curYear}${curMonth}-003`,
    room: 'রুম ৩',
    tenantName: 'সাদিয়া রহমান',
    personCount: 2,
    persons: [
      {
        name: 'সাদিয়া রহমান',
        phone: '০১৭১১-২২২২২২',
        rentShare: 4000,
        utilityShare: 1193,
        totalShare: 5193,
        paid: 5193,
        status: 'paid'
      },
      {
        name: 'নুসরাত ইসলাম',
        phone: '০১৭১১-৪৪৪৪৪৪',
        rentShare: 4000,
        utilityShare: 1192,
        totalShare: 5192,
        paid: 5192,
        status: 'paid'
      }
    ],
    month: currentMonthStr,
    dueDate: `${curYear}-${curMonth}-10`,
    createdAt: `${curYear}-${curMonth}-01T10:00:00.000Z`,
    rent: 8000,
    totalAmount: 10385,
    breakdown: {
      electricity: 1140,
      water: 300,
      gas: 270,
      wifi: 200,
      garbage: 100,
      utility: 2010,
      service: 375,
      electricityMeter: {
        prevUnit: 1450,
        currentUnit: 1570,
        consumedUnits: 120,
        unitRate: 9.5,
        meterNo: 'DPDC-Sub-03',
        readingDate: `${curYear}-${curMonth}-01`
      }
    },
    utilityDetails: {
      calculationType: 'sub_meter',
      totalFlatBill: {
        electricity: 4560,
        water: 1200,
        gas: 1080,
        wifi: 800,
        garbage: 400,
        service: 1500,
        total: 9540
      },
      roomShareRatio: '১/৪',
      occupiedRoomCount: 4,
      electricityMeter: {
        prevUnit: 1450,
        currentUnit: 1570,
        consumedUnits: 120,
        unitRate: 9.5,
        meterNo: 'DPDC-Sub-03',
        readingDate: `${curYear}-${curMonth}-01`
      }
    },
    payments: [
      {
        id: 'PAY-002',
        amount: 10385,
        date: `${curYear}-${curMonth}-04`,
        method: 'নগদ',
        note: 'সম্পূর্ণ বিল পরিশোধ'
      }
    ],
    status: 'paid'
  },
  {
    id: `INV-${curYear}${curMonth}-004`,
    room: 'রুম ৪',
    tenantName: 'মাহিন হাসান',
    personCount: 1,
    persons: [{ name: 'মাহিন হাসান', phone: '০১৭১১-৩৩৩৩৩৩' }],
    month: currentMonthStr,
    dueDate: `${curYear}-${curMonth}-10`,
    createdAt: `${curYear}-${curMonth}-01T10:00:00.000Z`,
    rent: 6000,
    totalAmount: 8385,
    breakdown: {
      electricity: 1140,
      water: 300,
      gas: 270,
      wifi: 200,
      garbage: 100,
      utility: 2010,
      service: 375,
      electricityMeter: {
        prevUnit: 980,
        currentUnit: 1100,
        consumedUnits: 120,
        unitRate: 9.5,
        meterNo: 'DPDC-Sub-04',
        readingDate: `${curYear}-${curMonth}-01`
      }
    },
    utilityDetails: {
      calculationType: 'sub_meter',
      totalFlatBill: {
        electricity: 4560,
        water: 1200,
        gas: 1080,
        wifi: 800,
        garbage: 400,
        service: 1500,
        total: 9540
      },
      roomShareRatio: '১/৪',
      occupiedRoomCount: 4,
      electricityMeter: {
        prevUnit: 980,
        currentUnit: 1100,
        consumedUnits: 120,
        unitRate: 9.5,
        meterNo: 'DPDC-Sub-04',
        readingDate: `${curYear}-${curMonth}-01`
      }
    },
    payments: [],
    status: 'due'
  }
];

export const defaultData: FlatManagerData = {
  rooms: [
    { name: 'রুম ১', type: 'master', status: 'owner', rent: 0, loginId: '', loginPassword: '', meterNo: 'DPDC-MAIN-01' },
    { name: 'রুম ২', type: 'double', status: 'occupied', rent: 8000, loginId: '', loginPassword: '', meterNo: 'DPDC-Sub-02' },
    { name: 'রুম ৩', type: 'double', status: 'occupied', rent: 8000, loginId: '', loginPassword: '', meterNo: 'DPDC-Sub-03' },
    { name: 'রুম ৪', type: 'single', status: 'occupied', rent: 6000, loginId: '', loginPassword: '', meterNo: 'DPDC-Sub-04' },
    { name: 'রুম ৫', type: 'single', status: 'empty', rent: 6000, loginId: '', loginPassword: '', meterNo: 'DPDC-Sub-05' },
  ],
  tenants: [
    {
      name: 'করিম আহমেদ',
      room: 'রুম ২',
      phone: '০১৭১১-১১১১১১',
      rent: 8000,
      initials: 'কআ',
      color: 'from-emerald-400 to-green-600',
      fatherName: 'মো: আব্দুল করিম',
      motherName: 'রাবেয়া বেগম',
      occupation: 'সিনিয়র অফিসার, বেসরকারি ব্যাংক',
      workplace: 'মতিঝিল বাণিজ্যিক এলাকা, ঢাকা',
      nid: '১৯৮৮১১২২৩৩৪৪৫৫',
      emergency: '০১৭১১-৫৫৫৪৪৪ (ভাই)',
      emergencyName: 'মো: জাহিদ আহমেদ (ভাই)',
      moveIn: '২০২৪-০১-০১',
      deposit: 8000
    },
    {
      name: 'সাদিয়া রহমান',
      room: 'রুম ৩',
      phone: '০১৭১১-২২২২২২',
      rent: 4000,
      initials: 'সর',
      color: 'from-purple-400 to-pink-600',
      fatherName: 'মো: রফিকুল ইসলাম',
      motherName: 'সালমা আক্তার',
      occupation: 'সফটওয়্যার ইঞ্জিনিয়ার',
      workplace: 'কারওয়ান বাজার সফটওয়্যার পার্ক',
      nid: '১৯৯২০১২৩৪৫৬৭৮৯',
      emergency: '০১৭১১-৯৯৯৮৮৮ (পিতা)',
      emergencyName: 'মো: রফিকুল ইসলাম (পিতা)',
      moveIn: '২০২৪-০২-০১',
      deposit: 4000
    },
    {
      name: 'নুসরাত ইসলাম',
      room: 'রুম ৩',
      phone: '০১৭১১-৪৪৪৪৪৪',
      rent: 4000,
      initials: 'নই',
      color: 'from-orange-400 to-red-600',
      fatherName: 'মো: নুরুল ইসলাম',
      motherName: 'রোকেয়া খাতুন',
      occupation: 'ইউআই/ইউএক্স ডিজাইনার',
      workplace: 'বনানী, ঢাকা',
      nid: '১৯৯৫৯৮৭৬৫৪৩২১০',
      emergency: '০১৭১১-৭৭৭৬৬৬ (মাতা)',
      emergencyName: 'রোকেয়া খাতুন (মাতা)',
      moveIn: '২০২৪-০২-০১',
      deposit: 4000
    },
    {
      name: 'মাহিন হাসান',
      room: 'রুম ৪',
      phone: '০১৭১১-৩৩৩৩৩৩',
      rent: 6000,
      initials: 'মহ',
      color: 'from-cyan-400 to-blue-600',
      fatherName: 'মো: আবুল হাসান',
      motherName: 'নাজমা বেগম',
      occupation: 'বিশ্ববিদ্যালয় শিক্ষার্থী',
      workplace: 'ঢাকা বিশ্ববিদ্যালয়',
      nid: '২০০১১২৩৪৫৬৭৮৯০',
      emergency: '০১৭১১-৩৩৪৪৭৭ (পিতা)',
      emergencyName: 'মো: আবুল হাসান (পিতা)',
      moveIn: '২০২৪-০৩-০১',
      deposit: 6000
    },
  ],
  invoices: sampleInvoices,
  complaints: [],
  notices: [],
  maints: [],
  documents: [],
  paymentRequests: [],
  notifications: [],
  disputes: [],
  deposits: [],
  advances: [],
  visitors: [
    {
      id: 'VIS-1710000001',
      name: 'মো: জাহিদ আহমেদ',
      phone: '০১৭১১-৫৫৫৪৪৪',
      room: 'রুম ২',
      hostTenantName: 'করিম আহমেদ',
      relation: 'পরিবার (Family)',
      purpose: 'পারিবারিক সাক্ষাৎ ও মেহমানদারী',
      entryDate: new Date().toLocaleDateString('bn-BD'),
      entryTime: '১০:৩০ AM',
      exitTime: null,
      entryTimestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      nidOrId: '১৯৮৮১২৩৪৫৬৭৮৯০',
      address: 'উত্তরা, ঢাকা',
      notes: 'করিম আহমেদের ছোট ভাই, দুই দিন থাকবেন।'
    },
    {
      id: 'VIS-1710000002',
      name: 'তাহমিদ চৌধুরী',
      phone: '০১৮২২-৩৩৪৪৭৭',
      room: 'রুম ৩',
      hostTenantName: 'সাদিয়া রহমান',
      relation: 'বন্ধু (Friend)',
      purpose: 'অ্যাসাইনমেন্ট ও স্টাডি',
      entryDate: new Date().toLocaleDateString('bn-BD'),
      entryTime: '০২:১৫ PM',
      exitTime: '০৫:৩০ PM',
      entryTimestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      exitTimestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      nidOrId: '১৯৯৮৯৮৭৬৫৪৩২১০',
      address: 'ধানমন্ডি, ঢাকা'
    }
  ],
  rentHistory: [],
  recurringMaints: [],
  moveOuts: [],
  scheduledNotices: [],
  legalDocs: [],
  photos: [],
  ratings: [],
  reminderSettings: { days: 7, enabled: false },
  autoInvoiceSettings: { enabled: false, day: 1 },
  kitchenDuty: {
    enabled: true,
    timeSlot: 'রাত ১০:০০ – ১১:০০ টা',
    rules: [
      'খাওয়ার পর নিজের ব্যবহৃত থালা-বাসন ও রান্নার হাড়ি তাৎক্ষণিক ধুয়ে রাখতে হবে।',
      'ডিউটিপ্রাপ্ত ব্যক্তি চুলার চারপাশ, কিচেন স্ল্যাব ও সিঙ্ক পরিষ্কার ও শুকনা রাখবেন।',
      'প্রতিদিনের ময়লা ডাস্টবিনে ফেলে ডাস্টবিনটি পরিষ্কার রাখবেন।',
      'পরিষ্কার সম্পন্ন হলে নিচে "✓ কাজ সম্পন্ন করেছি" বাটনে ক্লিক করে নিশ্চিত করবেন।'
    ],
    schedule: [
      { id: 'kd-sat', dayIndex: 6, dayName: 'শনিবার', assignedTo: 'রাকিব হাসান', room: 'রুম ২', timeSlot: 'রাত ১০:০০ – ১১:০০ টা' },
      { id: 'kd-sun', dayIndex: 0, dayName: 'রবিবার', assignedTo: 'আরিফুল ইসলাম', room: 'রুম ২', timeSlot: 'রাত ১০:০০ – ১১:০০ টা' },
      { id: 'kd-mon', dayIndex: 1, dayName: 'সোমবার', assignedTo: 'তানভীর আহমেদ', room: 'রুম ৩', timeSlot: 'রাত ১০:০০ – ১১:০০ টা' },
      { id: 'kd-tue', dayIndex: 2, dayName: 'মঙ্গলবার', assignedTo: 'মাহিন হাসান', room: 'রুম ৪', timeSlot: 'রাত ১০:০০ – ১১:০০ টা' },
      { id: 'kd-wed', dayIndex: 3, dayName: 'বুধবার', assignedTo: 'ফাহিম হোসেন', room: 'রুম ৫', timeSlot: 'রাত ১০:০০ – ১১:০০ টা' },
      { id: 'kd-thu', dayIndex: 4, dayName: 'বৃহস্পতিবার', assignedTo: 'রাকিব হাসান', room: 'রুম ২', timeSlot: 'রাত ১০:০০ – ১১:০০ টা' },
      { id: 'kd-fri', dayIndex: 5, dayName: 'শুক্রবার', assignedTo: 'সকল সদস্য', room: 'যৌথ ডিউটি', timeSlot: 'বিকাল ৪:০০ – ৫:০০ টা', note: 'সাপ্তাহিক ডিপ ক্লিনিং' },
    ],
    logs: []
  },
  rules: [
    'রাত ১১টার পর উচ্চ শব্দ বা জোরে গান বাজানো সম্পূর্ণ নিষেধ।',
    'প্রতি মাসের ৫ তারিখের মধ্যে ফ্ল্যাটের ভাড়া এবং ইউটিলিটি বিল পরিশোধ করতে হবে।',
    'কমন এরিয়া (ড্রয়িং রুম, ডাইনিং, বারান্দা) পরিষ্কার রাখতে হবে এবং নিজের জিনিসপত্র গুছিয়ে রাখতে হবে।',
    'বাহির থেকে কোনো অতিথি আসলে বা রাত যাপন করলে আগে থেকে ফ্ল্যাটের অন্যান্য সদস্য এবং মালিককে জানাতে হবে।',
    'বাথরুম ও রান্নাঘর ব্যবহারের পর তা পরিষ্কার ও পরিচ্ছন্ন রাখতে হবে।',
    'ডাস্টবিনের ময়লা প্রতিদিন নির্দিষ্ট স্থানে বা ময়লার বালতিতে ফেলতে হবে, খোলা স্থানে রাখা যাবে না।',
    'কমন লাইট, ফ্যান, বা গ্যাসের চুলা অকারণে জ্বালিয়ে রাখা যাবে না, ব্যবহার শেষে বন্ধ করতে হবে।',
    'ফ্ল্যাটের অভ্যন্তরে ধূমপান বা কোনো প্রকার মাদকাশক্তি সম্পূর্ণ নিষিদ্ধ।',
    'ফ্ল্যাটের কোনো আসবাবপত্র বা সম্পত্তির ক্ষতি হলে তার ক্ষতিপূরণ দিতে হবে।',
    'ফ্ল্যাট ছাড়ার অন্তত এক মাস আগে (৩০ দিন) মালিককে নোটিশ প্রদান করতে হবে।'
  ],
  flatInfo: {
    name: 'গ্রীন ভিলা — ফ্ল্যাট ৪বি',
    tagline: 'PREMIUM FLAT MANAGEMENT',
    address: 'মিরপুর-১০, ঢাকা',
    totalRooms: 5,
    phone: '০১৭১১-০০০০০০',
    ownerName: 'মালিক',
    mainMeterNo: 'DPDC-MAIN-88992',
    gasMeterNo: 'Titas-G-44021',
    waterMeterNo: 'WASA-W-99102',
    wifiName: 'Green_Villa_4B_5G',
    wifiPassword: 'villa_password_1234',
    paymentMethods: {
      cash: { enabled: true },
      bkash: { enabled: true, number: '01711-000000' },
      nagad: { enabled: true, number: '01811-000000' }
    }
  }
};

export function loadData(): FlatManagerData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        rooms: parsed.rooms || defaultData.rooms,
        tenants: parsed.tenants || defaultData.tenants,
        invoices: (parsed.invoices && parsed.invoices.length > 0) ? parsed.invoices : sampleInvoices,
        complaints: parsed.complaints || [],
        notices: parsed.notices || [],
        maints: parsed.maints || [],
        documents: parsed.documents || [],
        rules: parsed.rules && parsed.rules.length > 0 ? Array.from(new Set([...parsed.rules.filter((r: string) => !['রাত ১১টার পর উচ্চ শব্দ নিষিদ্ধ', 'প্রতি মাসের ৫ তারিখের মধ্যে বিল পরিশোধ করতে হবে', 'কমন এরিয়া পরিষ্কার রাখতে হবে', 'অতিথি রাত যাপন করলে আগে জানাতে হবে'].includes(r)), ...defaultData.rules])) : defaultData.rules,
        flatInfo: {
          ...defaultData.flatInfo,
          ...(parsed.flatInfo || {}),
          paymentMethods: {
            cash: { enabled: true, ...(parsed.flatInfo?.paymentMethods?.cash || {}) },
            bkash: { enabled: false, number: '', ...(parsed.flatInfo?.paymentMethods?.bkash || {}) },
            nagad: { enabled: false, number: '', ...(parsed.flatInfo?.paymentMethods?.nagad || {}) }
          }
        },
        paymentRequests: parsed.paymentRequests || [],
        notifications: parsed.notifications || [],
        disputes: parsed.disputes || [],
        deposits: parsed.deposits || [],
        advances: parsed.advances || [],
        visitors: parsed.visitors || [],
        rentHistory: parsed.rentHistory || [],
        recurringMaints: parsed.recurringMaints || [],
        moveOuts: parsed.moveOuts || [],
        scheduledNotices: parsed.scheduledNotices || [],
        reminderSettings: parsed.reminderSettings || defaultData.reminderSettings,
        autoInvoiceSettings: parsed.autoInvoiceSettings || defaultData.autoInvoiceSettings,
        legalDocs: parsed.legalDocs || [],
        photos: parsed.photos || [],
        ratings: parsed.ratings || [],
        kitchenDuty: parsed.kitchenDuty ? {
          ...defaultData.kitchenDuty,
          ...parsed.kitchenDuty,
          rules: parsed.kitchenDuty.rules || defaultData.kitchenDuty.rules,
          schedule: (parsed.kitchenDuty.schedule && parsed.kitchenDuty.schedule.length > 0)
            ? parsed.kitchenDuty.schedule
            : defaultData.kitchenDuty.schedule,
          logs: parsed.kitchenDuty.logs || []
        } : defaultData.kitchenDuty,
        updatedAt: parsed.updatedAt || new Date().toISOString()
      };
    }
  } catch (e) {
    console.error('Load failed:', e);
  }
  return defaultData;
}

export function saveData(data: FlatManagerData): void {
  try {
    const updated = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    
    // Save to Firestore background async to guarantee persistent cloud syncing
    saveCloudData(updated);

    // Dispatch custom event for same-tab reactive state
    window.dispatchEvent(new CustomEvent('flatDataUpdated', { detail: updated }));
  } catch (e) {
    console.error('Save failed:', e);
  }
}

export function getCurrentUser(): CurrentUser | null {
  try {
    const stored = sessionStorage.getItem(CURRENT_USER_KEY) || localStorage.getItem(CURRENT_USER_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('User parse error:', e);
  }
  return null;
}

export function setCurrentUser(user: CurrentUser, remember = false): void {
  const json = JSON.stringify(user);
  sessionStorage.setItem(CURRENT_USER_KEY, json);
  if (remember) {
    localStorage.setItem(CURRENT_USER_KEY, json);
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
  window.dispatchEvent(new CustomEvent('userStateChanged', { detail: user }));
}

export function clearCurrentUser(): void {
  sessionStorage.removeItem(CURRENT_USER_KEY);
  localStorage.removeItem(CURRENT_USER_KEY);
  window.dispatchEvent(new CustomEvent('userStateChanged', { detail: null }));
}

export function getAllLoginUsers(data: FlatManagerData): CurrentUser[] {
  const customOwnerPassword = data.flatInfo?.ownerPassword || OWNER_CREDENTIALS.password;
  const users: CurrentUser[] = [{ ...OWNER_CREDENTIALS, password: customOwnerPassword }];
  data.rooms.forEach(room => {
    if (!room.loginId || !room.loginPassword) return;
    const roomTenants = data.tenants.filter(t => t.room === room.name);
    const primary = roomTenants[0];
    users.push({
      login: room.loginId,
      email: room.loginId,
      password: room.loginPassword,
      role: 'tenant',
      room: room.name,
      name: primary ? primary.name : room.name,
      id: 'ROOM-' + room.loginId,
      persons: roomTenants,
      roomData: room
    });
  });
  return users;
}

export const getFlatData = loadData;
export const saveFlatData = saveData;

export function checkAndTriggerAutoInvoices(data: FlatManagerData): void {
  if (!data.autoInvoiceSettings?.enabled) return;
  const today = new Date();
  const targetDay = data.autoInvoiceSettings.day || 1;
  if (today.getDate() === targetDay) {
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const alreadyExists = data.invoices.some(i => i.month === currentMonth);
    if (!alreadyExists) {
      console.log('Auto invoice check: Ready for month', currentMonth);
    }
  }
}

/**
 * Gets all tenants staying in a specific room
 */
export function getRoomOccupants(tenants: Tenant[], roomName: string): Tenant[] {
  return tenants.filter(t => t.room === roomName);
}

/**
 * Calculates auto-split rent per person for a room
 */
export function getAutoSplitRentPerPerson(roomRent: number, occupantsCount: number): number {
  if (!roomRent || occupantsCount <= 0) return 0;
  return Math.round(roomRent / occupantsCount);
}

/**
 * Ensures room occupants have their rent auto-split based on room's monthly rent
 */
export function syncRoomTenantsAutoSplit(tenants: Tenant[], rooms: Room[]): Tenant[] {
  const roomMap = new Map<string, Room>();
  rooms.forEach(r => roomMap.set(r.name, r));

  const roomCounts = new Map<string, number>();
  tenants.forEach(t => {
    roomCounts.set(t.room, (roomCounts.get(t.room) || 0) + 1);
  });

  return tenants.map(t => {
    const room = roomMap.get(t.room);
    const count = roomCounts.get(t.room) || 1;
    if (room && room.status !== 'owner' && room.rent > 0) {
      const splitRent = Math.round(room.rent / count);
      // Auto-update if difference exists or auto-split enabled
      return {
        ...t,
        rent: splitRent
      };
    }
    return t;
  });
}

