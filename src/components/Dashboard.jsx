import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Receipt, History, ChevronLeft, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const StatCard = ({ title, value, unit, icon: Icon, color }) => (
  <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', flex: '1', minWidth: '200px', borderBottom: `4px solid ${color !== 'transparent' ? color : 'var(--primary)'}` }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
      <div style={{ padding: '0.8rem', backgroundColor: `${color !== 'transparent' ? color : 'var(--primary)'}15`, borderRadius: '12px', color: color !== 'transparent' ? color : 'var(--primary)' }}>
        {Icon && <Icon size={24} />}
      </div>
      <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 700 }}>{title}</h3>
    </div>
    <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
      {value} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>{unit}</span>
    </div>
  </div>
);

const Dashboard = ({ records = [], utilityExpenses = [], isMobile, onActivityClick, onAddClosedDay }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const dateObj = new Date(selectedDate);
  const dateFormatted = dateObj.toLocaleDateString('ar-EG');
  const isToday = selectedDate === new Date().toISOString().split('T')[0];
  
  // Calculate specific day totals including utilities
  const dailyRecords = (records || []).filter(r => new Date(r.date).toISOString().split('T')[0] === selectedDate);
  const dailyUtilities = (utilityExpenses || []).filter(e => new Date(e.date).toISOString().split('T')[0] === selectedDate);
  
  const dailySacks = dailyRecords.reduce((acc, r) => acc + (r.sacks || 0), 0);
  const dailyCashRevenue = dailyRecords.reduce((acc, r) => acc + (r.revenue || 0), 0);
  const dailyCreditSales = dailyRecords.reduce((acc, r) => acc + (r.creditSales ? r.creditSales.amount : 0), 0);
  const totalDailyGross = dailyCashRevenue + dailyCreditSales;

  const dailyOperationalCost = dailyRecords.reduce((acc, r) => acc + (r.totalCost || 0), 0);
  const dailyUtilityCost = dailyUtilities.reduce((acc, e) => acc + (e.amount || 0), 0);
  const totalDailyDeductedRent = dailyRecords.reduce((acc, r) => acc + (r.totalDeductedRent || 0), 0);
  const totalShiftUtilities = dailyRecords.reduce((acc, r) => acc + (r.shiftUtilities ? r.shiftUtilities.reduce((uAcc, u) => uAcc + u.amount, 0) : 0), 0);
  
  const netDailyProfit = totalDailyGross - dailyOperationalCost - dailyUtilityCost - totalDailyDeductedRent - totalShiftUtilities;
  const totalDailyExpenses = dailyOperationalCost + dailyUtilityCost + totalDailyDeductedRent + totalShiftUtilities;

  // Combine activities for the list (last 10 total)
  const allActivities = [
    ...(records || []).map(r => ({ ...r, activityType: 'shift' })),
    ...(utilityExpenses || []).map(e => ({ ...e, activityType: 'utility' }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

  // Generate 7-day chart data
  const chartData = [];
  for (let i = 6; i >= 0; i--) {
     const d = new Date();
     d.setDate(d.getDate() - i);
     const dateStr = d.toISOString().split('T')[0];
     const dayRecords = records.filter(r => new Date(r.date).toISOString().split('T')[0] === dateStr);
     const dayUtilities = utilityExpenses.filter(r => new Date(r.date).toISOString().split('T')[0] === dateStr);
     
     const cashRev = dayRecords.reduce((acc, r) => acc + (r.revenue || 0), 0);
     const crSales = dayRecords.reduce((acc, r) => acc + (r.creditSales ? r.creditSales.amount : 0), 0);
     const rev = cashRev + crSales;

     const opCost = dayRecords.reduce((acc, r) => acc + (r.totalCost || 0), 0);
     const utilCost = dayUtilities.reduce((acc, e) => acc + (e.amount || 0), 0);
     const shRent = dayRecords.reduce((acc, r) => acc + (r.totalDeductedRent || 0), 0);
     const shUtils = dayRecords.reduce((acc, r) => acc + (r.shiftUtilities ? r.shiftUtilities.reduce((uAcc, u) => uAcc + u.amount, 0) : 0), 0);

     const cost = opCost + utilCost + shRent + shUtils;
     
     chartData.push({
       name: d.toLocaleDateString('ar-EG', { weekday: 'short' }),
       'الأرباح': rev - cost,
       'المبيعات': rev
     });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Date Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
           <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-main)' }}>ملخص يوم: </h3>
           <div style={{ position: 'relative', display: 'inline-block' }}>
             <input 
               type="date" 
               value={selectedDate} 
               onChange={(e) => setSelectedDate(e.target.value)}
               id="dashboard-date-selector"
               style={{ 
                 opacity: 0, 
                 position: 'absolute', 
                 inset: 0, 
                 cursor: 'pointer',
                 width: '100%',
                 zIndex: 2
               }}
             />
             <div style={{ 
               padding: '0.4rem 1.2rem', 
               backgroundColor: 'var(--primary)', 
               color: 'white', 
               borderRadius: '12px', 
               fontSize: '0.9rem', 
               fontWeight: '800', 
               display: 'flex', 
               alignItems: 'center', 
               gap: '0.5rem',
               boxShadow: 'var(--shadow-sm)'
             }}>
               {isToday ? 'اليوم ✨' : dateFormatted} <ChevronLeft size={16} />
             </div>
           </div>
         </div>
         {isToday && onAddClosedDay && (
           <button 
             className="btn-secondary" 
             onClick={() => {
               if(window.confirm('هل أنت متأكد من إغلاق المخبز لليوم؟ سيتم خصم الإيجار اليومي كخسارة ولن تُسجل إيرادات.')) {
                 onAddClosedDay();
               }
             }}
             style={{ backgroundColor: '#fff1f2', color: 'var(--danger)', fontWeight: 'bold' }}
           >
             تسجيل يوم راحة/إغلاق 🛑
           </button>
         )}
      </div>

      <div className="responsive-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        <StatCard title="صافي الربح" value={Math.round(netDailyProfit).toLocaleString()} unit="ج.م" icon={BarChart3} color="var(--success)" />
        <StatCard title="إجمالي المصاريف" value={Math.round(totalDailyExpenses).toLocaleString()} unit="ج.م" icon={Receipt} color="var(--danger)" />
        <StatCard title="مبيعات اليوم" value={Math.round(totalDailyGross).toLocaleString()} unit="ج.م" icon={LayoutDashboard} color="var(--warning)" />
      </div>

      <div className="card glass">
        <h3 style={{ color: 'var(--primary)', fontWeight: 800, marginBottom: '1.5rem' }}>مؤشر الأرباح (آخر 7 أيام) 📈</h3>
        <div style={{ width: '100%', height: 300 }} dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4ade80" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#4ade80" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#92400e" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#92400e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                itemStyle={{ fontWeight: 'bold' }}
                formatter={(value) => [`${value} ج.م`]}
              />
              <Area type="monotone" dataKey="المبيعات" stroke="#92400e" fillOpacity={1} fill="url(#colorRevenue)" />
              <Area type="monotone" dataKey="الأرباح" stroke="#4ade80" fillOpacity={1} fill="url(#colorProfit)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card glass">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div style={{ padding: '0.5rem', backgroundColor: 'var(--primary)15', color: 'var(--primary)', borderRadius: '10px' }}>
              <History size={20} />
            </div>
            <h3 style={{ color: 'var(--primary)', fontWeight: 800 }}>آخر الأنشطة والعمليات ⚡</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>اضغط للمزيد</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {allActivities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <History size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p>لا توجد أنشطة مسجلة بعد.</p>
            </div>
          ) : (
            allActivities.map((item, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => onActivityClick(item)}
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '1.2rem', 
                  backgroundColor: item.activityType === 'utility' ? 'rgba(185, 28, 28, 0.03)' : 'white',
                  borderRadius: '16px',
                  border: '1px solid rgba(0,0,0,0.03)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  cursor: 'pointer'
                }}
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(0,0,0,0.02)' }}
              >
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ 
                    width: '44px', 
                    height: '44px', 
                    borderRadius: '12px', 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: item.activityType === 'utility' ? 'rgba(185, 28, 28, 0.1)' : (item.profit >= 0 ? 'rgba(21, 128, 61, 0.1)' : 'rgba(185, 28, 28, 0.1)'),
                    color: item.activityType === 'utility' ? 'var(--danger)' : (item.profit >= 0 ? 'var(--success)' : 'var(--danger)')
                  }}>
                    {item.activityType === 'utility' ? <Receipt size={20} /> : <LayoutDashboard size={20} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                      {item.activityType === 'utility' ? (
                        <>{item.type === 'cylinder_usage' ? 'استهلاك أنبوبة ⛽' : item.type === 'fixed_payment' ? `دفع ${item.name} 🏠` : item.type === 'other' ? (item.name || 'مصروف عام') : `دفع فواتير ${item.type === 'electricity' ? 'الكهرباء' : item.type === 'gas' ? 'الغاز' : 'المياه'}`}</>
                      ) : item.type === 'closed_day' ? (
                        <>يوم راحة / إغلاق للمخبز 🛑</>
                      ) : (
                        <>{item.shift === 'shift_1' || item.shift === 'morning' ? 'الوردية الأولى 🌅' : item.shift === 'shift_2' || item.shift === 'evening' ? 'الوردية الثانية 🌤️' : 'الوردية الثالثة 🌙'} ({item.sacks} أجولة)</>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {new Date(item.date).toLocaleDateString('ar-EG')} - {new Date(item.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 900, fontSize: '1.1rem', color: (item.activityType === 'utility' || item.profit < 0) ? 'var(--danger)' : 'var(--success)' }}>
                    {item.activityType === 'utility' ? `-${item.amount}` : Math.round(item.profit).toLocaleString()} <span style={{ fontSize: '0.7rem' }}>ج.م</span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
