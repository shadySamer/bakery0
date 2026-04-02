import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Reports = ({ records = [], utilityExpenses = [], fixedExpenses = [], isMobile, onActivityClick }) => {
  const [rangeType, setRangeType] = useState('today');
  const [customRange, setCustomRange] = useState({ 
    start: new Date().toISOString().split('T')[0], 
    end: new Date().toISOString().split('T')[0] 
  });

  const getFilteredRange = () => {
    let start, end = new Date();
    
    if (rangeType === 'today') {
      start = new Date();
      start.setHours(0, 0, 0, 0);
      end = new Date();
      end.setHours(23, 59, 59, 999);
    } else if (rangeType === 'weekly') {
      start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } else if (rangeType === 'monthly') {
      start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    } else if (rangeType === 'yearly') {
      start = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    } else if (rangeType === 'all') {
      start = new Date(0); // Beginning of time
    } else {
      start = new Date(customRange.start);
      start.setHours(0, 0, 0, 0);
      end = new Date(customRange.end);
      end.setHours(23, 59, 59, 999);
    }
    return { start, end };
  };

  const getFilteredData = () => {
    const { start, end } = getFilteredRange();

    const filteredRecords = records.filter(r => {
      const d = new Date(r.date);
      return d >= start && d <= end;
    });

    const filteredUtilities = utilityExpenses.filter(e => {
      const d = new Date(e.date);
      return d >= start && d <= end;
    });

    return { filteredRecords, filteredUtilities };
  };

  const { filteredRecords, filteredUtilities } = getFilteredData();

  // Quantities
  const totalSacks = filteredRecords.reduce((acc, r) => acc + (r.sacks || 0), 0);
  const totalWaste = filteredRecords.reduce((acc, r) => acc + (Number(r.wasteCount) || 0), 0);
  
  // Revenues
  const totalCashRevenue = filteredRecords.reduce((acc, r) => acc + (r.revenue || 0), 0);
  const totalCreditSales = filteredRecords.reduce((acc, r) => {
    if (!r.creditSales) return acc;
    if (Array.isArray(r.creditSales)) {
      return acc + r.creditSales.reduce((s, e) => s + (e.totalAmount || e.amount || 0), 0);
    }
    return acc + (r.creditSales.amount || 0);
  }, 0);
  const totalRevenue = totalCashRevenue + totalCreditSales;

  // Breakdown of Shift Costs
  const totalFlourCost = filteredRecords.reduce((acc, r) => acc + (r.flourCost || 0), 0);
  const totalWorkerCost = filteredRecords.reduce((acc, r) => acc + (r.workerCost || r.totalWorkerCost || 0), 0);
  const totalAdvances = filteredRecords.reduce((acc, r) => acc + (r.totalAdvances || 0), 0);
  const totalCylinderCost = filteredRecords.reduce((acc, r) => acc + (r.gasCost || r.cylinderCost || 0), 0);
  const totalCustomItemsCost = filteredRecords.reduce((acc, r) => acc + (r.otherMaterialsCost || r.customItemsCost || 0), 0);
  
  // Operational general costs
  const shiftUtilitiesCost = filteredRecords.reduce((acc, r) => {
    return acc + (r.shiftUtilities || []).reduce((uAcc, u) => uAcc + u.amount, 0);
  }, 0);
  const shiftDeductedRent = filteredRecords.reduce((acc, r) => acc + (r.totalDeductedRent || 0), 0); // Kept for older records mapping if needed
  const totalUtilityCosts = filteredUtilities.reduce((acc, e) => acc + (e.amount || 0), 0);
  
  const totalShiftCosts = totalFlourCost + totalWorkerCost + totalCylinderCost + totalCustomItemsCost;
  
  const totalExpenses = totalShiftCosts + totalUtilityCosts + shiftUtilitiesCost + shiftDeductedRent;
  
  const totalOperatingProfit = filteredRecords.reduce((acc, r) => acc + (r.profit || 0), 0);
  const netProfit = totalOperatingProfit - totalUtilityCosts;
  const avgProfitPerSack = totalSacks > 0 ? netProfit / totalSacks : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header className="card glass">
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', gap: '1.5rem' }}>
          <div>
            <h3 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>التقارير المالية والإنتاجية</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>اختر الفترة الزمنية لعرض ملخص الأداء.</p>
          </div>
          <div style={{ 
            display: 'flex', 
            gap: '0.4rem', 
            backgroundColor: 'rgba(146, 64, 14, 0.05)', 
            padding: '0.4rem', 
            borderRadius: '16px',
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch'
          }} className="no-scrollbar">
             {['today', 'weekly', 'monthly', 'yearly', 'all', 'custom'].map((type) => (
               <button 
                 key={type}
                 onClick={() => setRangeType(type)}
                 style={{ 
                   padding: '0.7rem 1.2rem', 
                   borderRadius: '12px', 
                   border: 'none', 
                   cursor: 'pointer', 
                   backgroundColor: rangeType === type ? 'white' : 'transparent', 
                   fontWeight: 800,
                   fontSize: '0.85rem',
                   color: rangeType === type ? 'var(--primary)' : 'var(--text-muted)',
                   boxShadow: rangeType === type ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                   transition: 'all 0.2s',
                   flexShrink: 0
                 }}
               >
                 {type === 'today' ? 'اليوم' : type === 'weekly' ? 'أسبوعي' : type === 'monthly' ? 'شهري' : type === 'yearly' ? 'سنوي' : type === 'all' ? 'الكل' : 'مخصص'}
               </button>
             ))}
          </div>
        </div>

        <AnimatePresence>
          {rangeType === 'custom' && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ 
                marginTop: '1.5rem', 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row',
                gap: '1rem', 
                alignItems: isMobile ? 'stretch' : 'end', 
                borderTop: '1px solid #eee', 
                paddingTop: '1.5rem' 
              }}
            >
              <div style={{ flex: 1 }}>
                 <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', fontWeight: 700 }}>من تاريخ</label>
                 <input type="date" value={customRange.start} onChange={e => setCustomRange({...customRange, start: e.target.value})} className="input-field" />
              </div>
              <div style={{ flex: 1 }}>
                 <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', fontWeight: 700 }}>إلى تاريخ</label>
                 <input type="date" value={customRange.end} onChange={e => setCustomRange({...customRange, end: e.target.value})} className="input-field" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Financial Summary Grid */}
      <div className="responsive-grid" style={{ gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <div className="card glass" style={{ borderRight: '6px solid var(--success)', background: 'linear-gradient(to left, white, rgba(21, 128, 61, 0.02))', padding: isMobile ? '1.2rem' : '1.5rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>صافي الربح النهائي للفرن 💰</p>
          <h2 style={{ fontSize: isMobile ? '1.6rem' : '2.2rem', color: 'var(--success)', fontWeight: 900, wordBreak: 'break-all' }}>{Math.round(netProfit).toLocaleString()} <span style={{ fontSize: '0.9rem' }}>ج.م</span></h2>
        </div>
        <div className="card glass" style={{ borderRight: '6px solid var(--primary)', background: 'linear-gradient(to left, white, rgba(146, 64, 14, 0.02))', padding: isMobile ? '1.2rem' : '1.5rem' }}>
           <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>إجمالي أرباح التشغيل (الورديات) 📈</p>
           <h2 style={{ fontSize: isMobile ? '1.6rem' : '2.2rem', color: 'var(--primary)', fontWeight: 900, wordBreak: 'break-all' }}>{Math.round(totalOperatingProfit).toLocaleString()} <span style={{ fontSize: '0.9rem' }}>ج.م</span></h2>
        </div>
        <div className="card glass" style={{ borderRight: '6px solid var(--danger)', background: 'linear-gradient(to left, white, rgba(185, 28, 28, 0.02))', padding: isMobile ? '1.2rem' : '1.5rem' }}>
           <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>إجمالي المصاريف 📉</p>
           <h2 style={{ fontSize: isMobile ? '1.6rem' : '2.2rem', color: 'var(--danger)', fontWeight: 900, wordBreak: 'break-all' }}>{Math.round(totalExpenses).toLocaleString()} <span style={{ fontSize: '0.9rem' }}>ج.م</span></h2>
        </div>
        <div className="card glass" style={{ borderRight: '6px solid var(--warning)', background: 'linear-gradient(to left, white, rgba(217, 119, 6, 0.02))', padding: isMobile ? '1.2rem' : '1.5rem' }}>
           <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>متوسط ربح الشوال 🥖</p>
           <h2 style={{ fontSize: isMobile ? '1.6rem' : '2.2rem', color: 'var(--warning)', fontWeight: 900, wordBreak: 'break-all' }}>{Math.round(avgProfitPerSack).toLocaleString()} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>ج.م/ش</span></h2>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card glass" style={{ width: '100%', padding: isMobile ? '1.2rem' : '1.5rem' }}>
          <h4 style={{ marginBottom: '1.5rem', color: 'var(--primary)', fontWeight: 800 }}>تفصيل الإنتاج والمبيعات بنداً بنداً</h4>
          <div style={{ padding: isMobile ? '1rem' : '1.5rem', backgroundColor: '#f8fafc', borderRadius: '16px' }}>

            {/* الإيرادات والإنتاج */}
            <h5 style={{ color: 'var(--success)', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>الإيرادات والإنتاج</h5>
            {[
              { label: 'إجمالي الأجولة المخبوزة:', value: `${totalSacks} شوال` },
              { label: 'إجمالي الهالك المسجل:', value: `${totalWaste} رغيف`, color: 'var(--warning)', show: totalWaste > 0 },
              { label: 'النقدية المستلمة (كاش):', value: `${Math.round(totalCashRevenue).toLocaleString()} ج.م` },
              { label: 'المبيعات الآجلة (مسحوبات العملاء):', value: `${Math.round(totalCreditSales).toLocaleString()} ج.م` }
            ].map((item, idx) => (item.show !== false && (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.8rem', fontSize: isMobile ? '0.88rem' : '0.95rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{item.label}</span> 
                <span style={{ fontWeight: 800, color: item.color || 'inherit' }}>{item.value}</span>
              </div>
            )))}

            {/* تفاصيل تكاليف الورديات المباشرة */}
            <h5 style={{ color: 'var(--danger)', marginTop: '1.5rem', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>التكاليف المباشرة للورديات</h5>
            {[
              { label: 'تكلفة سحب الدقيق:', value: `${Math.round(totalFlourCost).toLocaleString()} ج.م` },
              { label: 'أجور العمال (الصافي المدفوع):', value: `${Math.round(totalWorkerCost).toLocaleString()} ج.م` },
              { label: 'السلف المخصومة من العمال:', value: `${Math.round(totalAdvances).toLocaleString()} ج.م`, show: totalAdvances > 0 },
              { label: 'تكلفة استهلاك الغاز (أنابيب):', value: `${Math.round(totalCylinderCost).toLocaleString()} ج.م` },
              { label: 'تكاليف إضافية (مواصلات وغيرها):', value: `${Math.round(totalCustomItemsCost).toLocaleString()} ج.م` }
            ].map((item, idx) => (item.show !== false && (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.8rem', fontSize: isMobile ? '0.88rem' : '0.95rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{item.label}</span> 
                <span style={{ fontWeight: 800 }}>{item.value}</span>
              </div>
            )))}

            {/* المصاريف العامة والخدمات */}
            <h5 style={{ color: 'var(--warning)', marginTop: '1.5rem', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>نثريات ومصاريف عامة</h5>
            {[
              { label: 'نثريات وريدية (سُحبت من الدرج):', value: `${Math.round(shiftUtilitiesCost).toLocaleString()} ج.م` },
              { label: 'إيجار مخصوم من الورديات القديمة:', value: `${Math.round(shiftDeductedRent).toLocaleString()} ج.م`, show: shiftDeductedRent > 0 },
              { label: 'فواتير خارجية وإيجار مدفوع بشكل عام:', value: `${Math.round(totalUtilityCosts).toLocaleString()} ج.م` }
            ].map((item, idx) => (item.show !== false && (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.8rem', fontSize: isMobile ? '0.88rem' : '0.95rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{item.label}</span> 
                <span style={{ fontWeight: 800 }}>{item.value}</span>
              </div>
            )))}

            {/* الملخص النهائي */}
            <div style={{ marginTop: '2rem', background: '#fff', borderRadius: '12px', padding: '1rem', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 900 }}>
                 <span>إجمالي المصروفات المجمعة:</span>
                 <span style={{ color: 'var(--danger)' }}>{Math.round(totalExpenses).toLocaleString()} ج.م</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card glass" style={{ width: '100%', padding: isMobile ? '1.2rem' : '1.5rem' }}>
          <h4 style={{ marginBottom: '1.5rem', fontWeight: 800 }}>سجل العمليات ({filteredRecords.length + filteredUtilities.length})</h4>
          <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem', padding: '0.2rem' }}>
             {[
               ...filteredRecords.map(r => ({ ...r, type: 'shift' })),
               ...filteredUtilities.map(u => ({ ...u, type: 'utility' }))
             ].sort((a, b) => new Date(b.date) - new Date(a.date)).map((op, i) => (
               <div 
                 key={i} 
                 onClick={() => onActivityClick({ ...op, activityType: op.type === 'shift' ? 'shift' : 'utility' })}
                 style={{ 
                   padding: '1rem', 
                   backgroundColor: op.type === 'shift' ? 'white' : '#fef2f2', 
                   borderRadius: '12px', 
                   border: '1px solid #eee', 
                   display: 'flex', 
                   justifyContent: 'space-between', 
                   alignItems: 'center',
                   cursor: 'pointer',
                   boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                 }}
               >
                 <div style={{ flex: 1, minWidth: 0, paddingLeft: '0.5rem' }}>
                   <div style={{ fontSize: isMobile ? '0.85rem' : '0.95rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                     {op.type === 'shift' ? `${op.sacks} شوال (${op.shift === 'morning' ? 'صباحي' : op.shift === 'evening' ? 'مسائي' : op.shift})` : (op.type === 'cylinder_usage' ? 'استهلاك غاز' : op.type === 'fixed_payment' ? `دفع إيجار/سداد` : op.name || 'مصروف عام')}
                   </div>
                   <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{new Date(op.date).toLocaleDateString('ar-EG', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                 </div>
                 <div style={{ fontWeight: 900, fontSize: isMobile ? '0.95rem' : '1.1rem', color: op.type === 'shift' ? (op.profit >= 0 ? 'var(--success)' : 'var(--danger)') : 'var(--danger)', whiteSpace: 'nowrap' }}>
                   {op.type === 'shift' ? `${Math.round(op.profit).toLocaleString()} ج.م` : `-${op.amount.toLocaleString()} ج.م`}
                 </div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
