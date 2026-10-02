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
        meterNo: 'Meter: 030719024774/Ac: 41560816',
        readingDate: `${curYear}-${curMonth}-01`
      }
    },
    utilityDetails: {
      calculationType: 'equal_split',
      totalFlatBill: {
        electricity: 4560,
        water: 1200,
        gas: 1080,
        wifi: 800,
        garbage: 400,
        service: 1500,
        total: 9540
      },
      roomShareRatio: '১/৩',
      occupiedRoomCount: 2,
      electricityMeter: {
        prevUnit: 1240,
        currentUnit: 1360,
        consumedUnits: 120,
        unitRate: 9.5,
        meterNo: 'Meter: 030719024774/Ac: 41560816',
        readingDate: `${curYear}-${curMonth}-01`
      },
      notes: 'ফ্ল্যাটে একটিমাত্র প্রধান বিদ্যুৎ মিটার; বিদ্যুৎ ও ইউটিলিটি বিল রুমে সমবণ্টন (কোনো সাব-মিটার নেই)।'
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
        meterNo: 'Meter: 030719024774/Ac: 41560816',
        readingDate: `${curYear}-${curMonth}-01`
      }
    },
    utilityDetails: {
      calculationType: 'equal_split',
      totalFlatBill: {
        electricity: 4560,
        water: 1200,
        gas: 1080,
        wifi: 800,
        garbage: 400,
        service: 1500,
        total: 9540
      },
      roomShareRatio: '১/৩',
      occupiedRoomCount: 2,
      electricityMeter: {
        prevUnit: 1450,
        currentUnit: 1570,
        consumedUnits: 120,
        unitRate: 9.5,
        meterNo: 'Meter: 030719024774/Ac: 41560816',
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
        meterNo: 'Meter: 030719024774/Ac: 41560816',
        readingDate: `${curYear}-${curMonth}-01`
      }
    },
    utilityDetails: {
      calculationType: 'equal_split',
      totalFlatBill: {
        electricity: 4560,
        water: 1200,
        gas: 1080,
        wifi: 800,
        garbage: 400,
        service: 1500,
        total: 9540
      },
      roomShareRatio: '১/৩',
      occupiedRoomCount: 2,
      electricityMeter: {
        prevUnit: 980,
        currentUnit: 1100,
        consumedUnits: 120,
        unitRate: 9.5,
        meterNo: 'Meter: 030719024774/Ac: 41560816',
        readingDate: `${curYear}-${curMonth}-01`
      }
    },
    payments: [],
    status: 'due'
  }
];

export const defaultData: FlatManagerData = {
  rooms: [
    { name: 'রুম ১', type: 'master', status: 'owner', rent: 0, loginId: '', loginPassword: '', meterNo: 'Meter: 030719024774/Ac: 41560816', sizeSqFt: 180, floor: '৮ম তলা', facing: 'দক্ষিণমুখী', washroom: 'attached', balcony: 'attached', description: 'মাস্টার বেডরুম।' },
    { name: 'রুম ২', type: 'double', status: 'occupied', rent: 8000, loginId: 'room2', loginPassword: '906305', meterNo: 'Meter: 030719024774/Ac: 41560816', sizeSqFt: 120, floor: '৮ম তলা', facing: 'পূর্বমুখী', washroom: 'common', balcony: 'attached', description: 'প্রশস্ত ডাবল রুম।' },
    { name: 'রুম ৩', type: 'double', status: 'booked', rent: 8500, loginId: 'room3', loginPassword: 'room3pass', meterNo: 'Meter: 030719024774/Ac: 41560816', sizeSqFt: 120, floor: '৮ম তলা', facing: 'উত্তরমুখী', washroom: 'attached', balcony: 'none', description: 'শান্ত ও নিরিবিলি ডাবল রুম।' },
  ],
  tenants: [
    {
      name: 'U sha ching',
      room: 'রুম ২',
      phone: '01603906305',
      rent: 8000,
      initials: 'ইউশ',
      color: 'from-emerald-400 to-green-600',
      fatherName: '',
      motherName: '',
      occupation: '',
      workplace: '',
      nid: '',
      emergency: '',
      emergencyName: '',
      moveIn: '২০২৪-০১-০১',
      deposit: 0
    }
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
    name: 'সাদেকা গার্ডেন — ফ্ল্যাট ৮সি',
    tagline: 'PREMIUM FLAT MANAGEMENT',
    address: 'কাজিপাড়া,মিরপুর, ঢাকা',
    totalRooms: 3,
    phone: '01515223770',
    whatsapp: '01918481232',
    ownerName: 'মালিক',
    mainMeterNo: 'Meter: 030719024774/Ac: 41560816',
    gasMeterNo: '',
    waterMeterNo: '',
    wifiName: 'Take Off',
    wifiPassword: '01515t@ke',
    paymentMethods: {
      cash: { enabled: true },
      bkash: { enabled: true, number: '01918481232' },
      nagad: { enabled: true, number: '01918481232' }
    },
    cloudinaryCloudName: '',
    cloudinaryUploadPreset: '',
    cloudinaryApiKey: '',
    cloudinaryApiSecret: ''
  }
};

export function loadData(): FlatManagerData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) || 
                  localStorage.getItem(`${STORAGE_KEY}_backup`) || 
                  sessionStorage.getItem(`${STORAGE_KEY}_backup`);
    if (saved) {
      const parsed = JSON.parse(saved);
      // If cached data contains legacy mock flat name, prioritize the actual user flatInfo
      const isLegacyMock = parsed.flatInfo?.name?.includes('গ্রীন ভিলা') || parsed.flatInfo?.name?.includes('গ্রীন ভিউ') || parsed.flatInfo?.mainMeterNo?.includes('DPDC-MAIN-88992');
      const activeFlatInfo = isLegacyMock ? { ...defaultData.flatInfo, ...(parsed.flatInfo || {}) } : (parsed.flatInfo || defaultData.flatInfo);

      return {
        rooms: (parsed.rooms && parsed.rooms.length > 0) ? parsed.rooms : defaultData.rooms,
        tenants: Array.isArray(parsed.tenants) ? parsed.tenants : defaultData.tenants,
        invoices: parsed.invoices || [],
        complaints: parsed.complaints || [],
        notices: parsed.notices || [],
        maints: parsed.maints || [],
        documents: parsed.documents || [],
        rules: parsed.rules && parsed.rules.length > 0 ? parsed.rules : defaultData.rules,
        flatInfo: {
          ...defaultData.flatInfo,
          ...activeFlatInfo,
          paymentMethods: {
            cash: { enabled: true, ...(activeFlatInfo?.paymentMethods?.cash || {}) },
            bkash: { enabled: true, number: activeFlatInfo?.whatsapp || '01918481232', ...(activeFlatInfo?.paymentMethods?.bkash || {}) },
            nagad: { enabled: true, number: activeFlatInfo?.whatsapp || '01918481232', ...(activeFlatInfo?.paymentMethods?.nagad || {}) }
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
    const jsonStr = JSON.stringify(updated);
    localStorage.setItem(STORAGE_KEY, jsonStr);
    localStorage.setItem(`${STORAGE_KEY}_backup`, jsonStr);
    sessionStorage.setItem(`${STORAGE_KEY}_backup`, jsonStr);
    
    // Save to Firestore background async to guarantee persistent cloud syncing
    saveCloudData(updated);

    // Dispatch custom event for same-tab reactive state
    window.dispatchEvent(new CustomEvent('flatDataUpdated', { detail: updated }));
  } catch (e) {
    console.error('Save failed:', e);
  }
}

export function mergeFlatData(local: FlatManagerData, cloud: FlatManagerData): FlatManagerData {
  if (!cloud) return local;
  if (!local) return cloud;

  const mergeById = <T extends { id?: string }>(localArr: T[] = [], cloudArr: T[] = []): T[] => {
    const map = new Map<string, T>();
    cloudArr.forEach(item => { if (item && item.id) map.set(item.id, item); });
    localArr.forEach(item => { if (item && item.id && !map.has(item.id)) map.set(item.id, item); });
    return Array.from(map.values());
  };

  const mergeTenants = (localTenants: Tenant[] = [], cloudTenants: Tenant[] = []): Tenant[] => {
    const map = new Map<string, Tenant>();
    cloudTenants.forEach(t => { if (t && t.name) map.set(`${t.room}_${t.name}`, t); });
    localTenants.forEach(t => { if (t && t.name && !map.has(`${t.room}_${t.name}`)) map.set(`${t.room}_${t.name}`, t); });
    return Array.from(map.values());
  };

  const mergedInvoices = mergeById(local.invoices, cloud.invoices);
  const mergedTenants = mergeTenants(local.tenants, cloud.tenants);
  const mergedComplaints = mergeById(local.complaints, cloud.complaints);
  const mergedNotices = mergeById(local.notices, cloud.notices);
  const mergedMaints = mergeById(local.maints, cloud.maints);
  const mergedPaymentRequests = mergeById(local.paymentRequests, cloud.paymentRequests);
  const mergedAdvances = mergeById(local.advances, cloud.advances);
  const mergedVisitors = mergeById(local.visitors, cloud.visitors);

  return {
    ...cloud,
    rooms: (cloud.rooms && cloud.rooms.length > 0) ? cloud.rooms : local.rooms,
    tenants: mergedTenants.length > 0 ? mergedTenants : cloud.tenants,
    invoices: mergedInvoices,
    complaints: mergedComplaints,
    notices: mergedNotices,
    maints: mergedMaints,
    paymentRequests: mergedPaymentRequests,
    advances: mergedAdvances,
    visitors: mergedVisitors,
    updatedAt: new Date().toISOString()
  };
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

