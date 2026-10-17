export interface TemplateField {
  key: string;
  label: string;
  multiline?: boolean;
}

export interface TemplateSection {
  title: string;
  fields: TemplateField[];
}

export interface LegalTemplate {
  name: string;
  icon: string;
  color: string;
  description: string;
  sections: TemplateSection[];
}

export const LEGAL_TEMPLATES: Record<string, LegalTemplate> = {
  rentAgreement: {
    name: 'বাসা ভাড়া চুক্তিপত্র',
    icon: '📜',
    color: 'indigo',
    description: 'বাংলাদেশ স্ট্যান্ডার্ড ভাড়া চুক্তিপত্র (২ পেজ)',
    sections: [
      {
        title: '🏠 বাড়িওয়ালার তথ্য',
        fields: [
          { key: 'landlordName', label: 'নাম *' },
          { key: 'landlordFather', label: 'পিতার নাম *' },
          { key: 'landlordMother', label: 'মাতার নাম' },
          { key: 'landlordNid', label: 'NID নম্বর *' },
          { key: 'landlordPhone', label: 'মোবাইল *' },
          { key: 'landlordPermanent', label: 'স্থায়ী ঠিকানা', multiline: true }
        ]
      },
      {
        title: '👤 ভাড়াটিয়ার তথ্য',
        fields: [
          { key: 'tenantName', label: 'নাম *' },
          { key: 'tenantFather', label: 'পিতার নাম *' },
          { key: 'tenantMother', label: 'মাতার নাম' },
          { key: 'tenantNid', label: 'NID নম্বর *' },
          { key: 'tenantPhone', label: 'মোবাইল *' },
          { key: 'tenantPermanent', label: 'স্থায়ী ঠিকানা', multiline: true },
          { key: 'tenantOccupation', label: 'পেশা' }
        ]
      },
      {
        title: '🏢 সম্পত্তির বিবরণ',
        fields: [
          { key: 'propertyAddress', label: 'সম্পত্তির সম্পূর্ণ ঠিকানা *', multiline: true },
          { key: 'roomNo', label: 'রুম/ফ্ল্যাট নম্বর *' },
          { key: 'floorNo', label: 'তলা নম্বর' },
          { key: 'roomType', label: 'রুমের ধরন (সিঙ্গেল/ডাবল/মাস্টার)' },
          { key: 'roomFacilities', label: 'রুমের সুবিধা (ফ্যান, AC, বাথরুম ইত্যাদি)', multiline: true }
        ]
      },
      {
        title: '💰 আর্থিক শর্তাবলী',
        fields: [
          { key: 'monthlyRent', label: 'মাসিক ভাড়া (৳) *' },
          { key: 'advanceAmount', label: 'অগ্রিম/সিকিউরিটি জমা (৳) *' },
          { key: 'serviceCharge', label: 'মাসিক সার্ভিস চার্জ (৳)' },
          { key: 'paymentDate', label: 'ভাড়া দেওয়ার শেষ তারিখ (যেমন: ৫ তারিখ)' },
          { key: 'rentIncreasePercent', label: 'বার্ষিক ভাড়া বৃদ্ধি (%)' },
          { key: 'paymentMethod', label: 'পরিশোধের মাধ্যম (নগদ/বিকাশ/ব্যাংক)' }
        ]
      },
      {
        title: '⚡ ইউটিলিটি বিল বিভাজন',
        fields: [
          { key: 'electricityBy', label: 'বিদ্যুৎ বিল কে দেবে?' },
          { key: 'waterBy', label: 'পানি বিল কে দেবে?' },
          { key: 'gasBy', label: 'গ্যাস বিল কে দেবে?' },
          { key: 'internetBy', label: 'ইন্টারনেট বিল কে দেবে?' },
          { key: 'garbageBy', label: 'ময়লা বিল কে দেবে?' }
        ]
      },
      {
        title: '📅 মেয়াদ ও শর্ত',
        fields: [
          { key: 'startDate', label: 'চুক্তির শুরুর তারিখ *' },
          { key: 'durationMonths', label: 'চুক্তির মেয়াদ (মাস) *' },
          { key: 'noticeMonths', label: 'চুক্তি ভাঙার নোটিশ পিরিয়ড (মাস)' },
          { key: 'refundPolicy', label: 'অগ্রিম ফেরতের শর্ত', multiline: true }
        ]
      },
      {
        title: '🚫 নিষেধাজ্ঞা',
        fields: [
          { key: 'subletAllowed', label: 'সাবলেট করা যাবে? (হ্যাঁ/না)' },
          { key: 'smokingAllowed', label: 'ধূমপান করা যাবে? (হ্যাঁ/না)' },
          { key: 'petsAllowed', label: 'পোষা প্রাণী রাখা যাবে? (হ্যাঁ/না)' },
          { key: 'guestsPolicy', label: 'অতিথি নীতি', multiline: true },
          { key: 'maintenanceDuty', label: 'মেরামতের দায়িত্ব কার?', multiline: true }
        ]
      },
      {
        title: '🆘 জরুরি যোগাযোগ',
        fields: [
          { key: 'emergencyName1', label: 'জরুরি যোগাযোগ ১ — নাম' },
          { key: 'emergencyPhone1', label: 'জরুরি যোগাযোগ ১ — মোবাইল' },
          { key: 'emergencyRelation1', label: 'সম্পর্ক' },
          { key: 'emergencyName2', label: 'জরুরি যোগাযোগ ২ — নাম' },
          { key: 'emergencyPhone2', label: 'জরুরি যোগাযোগ ২ — মোবাইল' },
          { key: 'emergencyRelation2', label: 'সম্পর্ক' }
        ]
      },
      {
        title: '👥 সাক্ষী',
        fields: [
          { key: 'witness1Name', label: 'সাক্ষী ১ — নাম' },
          { key: 'witness1Nid', label: 'সাক্ষী ১ — NID' },
          { key: 'witness1Phone', label: 'সাক্ষী ১ — মোবাইল' },
          { key: 'witness2Name', label: 'সাক্ষী ২ — নাম' },
          { key: 'witness2Nid', label: 'সাক্ষী ২ — NID' },
          { key: 'witness2Phone', label: 'সাক্ষী ২ — মোবাইল' }
        ]
      }
    ]
  },
  evictionNotice: {
    name: 'উচ্ছেদ নোটিশ',
    icon: '⚠️',
    color: 'red',
    description: 'ভাড়াটিয়া উচ্ছেদের আইনি নোটিশ',
    sections: [
      {
        title: '📋 মৌলিক তথ্য',
        fields: [
          { key: 'landlordName', label: 'বাড়িওয়ালার নাম *' },
          { key: 'landlordPhone', label: 'বাড়িওয়ালার মোবাইল *' },
          { key: 'tenantName', label: 'ভাড়াটিয়ার নাম *' },
          { key: 'propertyAddress', label: 'সম্পত্তির ঠিকানা *', multiline: true },
          { key: 'roomNo', label: 'রুম নম্বর *' },
          { key: 'noticeDate', label: 'নোটিশের তারিখ *' }
        ]
      },
      {
        title: '⚠️ উচ্ছেদের কারণ',
        fields: [
          { key: 'evictionReason', label: 'মূল কারণ *', multiline: true },
          { key: 'dueAmount', label: 'বাকি টাকার পরিমাণ (৳)' },
          { key: 'dueMonths', label: 'কত মাসের বাকি?' },
          { key: 'otherViolations', label: 'অন্যান্য শর্ত ভঙ্গের বিবরণ', multiline: true }
        ]
      },
      {
        title: '📅 সময়সীমা',
        fields: [
          { key: 'deadlineDate', label: 'কত তারিখের মধ্যে খালি করতে হবে? *' },
          { key: 'handoverTime', label: 'কী সময়ে চাবি হস্তান্তর?' },
          { key: 'legalWarning', label: 'আইনি সতর্কতা', multiline: true }
        ]
      }
    ]
  },
  noc: {
    name: 'NOC (অনাপত্তি পত্র)',
    icon: '✅',
    color: 'green',
    description: 'ভাড়াটিয়া চলে যাওয়ার অনাপত্তি পত্র',
    sections: [
      {
        title: '📋 পক্ষগণের তথ্য',
        fields: [
          { key: 'landlordName', label: 'বাড়িওয়ালার নাম *' },
          { key: 'landlordPhone', label: 'বাড়িওয়ালার মোবাইল *' },
          { key: 'landlordNid', label: 'বাড়িওয়ালার NID' },
          { key: 'tenantName', label: 'ভাড়াটিয়ার নাম *' },
          { key: 'tenantFather', label: 'ভাড়াটিয়ার পিতার নাম' },
          { key: 'tenantNid', label: 'ভাড়াটিয়ার NID' },
          { key: 'tenantPhone', label: 'ভাড়াটিয়ার মোবাইল' }
        ]
      },
      {
        title: '🏢 বসবাসের তথ্য',
        fields: [
          { key: 'propertyAddress', label: 'সম্পত্তির ঠিকানা *', multiline: true },
          { key: 'roomNo', label: 'রুম নম্বর *' },
          { key: 'moveInDate', label: 'প্রবেশের তারিখ *' },
          { key: 'moveOutDate', label: 'বাহির হওয়ার তারিখ *' },
          { key: 'stayDuration', label: 'মোট কত দিন/মাস ছিলেন' }
        ]
      },
      {
        title: '✅ ক্লিয়ারেন্স',
        fields: [
          { key: 'duesCleared', label: 'সব বাকি পরিশোধ হয়েছে? (হ্যাঁ/না) *' },
          { key: 'electricityClear', label: 'বিদ্যুৎ বিল পরিশোধিত?' },
          { key: 'waterClear', label: 'পানি বিল পরিশোধিত?' },
          { key: 'gasClear', label: 'গ্যাস বিল পরিশোধিত?' },
          { key: 'advanceRefunded', label: 'অগ্রিম ফেরত দেওয়া হয়েছে?' },
          { key: 'refundAmount', label: 'ফেরত দেওয়া পরিমাণ (৳)' },
          { key: 'propertyCondition', label: 'সম্পত্তির অবস্থা', multiline: true }
        ]
      },
      {
        title: '📅 ইস্যু',
        fields: [
          { key: 'issueDate', label: 'ইস্যু তারিখ *' },
          { key: 'purposeOfNOC', label: 'NOC-এর উদ্দেশ্য (চাকরি/বাসা/অন্য)' }
        ]
      }
    ]
  },
  policeVerification: {
    name: 'বাংলাদেশ পুলিশ ভাড়াটিয়া তথ্য ফরম (CIMS)',
    icon: '👮',
    color: 'blue',
    description: 'বাংলাদেশ পুলিশ (ডিএমপি) ভাড়াটিয়া ভেরিফিকেশন ও তথ্য নিবন্ধন ফরম',
    sections: [
      {
        title: '👤 ১. ব্যক্তিগত তথ্য (Personal Info)',
        fields: [
          { key: 'applicantName', label: 'পূর্ণ নাম (বাংলায়) *' },
          { key: 'applicantNameEn', label: 'Full Name (in English Block Letters) *' },
          { key: 'fatherName', label: 'পিতার নাম *' },
          { key: 'motherName', label: 'মাতার নাম *' },
          { key: 'spouseName', label: 'স্বামী/স্ত্রীর নাম (প্রযোজ্য ক্ষেত্রে)' },
          { key: 'dateOfBirth', label: 'জন্ম তারিখ *' },
          { key: 'gender', label: 'লিঙ্গ (পুরুষ/নারী/অন্যান্য) *' },
          { key: 'maritalStatus', label: 'বৈবাহিক অবস্থা *' },
          { key: 'religion', label: 'ধর্ম *' },
          { key: 'bloodGroup', label: 'রক্তের গ্রুপ' },
          { key: 'nid', label: 'জাতীয় পরিচয়পত্র নম্বর (NID) *' },
          { key: 'birthCertNo', label: 'জন্ম নিবন্ধন নম্বর (যদি NID না থাকে)' },
          { key: 'passportNo', label: 'পাসপোর্ট নম্বর (যদি থাকে)' },
          { key: 'education', label: 'শিক্ষাগত যোগ্যতা' }
        ]
      },
      {
        title: '💼 ২. পেশা ও কর্মস্থল (Occupation & Workplace)',
        fields: [
          { key: 'occupation', label: 'পেশা (চাকরি/ব্যবসা/শিক্ষার্থী/অন্যান্য) *' },
          { key: 'organization', label: 'কর্মস্থল / প্রতিষ্ঠানের নাম' },
          { key: 'designation', label: 'পদবী / পদ' },
          { key: 'workAddress', label: 'প্রতিষ্ঠানের সম্পূর্ণ ঠিকানা', multiline: true },
          { key: 'workPhone', label: 'অফিসের ফোন নম্বর' },
          { key: 'monthlyIncome', label: 'মাসিক আনুমানিক আয় (৳)' }
        ]
      },
      {
        title: '📞 ৩. যোগাযোগের বিবরণ ও ঠিকানা (Contact & Address)',
        fields: [
          { key: 'phone', label: 'ভাড়াটিয়ার মোবাইল নম্বর *' },
          { key: 'altPhone', label: 'বিকল্প / অতিরিক্ত মোবাইল নম্বর' },
          { key: 'email', label: 'ইমেইল এড্রেস' },
          { key: 'permanentVillage', label: 'স্থায়ী ঠিকানা: গ্রাম / রোড / বাসা *' },
          { key: 'permanentPost', label: 'স্থায়ী ঠিকানা: ডাকঘর ও পোস্ট কোড *' },
          { key: 'permanentThana', label: 'স্থায়ী থানা / উপজেলা *' },
          { key: 'permanentDistrict', label: 'স্থায়ী জেলা *' },
          { key: 'presentAddress', label: 'বর্তমান ঠিকানা: বাসা/হোল্ডিং, রোড ও ব্লক *', multiline: true },
          { key: 'presentThana', label: 'বর্তমান থানা *' },
          { key: 'presentDistrict', label: 'বর্তমান জেলা (যেমন: ঢাকা)' }
        ]
      },
      {
        title: '👨‍👩‍👧 ৪. পরিবার ও সহ-বসবাসকারী সদস্য (Co-residents / Roommates)',
        fields: [
          { key: 'familyMembersList', label: 'সদস্যদের বিবরণ (নাম, বয়স, সম্পর্ক, পেশা ও মোবাইল - কমা বা লাইন দিয়ে লিখুন)', multiline: true },
          { key: 'totalMembers', label: 'মোট বসবাসকারী সদস্য সংখ্যা' }
        ]
      },
      {
        title: '🧹 ৫. গৃহকর্মী ও ড্রাইভার (Domestic Staff / Driver)',
        fields: [
          { key: 'maidName', label: 'কাজের লোক/গৃহকর্মীর নাম' },
          { key: 'maidPhone', label: 'গৃহকর্মীর মোবাইল নম্বর' },
          { key: 'maidNid', label: 'গৃহকর্মীর NID নম্বর' },
          { key: 'maidAddress', label: 'গৃহকর্মীর স্থায়ী ঠিকানা' },
          { key: 'driverName', label: 'ড্রাইভারের নাম' },
          { key: 'driverPhone', label: 'ড্রাইভারের মোবাইল' },
          { key: 'driverLicense', label: 'ড্রাইভিং লাইসেন্স নম্বর' }
        ]
      },
      {
        title: '🏘️ ৬. পূর্ববর্তী বাড়িওয়ালা ও স্থানীয় রেফারেন্স (Previous & Local References)',
        fields: [
          { key: 'prevLandlordName', label: 'পূর্ববর্তী বাড়িওয়ালার নাম' },
          { key: 'prevLandlordPhone', label: 'পূর্ববর্তী বাড়িওয়ালার মোবাইল' },
          { key: 'prevAddress', label: 'পূর্ববর্তী বাসার ঠিকানা', multiline: true },
          { key: 'leaveReason', label: 'পূর্ববর্তী বাসা ত্যাগের কারণ' },
          { key: 'ref1Name', label: 'স্থানীয় পরিচিত ব্যক্তি-১ এর নাম *' },
          { key: 'ref1Phone', label: 'ব্যক্তি-১ এর মোবাইল *' },
          { key: 'ref1Relation', label: 'ব্যক্তি-১ এর সাথে সম্পর্ক' },
          { key: 'ref1Address', label: 'ব্যক্তি-১ এর ঠিকানা' },
          { key: 'ref2Name', label: 'স্থানীয় পরিচিত ব্যক্তি-২ এর নাম' },
          { key: 'ref2Phone', label: 'ব্যক্তি-২ এর মোবাইল' },
          { key: 'ref2Address', label: 'ব্যক্তি-২ এর ঠিকানা' }
        ]
      },
      {
        title: '🏠 ৭. বর্তমান বাসা ও বাড়িওয়ালা (Current Residence & Landlord)',
        fields: [
          { key: 'flatAddress', label: 'বর্তমান ফ্ল্যাটের সম্পূর্ণ ঠিকানা *', multiline: true },
          { key: 'roomNumber', label: 'রুম বা ফ্ল্যাট নম্বর *' },
          { key: 'landlordName', label: 'বাড়িওয়ালার নাম *' },
          { key: 'landlordPhone', label: 'বাড়িওয়ালার মোবাইল নম্বর *' },
          { key: 'landlordNid', label: 'বাড়িওয়ালার NID নম্বর' },
          { key: 'livingFrom', label: 'ভাড়া শুরুর তারিখ / বসবাসের শুরুর তারিখ *' },
          { key: 'monthlyRent', label: 'মাসিক নির্ধারিত ভাড়া (৳)' }
        ]
      }
    ]
  }
};
