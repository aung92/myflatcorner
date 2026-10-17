import { FlatManagerData, Invoice, MaintenanceItem, Notice, NotificationItem } from '../types';
import { createNotificationItem } from './notificationService';

export interface AutomationRunResult {
  invoicesGenerated: number;
  remindersSent: number;
  noticesPublished: number;
  maintsCreated: number;
  moveOutsProcessed: number;
  kitchenDutyChecked: boolean;
  messages: string[];
  hasChanges: boolean;
  newData: FlatManagerData;
}

/**
 * Helper to get current Date string in YYYY-MM-DD
 */
export function getTodayDateStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Helper to get current Month string in YYYY-MM
 */
export function getCurrentMonthStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Bengali month names mapping
 */
export function getBengaliMonthName(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const monthNum = parseInt(month, 10);
  const bengaliMonths = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  const toBn = (num: string | number) => String(num).replace(/\d/g, d => bengaliDigits[parseInt(d, 10)]);
  const mName = bengaliMonths[monthNum - 1] || monthStr;
  return `${mName} ${toBn(year)}`;
}

/**
 * Runs all flat management system automations seamlessly
 */
export function runAllSystemAutomations(data: FlatManagerData): AutomationRunResult {
  let modifiedData: FlatManagerData = { ...data };
  const messages: string[] = [];
  let hasChanges = false;

  const todayStr = getTodayDateStr();
  const currentMonth = getCurrentMonthStr();
  const todayDate = new Date();

  // 1. AUTO SCHEDULED NOTICES PUBLISHING
  let noticesPublished = 0;
  if (modifiedData.scheduledNotices && modifiedData.scheduledNotices.length > 0) {
    const pendingNotices = modifiedData.scheduledNotices.filter(sn => sn.status === 'pending');
    const updatedScheduledNotices = [...modifiedData.scheduledNotices];
    const newNotices = [...(modifiedData.notices || [])];
    const newNotifications = [...(modifiedData.notifications || [])];

    pendingNotices.forEach(sn => {
      const scheduledDate = new Date(sn.scheduledFor);
      if (scheduledDate <= todayDate) {
        // Publish notice
        newNotices.unshift({
          title: sn.title,
          desc: sn.desc,
          date: todayStr,
          readBy: []
        });

        // Mark scheduled notice as published
        const snIdx = updatedScheduledNotices.findIndex(item => item.id === sn.id);
        if (snIdx >= 0) {
          updatedScheduledNotices[snIdx] = {
            ...updatedScheduledNotices[snIdx],
            status: 'published',
            publishedAt: new Date().toISOString()
          };
        }

        // Notify all tenants
        newNotifications.unshift(
          createNotificationItem({
            forRole: 'tenant',
            title: `📢 নতুন নোটিশ: ${sn.title}`,
            message: sn.desc.length > 80 ? sn.desc.substring(0, 80) + '...' : sn.desc,
            type: 'notice',
            targetTab: 'notices'
          })
        );

        noticesPublished++;
      }
    });

    if (noticesPublished > 0) {
      modifiedData = {
        ...modifiedData,
        scheduledNotices: updatedScheduledNotices,
        notices: newNotices,
        notifications: newNotifications
      };
      hasChanges = true;
      messages.push(`${noticesPublished}টি নির্ধারিত নোটিশ স্বয়ংক্রিয়ভাবে প্রকাশ করা হয়েছে।`);
    }
  }

  // 2. AUTO RECURRING MAINTENANCE CHECK
  let maintsCreated = 0;
  if (modifiedData.recurringMaints && modifiedData.recurringMaints.length > 0) {
    const updatedRecurring = [...modifiedData.recurringMaints];
    const newMaints: MaintenanceItem[] = [...(modifiedData.maints || [])];
    const newNotifications = [...(modifiedData.notifications || [])];

    updatedRecurring.forEach((rm, idx) => {
      const nextDate = new Date(rm.nextDate);
      if (nextDate <= todayDate) {
        // Create new maintenance item
        const maintItem: MaintenanceItem = {
          id: 'MAINT-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          title: `[নিয়মিত রক্ষণাবেক্ষণ] ${rm.title}`,
          desc: `প্রতি ${rm.interval} দিন পরপর নির্ধারিত নিয়মিত সার্ভিসিং / চেকআপ।`,
          room: 'সাধারণ এলাকা / ফ্ল্যাট',
          cost: 0,
          date: todayStr,
          status: 'pending',
          requestedBy: 'owner',
          submittedAt: new Date().toISOString()
        };
        newMaints.unshift(maintItem);

        // Advance nextDate
        const newNextDate = new Date(nextDate.getTime() + (rm.interval || 30) * 24 * 60 * 60 * 1000);
        const yyyy = newNextDate.getFullYear();
        const mm = String(newNextDate.getMonth() + 1).padStart(2, '0');
        const dd = String(newNextDate.getDate()).padStart(2, '0');
        updatedRecurring[idx] = {
          ...rm,
          nextDate: `${yyyy}-${mm}-${dd}`
        };

        // Notify owner
        newNotifications.unshift(
          createNotificationItem({
            forRole: 'owner',
            title: `🔧 রক্ষণাবেক্ষণ অ্যালার্ট: ${rm.title}`,
            message: `আজ ${rm.title} এর নিয়মিত সার্ভিসিং সম্পন্ন করার নির্ধারিত তারিখ।`,
            type: 'maintenance',
            targetTab: 'complaints',
            targetSubTab: 'maintenance'
          })
        );

        maintsCreated++;
      }
    });

    if (maintsCreated > 0) {
      modifiedData = {
        ...modifiedData,
        recurringMaints: updatedRecurring,
        maints: newMaints,
        notifications: newNotifications
      };
      hasChanges = true;
      messages.push(`${maintsCreated}টি নিয়মিত রক্ষণাবেক্ষণ টাস্ক তৈরি করা হয়েছে।`);
    }
  }

  // 3. AUTO INVOICE GENERATION
  let invoicesGenerated = 0;
  const isAutoInvoiceEnabled = modifiedData.autoInvoiceSettings?.enabled ?? true;
  const targetDay = modifiedData.autoInvoiceSettings?.day || 1;
  const currentDay = todayDate.getDate();

  // If today is on or after the target generation day of the month
  if (isAutoInvoiceEnabled && currentDay >= targetDay) {
    const occupiedRooms = modifiedData.rooms.filter(r => r.status === 'occupied' || r.status === 'owner');
    const existingMonthInvoices = modifiedData.invoices.filter(i => i.month === currentMonth);
    const roomsNeedingInvoice = occupiedRooms.filter(r => !existingMonthInvoices.some(i => i.room === r.name));

    if (roomsNeedingInvoice.length > 0) {
      const newInvoices: Invoice[] = [];
      const newNotifications = [...(modifiedData.notifications || [])];

      // Find average or previous month's utility reference
      const lastMonthInvoices = modifiedData.invoices.filter(i => i.month !== currentMonth);
      const samplePrevInv = lastMonthInvoices[0];
      const prevBreakdown = samplePrevInv?.breakdown || {
        electricity: 1000,
        water: 300,
        gas: 270,
        wifi: 200,
        garbage: 100,
        utility: 1870,
        service: 350
      };

      const occupiedCount = Math.max(1, occupiedRooms.length);
      const totalRoomsCount = Math.max(1, modifiedData.rooms.length);

      roomsNeedingInvoice.forEach(room => {
        const isOwner = room.status === 'owner';
        const roomTenants = modifiedData.tenants.filter(t => t.room === room.name);
        const primary = roomTenants[0];
        const roomRent = isOwner ? 0 : (primary?.rent ? Number(primary.rent) : Number(room.rent) || 0);

        const perRoomUtility = Math.round((prevBreakdown.utility || 1870));
        const perRoomService = Math.round((prevBreakdown.service || 350));
        const totalAmount = roomRent + perRoomUtility + perRoomService;

        const occupantsCount = Math.max(1, roomTenants.length);
        const splitRentPerPerson = Math.round(roomRent / occupantsCount);
        const splitUtilPerPerson = Math.round((perRoomUtility + perRoomService) / occupantsCount);

        // Due date set to 10th of current month
        const dueDate = `${currentMonth}-10`;

        const inv: Invoice = {
          id: 'INV-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
          room: room.name,
          tenantName: isOwner ? '👑 আপনি (মালিক)' : (primary ? primary.name : '—'),
          personCount: roomTenants.length,
          persons: roomTenants.map(p => {
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
          month: currentMonth,
          dueDate,
          createdAt: new Date().toISOString(),
          rent: roomRent,
          totalAmount,
          breakdown: {
            electricity: prevBreakdown.electricity || 1000,
            water: prevBreakdown.water || 300,
            gas: prevBreakdown.gas || 270,
            wifi: prevBreakdown.wifi || 200,
            garbage: prevBreakdown.garbage || 100,
            utility: perRoomUtility,
            service: perRoomService
          },
          utilityDetails: {
            calculationType: 'equal_split',
            totalFlatBill: {
              electricity: (prevBreakdown.electricity || 1000) * occupiedCount,
              water: (prevBreakdown.water || 300) * occupiedCount,
              gas: (prevBreakdown.gas || 270) * occupiedCount,
              wifi: (prevBreakdown.wifi || 200) * occupiedCount,
              garbage: (prevBreakdown.garbage || 100) * occupiedCount,
              service: (prevBreakdown.service || 350) * totalRoomsCount,
              total: (perRoomUtility + perRoomService) * occupiedCount
            },
            roomShareRatio: `১/${occupiedCount} (ইউটিলিটি) + ১/${totalRoomsCount} (সার্ভিস)`,
            occupiedRoomCount: occupiedCount,
            notes: 'সিস্টেম অটোমেশন দ্বারা স্বয়ংক্রিয় তৈরি ইনভয়েস'
          },
          payments: [],
          status: 'due'
        };

        newInvoices.push(inv);

        if (!isOwner) {
          newNotifications.unshift(
            createNotificationItem({
              forRole: 'tenant',
              room: room.name,
              type: 'invoice_created',
              title: `🧾 ${getBengaliMonthName(currentMonth)} মাসের ভাড়া ও বিল তৈরি হয়েছে`,
              message: `${room.name}-এর জন্য মোট বিল ৳ ${totalAmount.toLocaleString('bn-BD')} (পরিশোধের শেষ তারিখ: ১০ ${getBengaliMonthName(currentMonth)})।`,
              targetTab: 'invoices',
              invoiceId: inv.id
            })
          );
        }
      });

      if (newInvoices.length > 0) {
        modifiedData = {
          ...modifiedData,
          invoices: [...modifiedData.invoices, ...newInvoices],
          notifications: newNotifications
        };
        hasChanges = true;
        invoicesGenerated = newInvoices.length;
        messages.push(`${invoicesGenerated}টি রুমের মাসিক ইনভয়েস স্বয়ংক্রিয়ভাবে তৈরি হয়েছে।`);
      }
    }
  }

  // 4. AUTO OVERDUE & DUE-DATE REMINDERS
  let remindersSent = 0;
  const isReminderEnabled = modifiedData.reminderSettings?.enabled ?? true;
  const reminderDays = modifiedData.reminderSettings?.days || 3;

  if (isReminderEnabled) {
    const unpaidInvoices = modifiedData.invoices.filter(
      i => !i.isOwner && (i.status === 'due' || i.status === 'partial')
    );

    const newNotifications = [...(modifiedData.notifications || [])];
    const todayTimestamp = new Date(todayStr).getTime();

    unpaidInvoices.forEach(inv => {
      const dueTimestamp = new Date(inv.dueDate).getTime();
      const diffDays = Math.round((dueTimestamp - todayTimestamp) / (1000 * 60 * 60 * 24));

      // 1) Upcoming reminder (e.g. 3 days before due date)
      if (diffDays >= 0 && diffDays <= reminderDays) {
        const reminderTag = `REMINDER_UPCOMING_${inv.id}_${todayStr}`;
        const alreadySent = newNotifications.some(n => n.message.includes(reminderTag) || (n.invoiceId === inv.id && n.createdAt.startsWith(todayStr)));

        if (!alreadySent) {
          const paidAmount = (inv.payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
          const remainingDue = Math.max(0, inv.totalAmount - paidAmount);

          newNotifications.unshift(
            createNotificationItem({
              forRole: 'tenant',
              room: inv.room,
              type: 'payment_reminder',
              title: `⏰ বিল পরিশোধের তাগাদা (${inv.room})`,
              message: `${inv.month} মাসের বকেয়া ৳ ${remainingDue.toLocaleString('bn-BD')}। পরিশোধের শেষ তারিখ: ${inv.dueDate} (${diffDays === 0 ? 'আজই শেষ দিন' : `${diffDays} দিন বাকি`}) [${reminderTag}]`,
              targetTab: 'invoices',
              invoiceId: inv.id
            })
          );
          remindersSent++;
        }
      }

      // 2) Overdue reminder (past due date)
      if (diffDays < 0) {
        const overdueDays = Math.abs(diffDays);
        const overdueTag = `REMINDER_OVERDUE_${inv.id}_${todayStr}`;
        const alreadySent = newNotifications.some(n => n.message.includes(overdueTag) || (n.invoiceId === inv.id && n.createdAt.startsWith(todayStr)));

        if (!alreadySent) {
          const paidAmount = (inv.payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
          const remainingDue = Math.max(0, inv.totalAmount - paidAmount);

          newNotifications.unshift(
            createNotificationItem({
              forRole: 'tenant',
              room: inv.room,
              type: 'payment_overdue',
              title: `⚠️ বকেয়া বিল সতর্কবার্তা (${inv.room})`,
              message: `${inv.month} মাসের বিল ${overdueDays} দিন ধরে বকেয়া আছে! অবিলম্বে ৳ ${remainingDue.toLocaleString('bn-BD')} পরিশোধ করুন। [${overdueTag}]`,
              targetTab: 'invoices',
              invoiceId: inv.id
            })
          );
          remindersSent++;
        }
      }
    });

    if (remindersSent > 0) {
      modifiedData = {
        ...modifiedData,
        notifications: newNotifications
      };
      hasChanges = true;
      messages.push(`${remindersSent}টি বকেয়া ও শেষ তারিখের নোটিফিকেশন পাঠানো হয়েছে।`);
    }
  }

  // 5. AUTO ROOM STATUS & ADVANCE & MOVEOUT SYNCHRONIZATION
  let moveOutsProcessed = 0;
  const updatedRooms = modifiedData.rooms.map(room => {
    if (room.status === 'owner') return room;

    const occupants = modifiedData.tenants.filter(t => t.room === room.name);
    const activeAdvance = (modifiedData.advances || []).find(a => a.room === room.name && a.status === 'active');

    if (occupants.length > 0) {
      if (room.status !== 'occupied') {
        hasChanges = true;
        return { ...room, status: 'occupied' as const };
      }
    } else if (activeAdvance) {
      if (room.status !== 'booked') {
        hasChanges = true;
        return { ...room, status: 'booked' as const };
      }
    } else {
      if (room.status !== 'empty') {
        hasChanges = true;
        return { ...room, status: 'empty' as const };
      }
    }
    return room;
  });

  // Check move-outs past completion date
  if (modifiedData.moveOuts && modifiedData.moveOuts.length > 0) {
    const updatedMoveOuts = modifiedData.moveOuts.map(mo => {
      if (mo.status === 'approved' || mo.status === 'notice_given' || mo.status === 'pending') {
        const moveDate = new Date(mo.moveOutDate);
        if (moveDate <= todayDate) {
          moveOutsProcessed++;
          return {
            ...mo,
            status: 'completed'
          };
        }
      }
      return mo;
    });

    if (moveOutsProcessed > 0) {
      modifiedData = {
        ...modifiedData,
        moveOuts: updatedMoveOuts
      };
      hasChanges = true;
      messages.push(`${moveOutsProcessed}টি বাসা ছাড়ার তারিখ অতিক্রান্ত হওয়ায় হালনাগাদ করা হয়েছে।`);
    }
  }

  if (JSON.stringify(updatedRooms) !== JSON.stringify(modifiedData.rooms)) {
    modifiedData = {
      ...modifiedData,
      rooms: updatedRooms
    };
    hasChanges = true;
  }

  // 6. AUTO KITCHEN DUTY DAILY ROTATION CHECK
  let kitchenDutyChecked = false;
  if (modifiedData.kitchenDuty?.enabled && modifiedData.kitchenDuty.schedule?.length > 0) {
    const dayOfWeek = todayDate.getDay(); // 0 = Sunday, 1 = Monday, ... 6 = Saturday
    const todayDuty = modifiedData.kitchenDuty.schedule.find(s => s.dayIndex === dayOfWeek);

    if (todayDuty) {
      const dutyLogs = modifiedData.kitchenDuty.logs || [];
      const alreadyLogged = dutyLogs.some(log => log.date === todayStr);

      if (!alreadyLogged) {
        const newLog = {
          id: 'KDLOG-' + Date.now(),
          date: todayStr,
          dayName: todayDuty.dayName,
          assignedTo: todayDuty.assignedTo,
          room: todayDuty.room,
          status: 'pending' as const
        };

        const newNotifications = [...(modifiedData.notifications || [])];
        const dutyNotifTag = `KITCHEN_DUTY_${todayStr}`;
        const alreadyNotified = newNotifications.some(n => n.message.includes(dutyNotifTag));

        if (!alreadyNotified) {
          newNotifications.unshift(
            createNotificationItem({
              forRole: 'tenant',
              room: todayDuty.room,
              type: 'kitchenduty',
              title: `🍳 আজ আপনার কিচেন ডিউটি (${todayDuty.dayName})`,
              message: `আজ (${todayDuty.timeSlot}) কিচেন পরিষ্কার ও রক্ষণাবেক্ষণের দায়িত্ব আপনার (${todayDuty.assignedTo}, ${todayDuty.room})। [${dutyNotifTag}]`,
              targetTab: 'kitchenDuty'
            })
          );
        }

        modifiedData = {
          ...modifiedData,
          kitchenDuty: {
            ...modifiedData.kitchenDuty,
            logs: [newLog, ...dutyLogs]
          },
          notifications: newNotifications
        };
        hasChanges = true;
        kitchenDutyChecked = true;
        messages.push(`আজকের (${todayDuty.dayName}) কিচেন ডিউটি স্বয়ংক্রিয়ভাবে সূচিত করা হয়েছে।`);
      }
    }
  }

  return {
    invoicesGenerated,
    remindersSent,
    noticesPublished,
    maintsCreated,
    moveOutsProcessed,
    kitchenDutyChecked,
    messages,
    hasChanges,
    newData: modifiedData
  };
}
