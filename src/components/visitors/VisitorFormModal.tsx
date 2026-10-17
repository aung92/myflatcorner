import React, { useState, useEffect } from 'react';
import { Visitor, Room, Tenant } from '../../types';
import { uploadToCloudinary } from '../../lib/cloudinary';

interface VisitorFormModalProps {
  isOpen: boolean;
  isEditing: boolean;
  initialData?: Visitor | null;
  currentUserRole: 'owner' | 'tenant';
  currentUserRoom?: string;
  rooms: Room[];
  tenants: Tenant[];
  onSave: (visitor: Visitor) => void;
  onClose: () => void;
  showAlert: (msg: string, opts?: { title?: string; type?: 'info' | 'success' | 'error' | 'warning' }) => void;
}

const COMMON_RELATIONS = [
  'বন্ধু (Friend)',
  'আত্মীয় (Relative)',
  'পরিবার (Family)',
  'মেহমান (Guest)',
  'ডেলিভারি কর্মী (Delivery)',
  'গৃহকর্মী / হেল্পার (Househelp)',
  'টেকনিশিয়ান / মিস্ত্রি (Technician)',
  'সহকর্মী (Colleague)',
  'অফিসিয়াল (Official)',
  'অন্যান্য (Other)'
];

const COMMON_PURPOSES = [
  'পারিবারিক সাক্ষাৎ',
  'মেহমানদারী / থাকা',
  'পার্সেল বা ফুড ডেলিভারি',
  'বাসা পরিদর্শন / দেখা',
  'মেরামত ও সার্ভিসিং কাজ',
  'অফিসিয়াল কাজ',
  'স্বল্প সময়ের আড্ডা',
  'অন্যান্য'
];

export const VisitorFormModal: React.FC<VisitorFormModalProps> = ({
  isOpen,
  isEditing,
  initialData,
  currentUserRole,
  currentUserRoom,
  rooms,
  tenants,
  onSave,
  onClose,
  showAlert
}) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    room: currentUserRoom || (rooms[0]?.name || 'রুম ১'),
    hostTenantName: '',
    relation: 'বন্ধু (Friend)',
    purpose: 'পারিবারিক সাক্ষাৎ',
    photo: '' as string | null,
    nidOrId: '',
    idCardPhoto: '' as string | null,
    address: '',
    emergencyPhone: '',
    notes: '',
    entryDate: new Date().toLocaleDateString('bn-BD'),
    entryTime: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
    expectedExitTime: '',
    exitTime: null as string | null
  });

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingIdCard, setIsUploadingIdCard] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (isEditing && initialData) {
        setFormData({
          name: initialData.name || '',
          phone: initialData.phone || '',
          room: initialData.room || (currentUserRoom || rooms[0]?.name || 'রুম ১'),
          hostTenantName: initialData.hostTenantName || '',
          relation: initialData.relation || 'বন্ধু (Friend)',
          purpose: initialData.purpose || 'পারিবারিক সাক্ষাৎ',
          photo: initialData.photo || null,
          nidOrId: initialData.nidOrId || '',
          idCardPhoto: initialData.idCardPhoto || null,
          address: initialData.address || '',
          emergencyPhone: initialData.emergencyPhone || '',
          notes: initialData.notes || '',
          entryDate: initialData.entryDate || new Date().toLocaleDateString('bn-BD'),
          entryTime: initialData.entryTime || new Date().toLocaleTimeString('bn-BD'),
          expectedExitTime: initialData.expectedExitTime || '',
          exitTime: initialData.exitTime || null
        });
      } else {
        const defaultRoom = currentUserRoom || (rooms[0]?.name || 'রুম ১');
        const defaultTenant = tenants.find(t => t.room === defaultRoom);
        setFormData({
          name: '',
          phone: '',
          room: defaultRoom,
          hostTenantName: defaultTenant?.name || '',
          relation: 'বন্ধু (Friend)',
          purpose: 'পারিবারিক সাক্ষাৎ',
          photo: null,
          nidOrId: '',
          idCardPhoto: null,
          address: '',
          emergencyPhone: '',
          notes: '',
          entryDate: new Date().toLocaleDateString('bn-BD'),
          entryTime: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
          expectedExitTime: '',
          exitTime: null
        });
      }
    }
  }, [isOpen, isEditing, initialData, currentUserRoom, rooms, tenants]);

  if (!isOpen) return null;

  // Potential host tenants for the selected room
  const roomTenants = tenants.filter(t => t.room === formData.room);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, isIdCard: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showAlert('ছবির সাইজ ১০ মেগাবাইটের কম হতে হবে', { type: 'error' });
      return;
    }

    if (isIdCard) setIsUploadingIdCard(true);
    else setIsUploadingPhoto(true);

    try {
      const url = await uploadToCloudinary(file);
      if (isIdCard) {
        setFormData(prev => ({ ...prev, idCardPhoto: url }));
        showAlert('পরিচয়পত্রের ছবি আপলোড সফল হয়েছে!', { type: 'success' });
      } else {
        setFormData(prev => ({ ...prev, photo: url }));
        showAlert('ভিজিটরের ছবি আপলোড সফল হয়েছে!', { type: 'success' });
      }
    } catch (err: any) {
      // Fallback to local data URL if cloudinary not configured
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        const localUrl = loadEvt.target?.result as string;
        if (isIdCard) {
          setFormData(prev => ({ ...prev, idCardPhoto: localUrl }));
        } else {
          setFormData(prev => ({ ...prev, photo: localUrl }));
        }
        showAlert('ছবি সংরক্ষণ করা হয়েছে!', { type: 'info' });
      };
      reader.readAsDataURL(file);
    } finally {
      if (isIdCard) setIsUploadingIdCard(false);
      else setIsUploadingPhoto(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showAlert('অনুগ্রহ করে ভিজিটরের নাম লিখুন', { type: 'warning' });
      return;
    }

    const newVisitor: Visitor = {
      id: isEditing && initialData ? initialData.id : 'VIS-' + Date.now(),
      name: formData.name.trim(),
      phone: formData.phone.trim() || undefined,
      room: formData.room,
      hostTenantName: formData.hostTenantName.trim() || undefined,
      relation: formData.relation,
      purpose: formData.purpose.trim() || 'ভিজিট',
      photo: formData.photo || undefined,
      nidOrId: formData.nidOrId.trim() || undefined,
      idCardPhoto: formData.idCardPhoto || undefined,
      address: formData.address.trim() || undefined,
      emergencyPhone: formData.emergencyPhone.trim() || undefined,
      notes: formData.notes.trim() || undefined,
      entryDate: formData.entryDate,
      entryTime: formData.entryTime,
      expectedExitTime: formData.expectedExitTime.trim() || undefined,
      exitTime: formData.exitTime,
      entryTimestamp: isEditing && initialData?.entryTimestamp ? initialData.entryTimestamp : new Date().toISOString(),
      exitTimestamp: isEditing && initialData?.exitTimestamp ? initialData.exitTimestamp : (formData.exitTime ? new Date().toISOString() : undefined)
    };

    onSave(newVisitor);
  };

  return (
    <div 
      id="visitor-form-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade"
    >
      <div 
        id="visitor-form-dialog"
        className="relative bg-[#16162a]/95 backdrop-blur-xl rounded-3xl w-full max-w-lg p-6 sm:p-7 border border-indigo-500/30 shadow-[0_0_50px_rgba(99,102,241,0.2)] my-8 animate-pop overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-lg">
              {isEditing ? '✏️' : '👤'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {isEditing ? 'ভিজিটর প্রোফাইল সম্পাদনা' : 'নতুন ভিজিটর প্রোফাইল এন্ট্রি'}
              </h3>
              <p className="text-xs text-gray-400">
                {currentUserRole === 'owner' ? 'ফ্ল্যাট মেহমান ও ভিজিটর ব্যবস্থাপনা' : `রুম: ${formData.room} এর জন্য`}
              </p>
            </div>
          </div>
          <button
            id="close-visitor-form-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[72vh] overflow-y-auto pr-1">
          {/* Photo & Basic Details */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
            <div className="relative group w-20 h-20 rounded-2xl overflow-hidden bg-black/40 border-2 border-indigo-500/30 flex-shrink-0 flex items-center justify-center">
              {formData.photo ? (
                <img 
                  src={formData.photo} 
                  alt="Visitor" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="text-2xl text-gray-400 font-bold">
                  {formData.name ? formData.name.slice(0, 2).toUpperCase() : '📷'}
                </div>
              )}

              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center cursor-pointer text-[10px] text-white font-medium">
                <span>{isUploadingPhoto ? '⏳...' : '📷 ছবি আপলোড'}</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={e => handlePhotoUpload(e, false)} 
                />
              </label>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1">
              <p className="text-xs font-bold text-white">ভিজিটরের ছবি (Visitor Photo)</p>
              <p className="text-[11px] text-gray-400">নিরাপত্তা ও সনাক্তকরণের জন্য ছবি যুক্ত করতে পারেন</p>
              {formData.photo && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, photo: null })}
                  className="text-[10px] text-red-400 hover:underline inline-block mt-0.5"
                >
                  ✕ ছবি বাতিল করুন
                </button>
              )}
            </div>
          </div>

          {/* Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">ভিজিটরের পুরো নাম *</label>
              <input
                id="visitor-input-name"
                type="text"
                required
                placeholder="যেমন: মোঃ সাব্বির আহমেদ"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-black/40 border border-white/10 focus:border-indigo-500/60 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">মোবাইল নম্বর</label>
              <input
                id="visitor-input-phone"
                type="tel"
                placeholder="যেমন: ০১৭১১-XXXXXX"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-black/40 border border-white/10 focus:border-indigo-500/60 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition font-mono"
              />
            </div>
          </div>

          {/* Room & Host Tenant */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">গন্তব্য রুম</label>
              {currentUserRole === 'owner' ? (
                <select
                  id="visitor-select-room"
                  value={formData.room}
                  onChange={e => {
                    const newRoom = e.target.value;
                    const defaultT = tenants.find(t => t.room === newRoom);
                    setFormData({
                      ...formData,
                      room: newRoom,
                      hostTenantName: defaultT?.name || ''
                    });
                  }}
                  className="w-full bg-black/40 border border-white/10 focus:border-indigo-500/60 rounded-2xl px-3 py-2.5 text-sm text-white outline-none"
                >
                  {rooms.map(r => (
                    <option key={r.name} value={r.name}>{r.name}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  disabled
                  value={formData.room}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-gray-300 outline-none cursor-not-allowed"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">মেহমানদারী সদস্য (Host)</label>
              {roomTenants.length > 0 ? (
                <select
                  value={formData.hostTenantName}
                  onChange={e => setFormData({ ...formData, hostTenantName: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 focus:border-indigo-500/60 rounded-2xl px-3 py-2.5 text-sm text-white outline-none"
                >
                  <option value="">-- সদস্য নির্বাচন করুন --</option>
                  {roomTenants.map((t, idx) => (
                    <option key={idx} value={t.name}>{t.name}</option>
                  ))}
                  <option value="অন্যান্য">অন্যান্য সদস্য</option>
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="ভাড়াটিয়ার নাম"
                  value={formData.hostTenantName}
                  onChange={e => setFormData({ ...formData, hostTenantName: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 focus:border-indigo-500/60 rounded-2xl px-4 py-2.5 text-sm text-white outline-none"
                />
              )}
            </div>
          </div>

          {/* Relation & Purpose */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">সম্পর্ক / ধরন</label>
              <select
                value={formData.relation}
                onChange={e => setFormData({ ...formData, relation: e.target.value })}
                className="w-full bg-black/40 border border-white/10 focus:border-indigo-500/60 rounded-2xl px-3 py-2.5 text-sm text-white outline-none"
              >
                {COMMON_RELATIONS.map(rel => (
                  <option key={rel} value={rel}>{rel}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">আগমনের উদ্দেশ্য</label>
              <input
                type="text"
                list="purpose-suggestions"
                placeholder="যেমন: মেহমানদারী, ডেলিভারি..."
                value={formData.purpose}
                onChange={e => setFormData({ ...formData, purpose: e.target.value })}
                className="w-full bg-black/40 border border-white/10 focus:border-indigo-500/60 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none"
              />
              <datalist id="purpose-suggestions">
                {COMMON_PURPOSES.map(p => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Time & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">প্রবেশের সময়</label>
              <input
                type="text"
                placeholder="যেমন: ১০:৩০ AM"
                value={formData.entryTime}
                onChange={e => setFormData({ ...formData, entryTime: e.target.value })}
                className="w-full bg-black/40 border border-white/10 focus:border-indigo-500/60 rounded-2xl px-3 py-2.5 text-xs text-white outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">সম্ভাব্য প্রস্থান</label>
              <input
                type="text"
                placeholder="যেমন: ০৫:০০ PM"
                value={formData.expectedExitTime}
                onChange={e => setFormData({ ...formData, expectedExitTime: e.target.value })}
                className="w-full bg-black/40 border border-white/10 focus:border-indigo-500/60 rounded-2xl px-3 py-2.5 text-xs text-white outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">প্রস্থান অবস্থা</label>
              <select
                value={formData.exitTime ? 'exited' : 'inside'}
                onChange={e => {
                  if (e.target.value === 'exited') {
                    setFormData({ ...formData, exitTime: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }) });
                  } else {
                    setFormData({ ...formData, exitTime: null });
                  }
                }}
                className="w-full bg-black/40 border border-white/10 focus:border-indigo-500/60 rounded-2xl px-3 py-2.5 text-xs text-white outline-none"
              >
                <option value="inside">🟢 এখনও উপস্থিত</option>
                <option value="exited">⚪ প্রস্থান করেছেন</option>
              </select>
            </div>
          </div>

          {/* Identity NID & ID Photo (Optional/Security) */}
          <div className="p-3.5 bg-black/25 rounded-2xl border border-white/5 space-y-3">
            <p className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
              <span>🛡️</span> পরিচয়পত্র ও সুরক্ষা তথ্য (ঐচ্ছিক)
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-300 mb-1">এনআইডি / পরিচয়পত্র নম্বর</label>
                <input
                  type="text"
                  placeholder="যেমন: ৮৭২৯৮১৭২৬৩"
                  value={formData.nidOrId}
                  onChange={e => setFormData({ ...formData, nidOrId: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-300 mb-1">ঠিকানা / এলাকা</label>
                <input
                  type="text"
                  placeholder="যেমন: মিরপুর, ঢাকা"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                আইডি কার্ড / এনআইডি কার্ডের ছবি আপলোড
              </label>
              <div className="flex items-center gap-3">
                <label className="flex-1 glass py-2 px-3 rounded-xl text-xs text-center cursor-pointer hover:bg-white/10 transition border border-dashed border-white/20 text-gray-300">
                  <span>{isUploadingIdCard ? 'আপলোড হচ্ছে...' : (formData.idCardPhoto ? '✓ আইডি ছবি যুক্ত হয়েছে (পরিবর্তন করুন)' : '📷 আইডি কার্ডের ছবি নির্বাচন করুন')}</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={e => handlePhotoUpload(e, true)} 
                  />
                </label>
                {formData.idCardPhoto && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, idCardPhoto: null })}
                    className="text-xs text-red-400 p-2 hover:bg-red-500/10 rounded-lg transition"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">বিশেষ মন্তব্য / নোট</label>
            <textarea
              rows={2}
              placeholder="ভিজিটর সম্পর্কিত অতিরিক্ত কোনো তথ্য বা গাড়ির নম্বর..."
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-black/40 border border-white/10 focus:border-indigo-500/60 rounded-2xl p-3 text-xs text-white placeholder-gray-500 outline-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white py-3 rounded-2xl font-semibold border border-white/10 transition text-sm"
            >
              বাতিল
            </button>
            <button
              id="submit-visitor-form-btn"
              type="submit"
              className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white py-3 rounded-2xl font-bold transition shadow-lg shadow-indigo-600/30 text-sm flex items-center justify-center gap-2"
            >
              <span>{isEditing ? '✓ পরিবর্তন সংরক্ষণ' : '+ ভিজিটর এন্ট্রি সম্পন্ন করুন'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
