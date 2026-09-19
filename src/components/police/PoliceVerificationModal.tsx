import React, { useState, useEffect } from 'react';
import { FlatInfo } from '../../types';
import { toBn } from '../../lib/storage';
import { uploadToCloudinary } from '../../lib/cloudinary';

export interface FamilyMemberItem {
  id: string;
  name: string;
  age: string;
  relation: string;
  occupation: string;
  phoneOrNid: string;
  institutionOrWorkplace?: string;
  gender?: string;
}

interface PoliceVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: Record<string, string>) => void;
  initialValues?: Record<string, string>;
  currentUserRole: 'owner' | 'tenant';
  flatInfo: FlatInfo;
  roomNumber?: string;
  tenantName?: string;
  tenantPhone?: string;
  tenantNid?: string;
  status?: 'pending' | 'verified' | 'rejected';
  onVerify?: () => void;
  onPrint?: (values: Record<string, string>) => void;
  isReadOnly?: boolean;
}

export const PoliceVerificationModal: React.FC<PoliceVerificationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialValues = {},
  currentUserRole,
  flatInfo,
  roomNumber = '',
  tenantName = '',
  tenantPhone = '',
  tenantNid = '',
  status,
  onVerify,
  onPrint,
  isReadOnly = false
}) => {
  const [activeTab, setActiveTab] = useState<'personal' | 'occupation' | 'address' | 'emergency' | 'family' | 'vehiclesAndStaff' | 'references' | 'landlord' | 'preview'>('personal');

  // Form State
  const [values, setValues] = useState<Record<string, string>>({});
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberItem[]>([]);
  const [declarationAccepted, setDeclarationAccepted] = useState(true);

  // Initialize values
  useEffect(() => {
    if (!isOpen) return;

    const init = (initialValues || {}) as Record<string, any>;

    const baseValues: Record<string, string> = {
      // 1. Personal
      applicantName: init.applicantName || tenantName || '',
      applicantNameEn: init.applicantNameEn || '',
      fatherName: init.fatherName || '',
      fatherPhone: init.fatherPhone || '',
      fatherNid: init.fatherNid || '',
      motherName: init.motherName || '',
      motherPhone: init.motherPhone || '',
      motherNid: init.motherNid || '',
      spouseName: init.spouseName || '',
      spousePhone: init.spousePhone || '',
      spouseNid: init.spouseNid || '',
      dateOfBirth: init.dateOfBirth || '',
      gender: init.gender || 'পুরুষ',
      maritalStatus: init.maritalStatus || 'অবিবাহিত',
      religion: init.religion || 'ইসলাম',
      bloodGroup: init.bloodGroup || '',
      nid: init.nid || tenantNid || '',
      birthCertNo: init.birthCertNo || '',
      passportNo: init.passportNo || '',
      passportExpiry: init.passportExpiry || '',
      education: init.education || '',
      educationalInstitute: init.educationalInstitute || '',
      tinNo: init.tinNo || '',
      photoUrl: init.photoUrl || '',

      // 2. Occupation
      occupation: init.occupation || '',
      occupationType: init.occupationType || 'বেসরকারি চাকরি',
      organization: init.organization || '',
      designation: init.designation || '',
      employeeIdNo: init.employeeIdNo || '',
      workAddress: init.workAddress || '',
      workPhone: init.workPhone || '',
      monthlyIncome: init.monthlyIncome || '',

      // 3. Contact & Addresses
      phone: init.phone || tenantPhone || '',
      altPhone: init.altPhone || '',
      email: init.email || '',
      
      // Permanent Address
      permanentVillage: init.permanentVillage || '',
      permanentHolding: init.permanentHolding || '',
      permanentRoad: init.permanentRoad || '',
      permanentPost: init.permanentPost || '',
      permanentPostCode: init.permanentPostCode || '',
      permanentThana: init.permanentThana || '',
      permanentDistrict: init.permanentDistrict || '',

      // Present Address & Police Jurisdiction
      presentAddress: init.presentAddress || `${flatInfo?.name || 'ফ্ল্যাট'}, ${flatInfo?.address || 'মিরপুর, ঢাকা'}`,
      presentHolding: init.presentHolding || '',
      presentRoad: init.presentRoad || '',
      presentFloor: init.presentFloor || '',
      presentThana: init.presentThana || '',
      presentPoliceOutpost: init.presentPoliceOutpost || '',
      presentBeatNo: init.presentBeatNo || '',
      presentBeatOfficer: init.presentBeatOfficer || '',
      presentDistrict: init.presentDistrict || 'ঢাকা',

      // 4. Emergency Contact
      emergencyName: init.emergencyName || '',
      emergencyRelation: init.emergencyRelation || '',
      emergencyPhone: init.emergencyPhone || '',
      emergencyAltPhone: init.emergencyAltPhone || '',
      emergencyNid: init.emergencyNid || '',
      emergencyAddress: init.emergencyAddress || '',

      // 5. Vehicles
      hasVehicle: init.hasVehicle || 'না',
      vehicleType: init.vehicleType || '',
      vehicleRegNo: init.vehicleRegNo || '',
      parkingSlot: init.parkingSlot || '',
      drivingLicenseNo: init.drivingLicenseNo || '',

      // 6. Domestic Staff
      maidName: init.maidName || '',
      maidPhone: init.maidPhone || '',
      maidNid: init.maidNid || '',
      maidAddress: init.maidAddress || '',
      driverName: init.driverName || '',
      driverPhone: init.driverPhone || '',
      driverNid: init.driverNid || '',
      driverLicense: init.driverLicense || '',
      driverAddress: init.driverAddress || '',

      // 7. Previous Residence & References
      prevLandlordName: init.prevLandlordName || '',
      prevLandlordPhone: init.prevLandlordPhone || '',
      prevAddress: init.prevAddress || '',
      leaveReason: init.leaveReason || '',
      ref1Name: init.ref1Name || '',
      ref1Phone: init.ref1Phone || '',
      ref1Relation: init.ref1Relation || '',
      ref1Occupation: init.ref1Occupation || '',
      ref1Nid: init.ref1Nid || '',
      ref1Address: init.ref1Address || '',
      ref2Name: init.ref2Name || '',
      ref2Phone: init.ref2Phone || '',
      ref2Relation: init.ref2Relation || '',
      ref2Occupation: init.ref2Occupation || '',
      ref2Nid: init.ref2Nid || '',
      ref2Address: init.ref2Address || '',

      // 8. Current Flat & Landlord
      flatAddress: init.flatAddress || `${flatInfo?.name || 'ফ্ল্যাট'}, ${flatInfo?.address || ''}`,
      roomNumber: init.roomNumber || roomNumber || '',
      landlordName: init.landlordName || flatInfo?.ownerName || '',
      landlordPhone: init.landlordPhone || flatInfo?.phone || '',
      landlordNid: init.landlordNid || '',
      livingFrom: init.livingFrom || new Date().toISOString().split('T')[0],
      monthlyRent: init.monthlyRent || '',
      purposeOfVerification: init.purposeOfVerification || 'বাংলাদেশ পুলিশ নিরাপত্তা তথ্য নিবন্ধন (CIMS)',

      ...init
    };

    setValues(baseValues);

    // Parse family members
    if (init.familyMembersJson) {
      try {
        const parsed = JSON.parse(init.familyMembersJson);
        if (Array.isArray(parsed)) {
          setFamilyMembers(parsed);
        }
      } catch {
        setFamilyMembers([]);
      }
    } else {
      setFamilyMembers([]);
    }
  }, [isOpen, initialValues, flatInfo, roomNumber, tenantName, tenantPhone, tenantNid]);

  if (!isOpen) return null;

  const handleChange = (key: string, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('ছবির আকার সর্বোচ্চ ১০ মেগাবাইট হতে হবে');
        return;
      }
      try {
        const url = await uploadToCloudinary(file);
        handleChange('photoUrl', url);
      } catch (err: any) {
        alert('আপলোড ব্যর্থ হয়েছে: ' + (err?.message || err));
      }
    }
  };

  // Family Members handler
  const handleAddMember = () => {
    const newMember: FamilyMemberItem = {
      id: 'MEM-' + Date.now(),
      name: '',
      age: '',
      gender: 'পুরুষ',
      relation: '',
      occupation: '',
      institutionOrWorkplace: '',
      phoneOrNid: ''
    };
    setFamilyMembers(prev => [...prev, newMember]);
  };

  const handleUpdateMember = (id: string, field: keyof FamilyMemberItem, value: string) => {
    setFamilyMembers(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handleRemoveMember = (id: string) => {
    setFamilyMembers(prev => prev.filter(m => m.id !== id));
  };

  // Progress Calculation
  const requiredKeys = [
    'applicantName',
    'applicantNameEn',
    'fatherName',
    'motherName',
    'dateOfBirth',
    'nid',
    'phone',
    'permanentVillage',
    'permanentThana',
    'permanentDistrict',
    'presentThana',
    'emergencyName',
    'emergencyPhone',
    'ref1Name',
    'ref1Phone'
  ];
  const filledCount = requiredKeys.filter(k => !!values[k]?.trim()).length;
  const progressPercent = Math.round((filledCount / requiredKeys.length) * 100);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!values.photoUrl?.trim()) {
      alert('অনুগ্রহ করে ভাড়াটিয়ার পাসপোর্ট সাইজ ছবি আপলোড করুন (ছবি আপলোড করা বাধ্যতামূলক)');
      setActiveTab('personal');
      return;
    }
    if (!values.applicantName?.trim()) {
      alert('অনুগ্রহ করে ভাড়াটিয়ার পূর্ণ নাম লিখুন');
      setActiveTab('personal');
      return;
    }
    if (!values.nid?.trim() && !values.birthCertNo?.trim()) {
      alert('অনুগ্রহ করে জাতীয় পরিচয়পত্র (NID) অথবা জন্ম নিবন্ধন নম্বর লিখুন');
      setActiveTab('personal');
      return;
    }
    if (!values.phone?.trim()) {
      alert('অনুগ্রহ করে মোবাইল নম্বর লিখুন');
      setActiveTab('address');
      return;
    }

    const payload: Record<string, string> = {
      ...values,
      familyMembersJson: JSON.stringify(familyMembers),
      totalMembers: String(familyMembers.length + 1)
    };

    onSave(payload);
  };

  const tabs: { id: typeof activeTab; label: string; icon: string; badge?: string }[] = [
    { id: 'personal', label: '১. ব্যক্তিগত তথ্য', icon: '👤' },
    { id: 'occupation', label: '২. পেশা ও কর্মস্থল', icon: '💼' },
    { id: 'address', label: '৩. ঠিকানা ও বিট', icon: '📍' },
    { id: 'emergency', label: '৪. জরুরি যোগাযোগ', icon: '🚨' },
    { id: 'family', label: '৫. পরিবার ও রুমমেট', icon: '👨‍👩‍👧', badge: familyMembers.length ? `${familyMembers.length} জন` : undefined },
    { id: 'vehiclesAndStaff', label: '৬. যানবাহন ও স্টাফ', icon: '🚗' },
    { id: 'references', label: '৭. পূর্ববর্তী ও রেফারেন্স', icon: '🏘️' },
    { id: 'landlord', label: '৮. বাড়িওয়ালা ও ফ্ল্যাট', icon: '🏠' },
    { id: 'preview', label: '৯. সারসংক্ষেপ ও প্রিভিউ', icon: '📄' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-2 sm:p-4 modal-backdrop overflow-y-auto">
      <div className="glass rounded-2xl w-full max-w-5xl p-4 sm:p-6 animate-pop my-4 sm:my-8 border border-white/10 max-h-[95vh] flex flex-col shadow-2xl relative">
        
        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-700 flex items-center justify-center shadow-lg border border-blue-400/30 flex-shrink-0">
              <span className="text-2xl">👮</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-wide">
                  বাংলাদেশ পুলিশ ভাড়াটিয়া তথ্য নিবন্ধন ফরম (CIMS)
                </h3>
                {status && (
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                    status === 'verified' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                    status === 'rejected' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  }`}>
                    {status === 'verified' ? '✓ পুলিশ ভেরিফাইড' : status === 'rejected' ? '✗ বাতিল' : '⏳ অপেক্ষমাণ'}
                  </span>
                )}
              </div>
              <p className="text-xs text-cyan-300/90 font-medium">
                Citizen Information Management System • ঢাকা মেট্রোপলিটন পুলিশ (DMP) ফরম্যাট
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {onPrint && (
              <button
                type="button"
                onClick={() => onPrint({ ...values, familyMembersJson: JSON.stringify(familyMembers) })}
                className="px-3 py-1.5 glass text-xs text-cyan-400 font-semibold rounded-xl hover:bg-cyan-500/20 transition flex items-center gap-1.5 border border-cyan-500/30"
                title="অফিসিয়াল পুলিশ ফরম প্রিন্ট বা PDF ডাউনলোড করুন"
              >
                <span>🖨️</span>
                <span className="hidden sm:inline">পুলিশ স্লিপ প্রিন্ট</span>
              </button>
            )}
            {currentUserRole === 'owner' && onVerify && status !== 'verified' && (
              <button
                type="button"
                onClick={onVerify}
                className="px-3 py-1.5 bg-green-600/40 border border-green-500/40 text-xs text-green-300 font-semibold rounded-xl hover:bg-green-600/60 transition"
              >
                ✓ যাচাই অনুমোদন
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl glass flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Completion Progress Bar */}
        <div className="py-2.5 px-3 bg-white/5 rounded-xl my-3 border border-white/5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-300 font-medium">ফরম পূরণ অগ্রগতি:</span>
            <span className="font-bold text-cyan-400">{toBn(progressPercent)}%</span>
            {progressPercent >= 100 ? (
              <span className="text-[11px] text-green-400 font-semibold">✓ পূর্ণাঙ্গ তথ্য প্রস্তুত</span>
            ) : (
              <span className="text-[11px] text-yellow-400">({toBn(filledCount)}/{toBn(requiredKeys.length)} টি প্রধান তথ্য পূরণ)</span>
            )}
          </div>
          <div className="flex-1 max-w-xs bg-white/10 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-white/10 scrollbar-none text-xs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 rounded-xl font-medium transition whitespace-nowrap flex items-center gap-1.5 flex-shrink-0 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md font-semibold'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="bg-white/20 text-[10px] px-1.5 py-0.2 rounded-full ml-0.5">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto py-4 px-1 pr-2 space-y-4 text-xs">

          {/* TAB 1: PERSONAL INFORMATION */}
          {activeTab === 'personal' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-200 flex items-start gap-2">
                <span className="text-base">ℹ️</span>
                <p>
                  ভাড়াটিয়ার জাতীয় পরিচয়পত্র (NID) অনুযায়ী নাম ও জন্ম তারিখ যথাযথভাবে পূরণ করুন। পাসপোর্ট সাইজ ছবি যুক্ত করলে ফরমটি সরাসরি নিকটস্থ পুলিশ ফাঁড়ি বা থানায় জমা দেওয়া যাবে।
                </p>
              </div>

              {/* Photo Box & Basic Names */}
              <div className="flex flex-col sm:flex-row gap-4 items-start bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="flex flex-col items-center gap-2 flex-shrink-0 mx-auto sm:mx-0">
                  <div className="w-28 h-32 border-2 border-dashed border-cyan-400/40 rounded-xl overflow-hidden bg-black/30 flex flex-col items-center justify-center relative group">
                    {values.photoUrl ? (
                      <img
                        src={values.photoUrl}
                        alt="Tenant"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-2 text-gray-400 text-xs flex flex-col items-center gap-1">
                        <span className="text-2xl">📷</span>
                        <span className="text-[10px] text-red-400 font-bold">ছবি (বাধ্যতামূলক) *</span>
                      </div>
                    )}
                  </div>
                  {!isReadOnly && (
                    <label className="cursor-pointer bg-white/10 hover:bg-white/20 text-cyan-300 text-[11px] px-3 py-1 rounded-lg transition font-medium">
                      ছবি নির্বাচন
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  )}

                </div>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                  <div>
                    <label className="block text-gray-300 mb-1 font-medium">
                      পূর্ণ নাম (বাংলায়) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      placeholder="উদাঃ মোঃ রফিকুল ইসলাম"
                      value={values.applicantName || ''}
                      onChange={e => handleChange('applicantName', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-1 font-medium">
                      Full Name (English BLOCK Letters) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      placeholder="e.g. MD. ROFIQUL ISLAM"
                      value={values.applicantNameEn || ''}
                      onChange={e => handleChange('applicantNameEn', e.target.value.toUpperCase())}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-1 font-medium">
                      পিতার নাম <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={values.fatherName || ''}
                      onChange={e => handleChange('fatherName', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-1 font-medium">পিতার মোবাইল নম্বর</label>
                    <input
                      type="tel"
                      disabled={isReadOnly}
                      placeholder="০১XXXXXXXXX"
                      value={values.fatherPhone || ''}
                      onChange={e => handleChange('fatherPhone', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-1 font-medium">
                      মাতার নাম <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={values.motherName || ''}
                      onChange={e => handleChange('motherName', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-1 font-medium">মাতার মোবাইল নম্বর</label>
                    <input
                      type="tel"
                      disabled={isReadOnly}
                      placeholder="০১XXXXXXXXX"
                      value={values.motherPhone || ''}
                      onChange={e => handleChange('motherPhone', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Identification & Demographics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-300 mb-1 font-medium">
                    জাতীয় পরিচয়পত্র নম্বর (NID) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    placeholder="১০, ১৩ বা ১৭ ডিজিটের NID"
                    value={values.nid || ''}
                    onChange={e => handleChange('nid', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 font-medium">
                    জন্ম নিবন্ধন নম্বর (যদি NID না থাকে)
                  </label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    placeholder="১৭ ডিজিটের জন্ম নিবন্ধন"
                    value={values.birthCertNo || ''}
                    onChange={e => handleChange('birthCertNo', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 font-medium">
                    পাসপোর্ট নম্বর (যদি থাকে)
                  </label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    placeholder="পাসপোর্ট নম্বর"
                    value={values.passportNo || ''}
                    onChange={e => handleChange('passportNo', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none uppercase"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 font-medium">
                    জন্ম তারিখ <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    disabled={isReadOnly}
                    value={values.dateOfBirth || ''}
                    onChange={e => handleChange('dateOfBirth', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 font-medium">লিঙ্গ</label>
                  <select
                    disabled={isReadOnly}
                    value={values.gender || 'পুরুষ'}
                    onChange={e => handleChange('gender', e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none"
                  >
                    <option value="পুরুষ">পুরুষ</option>
                    <option value="নারী">নারী</option>
                    <option value="অন্যান্য">অন্যান্য</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 font-medium">বৈবাহিক অবস্থা</label>
                  <select
                    disabled={isReadOnly}
                    value={values.maritalStatus || 'অবিবাহিত'}
                    onChange={e => handleChange('maritalStatus', e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none"
                  >
                    <option value="অবিবাহিত">অবিবাহিত</option>
                    <option value="বিবাহিত">বিবাহিত</option>
                    <option value="ডিভোর্সড">ডিভোর্সড</option>
                    <option value="বিধবা/বিপত্নীক">বিধবা/বিপত্নীক</option>
                  </select>
                </div>

                {values.maritalStatus === 'বিবাহিত' && (
                  <>
                    <div>
                      <label className="block text-gray-300 mb-1 font-medium">স্বামী/স্ত্রীর নাম</label>
                      <input
                        type="text"
                        disabled={isReadOnly}
                        value={values.spouseName || ''}
                        onChange={e => handleChange('spouseName', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-1 font-medium">স্বামী/স্ত্রীর মোবাইল</label>
                      <input
                        type="tel"
                        disabled={isReadOnly}
                        value={values.spousePhone || ''}
                        onChange={e => handleChange('spousePhone', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none font-mono"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-gray-300 mb-1 font-medium">রক্তের গ্রুপ</label>
                  <select
                    disabled={isReadOnly}
                    value={values.bloodGroup || ''}
                    onChange={e => handleChange('bloodGroup', e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none"
                  >
                    <option value="">নির্বাচন করুন</option>
                    <option value="A+">A (+ve)</option>
                    <option value="A-">A (-ve)</option>
                    <option value="B+">B (+ve)</option>
                    <option value="B-">B (-ve)</option>
                    <option value="O+">O (+ve)</option>
                    <option value="O-">O (-ve)</option>
                    <option value="AB+">AB (+ve)</option>
                    <option value="AB-">AB (-ve)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 font-medium">ধর্ম</label>
                  <select
                    disabled={isReadOnly}
                    value={values.religion || 'ইসলাম'}
                    onChange={e => handleChange('religion', e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none"
                  >
                    <option value="ইসলাম">ইসলাম</option>
                    <option value="হিন্দু">হিন্দু</option>
                    <option value="বৌদ্ধ">বৌদ্ধ</option>
                    <option value="খ্রিস্টান">খ্রিস্টান</option>
                    <option value="অন্যান্য">অন্যান্য</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 font-medium">শিক্ষাগত যোগ্যতা</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    placeholder="উদাঃ বিএসসি / এমএ / এইচএসসি"
                    value={values.education || ''}
                    onChange={e => handleChange('education', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 font-medium">সর্বশেষ শিক্ষা প্রতিষ্ঠান</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    placeholder="বিশ্ববিদ্যালয় / কলেজের নাম"
                    value={values.educationalInstitute || ''}
                    onChange={e => handleChange('educationalInstitute', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 font-medium">টিআইএন (TIN No - ঐচ্ছিক)</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    placeholder="১২ ডিজিট ই-টিআইএন নম্বর"
                    value={values.tinNo || ''}
                    onChange={e => handleChange('tinNo', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: OCCUPATION & WORKPLACE */}
          {activeTab === 'occupation' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-200">
                ভাড়াটিয়ার বর্তমান কর্মস্থল, পেশা ও অফিসের সঠিক ঠিকানা দিন। পুলিশ ভেরিফিকেশনের জন্য এটি অত্যন্ত গুরুত্বপূর্ণ।
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-300 mb-1 font-medium">
                    পেশার ধরন <span className="text-red-400">*</span>
                  </label>
                  <select
                    disabled={isReadOnly}
                    value={values.occupationType || 'বেসরকারি চাকরি'}
                    onChange={e => handleChange('occupationType', e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none"
                  >
                    <option value="বেসরকারি চাকরি">বেসরকারি চাকরি</option>
                    <option value="সরকারি চাকরি">সরকারি চাকরি</option>
                    <option value="ব্যবসায়ী">ব্যবসায়ী</option>
                    <option value="শিক্ষার্থী">শিক্ষার্থী</option>
                    <option value="ডাক্তার / ইঞ্জিনিয়ার">ডাক্তার / ইঞ্জিনিয়ার / আইনজীবী</option>
                    <option value="ফ্রিল্যান্সার / আইটি">ফ্রিল্যান্সার / আইটি পেশাজীবী</option>
                    <option value="প্রবাসী">প্রবাসী</option>
                    <option value="অন্যান্য">অন্যান্য</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 font-medium">
                    পেশা / পদবী (Designation) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    placeholder="উদাঃ সিনিয়র সফটওয়্যার ইঞ্জিনিয়ার"
                    value={values.occupation || ''}
                    onChange={e => handleChange('occupation', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 font-medium">প্রতিষ্ঠান / অফিসের নাম</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    placeholder="কোম্পানি বা প্রতিষ্ঠানের নাম"
                    value={values.organization || ''}
                    onChange={e => handleChange('organization', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 font-medium">অফিস আইডি কার্ড নম্বর</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    placeholder="এমপ্লয়ি / স্টুডেন্ট আইডি"
                    value={values.employeeIdNo || ''}
                    onChange={e => handleChange('employeeIdNo', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 font-medium">অফিসের ফোন / হটলাইন</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    placeholder="অফিস ফোন বা এক্সটেনশন"
                    value={values.workPhone || ''}
                    onChange={e => handleChange('workPhone', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 font-medium">মাসিক আনুমানিক আয় (৳)</label>
                  <input
                    type="number"
                    disabled={isReadOnly}
                    placeholder="উদাঃ ৪৫০০০"
                    value={values.monthlyIncome || ''}
                    onChange={e => handleChange('monthlyIncome', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none font-mono"
                  />
                </div>

                <div className="sm:col-span-2 md:col-span-3">
                  <label className="block text-gray-300 mb-1 font-medium">কর্মস্থলের সম্পূর্ণ ঠিকানা</label>
                  <textarea
                    rows={2}
                    disabled={isReadOnly}
                    placeholder="বাড়ি নং, রোড নং, এলাকা, থানা ও জেলা"
                    value={values.workAddress || ''}
                    onChange={e => handleChange('workAddress', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CONTACT & ADDRESSES */}
          {activeTab === 'address' && (
            <div className="space-y-4 animate-fade-in">
              {/* Contact Numbers */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-300 mb-1 font-medium">
                    মোবাইল নম্বর <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    disabled={isReadOnly}
                    placeholder="০১XXXXXXXXX"
                    value={values.phone || ''}
                    onChange={e => handleChange('phone', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1 font-medium">বিকল্প মোবাইল নম্বর</label>
                  <input
                    type="tel"
                    disabled={isReadOnly}
                    placeholder="০১XXXXXXXXX"
                    value={values.altPhone || ''}
                    onChange={e => handleChange('altPhone', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1 font-medium">ইমেইল ঠিকানা</label>
                  <input
                    type="email"
                    disabled={isReadOnly}
                    placeholder="example@mail.com"
                    value={values.email || ''}
                    onChange={e => handleChange('email', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none"
                  />
                </div>
              </div>

              {/* Permanent Address */}
              <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3">
                <h4 className="text-sm font-bold text-cyan-300 flex items-center gap-1.5">
                  <span>🏡</span> স্থায়ী ঠিকানা (গ্রামের বাড়ি / পার্মানেন্ট এড্রেস)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-gray-300 mb-1 font-medium">
                      গ্রাম / মহল্লা / পাড়া <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      placeholder="গ্রাম বা এলাকার নাম"
                      value={values.permanentVillage || ''}
                      onChange={e => handleChange('permanentVillage', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1 font-medium">হোল্ডিং ও রোড নং</label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      placeholder="বাড়ি নং ও রোড"
                      value={values.permanentHolding || ''}
                      onChange={e => handleChange('permanentHolding', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1 font-medium">ডাকঘর ও পোস্ট কোড</label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      placeholder="উদাঃ বাড্ডা - ১২১২"
                      value={values.permanentPost || ''}
                      onChange={e => handleChange('permanentPost', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1 font-medium">
                      থানা / উপজেলা <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      placeholder="থানার নাম"
                      value={values.permanentThana || ''}
                      onChange={e => handleChange('permanentThana', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1 font-medium">
                      জেলা <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      placeholder="জেলার নাম"
                      value={values.permanentDistrict || ''}
                      onChange={e => handleChange('permanentDistrict', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Present Address in this flat & Police Jurisdiction */}
              <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3">
                <h4 className="text-sm font-bold text-indigo-300 flex items-center gap-1.5">
                  <span>🏢</span> বর্তমান ফ্ল্যাট ও পুলিশ অধিক্ষেত্র (Beat Policing Details)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-gray-300 mb-1 font-medium">
                      বাসা / হোল্ডিং নং, রোড ও ব্লক <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={values.presentAddress || ''}
                      onChange={e => handleChange('presentAddress', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1 font-medium">তলা / ফ্লোর</label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      placeholder="উদাঃ ৫ম তলা (ফ্ল্যাট ৫বি)"
                      value={values.presentFloor || ''}
                      onChange={e => handleChange('presentFloor', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1 font-medium">
                      সংশ্লিষ্ট থানা <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      placeholder="উদাঃ মিরপুর মডেল থানা"
                      value={values.presentThana || ''}
                      onChange={e => handleChange('presentThana', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1 font-medium">সংশ্লিষ্ট পুলিশ ফাঁড়ি</label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      placeholder="উদাঃ শেওড়াপাড়া পুলিশ ফাঁড়ি"
                      value={values.presentPoliceOutpost || ''}
                      onChange={e => handleChange('presentPoliceOutpost', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1 font-medium">বিট নম্বর ও কর্মকর্তা</label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      placeholder="উদাঃ বিট নং-০৪ (এসআই কামাল)"
                      value={values.presentBeatNo || ''}
                      onChange={e => handleChange('presentBeatNo', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: EMERGENCY CONTACT */}
          {activeTab === 'emergency' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200">
                জরুরি প্রয়োজনে বা যেকোনো বিশেষ পরিস্থিতিতে দ্রুত যোগাযোগের জন্য বিশ্বস্ত নিকটাত্মীয় বা অভিভাবকের তথ্য প্রদান করুন।
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3">
                <h4 className="text-sm font-bold text-red-300 flex items-center gap-1.5">
                  <span>🚨</span> জরুরি যোগাযোগের ব্যক্তি (Emergency Contact Person)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-gray-300 mb-1 font-medium">
                      নাম <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      placeholder="ব্যক্তির নাম"
                      value={values.emergencyName || ''}
                      onChange={e => handleChange('emergencyName', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1 font-medium">সম্পর্ক</label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      placeholder="উদাঃ পিতা / ভাই / মামা"
                      value={values.emergencyRelation || ''}
                      onChange={e => handleChange('emergencyRelation', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1 font-medium">
                      মোবাইল নম্বর <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="tel"
                      disabled={isReadOnly}
                      placeholder="০১XXXXXXXXX"
                      value={values.emergencyPhone || ''}
                      onChange={e => handleChange('emergencyPhone', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1 font-medium">বিকল্প মোবাইল</label>
                    <input
                      type="tel"
                      disabled={isReadOnly}
                      placeholder="০১XXXXXXXXX"
                      value={values.emergencyAltPhone || ''}
                      onChange={e => handleChange('emergencyAltPhone', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1 font-medium">জরুরি ব্যক্তির NID</label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      placeholder="এনআইডি নম্বর"
                      value={values.emergencyNid || ''}
                      onChange={e => handleChange('emergencyNid', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2 md:col-span-3">
                    <label className="block text-gray-300 mb-1 font-medium">জরুরি ব্যক্তির বর্তমান ঠিকানা</label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      placeholder="বাড়ি, রোড ও এলাকার পূর্ণ বিবরণ"
                      value={values.emergencyAddress || ''}
                      onChange={e => handleChange('emergencyAddress', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: FAMILY MEMBERS & ROOMMATES */}
          {activeTab === 'family' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>👨‍👩‍👧</span> পরিবারভুক্ত সদস্য ও সহ-বসবাসকারীদের তালিকা
                  </h4>
                  <p className="text-xs text-gray-400">
                    ফ্ল্যাটে বসবাসরত অন্য সকল সদস্য বা রুমমেটদের তথ্য দিন (মোট: {toBn(familyMembers.length)} জন)
                  </p>
                </div>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={handleAddMember}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1 shadow-md"
                  >
                    <span>+</span> সদস্য যোগ করুন
                  </button>
                )}
              </div>

              {familyMembers.length === 0 ? (
                <div className="text-center py-10 bg-white/5 rounded-xl border border-dashed border-white/10 p-6">
                  <p className="text-gray-400 text-xs mb-3">এখনো কোনো অতিরিক্ত সদস্য বা রুমমেটের তথ্য যোগ করা হয়নি</p>
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={handleAddMember}
                      className="px-4 py-2 glass text-cyan-300 text-xs font-semibold rounded-xl hover:bg-white/10 transition"
                    >
                      + প্রথম সদস্য যুক্ত করুন
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {familyMembers.map((member, index) => (
                    <div
                      key={member.id}
                      className="p-3.5 bg-white/5 rounded-xl border border-white/10 relative space-y-2 group"
                    >
                      <div className="flex justify-between items-center text-xs text-gray-400 pb-1.5 border-b border-white/5">
                        <span className="font-bold text-cyan-300">সদস্য #{toBn(index + 1)}</span>
                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(member.id)}
                            className="text-red-400 hover:text-red-300 text-xs px-2 py-0.5 rounded hover:bg-red-500/10 transition"
                          >
                            মুছুন ✕
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2">
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] text-gray-400 mb-1">সদস্যের নাম</label>
                          <input
                            type="text"
                            disabled={isReadOnly}
                            placeholder="পূর্ণ নাম"
                            value={member.name}
                            onChange={e => handleUpdateMember(member.id, 'name', e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-400"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-gray-400 mb-1">বয়স</label>
                          <input
                            type="text"
                            disabled={isReadOnly}
                            placeholder="উদাঃ ২৮"
                            value={member.age}
                            onChange={e => handleUpdateMember(member.id, 'age', e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-400"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-gray-400 mb-1">সম্পর্ক</label>
                          <input
                            type="text"
                            disabled={isReadOnly}
                            placeholder="উদাঃ স্ত্রী / ভাই / রুমমেট"
                            value={member.relation}
                            onChange={e => handleUpdateMember(member.id, 'relation', e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-400"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-gray-400 mb-1">পেশা / শিক্ষা</label>
                          <input
                            type="text"
                            disabled={isReadOnly}
                            placeholder="উদাঃ শিক্ষার্থী / চাকরি"
                            value={member.occupation}
                            onChange={e => handleUpdateMember(member.id, 'occupation', e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-400"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-gray-400 mb-1">মোবাইল / NID</label>
                          <input
                            type="text"
                            disabled={isReadOnly}
                            placeholder="ফোন বা এনআইডি"
                            value={member.phoneOrNid}
                            onChange={e => handleUpdateMember(member.id, 'phoneOrNid', e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-400 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: VEHICLES & STAFF */}
          {activeTab === 'vehiclesAndStaff' && (
            <div className="space-y-4 animate-fade-in">
              {/* Vehicle Section */}
              <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3">
                <h4 className="text-sm font-bold text-amber-300 flex items-center gap-1.5">
                  <span>🚗</span> মোটরযান ও পার্কিং বিবরণী (Vehicle & Parking Information)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-gray-300 mb-1 font-medium">যানবাহনের মালিকানা আছে?</label>
                    <select
                      disabled={isReadOnly}
                      value={values.hasVehicle || 'না'}
                      onChange={e => handleChange('hasVehicle', e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none"
                    >
                      <option value="না">না / নেই</option>
                      <option value="হ্যাঁ">হ্যাঁ (আছে)</option>
                    </select>
                  </div>

                  {values.hasVehicle === 'হ্যাঁ' && (
                    <>
                      <div>
                        <label className="block text-gray-300 mb-1 font-medium">যানবাহনের ধরন</label>
                        <select
                          disabled={isReadOnly}
                          value={values.vehicleType || 'মোটরসাইকেল'}
                          onChange={e => handleChange('vehicleType', e.target.value)}
                          className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none"
                        >
                          <option value="মোটরসাইকেল">মোটরসাইকেল</option>
                          <option value="প্রাইভেট কার">প্রাইভেট কার</option>
                          <option value="স্কুটার">স্কুটার</option>
                          <option value="বাইসাইকেল">বাইসাইকেল</option>
                          <option value="অন্যান্য">অন্যান্য</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-gray-300 mb-1 font-medium">গাড়ির রেজিস্ট্রেশন নং</label>
                        <input
                          type="text"
                          disabled={isReadOnly}
                          placeholder="উদাঃ ঢাকা মেট্রো-হ-১২-৩৪৫৬"
                          value={values.vehicleRegNo || ''}
                          onChange={e => handleChange('vehicleRegNo', e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-300 mb-1 font-medium">পার্কিং স্লট নং</label>
                        <input
                          type="text"
                          disabled={isReadOnly}
                          placeholder="উদাঃ P-02 বা বেজমেন্ট"
                          value={values.parkingSlot || ''}
                          onChange={e => handleChange('parkingSlot', e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-gray-300 mb-1 font-medium">ড্রাইভিং লাইসেন্স নম্বর</label>
                        <input
                          type="text"
                          disabled={isReadOnly}
                          placeholder="বিআরটিএ ড্রাইভিং লাইসেন্স নম্বর"
                          value={values.drivingLicenseNo || ''}
                          onChange={e => handleChange('drivingLicenseNo', e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none font-mono"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Domestic Help & Driver */}
              <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3">
                <h4 className="text-sm font-bold text-orange-300 flex items-center gap-1.5">
                  <span>🧹</span> গৃহকর্মী (কাজের লোক) ও ড্রাইভারের তথ্য (প্রযোজ্য ক্ষেত্রে)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-300 mb-1 font-medium">কাজের লোক / গৃহকর্মীর নাম</label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={values.maidName || ''}
                      onChange={e => handleChange('maidName', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1 font-medium">গৃহকর্মীর মোবাইল নম্বর</label>
                    <input
                      type="tel"
                      disabled={isReadOnly}
                      value={values.maidPhone || ''}
                      onChange={e => handleChange('maidPhone', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1 font-medium">গৃহকর্মীর NID নম্বর</label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={values.maidNid || ''}
                      onChange={e => handleChange('maidNid', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1 font-medium">গৃহকর্মীর স্থায়ী ঠিকানা</label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={values.maidAddress || ''}
                      onChange={e => handleChange('maidAddress', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none"
                    />
                  </div>

                  <div className="pt-3 border-t border-white/5 sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-gray-300 mb-1 font-medium">ড্রাইভারের নাম</label>
                      <input
                        type="text"
                        disabled={isReadOnly}
                        value={values.driverName || ''}
                        onChange={e => handleChange('driverName', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-1 font-medium">ড্রাইভারের ফোন</label>
                      <input
                        type="tel"
                        disabled={isReadOnly}
                        value={values.driverPhone || ''}
                        onChange={e => handleChange('driverPhone', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-1 font-medium">ড্রাইভিং লাইসেন্স নং</label>
                      <input
                        type="text"
                        disabled={isReadOnly}
                        value={values.driverLicense || ''}
                        onChange={e => handleChange('driverLicense', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: PREVIOUS RESIDENCE & REFERENCES */}
          {activeTab === 'references' && (
            <div className="space-y-4 animate-fade-in">
              {/* Previous Landlord Section */}
              <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3">
                <h4 className="text-sm font-bold text-yellow-300 flex items-center gap-1.5">
                  <span>🏘️</span> পূর্ববর্তী বাসা ও বাড়িওয়ালার তথ্য
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-300 mb-1 font-medium">পূর্ববর্তী বাড়িওয়ালার নাম</label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      placeholder="বাড়িওয়ালার নাম"
                      value={values.prevLandlordName || ''}
                      onChange={e => handleChange('prevLandlordName', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1 font-medium">পূর্ববর্তী বাড়িওয়ালার মোবাইল নম্বর</label>
                    <input
                      type="tel"
                      disabled={isReadOnly}
                      placeholder="০১XXXXXXXXX"
                      value={values.prevLandlordPhone || ''}
                      onChange={e => handleChange('prevLandlordPhone', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-gray-300 mb-1 font-medium">পূর্ববর্তী বাসার ঠিকানা</label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      placeholder="পূর্ববর্তী বাসার এলাকা ও ঠিকানা"
                      value={values.prevAddress || ''}
                      onChange={e => handleChange('prevAddress', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-gray-300 mb-1 font-medium">পূর্ববর্তী বাসা ত্যাগের কারণ</label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      placeholder="উদাঃ অফিস পরিবর্তনের কারণে / দূরত্ব কমানো"
                      value={values.leaveReason || ''}
                      onChange={e => handleChange('leaveReason', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Local References Section */}
              <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3">
                <h4 className="text-sm font-bold text-green-300 flex items-center gap-1.5">
                  <span>👥</span> ঢাকায় স্থানীয় পরিচিত ২ জন সম্মানিত ব্যক্তির তথ্য (রেফারেন্স)
                </h4>

                {/* Reference 1 */}
                <div className="p-3 bg-black/20 rounded-xl space-y-2 border border-white/5">
                  <p className="font-semibold text-cyan-300">রেফারেন্স - ১ <span className="text-red-400">*</span></p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1">নাম *</label>
                      <input
                        type="text"
                        disabled={isReadOnly}
                        placeholder="রেফারেন্স ১ এর নাম"
                        value={values.ref1Name || ''}
                        onChange={e => handleChange('ref1Name', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1">মোবাইল নম্বর *</label>
                      <input
                        type="tel"
                        disabled={isReadOnly}
                        placeholder="০১XXXXXXXXX"
                        value={values.ref1Phone || ''}
                        onChange={e => handleChange('ref1Phone', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-400 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1">সম্পর্ক</label>
                      <input
                        type="text"
                        disabled={isReadOnly}
                        placeholder="উদাঃ আত্মীয় / সহকর্মী"
                        value={values.ref1Relation || ''}
                        onChange={e => handleChange('ref1Relation', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1">পেশা</label>
                      <input
                        type="text"
                        disabled={isReadOnly}
                        placeholder="উদাঃ ব্যাংকার / ব্যবসায়ী"
                        value={values.ref1Occupation || ''}
                        onChange={e => handleChange('ref1Occupation', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] text-gray-400 mb-1">জাতীয় পরিচয়পত্র (NID)</label>
                      <input
                        type="text"
                        disabled={isReadOnly}
                        placeholder="এনআইডি নম্বর"
                        value={values.ref1Nid || ''}
                        onChange={e => handleChange('ref1Nid', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-400 font-mono"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] text-gray-400 mb-1">ঠিকানা</label>
                      <input
                        type="text"
                        disabled={isReadOnly}
                        placeholder="রেফারেন্সের বর্তমান ঠিকানা"
                        value={values.ref1Address || ''}
                        onChange={e => handleChange('ref1Address', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Reference 2 */}
                <div className="p-3 bg-black/20 rounded-xl space-y-2 border border-white/5">
                  <p className="font-semibold text-gray-300">রেফারেন্স - ২ (ঐচ্ছিক)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1">নাম</label>
                      <input
                        type="text"
                        disabled={isReadOnly}
                        placeholder="রেফারেন্স ২ এর নাম"
                        value={values.ref2Name || ''}
                        onChange={e => handleChange('ref2Name', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1">মোবাইল নম্বর</label>
                      <input
                        type="tel"
                        disabled={isReadOnly}
                        placeholder="০১XXXXXXXXX"
                        value={values.ref2Phone || ''}
                        onChange={e => handleChange('ref2Phone', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-400 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1">সম্পর্ক</label>
                      <input
                        type="text"
                        disabled={isReadOnly}
                        placeholder="উদাঃ বন্ধু / প্রতিবেশী"
                        value={values.ref2Relation || ''}
                        onChange={e => handleChange('ref2Relation', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] text-gray-400 mb-1">ঠিকানা</label>
                      <input
                        type="text"
                        disabled={isReadOnly}
                        placeholder="রেফারেন্স ২ এর ঠিকানা"
                        value={values.ref2Address || ''}
                        onChange={e => handleChange('ref2Address', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: CURRENT LANDLORD & FLAT */}
          {activeTab === 'landlord' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3">
                <h4 className="text-sm font-bold text-cyan-300 flex items-center gap-1.5">
                  <span>🏠</span> বর্তমান ফ্ল্যাট ও বাড়িওয়ালার তথ্য (Current Residence & Tenancy)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-300 mb-1 font-medium">বাড়িওয়ালার নাম</label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={values.landlordName || ''}
                      onChange={e => handleChange('landlordName', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1 font-medium">বাড়িওয়ালার মোবাইল নম্বর</label>
                    <input
                      type="tel"
                      disabled={isReadOnly}
                      value={values.landlordPhone || ''}
                      onChange={e => handleChange('landlordPhone', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1 font-medium">বাড়িওয়ালার NID</label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      placeholder="বাড়িওয়ালার জাতীয় পরিচয়পত্র"
                      value={values.landlordNid || ''}
                      onChange={e => handleChange('landlordNid', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1 font-medium">বসবাসের শুরুর তারিখ</label>
                    <input
                      type="date"
                      disabled={isReadOnly}
                      value={values.livingFrom || ''}
                      onChange={e => handleChange('livingFrom', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1 font-medium">রুম বা ফ্ল্যাট নম্বর</label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={values.roomNumber || ''}
                      onChange={e => handleChange('roomNumber', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1 font-medium">চুক্তিভিত্তিক মাসিক ভাড়া (৳)</label>
                    <input
                      type="number"
                      disabled={isReadOnly}
                      placeholder="উদাঃ ১২০০০"
                      value={values.monthlyRent || ''}
                      onChange={e => handleChange('monthlyRent', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-gray-300 mb-1 font-medium">বর্তমান বাসার সম্পূর্ণ ঠিকানা</label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={values.flatAddress || ''}
                      onChange={e => handleChange('flatAddress', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: SUMMARY PREVIEW & SUBMISSION */}
          {activeTab === 'preview' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-blue-900/40 rounded-xl border border-blue-400/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <span>📋</span> নিবন্ধিত পূর্ণাঙ্গ তথ্যের সারসংক্ষেপ
                  </h4>
                  <p className="text-xs text-blue-200">
                    নিচে তথ্যাদি যাচাই করুন। প্রিন্ট বাটনে চাপ দিলে বাংলাদেশ পুলিশের অফিসিয়াল লেআউটে ফরম তৈরি হবে।
                  </p>
                </div>
                {onPrint && (
                  <button
                    type="button"
                    onClick={() => onPrint({ ...values, familyMembersJson: JSON.stringify(familyMembers) })}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-lg flex-shrink-0"
                  >
                    <span>🖨️</span> অফিসিয়াল ফরম ডাউনলোড / প্রিন্ট
                  </button>
                )}
              </div>

              {/* Summary Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Personal */}
                <div className="p-3.5 bg-white/5 rounded-xl border border-white/10 space-y-2">
                  <div className="flex justify-between items-center text-cyan-300 font-bold border-b border-white/10 pb-1.5">
                    <span>১. ব্যক্তিগত তথ্য</span>
                    <button type="button" onClick={() => setActiveTab('personal')} className="text-[10px] text-gray-400 hover:text-white">সম্পাদনা ✎</button>
                  </div>
                  <div className="space-y-1 text-gray-300">
                    <p><strong className="text-white">নাম:</strong> {values.applicantName || '—'} {values.applicantNameEn && `(${values.applicantNameEn})`}</p>
                    <p><strong className="text-white">পিতা:</strong> {values.fatherName || '—'} • <strong className="text-white">মাতা:</strong> {values.motherName || '—'}</p>
                    <p><strong className="text-white">NID:</strong> <span className="font-mono text-cyan-300 font-bold">{values.nid || '—'}</span></p>
                    <p><strong className="text-white">জন্ম তারিখ:</strong> {values.dateOfBirth || '—'} • <strong className="text-white">রক্ত:</strong> {values.bloodGroup || '—'}</p>
                    <p><strong className="text-white">শিক্ষাগত যোগ্যতা:</strong> {values.education || '—'} {values.educationalInstitute && `(${values.educationalInstitute})`}</p>
                  </div>
                </div>

                {/* 2. Contact & Address */}
                <div className="p-3.5 bg-white/5 rounded-xl border border-white/10 space-y-2">
                  <div className="flex justify-between items-center text-cyan-300 font-bold border-b border-white/10 pb-1.5">
                    <span>২. যোগাযোগ ও ঠিকানা</span>
                    <button type="button" onClick={() => setActiveTab('address')} className="text-[10px] text-gray-400 hover:text-white">সম্পাদনা ✎</button>
                  </div>
                  <div className="space-y-1 text-gray-300">
                    <p><strong className="text-white">মোবাইল:</strong> <span className="font-mono text-green-300">{values.phone || '—'}</span> {values.altPhone && `(বিকল্প: ${values.altPhone})`}</p>
                    <p><strong className="text-white">স্থায়ী ঠিকানা:</strong> {values.permanentVillage || '—'}, {values.permanentThana || '—'}, {values.permanentDistrict || '—'}</p>
                    <p><strong className="text-white">বর্তমান থানা:</strong> {values.presentThana || '—'} {values.presentPoliceOutpost && `• ফাঁড়ি: ${values.presentPoliceOutpost}`}</p>
                  </div>
                </div>

                {/* 3. Emergency Contact */}
                <div className="p-3.5 bg-white/5 rounded-xl border border-white/10 space-y-2">
                  <div className="flex justify-between items-center text-red-300 font-bold border-b border-white/10 pb-1.5">
                    <span>৩. জরুরি যোগাযোগ</span>
                    <button type="button" onClick={() => setActiveTab('emergency')} className="text-[10px] text-gray-400 hover:text-white">সম্পাদনা ✎</button>
                  </div>
                  <div className="space-y-1 text-gray-300">
                    <p><strong className="text-white">ব্যক্তির নাম:</strong> {values.emergencyName || '—'} {values.emergencyRelation && `(${values.emergencyRelation})`}</p>
                    <p><strong className="text-white">মোবাইল:</strong> <span className="font-mono text-red-400 font-bold">{values.emergencyPhone || '—'}</span></p>
                    <p><strong className="text-white">ঠিকানা:</strong> {values.emergencyAddress || '—'}</p>
                  </div>
                </div>

                {/* 4. Occupation */}
                <div className="p-3.5 bg-white/5 rounded-xl border border-white/10 space-y-2">
                  <div className="flex justify-between items-center text-cyan-300 font-bold border-b border-white/10 pb-1.5">
                    <span>৪. পেশা ও কর্মস্থল</span>
                    <button type="button" onClick={() => setActiveTab('occupation')} className="text-[10px] text-gray-400 hover:text-white">সম্পাদনা ✎</button>
                  </div>
                  <div className="space-y-1 text-gray-300">
                    <p><strong className="text-white">পেশা:</strong> {values.occupation || '—'} {values.occupationType && `[${values.occupationType}]`}</p>
                    <p><strong className="text-white">প্রতিষ্ঠান:</strong> {values.organization || '—'} {values.employeeIdNo && `(ID: ${values.employeeIdNo})`}</p>
                    <p><strong className="text-white">মাসিক আয়:</strong> {values.monthlyIncome ? `৳ ${toBn(Number(values.monthlyIncome))}` : '—'}</p>
                  </div>
                </div>

                {/* 5. Family & Roommates */}
                <div className="p-3.5 bg-white/5 rounded-xl border border-white/10 space-y-2">
                  <div className="flex justify-between items-center text-cyan-300 font-bold border-b border-white/10 pb-1.5">
                    <span>৫. পরিবার ও সহ-বসবাসকারী ({toBn(familyMembers.length)} জন)</span>
                    <button type="button" onClick={() => setActiveTab('family')} className="text-[10px] text-gray-400 hover:text-white">সম্পাদনা ✎</button>
                  </div>
                  {familyMembers.length === 0 ? (
                    <p className="text-gray-400 italic">কোনো অতিরিক্ত সদস্য তালিকাভুক্ত নেই</p>
                  ) : (
                    <ul className="list-disc list-inside space-y-0.5 text-gray-300">
                      {familyMembers.map((m, idx) => (
                        <li key={m.id}>
                          <strong className="text-white">{m.name || `সদস্য ${idx + 1}`}</strong> - {m.relation || 'সম্পর্কহীন'}, {m.age ? `${m.age} বছর` : ''} {m.phoneOrNid ? `(${m.phoneOrNid})` : ''}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* 6. Vehicle & Staff */}
                <div className="p-3.5 bg-white/5 rounded-xl border border-white/10 space-y-2">
                  <div className="flex justify-between items-center text-amber-300 font-bold border-b border-white/10 pb-1.5">
                    <span>৬. যানবাহন ও স্টাফ</span>
                    <button type="button" onClick={() => setActiveTab('vehiclesAndStaff')} className="text-[10px] text-gray-400 hover:text-white">সম্পাদনা ✎</button>
                  </div>
                  <div className="space-y-1 text-gray-300">
                    <p><strong className="text-white">যানবাহন:</strong> {values.hasVehicle === 'হ্যাঁ' ? `${values.vehicleType || 'গাড়ি'} (${values.vehicleRegNo || 'রেজিস্ট্রেশন নেই'})` : 'নেই'}</p>
                    <p><strong className="text-white">কাজের লোক:</strong> {values.maidName ? `${values.maidName} (${values.maidPhone || 'ফোন নেই'})` : 'নেই'}</p>
                    <p><strong className="text-white">ড্রাইভার:</strong> {values.driverName ? `${values.driverName} (${values.driverPhone || 'ফোন নেই'})` : 'নেই'}</p>
                  </div>
                </div>

                {/* 7. References */}
                <div className="p-3.5 bg-white/5 rounded-xl border border-white/10 space-y-2 md:col-span-2">
                  <div className="flex justify-between items-center text-cyan-300 font-bold border-b border-white/10 pb-1.5">
                    <span>৭. রেফারেন্স ও পূর্ববর্তী বাড়িওয়ালা</span>
                    <button type="button" onClick={() => setActiveTab('references')} className="text-[10px] text-gray-400 hover:text-white">সম্পাদনা ✎</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-300">
                    <div>
                      <p><strong className="text-white">রেফারেন্স ১:</strong> {values.ref1Name || '—'} ({values.ref1Relation || 'পরিচিত'})</p>
                      <p><strong className="text-white">মোবাইল:</strong> {values.ref1Phone || '—'} {values.ref1Nid && `• NID: ${values.ref1Nid}`}</p>
                    </div>
                    <div>
                      <p><strong className="text-white">পূর্ববর্তী বাড়িওয়ালা:</strong> {values.prevLandlordName || '—'}</p>
                      <p><strong className="text-white">মোবাইল:</strong> {values.prevLandlordPhone || '—'} • {values.prevAddress || '—'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Declaration Statement */}
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={declarationAccepted}
                    onChange={e => setDeclarationAccepted(e.target.checked)}
                    className="mt-1 accent-cyan-400 w-4 h-4 rounded cursor-pointer"
                  />
                  <span className="text-yellow-100/90 leading-relaxed">
                    <strong>আইনানুগ সত্যপাঠ ও অঙ্গীকার:</strong> আমি এই মর্মে প্রত্যয়ন করছি যে, এই ফরমটিতে আমার প্রদত্ত সমুদয় তথ্য সঠিক ও সত্য। কোনো তথ্য গোপন বা মিথ্যা প্রমাণিত হলে আমি আইনগতভাবে সম্পূর্ণ দায়ী থাকব এবং বাংলাদেশ পুলিশ কর্তৃক যেকোনো আইনানুগ ব্যবস্থা গ্রহণ করা যাবে।
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 mt-2">
          <div className="text-xs text-gray-400 hidden sm:block">
            {activeTab === 'personal' && 'পৃষ্ঠা ১/৯: ব্যক্তিগত তথ্য'}
            {activeTab === 'occupation' && 'পৃষ্ঠা ২/৯: পেশাগত বিবরণ'}
            {activeTab === 'address' && 'পৃষ্ঠা ৩/৯: ঠিকানা ও বিট পুলিশ'}
            {activeTab === 'emergency' && 'পৃষ্ঠা ৪/৯: জরুরি যোগাযোগ'}
            {activeTab === 'family' && 'পৃষ্ঠা ৫/৯: রুমমেট ও পরিবার'}
            {activeTab === 'vehiclesAndStaff' && 'পৃষ্ঠা ৬/৯: যানবাহন ও স্টাফ'}
            {activeTab === 'references' && 'পৃষ্ঠা ৭/৯: রেফারেন্স'}
            {activeTab === 'landlord' && 'পৃষ্ঠা ৮/৯: বাড়িওয়ালা ও ফ্ল্যাট'}
            {activeTab === 'preview' && 'পৃষ্ঠা ৯/৯: সারসংক্ষেপ ও সাবমিশন'}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {activeTab !== 'personal' && (
              <button
                type="button"
                onClick={() => {
                  const idx = tabs.findIndex(t => t.id === activeTab);
                  if (idx > 0) setActiveTab(tabs[idx - 1].id);
                }}
                className="flex-1 sm:flex-none px-4 py-2 glass text-xs font-semibold rounded-xl text-gray-300 hover:text-white"
              >
                ← পূর্ববর্তী
              </button>
            )}

            {activeTab !== 'preview' ? (
              <button
                type="button"
                onClick={() => {
                  const idx = tabs.findIndex(t => t.id === activeTab);
                  if (idx < tabs.length - 1) setActiveTab(tabs[idx + 1].id);
                }}
                className="flex-1 sm:flex-none px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition shadow-md"
              >
                পরবর্তী ধাপ →
              </button>
            ) : (
              <button
                type="button"
                disabled={!declarationAccepted || isReadOnly}
                onClick={() => handleSubmit()}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 ${
                  declarationAccepted && !isReadOnly
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                    : 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                }`}
              >
                <span>✓</span>
                <span>{currentUserRole === 'owner' ? 'ফরম সংরক্ষণ করুন' : 'পুলিশ ফরম জমা দিন'}</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
