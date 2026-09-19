export type RoomType = 'single' | 'double' | 'master';
export type RoomStatus = 'empty' | 'occupied' | 'owner';

export interface Room {
  name: string;
  type: RoomType;
  status: RoomStatus;
  rent: number;
  loginId?: string;
  loginPassword?: string;
  meterNo?: string;
  photos?: string[];
  videoUrl?: string;
  videos?: string[];
  description?: string;
  features?: string[];
  sizeSqFt?: number;
  floor?: string;
  facing?: string;
  washroom?: 'attached' | 'common';
  balcony?: 'attached' | 'none';
}

export interface Tenant {
  name: string;
  room: string;
  phone: string;
  rent: number;
  initials: string;
  color: string;
  fatherName?: string;
  motherName?: string;
  occupation?: string;
  nid?: string;
  emergency?: string;
  emergencyName?: string;
  moveIn?: string;
  deposit?: number | string;
  photo?: string;
  email?: string;
  permanentAddress?: string;
  workplace?: string;
  bloodGroup?: string;
  autoSplitRent?: boolean;
}

export interface PaymentRecord {
  id?: string;
  amount: number;
  date: string;
  method: string;
  trxId?: string;
  note?: string;
  loggedAt?: string;
  fromRequest?: string;
}

export interface MeterReadingInfo {
  prevUnit?: number;
  currentUnit?: number;
  consumedUnits?: number;
  unitRate?: number;
  meterNo?: string;
  readingDate?: string;
}

export interface UtilityDetailsInfo {
  calculationType?: 'equal_split' | 'sub_meter' | 'per_person';
  totalFlatBill?: {
    electricity?: number;
    water?: number;
    gas?: number;
    wifi?: number;
    garbage?: number;
    service?: number;
    total?: number;
  };
  roomShareRatio?: string;
  occupiedRoomCount?: number;
  electricityMeter?: MeterReadingInfo;
  notes?: string;
}

export interface InvoiceBreakdown {
  electricity: number;
  water: number;
  gas: number;
  wifi: number;
  garbage: number;
  utility: number;
  service: number;
  electricityMeter?: MeterReadingInfo;
}

export interface InvoicePerson {
  name: string;
  phone: string;
  rentShare?: number;
  utilityShare?: number;
  totalShare?: number;
  paid?: number;
  status?: 'paid' | 'partial' | 'due';
}

export interface Invoice {
  id: string;
  room: string;
  tenantName: string;
  personCount?: number;
  persons?: InvoicePerson[];
  isOwner?: boolean;
  month: string;
  dueDate: string;
  createdAt: string;
  rent: number;
  totalAmount: number;
  breakdown: InvoiceBreakdown;
  payments: PaymentRecord[];
  status?: 'due' | 'partial' | 'paid';
  utilityDetails?: UtilityDetailsInfo;
}

export interface ComplaintReply {
  by: 'owner' | 'tenant';
  message: string;
  date: string;
  createdAt?: string;
}

export interface Complaint {
  title: string;
  room: string;
  tenantName?: string;
  desc?: string;
  photo?: string | null;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'progress' | 'solved';
  replies?: ComplaintReply[];
  date: string;
  repliedAt?: string;
}

export interface Notice {
  title: string;
  desc: string;
  date: string;
  readBy?: string[];
}

export interface MaintenanceItem {
  id?: string;
  title: string;
  desc?: string;
  room?: string;
  cost?: number;
  date: string;
  status: 'pending' | 'progress' | 'completed';
  requestedBy?: 'owner' | 'tenant';
  tenantName?: string;
  submittedAt?: string;
  ownerReply?: string;
}

export interface DocumentItem {
  name: string;
  type: 'pdf' | 'image' | 'other';
  size?: string;
  date: string;
  shared?: boolean;
}

export interface PaymentMethodConfig {
  enabled: boolean;
  number?: string;
}

export interface PaymentMethods {
  cash?: PaymentMethodConfig;
  bkash?: PaymentMethodConfig;
  nagad?: PaymentMethodConfig;
}

export interface FlatInfo {
  name: string;
  tagline?: string;
  address: string;
  totalRooms: number;
  phone: string;
  ownerName: string;
  whatsapp?: string;
  mainMeterNo?: string;
  gasMeterNo?: string;
  waterMeterNo?: string;
  wifiName?: string;
  wifiPassword?: string;
  paymentMethods: PaymentMethods;
  ownerPhoto?: string;
  cloudinaryCloudName?: string;
  cloudinaryUploadPreset?: string;
  cloudinaryApiKey?: string;
  cloudinaryApiSecret?: string;
  ownerPassword?: string;
}

export interface PaymentRequest {
  id: string;
  invoiceId: string;
  invoiceMonth: string;
  room: string;
  tenantName: string;
  amount: number;
  method: string;
  trxId?: string;
  date: string;
  note?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectReason?: string;
}

export interface NotificationItem {
  id: string;
  forRole: 'owner' | 'tenant';
  room?: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  relatedId?: string;
  invoiceId?: string;
  daysBefore?: number;
  targetTab?: string;
  targetSubTab?: string;
}

export interface DisputeReply {
  by: 'owner' | 'tenant';
  message: string;
  date: string;
}

export interface Dispute {
  id: string;
  invoiceId: string;
  invoiceMonth: string;
  room: string;
  tenantName: string;
  type: string;
  typeLabel: string;
  desc: string;
  status: 'pending' | 'resolved';
  replies?: DisputeReply[];
  date: string;
  submittedAt: string;
}

export interface Deposit {
  id: string;
  room: string;
  tenantName?: string;
  amount: number;
  type: 'deposit' | 'refund';
  note?: string;
  date: string;
  createdAt: string;
}

export interface Advance {
  id: string;
  room: string;
  tenantName?: string;
  amount: number;
  months: number;
  note?: string;
  status: 'active' | 'used';
  date: string;
  createdAt: string;
}

export interface Visitor {
  id: string;
  name: string;
  phone?: string;
  room: string;
  purpose?: string;
  entryTime: string;
  exitTime: string | null;
  entryTimestamp: string;
  exitTimestamp?: string;
  relation?: string;
  photo?: string | null;
  nidOrId?: string;
  idCardPhoto?: string | null;
  address?: string;
  hostTenantName?: string;
  emergencyPhone?: string;
  notes?: string;
  status?: 'active' | 'exited' | 'expected';
  expectedExitTime?: string;
  entryDate?: string;
}

export interface RentHistoryItem {
  id: string;
  tenantName: string;
  room: string;
  oldRent: number;
  newRent: number;
  reason?: string;
  date: string;
  timestamp: string;
}

export interface RecurringMaint {
  id: string;
  title: string;
  interval: number;
  nextDate: string;
  status: string;
  createdAt: string;
}

export interface MoveOut {
  id: string;
  tenantName: string;
  room: string;
  phone?: string;
  moveOutDate: string;
  refund: number;
  note?: string;
  depositedOn?: string;
  status: string;
  createdAt: string;
}

export interface ScheduledNotice {
  id: string;
  title: string;
  desc: string;
  scheduledFor: string;
  date: string;
  status: 'pending' | 'published';
  createdAt: string;
  publishedAt?: string;
}

export interface LegalDoc {
  id: string;
  type: string;
  typeName: string;
  values: Record<string, string>;
  room: string;
  submittedBy: string;
  submittedAt: string;
  date: string;
  status?: 'pending' | 'verified' | 'rejected';
  verifiedAt?: string | null;
  verifiedBy?: string;
  unverifiedAt?: string;
  rejectedAt?: string;
  rejectReason?: string | null;
  editedBy?: string;
  editedAt?: string;
}

export interface PhotoItem {
  id: string;
  title: string;
  room?: string;
  shared?: boolean;
  data: string;
  uploadedAt: string;
  date: string;
}

export interface FlatManagerData {
  rooms: Room[];
  tenants: Tenant[];
  invoices: Invoice[];
  complaints: Complaint[];
  notices: Notice[];
  maints: MaintenanceItem[];
  documents: DocumentItem[];
  rules: string[];
  flatInfo: FlatInfo;
  paymentRequests: PaymentRequest[];
  notifications: NotificationItem[];
  disputes: Dispute[];
  deposits: Deposit[];
  advances: Advance[];
  visitors: Visitor[];
  rentHistory: RentHistoryItem[];
  recurringMaints: RecurringMaint[];
  moveOuts: MoveOut[];
  scheduledNotices: ScheduledNotice[];
  reminderSettings: { days: number; enabled: boolean };
  autoInvoiceSettings: { enabled: boolean; day: number };
  legalDocs: LegalDoc[];
  photos: PhotoItem[];
  ratings?: any[];
  kitchenDuty?: KitchenDutyConfig;
  updatedAt?: string;
}

export interface KitchenDutyItem {
  id: string;
  dayIndex: number; // 0: Sunday, 1: Monday, 2: Tuesday, 3: Wednesday, 4: Thursday, 5: Friday, 6: Saturday
  dayName: string; // 'শনিবার', 'রবিবার', etc.
  assignedTo: string; // Tenant name or room name
  room: string;
  timeSlot: string; // e.g. "রাত ১০:০০ – ১১:০০ টা"
  note?: string;
}

export interface KitchenDutyConfig {
  enabled: boolean;
  timeSlot: string;
  rules: string[];
  schedule: KitchenDutyItem[];
  logs: {
    id: string;
    date: string; // YYYY-MM-DD
    dayName: string;
    assignedTo: string;
    room: string;
    completedAt?: string;
    completedBy?: string;
    status: 'pending' | 'completed' | 'skipped';
    note?: string;
  }[];
}

export interface CurrentUser {
  login: string;
  email?: string;
  password?: string;
  role: 'owner' | 'tenant';
  name: string;
  id: string;
  room?: string;
  persons?: Tenant[];
  roomData?: Room;
  photo?: string;
}
