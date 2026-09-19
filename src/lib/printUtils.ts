import { Invoice, PaymentRecord, Tenant, FlatInfo, LegalDoc, Visitor } from '../types';
import { toBn } from './storage';
import { LEGAL_TEMPLATES } from './legalTemplates';

export function getInvoiceStats(invoice: Invoice) {
  const totalPaid = (invoice.payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const total = Number(invoice.totalAmount) || 0;
  const remaining = Math.max(0, total - totalPaid);
  let status: 'due' | 'partial' | 'paid' = 'due';
  if (totalPaid >= total && total > 0) status = 'paid';
  else if (totalPaid > 0) status = 'partial';
  return { totalPaid, total, remaining, status };
}

export function openPrintDocument(html: string) {
  try {
    const printWin = window.open('', '_blank', 'width=900,height=800');
    if (printWin && !printWin.closed) {
      printWin.document.write(html);
      printWin.document.close();
      return;
    }
  } catch (e) {
    console.warn('window.open blocked, using iframe fallback for printing', e);
  }

  // Fallback: Invisible iframe printing
  try {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (printErr) {
          console.error('Print trigger error', printErr);
        }
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 3000);
      }, 500);
    }
  } catch (err) {
    console.error('Print fallback failed', err);
  }
}

export function printInvoice(inv: Invoice, flatInfo: FlatInfo) {
  const stats = getInvoiceStats(inv);
  const payments = inv.payments || [];
  const personsLine = (inv.persons && inv.persons.length > 1)
    ? `<p style="margin-top:6px; font-size:12px; color:#555;">👥 ${inv.persons.map(p => p.name).join(', ')}</p>` : '';
  const paymentsHtml = payments.length > 0 ? `
    <table style="width:100%; border-collapse: collapse; margin-top:10px;">
      <thead><tr style="background:#f0f0f0;"><th style="border:1px solid #ccc; padding:8px; text-align:left;">তারিখ</th><th style="border:1px solid #ccc; padding:8px; text-align:left;">পদ্ধতি</th><th style="border:1px solid #ccc; padding:8px; text-align:left;">নোট</th><th style="border:1px solid #ccc; padding:8px; text-align:right;">পরিমাণ</th></tr></thead>
      <tbody>${payments.map(p => `<tr><td style="border:1px solid #ccc; padding:8px;">${p.date}</td><td style="border:1px solid #ccc; padding:8px;">${p.method}</td><td style="border:1px solid #ccc; padding:8px;">${p.note || '—'}</td><td style="border:1px solid #ccc; padding:8px; text-align:right;">৳ ${toBn(p.amount)}</td></tr>`).join('')}</tbody>
    </table>
  ` : '<p style="margin-top:10px; color:#888;">এখনো কোনো পেমেন্ট হয়নি</p>';

  const invoiceHtml = `
    <!DOCTYPE html><html lang="bn"><head><meta charset="UTF-8"><title>Invoice — ${inv.room}</title>
    <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>*{box-sizing:border-box;}body{font-family:'Hind Siliguri',Arial,sans-serif;padding:30px;color:#222;max-width:800px;margin:0 auto;background:white;}.header{display:flex;justify-content:space-between;border-bottom:3px solid #6366f1;padding-bottom:20px;margin-bottom:25px;}.logo{font-size:24px;font-weight:bold;color:#6366f1;}.logo-sub{font-size:11px;color:#888;letter-spacing:2px;}.invoice-num{text-align:right;}.invoice-num h2{margin:0;font-size:22px;color:#6366f1;}.invoice-num p{margin:4px 0;font-size:12px;color:#555;}.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:25px;}.info-box{background:#f9f9fc;padding:15px;border-radius:8px;}.info-box h4{margin:0 0 8px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;}.info-box p{margin:3px 0;font-size:14px;}.info-box .big{font-size:16px;font-weight:bold;}table.items{width:100%;border-collapse:collapse;margin-bottom:20px;}table.items thead{background:#6366f1;color:white;}table.items th,table.items td{padding:12px;text-align:left;font-size:14px;}table.items th:last-child,table.items td:last-child{text-align:right;}table.items tbody tr{border-bottom:1px solid #eee;}.totals{margin-left:auto;width:320px;margin-top:20px;}.totals .row{display:flex;justify-content:space-between;padding:8px 0;font-size:14px;}.totals .row.total{border-top:2px solid #222;margin-top:10px;padding-top:12px;font-size:18px;font-weight:bold;color:#6366f1;}.totals .row.paid{color:#16a34a;font-weight:600;}.totals .row.remaining{color:#dc2626;font-weight:600;}.status-badge{display:inline-block;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:bold;}.status-paid{background:#dcfce7;color:#16a34a;}.status-partial{background:#fef3c7;color:#d97706;}.status-due{background:#fee2e2;color:#dc2626;}.footer{margin-top:40px;padding-top:20px;border-top:1px solid #eee;text-align:center;font-size:12px;color:#888;}.pay-title{font-size:16px;font-weight:bold;margin-top:30px;margin-bottom:10px;color:#333;}@media print{body{padding:15px;}.no-print{display:none !important;}}</style>
    </head><body>
      <div class="header"><div><div class="logo">🏠 ${flatInfo.name}</div><div class="logo-sub">FLAT INVOICE</div><p style="margin:8px 0 0; font-size:13px; color:#555;">${flatInfo.address}</p></div>
      <div class="invoice-num"><h2>ইনভয়েস</h2><p>মাস: <strong>${inv.month}</strong></p><p>Due: <strong>${inv.dueDate}</strong></p><p style="font-size:10px; color:#999;">ID: ${inv.id}</p></div></div>
      <div class="info-grid">
        <div class="info-box"><h4>বিল প্রাপক</h4><p class="big">${inv.room}</p><p>${inv.tenantName}</p>${personsLine}</div>
        <div class="info-box"><h4>স্ট্যাটাস</h4><p><span class="status-badge status-${stats.status}">${stats.status === 'paid' ? '✓ সম্পূর্ণ পরিশোধিত' : (stats.status === 'partial' ? '◐ আংশিক পরিশোধিত' : '● বাকি')}</span></p><p style="margin-top:8px;">মোট: <strong>৳ ${toBn(stats.total)}</strong></p></div>
      </div>
      <table class="items"><thead><tr><th>বিবরণ</th><th style="text-align:right;">পরিমাণ (৳)</th></tr></thead><tbody>
        ${inv.rent > 0 ? `<tr><td>🏠 রুম ভাড়া (${inv.room})</td><td style="text-align:right;">৳ ${toBn(inv.rent)}</td></tr>` : ''}
        ${inv.breakdown?.electricity > 0 ? `<tr><td>⚡ বিদ্যুৎ বিল</td><td style="text-align:right;">৳ ${toBn(inv.breakdown.electricity)}</td></tr>` : ''}
        ${inv.breakdown?.water > 0 ? `<tr><td>💧 পানি বিল</td><td style="text-align:right;">৳ ${toBn(inv.breakdown.water)}</td></tr>` : ''}
        ${inv.breakdown?.gas > 0 ? `<tr><td>🔥 গ্যাস বিল</td><td style="text-align:right;">৳ ${toBn(inv.breakdown.gas)}</td></tr>` : ''}
        ${inv.breakdown?.wifi > 0 ? `<tr><td>📶 ওয়াইফাই বিল</td><td style="text-align:right;">৳ ${toBn(inv.breakdown.wifi)}</td></tr>` : ''}
        ${inv.breakdown?.garbage > 0 ? `<tr><td>🗑️ ময়লা বিল</td><td style="text-align:right;">৳ ${toBn(inv.breakdown.garbage)}</td></tr>` : ''}
        ${inv.breakdown?.service > 0 ? `<tr><td>🛠️ সার্ভিস চার্জ</td><td style="text-align:right;">৳ ${toBn(inv.breakdown.service)}</td></tr>` : ''}
      </tbody></table>
      <div class="totals">
        <div class="row"><span>মোট বিল</span><span>৳ ${toBn(stats.total)}</span></div>
        ${stats.totalPaid > 0 ? `<div class="row paid"><span>জমা হয়েছে</span><span>৳ ${toBn(stats.totalPaid)}</span></div>` : ''}
        <div class="row ${stats.remaining > 0 ? 'remaining' : 'total'}"><span>${stats.remaining > 0 ? 'বাকি' : 'সর্বমোট পরিশোধিত'}</span><span>৳ ${toBn(stats.remaining > 0 ? stats.remaining : stats.total)}</span></div>
      </div>
      <div class="pay-title">📋 পেমেন্ট লগ</div>${paymentsHtml}
      <div class="footer"><p>এই ইনভয়েসটি স্বয়ংক্রিয়ভাবে তৈরি — ${new Date().toLocaleDateString('bn-BD')}</p><p>ধন্যবাদ! 🙏</p></div>
      <div class="no-print" style="text-align:center; margin-top:30px;"><button onclick="window.print()" style="background:#6366f1; color:white; border:none; padding:12px 30px; border-radius:8px; font-size:14px; cursor:pointer; font-weight:bold; font-family:inherit;">🖨️ প্রিন্ট / PDF সেভ করুন</button> <button onclick="window.close()" style="background:#eee; color:#333; border:none; padding:12px 30px; border-radius:8px; font-size:14px; cursor:pointer; margin-left:10px; font-family:inherit;">বন্ধ করুন</button></div>
    </body></html>`;
  openPrintDocument(invoiceHtml);
}

export function printTenantList(tenants: Tenant[], flatInfo: FlatInfo) {
  const html = `<!DOCTYPE html><html lang="bn"><head><meta charset="UTF-8"><title>ভাড়াটিয়া তালিকা</title><link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&display=swap" rel="stylesheet"><style>body{font-family:'Hind Siliguri',Arial,sans-serif;padding:30px;background:white;color:#222;}h1{color:#6366f1;text-align:center;}table{width:100%;border-collapse:collapse;margin-top:20px;}th,td{border:1px solid #ddd;padding:10px;text-align:left;font-size:13px;}th{background:#6366f1;color:white;}tr:nth-child(even){background:#f9f9f9;}.footer{text-align:center;font-size:11px;color:#888;margin-top:30px;}@media print{.no-print{display:none;}}</style></head><body>
    <h1>🏠 ${flatInfo.name}</h1><p style="text-align:center;color:#666;">${flatInfo.address}</p><p style="text-align:center;color:#666;font-size:12px;">তারিখ: ${new Date().toLocaleDateString('bn-BD')}</p>
    <table><thead><tr><th>#</th><th>নাম</th><th>ফোন</th><th>রুম</th><th>ভাড়া (৳)</th><th>প্রবেশ</th></tr></thead><tbody>
    ${tenants.map((t, i) => `<tr><td>${i + 1}</td><td>${t.name}</td><td>${t.phone}</td><td>${t.room}</td><td>${toBn(t.rent || 0)}</td><td>${t.moveIn || '—'}</td></tr>`).join('')}
    </tbody></table>
    <div class="footer"><p>মোট: ${tenants.length} জন</p></div>
    <div class="no-print" style="text-align:center;margin-top:20px;"><button onclick="window.print()" style="background:#6366f1;color:white;border:none;padding:12px 30px;border-radius:8px;cursor:pointer;font-family:inherit;">🖨️ প্রিন্ট / PDF</button></div>
    </body></html>`;
  openPrintDocument(html);
}

export function printReceipt(payment: PaymentRecord, inv: Invoice, flatInfo: FlatInfo) {
  const html = `<!DOCTYPE html><html lang="bn"><head><meta charset="UTF-8"><title>রিসিট</title>
  <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>*{box-sizing:border-box;}body{font-family:'Hind Siliguri',Arial,sans-serif;padding:30px;max-width:500px;margin:0 auto;background:white;color:#222;}.head{text-align:center;border-bottom:3px solid #06b6d4;padding-bottom:20px;margin-bottom:20px;}.icon{width:70px;height:70px;border-radius:50%;background:#dcfce7;color:#16a34a;display:inline-flex;align-items:center;justify-content:center;font-size:36px;margin-bottom:10px;}.head h1{margin:5px 0;color:#06b6d4;font-size:22px;}.head p{margin:3px 0;font-size:13px;color:#666;}.box{background:#f9f9fc;padding:20px;border-radius:12px;margin-bottom:20px;}.row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px dashed #ddd;font-size:14px;}.row:last-child{border-bottom:none;padding-top:15px;font-size:18px;font-weight:bold;color:#16a34a;}.footer{text-align:center;font-size:12px;color:#888;margin-top:30px;}@media print{body{padding:15px;}.no-print{display:none;}}</style></head><body>
    <div class="head"><div class="icon">✓</div><h1>পেমেন্ট রিসিট</h1><p>${flatInfo.name}</p><p>${flatInfo.address}</p></div>
    <div class="box">
      <div class="row"><span>রুম</span><span><strong>${inv.room}</strong></span></div>
      <div class="row"><span>বিলের মাস</span><span>${inv.month}</span></div>
      <div class="row"><span>তারিখ</span><span>${payment.date}</span></div>
      <div class="row"><span>পদ্ধতি</span><span>${payment.method}</span></div>
      <div class="row"><span>মোট পরিশোধিত</span><span>৳ ${toBn(payment.amount)}</span></div>
    </div>
    <div class="footer"><p>এই রিসিটটি স্বয়ংক্রিয়ভাবে তৈরি — ${new Date().toLocaleDateString('bn-BD')}</p><p>ধন্যবাদ! 🙏</p></div>
    <div class="no-print" style="text-align:center;margin-top:20px;"><button onclick="window.print()" style="background:#06b6d4;color:white;border:none;padding:12px 30px;border-radius:8px;cursor:pointer;font-family:inherit;">🖨️ প্রিন্ট / PDF</button></div>
  </body></html>`;
  openPrintDocument(html);
}

export function printUtilitySlip(inv: Invoice, flatInfo: FlatInfo) {
  const stats = getInvoiceStats(inv);
  const bd = inv.breakdown || { electricity: 0, water: 0, gas: 0, wifi: 0, garbage: 0, utility: 0, service: 0 };
  const meter = bd.electricityMeter || inv.utilityDetails?.electricityMeter;
  const occupiedCount = inv.utilityDetails?.occupiedRoomCount || 4;
  const shareRatio = inv.utilityDetails?.roomShareRatio || `১/${occupiedCount}`;

  const totalUtility = (bd.electricity || 0) + (bd.water || 0) + (bd.gas || 0) + (bd.wifi || 0) + (bd.garbage || 0) + (bd.service || 0);

  const meterDetailsHtml = meter && meter.consumedUnits ? `
    <div style="background:#eef2ff; border:1px solid #c7d2fe; border-radius:8px; padding:12px; margin-top:10px; font-size:13px; color:#1e1b4b;">
      <p style="margin:0 0 6px; font-weight:bold;">⚡ বিদ্যুৎ মিটার রিডিং হিসাব:</p>
      <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:8px;">
        <div>পূর্ববর্তী রিডিং: <strong>${toBn(meter.prevUnit || 0)} kWh</strong></div>
        <div>বর্তমান রিডিং: <strong>${toBn(meter.currentUnit || 0)} kWh</strong></div>
        <div>ব্যবহৃত ইউনিট: <strong style="color:#4f46e5;">${toBn(meter.consumedUnits)} kWh</strong></div>
        <div>ইউনিট প্রতি দর: <strong>৳ ${toBn(meter.unitRate || 9.5)}</strong></div>
      </div>
      ${meter.meterNo ? `<p style="margin:6px 0 0; font-size:11px; color:#6366f1;">মিটার নম্বর: ${meter.meterNo}</p>` : ''}
    </div>
  ` : '';

  const html = `<!DOCTYPE html><html lang="bn"><head><meta charset="UTF-8"><title>ইউটিলিটি বিল বিবরণী — ${inv.room}</title>
  <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    *{box-sizing:border-box;}
    body{font-family:'Hind Siliguri',Arial,sans-serif;padding:30px;color:#1e293b;max-width:850px;margin:0 auto;background:#fff;}
    .header{display:flex;justify-content:space-between;border-bottom:3px solid #0284c7;padding-bottom:16px;margin-bottom:20px;}
    .title h1{margin:0;font-size:24px;color:#0369a1;}
    .title p{margin:4px 0 0;font-size:12px;color:#64748b;}
    .meta{text-align:right;}
    .meta h3{margin:0;font-size:18px;color:#0284c7;}
    .meta p{margin:3px 0 0;font-size:12px;color:#64748b;}
    .info-card{display:grid;grid-template-columns:2fr 1fr;gap:15px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin-bottom:20px;}
    .info-card h4{margin:0 0 6px;font-size:11px;text-transform:uppercase;color:#64748b;letter-spacing:1px;}
    .info-card p{margin:2px 0;font-size:14px;}
    table.breakdown{width:100%;border-collapse:collapse;margin:15px 0 25px;}
    table.breakdown th{background:#0284c7;color:#fff;padding:10px 12px;text-align:left;font-size:13px;}
    table.breakdown td{padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;}
    table.breakdown tr:nth-child(even){background:#f8fafc;}
    table.breakdown td.amount{text-align:right;font-weight:600;}
    .totals-box{margin-left:auto;width:340px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:16px;margin-bottom:25px;}
    .totals-box .row{display:flex;justify-content:space-between;padding:6px 0;font-size:14px;}
    .totals-box .row.grand{border-top:2px solid #0284c7;margin-top:8px;padding-top:10px;font-size:18px;font-weight:bold;color:#0369a1;}
    .status-badge{display:inline-block;padding:4px 12px;border-radius:12px;font-size:12px;font-weight:bold;}
    .status-paid{background:#dcfce7;color:#16a34a;}
    .status-partial{background:#fef3c7;color:#d97706;}
    .status-due{background:#fee2e2;color:#dc2626;}
    .sign-row{display:flex;justify-content:space-between;margin-top:60px;padding-top:20px;}
    .sign-box{text-align:center;width:200px;border-top:1px dashed #94a3b8;padding-top:6px;font-size:12px;color:#475569;}
    .footer{text-align:center;font-size:11px;color:#94a3b8;margin-top:30px;border-top:1px solid #e2e8f0;padding-top:15px;}
    @media print{.no-print{display:none !important;}}
  </style>
  </head><body>
    <div class="header">
      <div class="title">
        <h1>🏠 ${flatInfo.name}</h1>
        <p>${flatInfo.address} • যোগাযোগ: ${flatInfo.phone}</p>
        <p style="margin-top:6px; font-size:13px; font-weight:bold; color:#0369a1;">📄 ইউটিলিটি বিল বিস্তারিত বিবরণী (Utility Statement)</p>
      </div>
      <div class="meta">
        <h3>বিলের মাস: ${inv.month}</h3>
        <p>Due Date: <strong>${inv.dueDate}</strong></p>
        <p>রুম: <strong>${inv.room}</strong></p>
        <p style="margin-top:5px;"><span class="status-badge status-${stats.status}">${stats.status === 'paid' ? '✓ পরিশোধিত' : (stats.status === 'partial' ? '◐ আংশিক বাকি' : '● বাকি')}</span></p>
      </div>
    </div>

    <div class="info-card">
      <div>
        <h4>ভাড়াটিয়া বিবরণ</h4>
        <p><strong>নাম:</strong> ${inv.tenantName}</p>
        <p><strong>রুম নম্বর:</strong> ${inv.room}</p>
        ${inv.persons && inv.persons.length > 1 ? `<p style="color:#64748b; font-size:12px;">সহবাসী: ${inv.persons.map(p => p.name).join(', ')}</p>` : ''}
        <p style="color:#64748b; font-size:12px; margin-top:4px;">বণ্টন নিয়ম: ফ্ল্যাটের মোট ইউটিলিটি খরচ সমানভাগে রুমগুলোর মধ্যে বণ্টিত (${shareRatio} ভাগ)</p>
      </div>
      <div style="border-left:1px solid #e2e8f0; padding-left:15px;">
        <h4>বিল সারাংশ</h4>
        <p>রুম ভাড়া: <strong>৳ ${toBn(inv.rent)}</strong></p>
        <p>ইউটিলিটি: <strong>৳ ${toBn(totalUtility)}</strong></p>
        <p style="color:#0369a1; font-weight:bold; margin-top:4px;">সর্বমোট: ৳ ${toBn(stats.total)}</p>
      </div>
    </div>

    ${meterDetailsHtml}

    <table class="breakdown">
      <thead>
        <tr>
          <th>#</th>
          <th>ইউটিলিটি খাত</th>
          <th>হিসাব পদ্ধতি / নোট</th>
          <th style="text-align:right;">পরিমাণ (৳)</th>
        </tr>
      </thead>
      <tbody>
        ${bd.electricity > 0 ? `
          <tr>
            <td>১</td>
            <td>⚡ বিদ্যুৎ বিল (Electricity)</td>
            <td>${meter && meter.consumedUnits ? `মিটার রিডিং (${toBn(meter.consumedUnits)} ইউনিট × ৳${toBn(meter.unitRate || 9.5)})` : `ফ্ল্যাট বিদ্যুৎ বিলের ${shareRatio} সমবণ্টন`}</td>
            <td class="amount">৳ ${toBn(bd.electricity)}</td>
          </tr>
        ` : ''}
        ${bd.water > 0 ? `
          <tr>
            <td>২</td>
            <td>💧 পানি বিল (WASA Water)</td>
            <td>ওয়াসা ও পাম্প পরিচালনা খরচ সমবণ্টন</td>
            <td class="amount">৳ ${toBn(bd.water)}</td>
          </tr>
        ` : ''}
        ${bd.gas > 0 ? `
          <tr>
            <td>৩</td>
            <td>🔥 গ্যাস বিল (Gas Line / Cylinder)</td>
            <td>অনুমোদিত আবাসিক গ্যাস লাইন বিল সমবণ্টন</td>
            <td class="amount">৳ ${toBn(bd.gas)}</td>
          </tr>
        ` : ''}
        ${bd.wifi > 0 ? `
          <tr>
            <td>৪</td>
            <td>📶 ইন্টারনেট ও ওয়াইফাই (WiFi)</td>
            <td>হাইস্পিড ব্রডব্যান্ড আনলিমিটেড প্যাকেজ সমবণ্টন</td>
            <td class="amount">৳ ${toBn(bd.wifi)}</td>
          </tr>
        ` : ''}
        ${bd.garbage > 0 ? `
          <tr>
            <td>৫</td>
            <td>🗑️ ময়লা অপসারণ (Waste Cleaning)</td>
            <td>সিটি কর্পোরেশন বর্জ্য অপসারণ ও পরিচ্ছন্নতাকর্মী ফি</td>
            <td class="amount">৳ ${toBn(bd.garbage)}</td>
          </tr>
        ` : ''}
        ${bd.service > 0 ? `
          <tr>
            <td>৬</td>
            <td>🛠️ সার্ভিস চার্জ ও কমন এরিয়া (Service Charge)</td>
            <td>লিফট, সিকিউরিটি গার্ড ও কমন স্পেস লাইটিং সার্ভিস</td>
            <td class="amount">৳ ${toBn(bd.service)}</td>
          </tr>
        ` : ''}
        ${inv.rent > 0 ? `
          <tr style="background:#f1f5f9; font-weight:bold;">
            <td>৭</td>
            <td>🏠 মাসিক রুম ভাড়া (Room Rent)</td>
            <td>চুক্তি অনুযায়ী মূল রুম ভাড়া</td>
            <td class="amount">৳ ${toBn(inv.rent)}</td>
          </tr>
        ` : ''}
      </tbody>
    </table>

    <div class="totals-box">
      <div class="row"><span>মোট ইউটিলিটি খরচ:</span><span>৳ ${toBn(totalUtility)}</span></div>
      ${inv.rent > 0 ? `<div class="row"><span>রুম ভাড়া:</span><span>৳ ${toBn(inv.rent)}</span></div>` : ''}
      <div class="row grand"><span>সর্বমোট প্রদেয়:</span><span>৳ ${toBn(stats.total)}</span></div>
      ${stats.totalPaid > 0 ? `<div class="row" style="color:#16a34a; font-weight:bold;"><span>পরিশোধিত:</span><span>৳ ${toBn(stats.totalPaid)}</span></div>` : ''}
      ${stats.remaining > 0 ? `<div class="row" style="color:#dc2626; font-weight:bold;"><span>বাকি পরিমাণ:</span><span>৳ ${toBn(stats.remaining)}</span></div>` : ''}
    </div>

    <div class="sign-row">
      <div class="sign-box">ভাড়াটিয়ার স্বাক্ষর ও তারিখ</div>
      <div class="sign-box">ফ্ল্যাট মালিক / ব্যবস্থাপকের স্বাক্ষর</div>
    </div>

    <div class="footer">
      <p>এই স্লিপটি সিস্টেম দ্বারা স্বয়ংক্রিয়ভাবে প্রস্তুতকৃত • তারিখ: ${new Date().toLocaleDateString('bn-BD')} • ফ্ল্যাট ম্যানেজার</p>
    </div>

    <div class="no-print" style="text-align:center; margin-top:30px;">
      <button onclick="window.print()" style="background:#0284c7; color:white; border:none; padding:12px 30px; border-radius:8px; font-size:14px; cursor:pointer; font-weight:bold; font-family:inherit;">🖨️ প্রিন্ট / PDF সংরক্ষণ করুন</button>
      <button onclick="window.close()" style="background:#e2e8f0; color:#334155; border:none; padding:12px 30px; border-radius:8px; font-size:14px; cursor:pointer; margin-left:10px; font-family:inherit;">বন্ধ করুন</button>
    </div>
  </body></html>`;

  openPrintDocument(html);
}

export function printLegalDoc(doc: LegalDoc) {
  const tpl = LEGAL_TEMPLATES[doc.type];
  if (!tpl) return;
  const v = doc.values || {};
  const today = new Date().toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });

  let body = '';

  if (doc.type === 'rentAgreement') {
    body = `
      <div class="header">
        <h1>বাসা ভাড়া চুক্তিপত্র</h1>
        <p class="sub-en">RENT AGREEMENT</p>
        <p style="margin-top:10px; font-size:12px; color:#666;">তারিখ: ${today}</p>
      </div>
      <p class="intro">আজ ${today} তারিখে নিম্নলিখিত দুই পক্ষের মধ্যে এই চুক্তিপত্র সম্পাদিত হয়:</p>
      <h3>প্রথম পক্ষ (বাড়িওয়ালা)</h3>
      <table class="info">
        <tr><td class="label">নাম</td><td><strong>${v.landlordName || '—'}</strong></td></tr>
        <tr><td class="label">পিতা</td><td>${v.landlordFather || '—'}</td></tr>
        <tr><td class="label">মাতা</td><td>${v.landlordMother || '—'}</td></tr>
        <tr><td class="label">NID</td><td>${v.landlordNid || '—'}</td></tr>
        <tr><td class="label">মোবাইল</td><td>${v.landlordPhone || '—'}</td></tr>
        <tr><td class="label">স্থায়ী ঠিকানা</td><td>${v.landlordPermanent || '—'}</td></tr>
      </table>
      <h3>দ্বিতীয় পক্ষ (ভাড়াটিয়া)</h3>
      <table class="info">
        <tr><td class="label">নাম</td><td><strong>${v.tenantName || '—'}</strong></td></tr>
        <tr><td class="label">পিতা</td><td>${v.tenantFather || '—'}</td></tr>
        <tr><td class="label">মাতা</td><td>${v.tenantMother || '—'}</td></tr>
        <tr><td class="label">NID</td><td>${v.tenantNid || '—'}</td></tr>
        <tr><td class="label">মোবাইল</td><td>${v.tenantPhone || '—'}</td></tr>
        <tr><td class="label">পেশা</td><td>${v.tenantOccupation || '—'}</td></tr>
        <tr><td class="label">স্থায়ী ঠিকানা</td><td>${v.tenantPermanent || '—'}</td></tr>
      </table>
      <h3>সম্পত্তির বিবরণ</h3>
      <table class="info">
        <tr><td class="label">সম্পূর্ণ ঠিকানা</td><td>${v.propertyAddress || '—'}</td></tr>
        <tr><td class="label">রুম/ফ্ল্যাট নম্বর</td><td>${v.roomNo || '—'}</td></tr>
        <tr><td class="label">তলা নম্বর</td><td>${v.floorNo || '—'}</td></tr>
        <tr><td class="label">রুমের ধরন</td><td>${v.roomType || '—'}</td></tr>
        <tr><td class="label">রুমের সুবিধা</td><td>${v.roomFacilities || '—'}</td></tr>
      </table>
      <h3>শর্তাবলী</h3>
      <ol class="terms">
        <li><strong>মেয়াদ:</strong> প্রথম পক্ষ কর্তৃক দ্বিতীয় পক্ষকে ${v.startDate || '—'} তারিখ থেকে ${v.durationMonths || '—'} মাসের জন্য উপরের সম্পত্তি ভাড়া দেওয়া হলো।</li>
        <li><strong>মাসিক ভাড়া:</strong> মাসিক ভাড়া ৳ ${v.monthlyRent || '—'}। প্রতি মাসের <strong>${v.paymentDate || '৫'}</strong> তারিখের মধ্যে পরিশোধ করতে হবে।</li>
        <li><strong>অগ্রিম/সিকিউরিটি জমা:</strong> ৳ ${v.advanceAmount || '—'} যা চুক্তি শেষে উভয় পক্ষ সম্মতিতে ফেরতযোগ্য।</li>
        ${v.serviceCharge ? `<li><strong>সার্ভিস চার্জ:</strong> মাসিক ৳ ${v.serviceCharge}।</li>` : ''}
        ${v.rentIncreasePercent ? `<li><strong>ভাড়া বৃদ্ধি:</strong> প্রতি বছর ভাড়া ${v.rentIncreasePercent}% হারে বৃদ্ধি পাবে।</li>` : ''}
        <li><strong>পরিশোধের মাধ্যম:</strong> ${v.paymentMethod || 'নগদ'}।</li>
        <li><strong>ইউটিলিটি বিল বিভাজন:</strong>
          <ul class="sub">
            <li>বিদ্যুৎ: ${v.electricityBy || '—'}</li>
            <li>পানি: ${v.waterBy || '—'}</li>
            <li>গ্যাস: ${v.gasBy || '—'}</li>
            <li>ইন্টারনেট: ${v.internetBy || '—'}</li>
            <li>ময়লা: ${v.garbageBy || '—'}</li>
          </ul>
        </li>
        <li><strong>চুক্তি ভাঙার নোটিশ:</strong> উভয় পক্ষ ${v.noticeMonths || '১'} মাসের পূর্ব নোটিশ দিয়ে চুক্তি বাতিল করতে পারবেন।</li>
        ${v.refundPolicy ? `<li><strong>অগ্রিম ফেরত:</strong> ${v.refundPolicy}</li>` : ''}
      </ol>
      <h3>নিষেধাজ্ঞা</h3>
      <ol class="terms">
        <li>সাবলেট করা যাবে: <strong>${v.subletAllowed || 'না'}</strong></li>
        <li>ধূমপান করা যাবে: <strong>${v.smokingAllowed || 'না'}</strong></li>
        <li>পোষা প্রাণী রাখা যাবে: <strong>${v.petsAllowed || 'না'}</strong></li>
        ${v.guestsPolicy ? `<li>অতিথি নীতি: ${v.guestsPolicy}</li>` : ''}
        ${v.maintenanceDuty ? `<li>মেরামতের দায়িত্ব: ${v.maintenanceDuty}</li>` : ''}
        <li>ভাড়াটিয়া কোনো অবৈধ কার্যকলাপে জড়িত হতে পারবেন না।</li>
        <li>সম্পত্তির কোনো কাঠামোগত পরিবর্তন করা যাবে না।</li>
      </ol>
      <h3>জরুরি যোগাযোগ</h3>
      <table class="info">
        <tr><td class="label">১. নাম</td><td>${v.emergencyName1 || '—'} (${v.emergencyRelation1 || '—'}) — ${v.emergencyPhone1 || '—'}</td></tr>
        <tr><td class="label">২. নাম</td><td>${v.emergencyName2 || '—'} (${v.emergencyRelation2 || '—'}) — ${v.emergencyPhone2 || '—'}</td></tr>
      </table>
      <div class="declaration">
        <p><strong>ঘোষণা:</strong> আমরা উভয় পক্ষ উপরোক্ত সকল শর্তাবলী পড়ে এবং বুঝে স্বেচ্ছায় এই চুক্তিতে স্বাক্ষর করলাম।</p>
      </div>
      <div class="signatures">
        <div class="sig"><div class="line"></div><p><strong>প্রথম পক্ষের স্বাক্ষর</strong></p><p class="small">${v.landlordName || ''}</p><p class="small">তারিখ: ${today}</p></div>
        <div class="sig"><div class="line"></div><p><strong>দ্বিতীয় পক্ষের স্বাক্ষর</strong></p><p class="small">${v.tenantName || ''}</p><p class="small">তারিখ: ${today}</p></div>
      </div>
      <h3>সাক্ষী</h3>
      <div class="signatures">
        <div class="sig"><div class="line"></div><p><strong>সাক্ষী ১</strong></p><p class="small">${v.witness1Name || ''}</p><p class="small">NID: ${v.witness1Nid || '—'}</p><p class="small">মোবাইল: ${v.witness1Phone || '—'}</p></div>
        <div class="sig"><div class="line"></div><p><strong>সাক্ষী ২</strong></p><p class="small">${v.witness2Name || ''}</p><p class="small">NID: ${v.witness2Nid || '—'}</p><p class="small">মোবাইল: ${v.witness2Phone || '—'}</p></div>
      </div>
      <div class="footer"><p>এই চুক্তিপত্রটি স্বয়ংক্রিয়ভাবে তৈরি — আমার ফ্ল্যাট অ্যাপ</p><p>Document ID: ${doc.id}</p></div>
    `;
  } else if (doc.type === 'evictionNotice') {
    body = `
      <div class="header">
        <h1>উচ্ছেদ নোটিশ</h1>
        <p class="sub-en">EVICTION NOTICE</p>
      </div>
      <div class="notice-date">তারিখ: ${v.noticeDate || today}</div>
      <div class="recipient">
        <p><strong>প্রাপক:</strong></p>
        <p>${v.tenantName || '—'}</p>
        <p>${v.roomNo || '—'}, ${v.propertyAddress || '—'}</p>
      </div>
      <div class="sender">
        <p><strong>প্রেরক:</strong></p>
        <p>${v.landlordName || '—'}</p>
        <p>মোবাইল: ${v.landlordPhone || '—'}</p>
      </div>
      <p class="subject"><strong>বিষয়:</strong> বাসা খালি করার আইনি নোটিশ</p>
      <p>মহোদয়,</p>
      <p>আপনি আমার মালিকানাধীন ${v.propertyAddress || '—'} এর ${v.roomNo || '—'} নম্বর কক্ষে বসবাস করছেন। নিম্নলিখিত কারণে আপনাকে এই নোটিশ প্রদান করা হচ্ছে:</p>
      <div class="reason-box">
        <p><strong>উচ্ছেদের কারণ:</strong></p>
        <p>${v.evictionReason || '—'}</p>
        ${v.dueAmount ? `<p style="margin-top:10px;"><strong>বাকি টাকার পরিমাণ:</strong> ৳ ${v.dueAmount}${v.dueMonths ? ' (' + v.dueMonths + ' মাসের)' : ''}</p>` : ''}
        ${v.otherViolations ? `<p style="margin-top:10px;"><strong>অন্যান্য শর্ত ভঙ্গ:</strong> ${v.otherViolations}</p>` : ''}
      </div>
      <p>এই নোটিশ পাওয়ার তারিখ থেকে <strong>${v.deadlineDate || '৩০ দিনের'}</strong> মধ্যে বাসাটি খালি করে দেওয়ার জন্য অনুরোধ করা হচ্ছে।</p>
      ${v.handoverTime ? `<p>চাবি হস্তান্তরের সময়: <strong>${v.handoverTime}</strong></p>` : ''}
      <div class="warning-box">
        <p><strong>⚠️ আইনি সতর্কতা:</strong></p>
        <p>${v.legalWarning || 'নির্ধারিত সময়ের মধ্যে বাসা খালি না করলে আমি আপনার বিরুদ্ধে সুনির্দিষ্ট প্রতিকার আইন, ১৮৭৭ এবং প্রযোজ্য অন্যান্য আইনের অধীনে আইনি ব্যবস্থা নিতে বাধ্য হবো।'}</p>
      </div>
      <p style="margin-top:30px;">বিনীত,</p>
      <div class="signatures single">
        <div class="sig" style="margin-left:auto;"><div class="line"></div><p><strong>${v.landlordName || ''}</strong></p><p class="small">বাড়িওয়ালা</p><p class="small">মোবাইল: ${v.landlordPhone || ''}</p></div>
      </div>
      <div class="footer"><p>Document ID: ${doc.id}</p></div>
    `;
  } else if (doc.type === 'noc') {
    body = `
      <div class="header">
        <h1>অনাপত্তি পত্র</h1>
        <p class="sub-en">NO OBJECTION CERTIFICATE (NOC)</p>
        <p style="margin-top:10px; font-size:12px; color:#666;">তারিখ: ${v.issueDate || today}</p>
      </div>
      <p class="intro">এই মর্মে প্রত্যয়ন করা যাচ্ছে যে:</p>
      <h3>ভাড়াটিয়ার তথ্য</h3>
      <table class="info">
        <tr><td class="label">নাম</td><td><strong>${v.tenantName || '—'}</strong></td></tr>
        <tr><td class="label">পিতা</td><td>${v.tenantFather || '—'}</td></tr>
        <tr><td class="label">NID</td><td>${v.tenantNid || '—'}</td></tr>
        <tr><td class="label">মোবাইল</td><td>${v.tenantPhone || '—'}</td></tr>
      </table>
      <h3>বসবাসের তথ্য</h3>
      <table class="info">
        <tr><td class="label">সম্পত্তির ঠিকানা</td><td>${v.propertyAddress || '—'}</td></tr>
        <tr><td class="label">রুম নম্বর</td><td>${v.roomNo || '—'}</td></tr>
        <tr><td class="label">প্রবেশের তারিখ</td><td>${v.moveInDate || '—'}</td></tr>
        <tr><td class="label">বাহির হওয়ার তারিখ</td><td>${v.moveOutDate || '—'}</td></tr>
        ${v.stayDuration ? `<tr><td class="label">বসবাসের মেয়াদ</td><td>${v.stayDuration}</td></tr>` : ''}
      </table>
      <h3>ক্লিয়ারেন্স</h3>
      <table class="info">
        <tr><td class="label">সকল বকেয়া পরিশোধ</td><td>${v.duesCleared || '—'}</td></tr>
        <tr><td class="label">বিদ্যুৎ বিল</td><td>${v.electricityClear || '—'}</td></tr>
        <tr><td class="label">পানি বিল</td><td>${v.waterClear || '—'}</td></tr>
        <tr><td class="label">গ্যাস বিল</td><td>${v.gasClear || '—'}</td></tr>
        <tr><td class="label">অগ্রিম ফেরত</td><td>${v.advanceRefunded || '—'}${v.refundAmount ? ' (৳ ' + v.refundAmount + ')' : ''}</td></tr>
      </table>
      <div class="declaration green">
        <p>উপরোক্ত ভাড়াটিয়ার বিরুদ্ধে আমার কোনো আপত্তি নেই। তিনি যেকোনো স্থানে বসবাস করতে, চাকরি করতে বা যেকোনো বৈধ কাজে এই NOC ব্যবহার করতে পারবেন।</p>
      </div>
      <p style="margin-top:20px;">${v.purposeOfNOC ? '<strong>NOC-এর উদ্দেশ্য:</strong> ' + v.purposeOfNOC : ''}</p>
      <div class="signatures single">
        <div class="sig" style="margin-left:auto;"><div class="line"></div><p><strong>${v.landlordName || ''}</strong></p><p class="small">বাড়িওয়ালা</p><p class="small">মোবাইল: ${v.landlordPhone || ''}</p></div>
      </div>
      <div class="footer"><p>Document ID: ${doc.id}</p></div>
    `;
  } else if (doc.type === 'policeVerification') {
    let membersRows = '';
    if (v.familyMembersJson) {
      try {
        const list = JSON.parse(v.familyMembersJson);
        if (Array.isArray(list) && list.length > 0) {
          membersRows = list.map((m: any, i: number) => `
            <tr>
              <td style="text-align:center;width:40px;">${i + 1}</td>
              <td><strong>${m.name || '—'}</strong></td>
              <td style="text-align:center;">${m.age ? m.age + ' বছর' : '—'}</td>
              <td>${m.relation || '—'}</td>
              <td>${m.occupation || '—'}</td>
              <td>${m.phoneOrNid || '—'}</td>
            </tr>
          `).join('');
        }
      } catch {
        membersRows = '';
      }
    }

    body = `
      <div class="police-header">
        <div class="police-logo">
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="84" height="84">
            <defs>
              <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#1e3a8a"/>
                <stop offset="100%" stop-color="#0f172a"/>
              </linearGradient>
            </defs>
            <path d="M50 5 L85 20 L85 50 Q85 75 50 95 Q15 75 15 50 L15 20 Z" fill="url(#shieldGrad)" stroke="#dc2626" stroke-width="2.5"/>
            <circle cx="50" cy="42" r="18" fill="#fef3c7" stroke="#dc2626" stroke-width="1.5"/>
            <text x="50" y="49" text-anchor="middle" font-size="16" font-weight="bold" fill="#7f1d1d" font-family="Arial">BP</text>
            <path d="M30 65 L50 58 L70 65 L70 75 L50 82 L30 75 Z" fill="#dc2626"/>
            <text x="50" y="76" text-anchor="middle" font-size="9" font-weight="bold" fill="#ffffff" font-family="sans-serif">পুলিশ</text>
          </svg>
        </div>
        <div class="police-title">
          <div style="font-size:12px;font-weight:bold;color:#047857;letter-spacing:1px;margin-bottom:2px;">গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</div>
          <h1>বাংলাদেশ পুলিশ</h1>
          <h2>BANGLADESH POLICE</h2>
          <p class="subtitle">সিটিজেন ইনফরমেশন ম্যানেজমেন্ট সিস্টেম (CIMS) • ঢাকা মেট্রোপলিটন পুলিশ</p>
          <p class="form-type">ভাড়াটিয়া তথ্য নিবন্ধন ফরম / TENANT INFORMATION REGISTRATION FORM</p>
        </div>
        <div class="photo-and-id" style="display:flex;flex-direction:column;align-items:center;gap:6px;">
          ${v.photoUrl ? `
            <div style="width:96px;height:115px;border:1.5px solid #1e3a8a;border-radius:4px;overflow:hidden;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
              <img src="${v.photoUrl}" style="width:100%;height:100%;object-fit:cover;" alt="Tenant Photo" />
            </div>
          ` : `
            <div style="width:96px;height:115px;border:1.5px dashed #94a3b8;border-radius:4px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:4px;background:#f8fafc;">
              <span style="font-size:18px;">📷</span>
              <span style="font-size:9px;color:#64748b;line-height:1.2;margin-top:4px;">১ কপি পাসপোর্ট সাইজ ছবি</span>
            </div>
          `}
          <div class="form-id-box" style="text-align:center;border-left:none;padding-left:0;margin-top:2px;">
            <p style="margin:0;font-size:9px;color:#666;">ফরম ট্র্যাকিং নং</p>
            <p class="form-id" style="margin:1px 0;font-size:11px;">DMP/CIMS-${String(doc.id).slice(-8)}</p>
            <p class="form-date" style="margin:0;font-size:9px;">তারিখ: ${today}</p>
          </div>
        </div>
      </div>

      <div class="police-notice">
        <p><strong>আইনানুগ বিজ্ঞপ্তি:</strong> এই ফরমটি বাংলাদেশ পুলিশের নিরাপত্তা ও ভাড়াটিয়া তথ্য ভেরিফিকেশনের (CIMS) জন্য ব্যবহৃত হবে। সকল তথ্য নির্ভুল ও সঠিকভাবে পূরণ করা আবশ্যক।</p>
      </div>

      <h3>১. ভাড়াটিয়ার সাধারণ ও ব্যক্তিগত তথ্য / PERSONAL INFORMATION</h3>
      <table class="info">
        <tr>
          <td class="label">পূর্ণ নাম (বাংলায়)</td>
          <td><strong>${v.applicantName || '—'}</strong></td>
          <td class="label">Name (English Block)</td>
          <td><strong>${v.applicantNameEn || '—'}</strong></td>
        </tr>
        <tr>
          <td class="label">পিতার নাম ও ফোন</td>
          <td>${v.fatherName || '—'} ${v.fatherPhone ? `(মোবাইল: ${v.fatherPhone})` : ''} ${v.fatherNid ? `(NID: ${v.fatherNid})` : ''}</td>
          <td class="label">মাতার নাম ও ফোন</td>
          <td>${v.motherName || '—'} ${v.motherPhone ? `(মোবাইল: ${v.motherPhone})` : ''}</td>
        </tr>
        <tr>
          <td class="label">বৈবাহিক অবস্থা</td>
          <td>${v.maritalStatus || '—'} ${v.spouseName ? `(স্ত্রী/স্বামী: ${v.spouseName} ${v.spousePhone ? `• ফোন: ${v.spousePhone}` : ''})` : ''}</td>
          <td class="label">জন্ম তারিখ ও লিঙ্গ</td>
          <td>${v.dateOfBirth || '—'} • ${v.gender || '—'}</td>
        </tr>
        <tr>
          <td class="label">ধর্ম / Religion</td>
          <td>${v.religion || '—'}</td>
          <td class="label">রক্তের গ্রুপ</td>
          <td><strong>${v.bloodGroup || '—'}</strong></td>
        </tr>
        <tr>
          <td class="label">শিক্ষাগত যোগ্যতা</td>
          <td>${v.education || '—'} ${v.educationalInstitute ? `(${v.educationalInstitute})` : ''}</td>
          <td class="label">রুম নম্বর / ফ্ল্যাট</td>
          <td><strong>${v.roomNumber || doc.room || '—'}</strong></td>
        </tr>
        <tr>
          <td class="label">জাতীয় পরিচয়পত্র (NID)</td>
          <td><strong style="color:#1e3a8a;font-size:14px;">${v.nid || '—'}</strong></td>
          <td class="label">জন্ম নিবন্ধন নম্বর</td>
          <td>${v.birthCertNo || '—'}</td>
        </tr>
        <tr>
          <td class="label">পাসপোর্ট নম্বর ও মেয়াদ</td>
          <td>${v.passportNo ? `${v.passportNo} ${v.passportExpiry ? `(মেয়াদ: ${v.passportExpiry})` : ''}` : '—'}</td>
          <td class="label">টিআইএন (TIN No)</td>
          <td>${v.tinNo || '—'}</td>
        </tr>
      </table>

      <h3>২. পেশা ও কর্মস্থলের বিবরণ / OCCUPATION & WORKPLACE</h3>
      <table class="info">
        <tr>
          <td class="label">পেশা ও ধরন</td>
          <td><strong>${v.occupation || '—'}</strong> ${v.occupationType ? `[${v.occupationType}]` : ''}</td>
          <td class="label">পদবী / Designation</td>
          <td>${v.designation || '—'}</td>
        </tr>
        <tr>
          <td class="label">প্রতিষ্ঠান / অফিসের নাম</td>
          <td>${v.organization || '—'}</td>
          <td class="label">অফিস আইডি কার্ড নং</td>
          <td><strong>${v.employeeIdNo || '—'}</strong></td>
        </tr>
        <tr>
          <td class="label">কর্মস্থলের পূর্ণ ঠিকানা</td>
          <td colspan="3">${v.workAddress || '—'}</td>
        </tr>
        <tr>
          <td class="label">অফিসের ফোন নম্বর</td>
          <td>${v.workPhone || '—'}</td>
          <td class="label">মাসিক আনুমানিক আয়</td>
          <td>${v.monthlyIncome ? '৳ ' + v.monthlyIncome : '—'}</td>
        </tr>
      </table>

      <h3>৩. যোগাযোগের বিবরণ ও ঠিকানা / CONTACT & ADDRESS DETAILS</h3>
      <table class="info">
        <tr>
          <td class="label">মোবাইল নম্বর</td>
          <td><strong style="color:#047857;font-size:14px;">${v.phone || '—'}</strong></td>
          <td class="label">বিকল্প মোবাইল নম্বর</td>
          <td>${v.altPhone || '—'}</td>
        </tr>
        <tr>
          <td class="label">ইমেইল ঠিকানা</td>
          <td colspan="3">${v.email || '—'}</td>
        </tr>
        <tr>
          <td class="label" style="background:#e2e8f0;font-weight:bold;" colspan="4">স্থায়ী ঠিকানা (Permanent Address)</td>
        </tr>
        <tr>
          <td class="label">বাড়ি/হোল্ডিং ও রোড নং</td>
          <td>${v.permanentHolding ? `হোল্ডিং: ${v.permanentHolding}, ` : ''}${v.permanentRoad ? `রোড: ${v.permanentRoad}, ` : ''}${v.permanentVillage || v.permanentAddress || '—'}</td>
          <td class="label">ডাকঘর ও পোস্ট কোড</td>
          <td>${v.permanentPost || '—'} ${v.permanentPostCode ? `(${v.permanentPostCode})` : ''}</td>
        </tr>
        <tr>
          <td class="label">থানা / উপজেলা</td>
          <td><strong>${v.permanentThana || '—'}</strong></td>
          <td class="label">জেলা</td>
          <td><strong>${v.permanentDistrict || '—'}</strong></td>
        </tr>
        <tr>
          <td class="label" style="background:#e2e8f0;font-weight:bold;" colspan="4">বর্তমান ফ্ল্যাট ও পুলিশ অধিক্ষেত্র (Present Flat & Police Jurisdiction)</td>
        </tr>
        <tr>
          <td class="label">বাসা/হোল্ডিং, রোড ও তলা</td>
          <td>${v.presentAddress || v.flatAddress || '—'} ${v.presentFloor ? `(তলা: ${v.presentFloor})` : ''}</td>
          <td class="label">বর্তমান থানা ও জেলা</td>
          <td>${v.presentThana || 'মিরপুর'}, ${v.presentDistrict || 'ঢাকা'}</td>
        </tr>
        <tr>
          <td class="label">সংশ্লিষ্ট পুলিশ ফাঁড়ি</td>
          <td>${v.presentPoliceOutpost || '—'}</td>
          <td class="label">বিট নং ও কর্মকর্তা</td>
          <td>${v.presentBeatNo ? `বিট নং: ${v.presentBeatNo}` : '—'} ${v.presentBeatOfficer ? `(${v.presentBeatOfficer})` : ''}</td>
        </tr>
      </table>

      <h3>৪. জরুরি যোগাযোগের বিবরণ / EMERGENCY CONTACT</h3>
      <table class="info">
        <tr>
          <td class="label">জরুরি ব্যক্তির নাম ও সম্পর্ক</td>
          <td><strong>${v.emergencyName || '—'}</strong> ${v.emergencyRelation ? `(${v.emergencyRelation})` : ''}</td>
          <td class="label">মোবাইল নম্বর</td>
          <td><strong style="color:#b91c1c;">${v.emergencyPhone || '—'}</strong> ${v.emergencyAltPhone ? `• ${v.emergencyAltPhone}` : ''}</td>
        </tr>
        <tr>
          <td class="label">জরুরি ব্যক্তির NID</td>
          <td>${v.emergencyNid || '—'}</td>
          <td class="label">জরুরি ব্যক্তির ঠিকানা</td>
          <td>${v.emergencyAddress || '—'}</td>
        </tr>
      </table>

      <h3>৫. পরিবারভুক্ত সদস্য / সহ-বসবাসকারী ও রুমমেটের তালিকা / CO-RESIDENTS & ROOMMATES</h3>
      ${membersRows ? `
        <table class="info" style="margin-bottom:15px;">
          <thead>
            <tr style="background:#f1f5f9;font-weight:bold;">
              <td style="text-align:center;width:40px;">ক্র.</td>
              <td>নাম</td>
              <td style="text-align:center;">বয়স</td>
              <td>সম্পর্ক</td>
              <td>পেশা / প্রতিষ্ঠান</td>
              <td>মোবাইল / NID নম্বর</td>
            </tr>
          </thead>
          <tbody>
            ${membersRows}
          </tbody>
        </table>
      ` : v.familyMembersList ? `
        <div style="padding:10px 14px;border:1px solid #cbd5e1;background:#fff;border-radius:4px;font-size:12px;margin-bottom:15px;">
          ${v.familyMembersList}
        </div>
      ` : `
        <table class="info" style="margin-bottom:15px;">
          <tr style="background:#f1f5f9;font-weight:bold;">
            <td style="text-align:center;width:40px;">ক্র.</td>
            <td>নাম</td>
            <td style="text-align:center;">বয়স</td>
            <td>সম্পর্ক</td>
            <td>পেশা</td>
            <td>মোবাইল / NID</td>
          </tr>
          <tr><td style="text-align:center;">১</td><td>—</td><td style="text-align:center;">—</td><td>—</td><td>—</td><td>—</td></tr>
          <tr><td style="text-align:center;">২</td><td>—</td><td style="text-align:center;">—</td><td>—</td><td>—</td><td>—</td></tr>
        </table>
      `}

      <h3>৬. যানবাহন ও পার্কিং বিবরণী / VEHICLE & PARKING DETAILS</h3>
      <table class="info">
        <tr>
          <td class="label">যানবাহনের মালিকানা</td>
          <td>${v.hasVehicle === 'হ্যাঁ' || v.vehicleRegNo ? 'হ্যাঁ' : 'নেই / প্রযোজ্য নয়'}</td>
          <td class="label">যানবাহনের ধরন</td>
          <td>${v.vehicleType || '—'}</td>
        </tr>
        <tr>
          <td class="label">গাড়ির রেজিস্ট্রেশন নম্বর</td>
          <td><strong>${v.vehicleRegNo || '—'}</strong></td>
          <td class="label">ড্রাইভিং লাইসেন্স নং ও পার্কিং স্লট</td>
          <td>${v.drivingLicenseNo ? `লাইসেন্স: ${v.drivingLicenseNo}` : ''} ${v.parkingSlot ? `• পার্কিং স্লট: ${v.parkingSlot}` : ''}</td>
        </tr>
      </table>

      <h3>৭. গৃহকর্মী (কাজের লোক) ও ড্রাইভারের তথ্য / DOMESTIC HELP & DRIVER</h3>
      <table class="info">
        <tr>
          <td class="label">কাজের লোক/গৃহকর্মীর নাম</td>
          <td>${v.maidName || 'প্রযোজ্য নয়'}</td>
          <td class="label">গৃহকর্মীর মোবাইল ও NID</td>
          <td>${v.maidPhone || v.maidNid ? `${v.maidPhone || ''} ${v.maidNid ? `(NID: ${v.maidNid})` : ''}` : '—'}</td>
        </tr>
        <tr>
          <td class="label">গৃহকর্মীর স্থায়ী ঠিকানা</td>
          <td colspan="3">${v.maidAddress || '—'}</td>
        </tr>
        <tr>
          <td class="label">ড্রাইভারের নাম</td>
          <td>${v.driverName || 'প্রযোজ্য নয়'}</td>
          <td class="label">ড্রাইভারের ফোন ও লাইসেন্স নং</td>
          <td>${v.driverPhone || v.driverLicense ? `${v.driverPhone || ''} ${v.driverLicense ? `(লাইসেন্স: ${v.driverLicense})` : ''}` : '—'}</td>
        </tr>
        <tr>
          <td class="label">ড্রাইভারের NID ও ঠিকানা</td>
          <td colspan="3">${v.driverNid ? `NID: ${v.driverNid} • ` : ''}${v.driverAddress || '—'}</td>
        </tr>
      </table>

      <h3>৮. পূর্ববর্তী বাসা ও ঢাকায় স্থানীয় পরিচিত ব্যক্তি (রেফারেন্স) / REFERENCES</h3>
      <table class="info">
        <tr>
          <td class="label">পূর্ববর্তী বাড়িওয়ালার নাম</td>
          <td>${v.prevLandlordName || '—'}</td>
          <td class="label">পূর্ববর্তী বাড়িওয়ালার মোবাইল</td>
          <td>${v.prevLandlordPhone || '—'}</td>
        </tr>
        <tr>
          <td class="label">পূর্ববর্তী বাসার ঠিকানা</td>
          <td>${v.prevAddress || '—'}</td>
          <td class="label">বাসা ত্যাগের কারণ</td>
          <td>${v.leaveReason || '—'}</td>
        </tr>
        <tr>
          <td class="label">স্থানীয় পরিচিত ব্যক্তি-১ (নাম, সম্পর্ক ও পেশা)</td>
          <td><strong>${v.ref1Name || '—'}</strong> ${v.ref1Relation ? `(${v.ref1Relation})` : ''} ${v.ref1Occupation ? `• পেশা: ${v.ref1Occupation}` : ''}</td>
          <td class="label">ব্যক্তি-১ এর মোবাইল, NID ও ঠিকানা</td>
          <td>${v.ref1Phone || '—'} ${v.ref1Nid ? `(NID: ${v.ref1Nid})` : ''} ${v.ref1Address ? `• ${v.ref1Address}` : ''}</td>
        </tr>
        <tr>
          <td class="label">স্থানীয় পরিচিত ব্যক্তি-২ (নাম, সম্পর্ক ও পেশা)</td>
          <td>${v.ref2Name || '—'} ${v.ref2Relation ? `(${v.ref2Relation})` : ''} ${v.ref2Occupation ? `• পেশা: ${v.ref2Occupation}` : ''}</td>
          <td class="label">ব্যক্তি-২ এর মোবাইল, NID ও ঠিকানা</td>
          <td>${v.ref2Phone || '—'} ${v.ref2Nid ? `(NID: ${v.ref2Nid})` : ''} ${v.ref2Address ? `• ${v.ref2Address}` : ''}</td>
        </tr>
      </table>

      <h3>৯. বর্তমান বাসা ও বাড়িওয়ালার তথ্য / CURRENT FLAT & LANDLORD</h3>
      <table class="info">
        <tr>
          <td class="label">বাড়িওয়ালার নাম</td>
          <td><strong>${v.landlordName || '—'}</strong></td>
          <td class="label">বাড়িওয়ালার মোবাইল নম্বর</td>
          <td>${v.landlordPhone || '—'}</td>
        </tr>
        <tr>
          <td class="label">বাড়িওয়ালার NID</td>
          <td>${v.landlordNid || '—'}</td>
          <td class="label">বসবাসের শুরুর তারিখ</td>
          <td>${v.livingFrom || '—'}</td>
        </tr>
        <tr>
          <td class="label">বর্তমান বাসার পূর্ণ ঠিকানা</td>
          <td colspan="3">${v.flatAddress || '—'}</td>
        </tr>
      </table>

      <div class="declaration yellow" style="margin-top:15px;line-height:1.6;">
        <p><strong>আইনানুগ অঙ্গীকারনামা ও সত্যপাঠ:</strong> আমি এই মর্মে ঘোষণা করছি যে উপরোক্ত সকল তথ্য সঠিক, সম্পূর্ণ এবং সত্য। কোনো তথ্য মিথ্যা বা অসত্য প্রমাণিত হলে আমি আইনগতভাবে সম্পূর্ণ দায়ী থাকব এবং আমার বিরুদ্ধে বাংলাদেশ পুলিশ কর্তৃক ফৌজদারি বা আইনানুগ ব্যবস্থা গ্রহণ করা যাবে।</p>
      </div>

      <div class="signatures" style="margin-top:40px;display:flex;justify-content:space-between;align-items:flex-end;">
        <div class="sig" style="text-align:center;flex:1;">
          <div class="line" style="border-top:1.5px solid #333;width:180px;margin:40px auto 6px;"></div>
          <p><strong>ভাড়াটিয়ার স্বাক্ষর</strong></p>
          <p class="small">${v.applicantName || ''}</p>
          <p class="small">তারিখ: ${today}</p>
        </div>

        <div class="sig" style="text-align:center;flex:1;">
          <div class="line" style="border-top:1.5px solid #333;width:180px;margin:40px auto 6px;"></div>
          <p><strong>বাড়িওয়ালার স্বাক্ষর</strong></p>
          <p class="small">${v.landlordName || ''}</p>
          <p class="small">তারিখ: ${today}</p>
        </div>

        <div class="sig" style="text-align:center;flex:1;">
          <div style="width:140px;height:70px;border:1.5px dashed #1e3a8a;border-radius:8px;margin:0 auto 6px;display:flex;align-items:center;justify-content:center;color:#64748b;font-size:10px;">
            থানার গোল সিল ও ওসির স্বাক্ষর
          </div>
          <p><strong>সংশ্লিষ্ট পুলিশ কর্মকর্তা</strong></p>
          <p class="small">থানা: ${v.presentThana || 'ডিএমপি'}</p>
        </div>
      </div>

      <div class="police-footer" style="margin-top:30px;padding:12px;background:#f1f5f9;border-top:2px solid #1e3a8a;text-align:center;font-size:10px;color:#475569;">
        <p style="margin:2px 0;">🏛️ সিটিজেন ইনফরমেশন ম্যানেজমেন্ট সিস্টেম (CIMS) • বাংলাদেশ পুলিশ • স্বয়ংক্রিয় ডিজিটাল রেকর্ড</p>
        <p style="margin:2px 0;">ফরম আইডি: DMP-TVF-${doc.id} • প্রিন্টের সময়: ${new Date().toLocaleString('bn-BD')}</p>
      </div>
    `;
  }

  const html = `<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="UTF-8">
<title>${tpl.name}</title>
<link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;}
  body{font-family:'Hind Siliguri',Arial,sans-serif;padding:40px 50px;color:#222;max-width:800px;margin:0 auto;background:white;line-height:1.75;font-size:14px;}
  .header{text-align:center;border-bottom:3px double #333;padding-bottom:20px;margin-bottom:25px;}
  .header h1{margin:5px 0;color:#111;font-size:24px;}
  .header .sub-en{font-size:11px;color:#888;letter-spacing:2px;margin:5px 0;}
  .police-header{display:flex;align-items:center;gap:20px;padding:20px 0;border-bottom:4px double #1e3a8a;margin-bottom:20px;}
  .police-logo{flex-shrink:0;}
  .police-title{flex:1;text-align:left;}
  .police-title h1{margin:0;font-size:22px;color:#1e3a8a;letter-spacing:1px;}
  .police-title h2{margin:2px 0;font-size:12px;color:#dc2626;letter-spacing:3px;font-weight:600;}
  .police-title .subtitle{margin:4px 0 0;font-size:13px;color:#333;font-weight:600;}
  .police-title .form-type{margin:4px 0 0;font-size:11px;color:#666;letter-spacing:0.5px;font-style:italic;}
  .form-id-box{text-align:right;border-left:2px solid #dc2626;padding-left:15px;flex-shrink:0;}
  .form-id-box p{margin:2px 0;font-size:10px;color:#888;text-transform:uppercase;letter-spacing:1px;}
  .form-id-box .form-id{margin:3px 0;font-size:12px;color:#1e3a8a;font-weight:bold;font-family:monospace;}
  .form-id-box .form-date{margin:3px 0;font-size:10px;color:#333;}
  .police-notice{background:#fef3c7;border-left:4px solid #f59e0b;padding:10px 15px;border-radius:6px;font-size:12px;color:#78350f;margin-bottom:20px;}
  .police-notice p{margin:0;}
  .police-footer{margin-top:50px;padding:20px;border-top:3px double #1e3a8a;text-align:center;font-size:11px;color:#555;background:#f8fafc;border-radius:6px;}
  .intro{margin:20px 0;text-align:justify;}
  h3{color:#1e40af;font-size:14px;border-bottom:2px solid #1e40af;padding-bottom:6px;margin-top:22px;margin-bottom:12px;letter-spacing:0.3px;}
  table.info{width:100%;border-collapse:collapse;margin-bottom:15px;}
  table.info td{padding:9px 12px;border:1px solid #cbd5e1;font-size:13px;vertical-align:top;}
  table.info td.label{background:#f1f5f9;font-weight:600;width:38%;color:#334155;}
  ol.terms{padding-left:22px;margin:15px 0;}
  ol.terms>li{margin-bottom:10px;text-align:justify;}
  ol.terms ul.sub{padding-left:18px;margin-top:5px;font-size:13px;}
  ol.terms ul.sub li{margin-bottom:4px;}
  .declaration{margin:20px 0;padding:15px;background:#fef3c7;border-left:4px solid #f59e0b;font-size:13px;border-radius:6px;text-align:justify;}
  .declaration.green{background:#dcfce7;border-left-color:#16a34a;}
  .declaration.yellow{background:#fef3c7;border-left-color:#f59e0b;}
  .notice-date{text-align:right;font-size:13px;margin-bottom:20px;}
  .recipient,.sender{margin:15px 0;padding:12px;background:#f9f9fc;border-radius:8px;font-size:13px;}
  .recipient p,.sender p{margin:3px 0;}
  .subject{margin:20px 0;font-size:14px;}
  .reason-box{margin:20px 0;padding:15px;background:#fee2e2;border-left:4px solid #dc2626;border-radius:6px;font-size:13px;}
  .warning-box{margin:20px 0;padding:15px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:6px;font-size:13px;text-align:justify;}
  .signatures{display:flex;justify-content:space-between;margin-top:60px;gap:30px;}
  .signatures.single{justify-content:flex-end;}
  .sig{text-align:center;flex:1;max-width:250px;}
  .sig .line{border-top:1.5px solid #333;margin-top:60px;margin-bottom:8px;}
  .sig p{margin:3px 0;font-size:12px;}
  .sig .small{font-size:11px;color:#666;}
  .footer{margin-top:60px;padding-top:20px;border-top:1px solid #ddd;text-align:center;font-size:11px;color:#888;}
  @media print{
    body{padding:20px 30px;}
    .no-print{display:none !important;}
    h3{page-break-after:avoid;}
    .signatures{page-break-inside:avoid;}
    .police-header{page-break-after:avoid;}
  }
</style>
</head>
<body>
${body}
<div class="no-print" style="text-align:center;margin-top:40px;">
  <button onclick="window.print()" style="background:#1e40af;color:white;border:none;padding:14px 36px;border-radius:10px;cursor:pointer;font-weight:bold;font-family:inherit;font-size:15px;">🖨️ প্রিন্ট / PDF সেভ করুন</button>
  <button onclick="window.close()" style="background:#e5e7eb;color:#222;border:none;padding:14px 36px;border-radius:10px;cursor:pointer;margin-left:10px;font-family:inherit;font-size:15px;">বন্ধ করুন</button>
</div>
</body>
</html>`;

  openPrintDocument(html);
}

export function printTenantProfile(
  tenant: Tenant,
  room: { name: string; type?: string; rent?: number } | undefined,
  flatInfo: FlatInfo,
  roommates: Tenant[] = []
) {
  const roomRent = Number(room?.rent) || 0;
  const totalOccupants = roommates.length > 0 ? roommates.length : 1;
  const autoSplitRent = Math.round(roomRent / totalOccupants);

  const roommatesHtml = roommates.length > 1 ? `
    <div style="margin-top:15px; background:#f1f5f9; padding:12px; border-radius:8px;">
      <h4 style="margin:0 0 8px; font-size:13px; color:#1e293b;">👥 রুমমেট তালিকা (${toBn(roommates.length)} জন):</h4>
      <ul style="margin:0; padding-left:20px; font-size:12px; color:#475569;">
        ${roommates.map(r => `<li><strong>${r.name}</strong> (${r.phone}) — নির্ধারিত অটো-স্প্লিট ভাড়া: ৳ ${toBn(r.rent || autoSplitRent)}</li>`).join('')}
      </ul>
    </div>
  ` : '';

  const html = `<!DOCTYPE html><html lang="bn"><head><meta charset="UTF-8"><title>ভাড়াটিয়া পরিচিতি — ${tenant.name}</title>
  <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Hind Siliguri', sans-serif; padding: 30px; color: #1e293b; max-width: 800px; margin: 0 auto; background: white; }
    .header { border-bottom: 2px solid #6366f1; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
    .logo { font-size: 20px; font-weight: bold; color: #6366f1; }
    .card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px; background: #fff; }
    .title { font-size: 16px; font-weight: bold; color: #4338ca; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
    td.lbl { width: 35%; color: #64748b; font-weight: 600; }
    .highlight { background: #fdf4ff; border-left: 4px solid #c084fc; padding: 12px; border-radius: 6px; margin: 15px 0; }
    @media print { .no-print { display: none !important; } body { padding: 15px; } }
  </style></head><body>
    <div class="header">
      <div>
        <div class="logo">🏠 ${flatInfo.name}</div>
        <p style="margin:4px 0 0; font-size:12px; color:#64748b;">${flatInfo.address || 'ঢাকা, বাংলাদেশ'}</p>
      </div>
      <div style="text-align:right;">
        <h3 style="margin:0; color:#333; font-size:16px;">ভাড়াটিয়া পরিচিতি পত্র</h3>
        <p style="margin:2px 0 0; font-size:11px; color:#64748b;">তারিখ: ${new Date().toLocaleDateString('bn-BD')}</p>
      </div>
    </div>

    <div class="card">
      <div class="title">👤 ব্যক্তিগত ও সনাক্তকরণ তথ্য</div>
      <table>
        <tr><td class="lbl">ভাড়াটিয়ার পূর্ণ নাম:</td><td><strong>${tenant.name}</strong></td></tr>
        <tr><td class="lbl">মোবাইল নম্বর:</td><td>${tenant.phone}</td></tr>
        <tr><td class="lbl">জাতীয় পরিচয়পত্র (NID):</td><td>${tenant.nid || 'তথ্য প্রদান করা হয়নি'}</td></tr>
        <tr><td class="lbl">পিতার নাম:</td><td>${tenant.fatherName || '—'}</td></tr>
        <tr><td class="lbl">মাতার নাম:</td><td>${tenant.motherName || '—'}</td></tr>
        <tr><td class="lbl">পেশা ও প্রতিষ্ঠান:</td><td>${tenant.occupation || '—'} ${tenant.workplace ? `(${tenant.workplace})` : ''}</td></tr>
        <tr><td class="lbl">জরুরি যোগাযোগ:</td><td>${tenant.emergency || '—'} ${tenant.emergencyName ? `[${tenant.emergencyName}]` : ''}</td></tr>
      </table>
    </div>

    <div class="card">
      <div class="title">🏠 রুম ও ব্যক্তি-ভিত্তিক অটো-স্প্লিট ভাড়া হিসাব</div>
      <table>
        <tr><td class="lbl">বরাদ্দকৃত রুম:</td><td><strong style="color:#0284c7;">${tenant.room}</strong> ${room?.type ? `(${room.type === 'master' ? 'মাস্টার' : room.type === 'double' ? 'ডাবল' : 'সিঙ্গেল'})` : ''}</td></tr>
        <tr><td class="lbl">রুমের মোট নির্ধারিত ভাড়া:</td><td>৳ ${toBn(roomRent)} / মাস</td></tr>
        <tr><td class="lbl">রুমমেট / সদস্য সংখ্যা:</td><td>${toBn(totalOccupants)} জন</td></tr>
        <tr><td class="lbl">ব্যক্তি প্রতি অটো-স্প্লিট ভাড়া:</td><td><strong style="color:#db2777; font-size:15px;">৳ ${toBn(tenant.rent || autoSplitRent)}</strong> (স্বয়ংক্রিয় আনুপাতিক বণ্টন)</td></tr>
        <tr><td class="lbl">সিকিউরিটি ডিপোজিট:</td><td>৳ ${toBn(Number(tenant.deposit) || 0)}</td></tr>
        <tr><td class="lbl">বসবাসের শুরুর তারিখ:</td><td>${tenant.moveIn || '—'}</td></tr>
      </table>
      ${roommatesHtml}
    </div>

    <div class="highlight">
      <strong>ঘোষণা ও অঙ্গীকার:</strong> আমি এই মর্মে প্রত্যয়ন করছি যে, ফ্ল্যাট মালিকের বিধিমালা মেনে নির্ধারিত সময়ে মাসিক অটো-স্প্লিট ভাড়া ও ইউটিলিটি পরিশোধ করতে বাধ্য থাকিব।
    </div>

    <div style="display:flex; justify-content:space-between; margin-top:50px;">
      <div style="text-align:center; width:200px; border-top:1px solid #94a3b8; padding-top:6px; font-size:12px;">ভাড়াটিয়ার স্বাক্ষর</div>
      <div style="text-align:center; width:200px; border-top:1px solid #94a3b8; padding-top:6px; font-size:12px;">বাড়িওয়ালার স্বাক্ষর</div>
    </div>

    <div class="no-print" style="text-align:center; margin-top:30px;">
      <button onclick="window.print()" style="background:#6366f1; color:white; border:none; padding:10px 24px; border-radius:8px; cursor:pointer; font-weight:bold; font-family:inherit;">🖨️ প্রিন্ট করুন</button>
      <button onclick="window.close()" style="background:#e2e8f0; color:#333; border:none; padding:10px 24px; border-radius:8px; cursor:pointer; margin-left:10px; font-family:inherit;">বন্ধ করুন</button>
    </div>
  </body></html>`;

  openPrintDocument(html);
}

export function printVisitorPass(visitor: Visitor, flatInfo: FlatInfo) {
  const isInside = !visitor.exitTime;
  const photoHtml = visitor.photo ? `
    <div style="text-align:center; margin-bottom:12px;">
      <img src="${visitor.photo}" alt="${visitor.name}" style="width:100px; height:100px; object-fit:cover; border-radius:50%; border:3px solid #6366f1; box-shadow:0 4px 10px rgba(0,0,0,0.1);" />
    </div>
  ` : '';

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>ভিজিটর পাস — ${visitor.name}</title>
  <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family:'Hind Siliguri', sans-serif; padding:24px; color:#1e293b; max-width:550px; margin:auto; background:#f8fafc; }
    .card { background:white; border-radius:16px; padding:24px; border:2px solid #e2e8f0; box-shadow:0 10px 25px -5px rgba(0,0,0,0.1); }
    .header { text-align:center; border-bottom:2px dashed #cbd5e1; padding-bottom:16px; margin-bottom:16px; }
    .badge { display:inline-block; padding:4px 12px; border-radius:9999px; font-size:12px; font-weight:bold; }
    .badge-in { background:#dcfce7; color:#15803d; border:1px solid #86efac; }
    .badge-out { background:#f1f5f9; color:#475569; border:1px solid #cbd5e1; }
    table { width:100%; border-collapse:collapse; margin-top:12px; font-size:14px; }
    td { padding:8px 6px; border-bottom:1px solid #f1f5f9; }
    td.lbl { color:#64748b; width:40%; font-weight:500; }
    td.val { font-weight:600; color:#0f172a; }
    .footer { text-align:center; margin-top:20px; font-size:11px; color:#94a3b8; border-top:1px solid #e2e8f0; padding-top:12px; }
    @media print { .no-print { display:none !important; } body { padding:0; background:white; } .card { border:1px solid #ccc; box-shadow:none; } }
  </style></head><body>
    <div class="card">
      <div class="header">
        <h2 style="margin:0; font-size:20px; color:#4338ca;">🏢 ${flatInfo.name}</h2>
        <p style="margin:2px 0 8px; font-size:12px; color:#64748b;">${flatInfo.address || 'ঢাকা, বাংলাদেশ'}</p>
        <div style="font-size:16px; font-weight:bold; color:#1e1b4b; margin-top:6px;">🪪 মেহমান / ভিজিটর পাস (Visitor Pass)</div>
        <div style="margin-top:6px;">
          <span class="badge ${isInside ? 'badge-in' : 'badge-out'}">
            ${isInside ? '🟢 বর্তমানে ফ্ল্যাটে উপস্থিত' : '⚪ প্রস্থান সম্পন্ন'}
          </span>
        </div>
      </div>

      ${photoHtml}

      <table>
        <tr><td class="lbl">ভিজিটরের নাম:</td><td class="val">${visitor.name}</td></tr>
        <tr><td class="lbl">মোবাইল নম্বর:</td><td class="val">${visitor.phone || '—'}</td></tr>
        <tr><td class="lbl">গন্তব্য রুম:</td><td class="val" style="color:#2563eb;">${visitor.room}</td></tr>
        ${visitor.hostTenantName ? `<tr><td class="lbl">মেহমানদারী সদস্য:</td><td class="val">${visitor.hostTenantName}</td></tr>` : ''}
        ${visitor.relation ? `<tr><td class="lbl">সম্পর্ক / ধরন:</td><td class="val">${visitor.relation}</td></tr>` : ''}
        <tr><td class="lbl">আগমনের উদ্দেশ্য:</td><td class="val">${visitor.purpose || 'সাধারণ ভিজিট'}</td></tr>
        ${visitor.nidOrId ? `<tr><td class="lbl">এনআইডি / আইডি নম্বর:</td><td class="val font-mono">${visitor.nidOrId}</td></tr>` : ''}
        ${visitor.address ? `<tr><td class="lbl">ঠিকানা / এলাকা:</td><td class="val">${visitor.address}</td></tr>` : ''}
        <tr><td class="lbl">প্রবেশের সময়:</td><td class="val" style="color:#16a34a;">${visitor.entryDate ? visitor.entryDate + ' ' : ''}${visitor.entryTime}</td></tr>
        <tr><td class="lbl">প্রস্থানের সময়:</td><td class="val">${visitor.exitTime || (visitor.expectedExitTime ? `(সম্ভাব্য: ${visitor.expectedExitTime})` : 'এখনও অবস্থান করছেন')}</td></tr>
        ${visitor.notes ? `<tr><td class="lbl">বিশেষ মন্তব্য:</td><td class="val">${visitor.notes}</td></tr>` : ''}
      </table>

      <div class="footer">
        <p style="margin:0;">পাস আইডি: #${visitor.id} • তৈরি: ${new Date().toLocaleDateString('bn-BD')}</p>
        <p style="margin:3px 0 0;">নিরাপত্তার স্বার্থে ফ্ল্যাটে প্রবেশের সময় পরিচয়পত্র প্রদর্শন করুন।</p>
      </div>
    </div>

    <div class="no-print" style="text-align:center; margin-top:20px;">
      <button onclick="window.print()" style="background:#4f46e5; color:white; border:none; padding:10px 24px; border-radius:8px; cursor:pointer; font-weight:bold; font-family:inherit;">🖨️ প্রিন্ট করুন</button>
      <button onclick="window.close()" style="background:#e2e8f0; color:#333; border:none; padding:10px 20px; border-radius:8px; cursor:pointer; margin-left:10px; font-family:inherit;">বন্ধ করুন</button>
    </div>
  </body></html>`;

  openPrintDocument(html);
}

