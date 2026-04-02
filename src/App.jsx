import React, { useState, useEffect, useRef } from 'react';
import { Preferences } from '@capacitor/preferences';
import { 
  LayoutDashboard, 
  Users, 
  Receipt, 
  BarChart3, 
  Mic, 
  Settings,
  ChevronLeft,
  Menu,
  X,
  History,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  PlusCircle,
  Package,
  Building2,
  MoreHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

import Inventory from './components/Inventory';
import Clients from './components/Clients';
import Expenses from './components/Expenses';
import Dashboard from './components/Dashboard';
import Reports from './components/Reports';
import ExternalExpenses from './components/ExternalExpenses';

const DEFAULT_WORKERS = [];

const DEFAULT_INGREDIENTS = [
  { id: 'flour', name: 'شيكارة دقيق', unitPrice: 1200, unitName: 'شيكارة', isCore: true },
  { id: 'gas', name: 'الغاز', unitPrice: 150, unitName: 'متر / أنبوبة', isCore: true },
  { id: 'yeast', name: 'الخميرة', unitPrice: 45, unitName: 'كجم', isCore: false },
  { id: 'salt', name: 'الملح', unitPrice: 5, unitName: 'شيكارة', isCore: false },
  { id: 'bran', name: 'الردة', unitPrice: 12, unitName: 'كجم', isCore: false },
  { id: 'oil', name: 'الزيت', unitPrice: 60, unitName: 'لتر', isCore: false }
];

// Dummy Components for now
// Components
// Detailed Activity Modal Component
const ActivityDetailModal = ({ activity, onClose, onDelete, onEdit }) => {
  if (!activity) return null;

  const isUtility = activity.activityType === 'utility' || activity.sacks === undefined;
  const isClosedDay = activity.type === 'closed_day';
  const isShift = !isUtility && !isClosedDay;
  const dateStr = new Date(activity.date).toLocaleString('ar-EG', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        zIndex: 3000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        backdropFilter: 'blur(4px)'
      }}
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        style={{
          backgroundColor: 'white',
          width: '100%',
          maxWidth: '500px',
          borderRadius: '24px',
          padding: '2rem',
          position: 'relative',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', display: 'flex', gap: '0.8rem' }}>
          {isShift && (
            <button 
              onClick={() => {
                onEdit(activity);
              }}
              style={{ background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a', padding: '0.5rem 1rem', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              تعديل ✏️
            </button>
          )}
          <button 
            onClick={() => {
              if (window.confirm("هل أنت متأكد من حذف هذا السجل نهائياً؟ جميع الحسابات ستتغير بناءً على ذلك.")) {
                onDelete(activity);
              }
            }}
            style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '0.5rem 1rem', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            حذف 🗑️
          </button>
          <button 
            onClick={onClose} 
            style={{ background: '#f3f4f6', border: 'none', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            borderRadius: '20px', 
            backgroundColor: isShift ? 'var(--primary)15' : isClosedDay ? 'var(--warning)15' : 'var(--danger)15',
            color: isShift ? 'var(--primary)' : isClosedDay ? 'var(--warning)' : 'var(--danger)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            {isShift ? <LayoutDashboard size={32} /> : isClosedDay ? <History size={32} /> : <Receipt size={32} />}
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            {isShift ? (activity.shift === 'shift_1' || activity.shift === 'morning' ? 'الوردية الأولى 🌅' : activity.shift === 'shift_2' || activity.shift === 'evening' ? 'الوردية الثانية 🌤️' : 'سهرة 🌙') : isClosedDay ? 'يوم عطلة مغلق 🛑' : 'تفاصيل المصروف 💸'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>{dateStr}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {isShift ? (
            <>
              <div className="glass" style={{ padding: '1.2rem', borderRadius: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>عدد الأجولة</label>
                  <p style={{ fontWeight: 800, fontSize: '1.2rem' }}>{activity.sacks} <span style={{ fontSize: '0.8rem' }}>أجولة</span></p>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>الإيراد</label>
                  <p style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary)' }}>{activity.revenue.toLocaleString()} <span style={{ fontSize: '0.8rem' }}>ج.م</span></p>
                </div>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.8rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={16} /> طقم العمال ({activity.workers?.length || 0})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto', padding: '0.2rem' }}>
                  {activity.workers?.map(w => (
                    <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px solid #eee' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{w.name}</span>
                      <span style={{ color: 'var(--success)', fontWeight: 800, fontSize: '0.9rem' }}>{Math.round(w.type === 'commission' ? w.rate * (w.customSacks || activity.sacks) : w.rate)} ج.م</span>
                    </div>
                  ))}
                </div>
              </div>

              {activity.shiftUtilities && activity.shiftUtilities.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <h4 style={{ fontSize: '0.9rem', marginBottom: '0.8rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Receipt size={16} /> فواتير ومصروفات نقدية
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.2rem' }}>
                    {activity.shiftUtilities.map((u, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.8rem', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fee2e2' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{u.type === 'electricity' ? 'كهرباء' : u.type === 'gas' ? 'غاز' : u.type === 'water' ? 'مياه' : 'أخرى'}</span>
                        <span style={{ color: 'var(--danger)', fontWeight: 800, fontSize: '0.9rem' }}>{u.amount} ج.م</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activity.totalDeductedRent && activity.totalDeductedRent > 0 && (
                 <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', padding: '0.8rem', backgroundColor: '#fff7ed', borderRadius: '8px', border: '1px solid #ffedd5' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#ea580c' }}>إيجار اليوم المخصوم</span>
                  <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#ea580c' }}>{Math.round(activity.totalDeductedRent)} ج.م</span>
                 </div>
              )}

              <div style={{ marginTop: '1.5rem', borderTop: '2px dashed #eee', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>صافي الربح 💰</span>
                <span style={{ fontWeight: 900, fontSize: '1.8rem', color: activity.profit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  {Math.round(activity.profit).toLocaleString()} <span style={{ fontSize: '1rem' }}>ج.م</span>
                </span>
              </div>
            </>
          ) : (
            <div className="glass" style={{ padding: '1.5rem', borderRadius: '20px', textAlign: 'center' }}>
              <p style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
                {activity.type === 'electricity' ? 'شحن كهرباء ⚡' : activity.type === 'gas' ? 'شحن غاز 🔥' : activity.type === 'water' ? 'فاتورة مياه 💧' : activity.type === 'fixed_payment' ? `دفع ${activity.name}` : activity.name || 'مصروف عام'}
              </p>
              <h3 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--danger)', marginBottom: '0.5rem' }}>
                -{activity.amount.toLocaleString()} <span style={{ fontSize: '1rem' }}>ج.م</span>
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>تم الخصم من مبيعات اليوم</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};



const Workers = ({ workers, onAdd, onDelete, onUpdate }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);
  const [formData, setFormData] = useState({ name: '', type: 'fixed', rate: '' });

  const resetForm = () => {
    setFormData({ name: '', type: 'fixed', rate: '' });
    setEditingWorker(null);
    setShowForm(false);
  };

  const handleEdit = (worker) => {
    setEditingWorker(worker);
    setFormData({ name: worker.name, type: worker.type, rate: worker.rate });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.rate) {
      toast.error('برجاء إدخال الاسم والأجر');
      return;
    }
    const workerData = { ...formData, rate: Number(formData.rate) };
    if (editingWorker) {
      onUpdate(editingWorker.id, workerData);
      toast.success('تم تعديل بيانات العامل');
    } else {
      onAdd(workerData);
      toast.success('تمت إضافة العامل بنجاح');
    }
    resetForm();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="card glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>إدارة العمال</h3>
        <button className="btn-primary" onClick={() => { if(showForm) resetForm(); else setShowForm(true); }}>
          {showForm ? 'إلغاء' : 'إضافة عامل +'}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="card glass"
            style={{ border: '2px solid var(--primary)' }}
          >
            <form onSubmit={handleSubmit} className="form-grid" style={{ padding: '0.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 600 }}>اسم العامل</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="input-field" 
                  placeholder="أدخل الاسم"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 600 }}>نوع الأجر</label>
                <select 
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="input-field"
                >
                  <option value="fixed">يومية ثابتة</option>
                  <option value="commission">عمولة على الشوال</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 600 }}>قيمة الأجر (ج.م)</label>
                <input 
                  type="number" 
                  value={formData.rate}
                  onChange={(e) => setFormData({...formData, rate: e.target.value})}
                  className="input-field" 
                  placeholder="0"
                />
              </div>
              <button type="submit" className="btn-primary" style={{ padding: '0.7rem 2rem' }}>{editingWorker ? 'تحديث' : 'حفظ'}</button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
        {workers.map(worker => (
          <div 
            key={worker.id} 
            className="card glass" 
            style={{ 
              borderRight: `5px solid ${worker.type === 'fixed' ? 'var(--primary)' : 'var(--secondary)'}`,
              cursor: 'pointer'
            }}
            onClick={() => handleEdit(worker)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>{worker.name}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(worker.id); }} 
                style={{ color: 'var(--danger)', fontSize: '0.75rem', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
              >حذف</button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {worker.type === 'fixed' ? 'أجر ثابت' : 'عمولة: ' + worker.rate + ' ج/شوال'}
              </div>
              {worker.type === 'fixed' && <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{worker.rate} ج.م</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper Component for Price Inputs (to debounce/blur update)
const PriceInput = ({ initialValue, onUpdate }) => {
  const [val, setVal] = useState(initialValue);

  // Sync if global state changes externally
  useEffect(() => {
    setVal(initialValue);
  }, [initialValue]);

  const handleBlur = () => {
    if (Number(val) !== Number(initialValue)) {
      onUpdate(val);
    }
  };

  return (
    <input 
      type="number" 
      value={val} 
      onChange={(e) => setVal(e.target.value)} 
      onBlur={handleBlur}
      className="input-field" 
      style={{ width: '100%', padding: '0.5rem' }}
    />
  );
};

const PriceSettings = ({ 
  ingredients, 
  utilityExpenses = [], 
  gasSystem, 
  onUpdatePrice, 
  onAddIngredient, 
  onDeleteIngredient, 
  onAddUtility, 
  onSetGasSystem,
  fixedExpenses = [],
  setFixedExpenses
}) => {
  const [newUtility, setNewUtility] = useState({ type: 'electricity', amount: '' });
  
  const [showAddIng, setShowAddIng] = useState(false);
  const [newIng, setNewIng] = useState({ name: '', unitPrice: '', unitName: '' });

  const handleAddUtility = () => {
    if (!newUtility.amount) return;
    onAddUtility({ ...newUtility, amount: Number(newUtility.amount) });
    setNewUtility({ ...newUtility, amount: '' });
  };

  const handleAddIngredient = (e) => {
    e.preventDefault();
    if (!newIng.name || !newIng.unitPrice) {
      toast.error('برجاء إدخال اسم الخامة وسعرها');
      return;
    }
    onAddIngredient({ 
      name: newIng.name, 
      unitPrice: Number(newIng.unitPrice), 
      unitName: newIng.unitName || 'وحدة' 
    });
    setNewIng({ name: '', unitPrice: '', unitName: '' });
    setShowAddIng(false);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="card glass">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3>أسعار الخامات وتكاليف الإنتاج</h3>
            <button 
              className="btn-primary" 
              style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
              onClick={() => setShowAddIng(!showAddIng)}
            >
              {showAddIng ? 'إلغاء' : 'إضافة خامة +'}
            </button>
          </div>

          <AnimatePresence>
            {showAddIng && (
              <motion.form 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                onSubmit={handleAddIngredient} 
                className="form-grid"
                style={{ 
                  padding: '1.5rem', 
                  backgroundColor: 'rgba(146, 64, 14, 0.03)', 
                  borderRadius: '16px', 
                  marginBottom: '1.5rem',
                  border: '1px dashed rgba(146, 64, 14, 0.2)'
                }}
              >
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.3rem', display: 'block' }}>اسم الخامة</label>
                  <input type="text" value={newIng.name} onChange={e => setNewIng({...newIng, name: e.target.value})} className="input-field" placeholder="فانيليا..." />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.3rem', display: 'block' }}>السعر</label>
                  <input type="number" value={newIng.unitPrice} onChange={e => setNewIng({...newIng, unitPrice: e.target.value})} className="input-field" placeholder="0.00" />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.3rem', display: 'block' }}>الوحدة</label>
                  <input type="text" value={newIng.unitName} onChange={e => setNewIng({...newIng, unitName: e.target.value})} className="input-field" placeholder="زجاجة / كيلو" />
                </div>
                <button type="submit" className="btn-primary">حفظ الخامة</button>
              </motion.form>
            )}
          </AnimatePresence>
          
          <div style={{ padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '12px', marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.8rem' }}>نظام الغاز المستخدم:</label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => onSetGasSystem('meter')} 
                style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', border: gasSystem === 'meter' ? '2px solid var(--primary)' : '1px solid #ddd', backgroundColor: gasSystem === 'meter' ? 'white' : 'transparent', fontWeight: 'bold' }}
              >عداد غاز طبيعي 📊</button>
              <button 
                onClick={() => onSetGasSystem('cylinder')}
                style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', border: gasSystem === 'cylinder' ? '2px solid var(--secondary)' : '1px solid #ddd', backgroundColor: gasSystem === 'cylinder' ? 'white' : 'transparent', fontWeight: 'bold' }}
              >أنابيب غاز ⛽</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            {ingredients
              .filter(ing => {
                // ALWAYS show flour
                if (ing.id === 'flour') return true;
                // Show gas ONLY if it's cylinder system
                if (ing.id === 'gas') return gasSystem === 'cylinder';
                // Show all other custom ingredients
                return true;
              }) 
              .map(ing => (
              <div key={ing.id} className="price-item" style={{ position: 'relative' }}>
                <label style={{ fontSize: '0.85rem' }}>
                  {ing.id === 'gas' ? 'سعر الأنبوبة' : ing.name} ({ing.unitName})
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <PriceInput 
                    initialValue={ing.unitPrice} 
                    onUpdate={(val) => onUpdatePrice(ing.id, val)} 
                  />
                  {!ing.isCore && (
                    <button 
                      onClick={() => onDeleteIngredient(ing.id)}
                      style={{ color: 'var(--danger)', padding: '0.2rem', backgroundColor: 'transparent', border: 'none' }}
                      title="حذف"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

const PriceHistoryView = ({ priceHistory = [] }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header className="card glass">
        <h3>سجل تغيرات الأسعار</h3>
        <p style={{ color: 'var(--text-muted)' }}>متابعة تاريخية لارتفاع أو انخفاض أسعار الخامات الأساسية.</p>
      </header>

      <div className="card glass">
        {priceHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <History size={48} style={{ color: '#cbd5e1', marginBottom: '1rem' }} />
            <p style={{ color: 'var(--text-muted)' }}>لم يتم تسجيل أي تغييرات في الأسعار بعد.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {priceHistory.map(log => {
              const diff = log.newPrice - log.oldPrice;
              const percent = log.oldPrice !== 0 ? ((diff / log.oldPrice) * 100).toFixed(1) : '0';
              const isUp = diff > 0;

              return (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={log.id} 
                  style={{ 
                    padding: '1.2rem', 
                    borderRadius: '16px', 
                    backgroundColor: 'white',
                    borderRight: `4px solid ${isUp ? '#f87171' : '#4ade80'}`,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{log.name || 'خامة'}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(log.date).toLocaleString('ar-EG', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>السعر السابق</p>
                      <p style={{ fontWeight: 600 }}>{log.oldPrice} ج.م</p>
                    </div>
                    <ArrowLeft size={20} color="#94a3b8" />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>السعر الجديد</p>
                      <p style={{ fontWeight: 'bold', color: 'var(--primary)', fontSize: '1.1rem' }}>{log.newPrice} ج.م</p>
                    </div>
                  </div>

                  <div style={{ 
                    marginTop: '1rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    padding: '0.5rem',
                    borderRadius: '8px',
                    backgroundColor: isUp ? '#fff1f2' : '#f0fdf4',
                    color: isUp ? '#be123c' : '#15803d',
                    fontSize: '0.9rem',
                    fontWeight: 'bold'
                  }}>
                    {isUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    <span>{isUp ? 'زيادة' : 'انخفاض'} بمقدار {Math.abs(diff)} ج.م ({isUp ? '+' : ''}{percent}%)</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const BottomNav = ({ activeTab, setActiveTab, items }) => {
  const mainItems = items.filter(item => !item.isMoreItem);
  const moreItems = items.filter(item => item.isMoreItem);
  const isMoreActive = moreItems.some(i => i.id === activeTab) || activeTab === 'more';
  
  return (
    <motion.nav 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '0.6rem 0',
        paddingBottom: 'calc(0.6rem + env(safe-area-inset-bottom))',
        borderTop: '1px solid rgba(0,0,0,0.05)',
        zIndex: 1001,
        boxShadow: '0 -4px 20px rgba(0,0,0,0.08)'
      }}
    >
      {mainItems.map((item) => {
        const isActive = item.id === 'more' ? isMoreActive : activeTab === item.id;
        
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.2rem',
              background: 'none',
              border: 'none',
              padding: '0.4rem',
              color: isActive ? 'var(--primary)' : '#94a3b8',
              flex: 1,
              position: 'relative',
              cursor: 'pointer'
            }}
          >
            {item.special ? (
              <div style={{
                marginTop: '-2.2rem',
                backgroundColor: isActive ? 'var(--warning)' : 'var(--primary)',
                color: 'white',
                minWidth: '54px',
                minHeight: '54px',
                borderRadius: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(146, 64, 14, 0.3)',
                border: '4px solid white',
                transform: 'rotate(45deg)',
                transition: 'all 0.3s ease'
              }}>
                <div style={{ transform: 'rotate(-45deg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <item.icon size={26} />
                </div>
              </div>
            ) : (
              <div style={{ 
                color: isActive ? 'var(--primary)' : '#94a3b8',
                transition: 'all 0.3s ease',
                transform: isActive ? 'scale(1.1)' : 'scale(1)'
              }}>
                <item.icon size={22} style={{ opacity: isActive ? 1 : 0.7 }} />
              </div>
            )}
            <span style={{ 
              fontSize: '0.65rem', 
              fontWeight: 900, 
              marginTop: item.special ? '0.4rem' : '0.1rem',
              color: isActive ? 'var(--primary)' : 'var(--text-muted)',
              transition: 'all 0.3s ease'
            }}>{item.label}</span>
            
            {isActive && !item.special && (
              <motion.div 
                layoutId="activeTabMobile"
                style={{
                  position: 'absolute',
                  top: 0,
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary)',
                  marginTop: '0.2rem'
                }}
              />
            )}
          </button>
        );
      })}
    </motion.nav>
  );
};




function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  const [isActivated, setIsActivated] = useState(false);
  const [showBakeryModal, setShowBakeryModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [newBakeryName, setNewBakeryName] = useState('');
  const isSwitching = useRef(false);

  // Responsive logic
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      if (mobile) setIsSidebarOpen(false); 
      else setIsSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // State
  const [workers, setWorkers] = useState(DEFAULT_WORKERS);
  const [ingredients, setIngredients] = useState(DEFAULT_INGREDIENTS);
  const [priceHistory, setPriceHistory] = useState([]);
  const [dailyRecords, setDailyRecords] = useState([]);
  const [utilityExpenses, setUtilityExpenses] = useState([]);
  const [fixedExpenses, setFixedExpenses] = useState([]);
  const [bakeries, setBakeries] = useState([]);
  const [activeBakeryId, setActiveBakeryId] = useState(null);
  const [gasSystem, setGasSystem] = useState('meter');
  const [inventoryList, setInventoryList] = useState([]);
  const [clients, setClients] = useState([]);

  // Load Data
  useEffect(() => {
    const initLoad = async () => {
      try {
        const { value: activated } = await Preferences.get({ key: 'app_activated' });
        if (activated === 'true') {
          setIsActivated(true);
        }

        const { value: bList } = await Preferences.get({ key: 'bakery-list' });
        let list = bList ? JSON.parse(bList) : [];
        setBakeries(list);
        
        const { value: lastId } = await Preferences.get({ key: 'last-active-bakery' });
        if (lastId && list.find(b => b.id === lastId)) {
          setActiveBakeryId(lastId);
        } else if (list.length > 0) {
          setActiveBakeryId(list[0].id);
        }

        if (activeBakeryId) {
          const prefix = `bakery-${activeBakeryId}-`;
          const load = async (key, setter, defaultValue, isJson = true) => {
            const { value } = await Preferences.get({ key: `${prefix}${key}` });
            if (value) {
              setter(isJson ? JSON.parse(value) : value);
            } else {
              setter(defaultValue);
            }
          };

          await load('workers', setWorkers, DEFAULT_WORKERS);
          await load('ingredients', setIngredients, DEFAULT_INGREDIENTS);
          await load('daily-records', setDailyRecords, []);
          await load('utility-expenses', setUtilityExpenses, []);
          await load('fixed-expenses', setFixedExpenses, []);
          await load('gas-system', setGasSystem, 'meter', false);
          await load('price-history', setPriceHistory, []);
          await load('inventory', setInventoryList, []);
          await load('clients', setClients, []);
        }

        setIsLoaded(true);
      } catch (e) {
        console.error(e);
        setIsLoaded(true);
      }
    };
    initLoad();
  }, [activeBakeryId]);

  // Save Data
  useEffect(() => {
    if (!isLoaded || !activeBakeryId || isSwitching.current) return;
    const save = async () => {
      const prefix = `bakery-${activeBakeryId}-`;
      await Preferences.set({ key: `${prefix}workers`, value: JSON.stringify(workers) });
      await Preferences.set({ key: `${prefix}ingredients`, value: JSON.stringify(ingredients) });
      await Preferences.set({ key: `${prefix}daily-records`, value: JSON.stringify(dailyRecords) });
      await Preferences.set({ key: `${prefix}utility-expenses`, value: JSON.stringify(utilityExpenses) });
      await Preferences.set({ key: `${prefix}fixed-expenses`, value: JSON.stringify(fixedExpenses) });
      await Preferences.set({ key: `${prefix}gas-system`, value: gasSystem });
      await Preferences.set({ key: `${prefix}price-history`, value: JSON.stringify(priceHistory) });
      await Preferences.set({ key: `${prefix}inventory`, value: JSON.stringify(inventoryList) });
      await Preferences.set({ key: `${prefix}clients`, value: JSON.stringify(clients) });
      await Preferences.set({ key: 'bakery-list', value: JSON.stringify(bakeries) });
      await Preferences.set({ key: 'last-active-bakery', value: activeBakeryId });
    };
    save();
  }, [workers, ingredients, dailyRecords, utilityExpenses, fixedExpenses, gasSystem, activeBakeryId, bakeries, priceHistory, inventoryList, clients, isLoaded]);

  // Actions
  const switchBakery = async (id) => {
    isSwitching.current = true;
    await Preferences.set({ key: 'last-active-bakery', value: id });
    window.location.reload(); 
  };

  const addBakery = async (name) => {
    if (!name.trim()) return;
    const newBakery = { id: Date.now().toString(), name: name.trim() };
    const newList = [...bakeries, newBakery];
    setBakeries(newList);
    setNewBakeryName('');
    
    // Explicitly save the list BEFORE reloading
    await Preferences.set({ key: 'bakery-list', value: JSON.stringify(newList) });
    await switchBakery(newBakery.id);
  };

  const addWorker = (w) => setWorkers([...workers, { ...w, id: Date.now() }]);
  const deleteWorker = (id) => setWorkers(workers.filter(w => w.id !== id));
  const updateWorker = (id, data) => setWorkers(workers.map(w => w.id === id ? { ...w, ...data } : w));
  
  const addDailyRecord = (record, isEdit) => {
    if (isEdit) {
      setDailyRecords(dailyRecords.map(r => r.id === record.id ? { ...record, date: r.date } : r));
      setEditingRecord(null);
      toast.success('تم تحديث بيانات الوردية بنجاح وتسوية الحسابات');
    } else {
      // Register credit sales as client transactions (supports both old and new format)
      if (record.creditSales) {
        const entries = Array.isArray(record.creditSales) ? record.creditSales : [record.creditSales];
        entries.forEach(entry => {
          if (entry.clientId && entry.totalAmount) {
            addClientTransaction(entry.clientId, {
              type: 'credit_sale',
              amount: entry.totalAmount,
              paidAmount: entry.paidAmount || 0,
              note: `آجل وردية (${new Date().toLocaleDateString('ar-EG')})`
            });
          }
        });
      }
      setDailyRecords([{ ...record, id: Date.now().toString(), date: new Date().toISOString() }, ...dailyRecords]);
      toast.success('تم الحفظ بنجاح');
    }
    setActiveTab('dashboard');
  };

  const addClosedDay = () => {
    const dailyRentRaw = (fixedExpenses || []).reduce((acc, f) => acc + f.amount, 0) / 30;
    const closedDayRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      type: 'closed_day',
      profit: -dailyRentRaw,
      totalDeductedRent: dailyRentRaw,
      shift: '',
      sacks: 0,
      revenue: 0,
    };
    setDailyRecords([closedDayRecord, ...dailyRecords]);
    toast.success('تم تسجيل إجازة، وخُصم الإيجار اليومي كخسارة.');
  };

  const deleteActivity = (activity) => {
    if (activity.sacks !== undefined) {
      setDailyRecords(dailyRecords.filter(r => r.id !== activity.id));
    } else {
      setUtilityExpenses(utilityExpenses.filter(r => r.id !== activity.id));
    }
    setSelectedActivity(null);
    toast.success('تم حذف السجل بنجاح، وتم تسوية الحسابات');
  };

  const addUtilityExpense = (expense) => {
    setUtilityExpenses([{ ...expense, id: Date.now(), date: new Date().toISOString() }, ...utilityExpenses]);
    toast.success('تم تسجيل المصروف');
  };

  const updateUtilityExpense = (id, data) => {
    setUtilityExpenses(utilityExpenses.map(e => e.id === id ? { ...e, ...data } : e));
  };

  const deleteUtilityExpense = (id) => {
    setUtilityExpenses(utilityExpenses.filter(e => e.id !== id));
    toast.success('تم حذف الفاتورة');
  };

  const updateIngredientPrice = (id, val) => {
    const newPrice = Number(val);
    setIngredients(prevIngs => {
      const oldPrice = prevIngs.find(ing => ing.id === id)?.unitPrice || 0;
      if (newPrice !== oldPrice) {
        setPriceHistory(prevHist => [{ id: Date.now().toString(), ingredientId: id, oldPrice, newPrice, date: new Date().toISOString() }, ...prevHist]);
        return prevIngs.map(ing => ing.id === id ? { ...ing, unitPrice: newPrice } : ing);
      }
      return prevIngs;
    });
  };

  const addIngredient = (ing) => setIngredients([...ingredients, { ...ing, id: Date.now().toString() }]);
  const deleteIngredient = (id) => setIngredients(ingredients.filter(ing => ing.id !== id));

  const addInventoryLog = (log) => {
    let finalTypeId = log.type;
    
    if (log.type === 'other') {
      finalTypeId = 'item_' + Date.now().toString();
      const newIng = {
        id: finalTypeId,
        name: log.name,
        unitPrice: log.unitCost,
        unitName: 'وحدة',
        isCore: false
      };
      setIngredients(prev => [...prev, newIng]);
      log.type = finalTypeId;
    } else {
      updateIngredientPrice(log.type, log.unitCost);
    }

    setInventoryList([{ ...log, id: Date.now().toString() }, ...inventoryList]);
    toast.success('تم تسجيل الوارد وتحديث السعر بالخامات');
  };

  const updateInventoryLog = (id, newLog) => {
    let finalTypeId = newLog.type;
    
    if (newLog.type === 'other') {
      finalTypeId = 'item_' + Date.now().toString();
      const newIng = {
        id: finalTypeId,
        name: newLog.name,
        unitPrice: newLog.unitCost,
        unitName: 'وحدة',
        isCore: false
      };
      setIngredients(prev => [...prev, newIng]);
      newLog.type = finalTypeId;
    } else {
      updateIngredientPrice(newLog.type, newLog.unitCost);
    }

    setInventoryList(inventoryList.map(l => l.id === id ? { ...l, ...newLog } : l));
    toast.success('تم تعديل الوارد وتحديث السعر');
  };

  const deleteInventoryLog = (id) => {
    setInventoryList(inventoryList.filter(l => l.id !== id));
    toast.success('تم حذف قيد الوارد');
  };

  const addClient = (name) => {
    setClients([{ id: Date.now().toString(), name, transactions: [] }, ...clients]);
    toast.success('تم إضافة العميل بنجاح');
  };

  const addClientTransaction = (id, transaction) => {
    setClients(clients.map(c => 
      c.id === id ? { ...c, transactions: [{ ...transaction, id: Date.now() }, ...(c.transactions || [])] } : c
    ));
    toast.success('تم تسجيل المعاملة');
  };

  if (!isLoaded) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>جاري التحميل...</div>;

  const menuItems = [
    { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
    { 
      id: 'expenses', 
      label: editingRecord ? 'تعديل الوردية ✏️' : 'إنشاء وردية', 
      icon: PlusCircle, 
      special: true 
    },
    { id: 'reports', label: 'التقارير', icon: BarChart3 },
    { id: 'more', label: 'إدارة', icon: MoreHorizontal, isMobileOnly: true },
    { id: 'inventory', label: 'المخازن والمشتريات', icon: Package, isMoreItem: true },
    { id: 'clients', label: 'عملاء الآجل', icon: Building2, isMoreItem: true },
    { id: 'workers', label: 'العمال', icon: Users, isMoreItem: true },
    { id: 'externalExpenses', label: 'مصروفات خارجية وإيجار', icon: Receipt, isMoreItem: true },
    { id: 'prices', label: 'إعدادات المخبز', icon: Settings, isMoreItem: true },
    { id: 'priceLogs', label: 'سجل الأسعار', icon: History, isMoreItem: true },
  ];

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', minHeight: '100vh' }}>
      <Toaster position="top-left" />
      
      {isMobile && (
        <header style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'white', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 1000 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem 1.2rem' }}>
            <h1 style={{ fontSize: '1.5rem', color: 'var(--primary)', fontWeight: '900' }}>فُـرن</h1>
            <button onClick={() => setShowBakeryModal(true)} style={{ padding: '0.4rem 0.8rem', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.8rem' }}>
              📍 {bakeries.find(b => b.id === activeBakeryId)?.name} 🔄
            </button>
          </div>
        </header>
      )}

      {isMobile && <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} items={menuItems} />}

      {!isMobile && (
        <motion.aside animate={{ width: isSidebarOpen ? 280 : 80 }} className="glass" style={{ borderLeft: '1px solid rgba(0,0,0,0.1)', padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', zIndex: 1002, position: 'fixed', right: 0, top: 0, bottom: 0, backgroundColor: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
            {isSidebarOpen && <h1 style={{ fontSize: '1.8rem', color: 'var(--primary)', fontWeight: '900' }}>فُـرن</h1>}
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="btn-icon">
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
            {menuItems.filter(item => !item.isMobileOnly).map((item) => (
              <button 
                key={item.id} 
                onClick={() => {
                  if (item.id === 'expenses' && activeTab !== 'expenses') {
                    // Reset editing state if clicking the standard Create tab
                    setEditingRecord(null); 
                  }
                  setActiveTab(item.id);
                }} 
                style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '12px', color: activeTab === item.id ? 'white' : 'var(--text-main)', backgroundColor: activeTab === item.id ? (item.id === 'expenses' && editingRecord ? 'var(--warning)' : 'var(--primary)') : 'transparent', justifyContent: isSidebarOpen ? 'flex-start' : 'center' }}
              >
                <item.icon size={22} />
                {isSidebarOpen && <span style={{ fontWeight: 600 }}>{item.label}</span>}
              </button>
            ))}
          </nav>
        </motion.aside>
      )}

      <main style={{ 
        flex: 1, 
        marginRight: isMobile ? 0 : (isSidebarOpen ? 280 : 80), 
        padding: isMobile ? '1rem' : '2rem', 
        paddingBottom: isMobile ? '100px' : '2rem', // Clear the bottom nav
        transition: 'margin 0.3s ease' 
      }}>
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {activeTab === 'more' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>الإدارة والأقسام</h3>
                {menuItems.filter(i => i.isMoreItem).map(item => (
                  <button key={item.id} onClick={() => setActiveTab(item.id)} className="card glass" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', border: 'none', cursor: 'pointer', textAlign: 'right', width: '100%' }}>
                    <div style={{ padding: '0.8rem', backgroundColor: 'var(--primary)15', color: 'var(--primary)', borderRadius: '12px' }}>
                      <item.icon size={24} />
                    </div>
                    <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{item.label}</span>
                  </button>
                ))}
              </div>
            )}
            {activeTab === 'dashboard' && <Dashboard records={dailyRecords} utilityExpenses={utilityExpenses} isMobile={isMobile} onActivityClick={setSelectedActivity} onAddClosedDay={addClosedDay} />}
            {activeTab === 'workers' && <Workers workers={workers} onAdd={addWorker} onDelete={deleteWorker} onUpdate={updateWorker} />}
            {activeTab === 'inventory' && <Inventory inventoryList={inventoryList} dailyRecords={dailyRecords} onAddInventory={addInventoryLog} onUpdateInventory={updateInventoryLog} onDeleteInventory={deleteInventoryLog} isMobile={isMobile} ingredients={ingredients} />}
            {activeTab === 'clients' && <Clients clients={clients} onAddClient={addClient} onAddTransaction={addClientTransaction} isMobile={isMobile} />}
            {activeTab === 'externalExpenses' && <ExternalExpenses utilityExpenses={utilityExpenses} fixedExpenses={fixedExpenses} onAddUtility={addUtilityExpense} setFixedExpenses={setFixedExpenses} onUpdateUtility={updateUtilityExpense} onDeleteUtility={deleteUtilityExpense} />}
            {activeTab === 'prices' && <PriceSettings ingredients={ingredients} gasSystem={gasSystem} onUpdatePrice={updateIngredientPrice} onAddIngredient={addIngredient} onDeleteIngredient={deleteIngredient} onSetGasSystem={setGasSystem} isMobile={isMobile} />}
            {activeTab === 'expenses' && <Expenses ingredients={ingredients} workers={workers} gasSystem={gasSystem} onSave={addDailyRecord} isMobile={isMobile} onAddUtility={addUtilityExpense} fixedExpenses={fixedExpenses} clients={clients} inventoryList={inventoryList} dailyRecords={dailyRecords} initialData={editingRecord} />}
            {activeTab === 'reports' && <Reports records={dailyRecords} utilityExpenses={utilityExpenses} fixedExpenses={fixedExpenses} isMobile={isMobile} onActivityClick={setSelectedActivity} />}
            {activeTab === 'priceLogs' && <PriceHistoryView priceHistory={priceHistory} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {selectedActivity && (
          <ActivityDetailModal 
            activity={selectedActivity} 
            onClose={() => setSelectedActivity(null)} 
            onDelete={deleteActivity} 
            onEdit={(act) => {
              setEditingRecord(act);
              setSelectedActivity(null);
              setActiveTab('expenses');
            }}
          />
        )}
        {showBakeryModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(5px)' }}
            onClick={() => setShowBakeryModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="card glass" 
              style={{ width: '100%', maxWidth: '400px', backgroundColor: 'white', padding: '2rem', borderRadius: '24px' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)' }}>تبديل المخبز 📍</h3>
                <button 
                  onClick={() => setShowBakeryModal(false)}
                  style={{ backgroundColor: '#f3f4f6', padding: '0.5rem', borderRadius: '50%' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '300px', overflowY: 'auto', padding: '0.8rem', borderRadius: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'thin' }}>
                {bakeries.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>لا يوجد مخابز مضافة بعد.</p>
                ) : (
                  bakeries.map(b => (
                    <button 
                      key={b.id} 
                      onClick={() => switchBakery(b.id)} 
                      style={{ 
                        width: '100%', 
                        padding: '1.2rem', 
                        borderRadius: '16px', 
                        textAlign: 'right',
                        fontSize: '1rem',
                        fontWeight: 700,
                        backgroundColor: activeBakeryId === b.id ? 'var(--primary)10' : 'white',
                        border: activeBakeryId === b.id ? '2px solid var(--primary)' : '1px solid #eee',
                        color: activeBakeryId === b.id ? 'var(--primary)' : 'var(--text-main)',
                        transition: 'all 0.2s'
                      }}
                    >
                      {b.name} {activeBakeryId === b.id && '✅'}
                    </button>
                  ))
                )}
              </div>

              <div style={{ marginTop: '2rem', borderTop: '2px dashed #eee', paddingTop: '1.5rem' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.8rem' }}>إضافة مخبز جديد:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <input 
                    type="text" 
                    value={newBakeryName} 
                    onChange={e => setNewBakeryName(e.target.value)}
                    placeholder="مثال: مخبز الأمل، فرع أكتوبر..." 
                    style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid #ddd', fontSize: '1rem' }} 
                  />
                  <button 
                    onClick={() => { if(newBakeryName) addBakery(newBakeryName); }} 
                    className="btn-primary" 
                    style={{ width: '100%', padding: '1rem', borderRadius: '12px', justifyContent: 'center' }}
                  >
                    إضافة وبدء العمل +
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isActivated && (
          <ActivationOverlay onActivated={(bakeryName) => {
            const firstBakery = { id: Date.now().toString(), name: bakeryName };
            setBakeries([firstBakery]);
            setActiveBakeryId(firstBakery.id);
            setIsActivated(true);
            Preferences.set({ key: 'app_activated', value: 'true' });
            Preferences.set({ key: 'bakery-list', value: JSON.stringify([firstBakery]) });
            Preferences.set({ key: 'last-active-bakery', value: firstBakery.id });
          }} />
        )}
      </AnimatePresence>
    </div>
  );
}

const ActivationOverlay = ({ onActivated }) => {
  const [password, setPassword] = useState('');
  const [bakeryName, setBakeryName] = useState('');
  const [error, setError] = useState('');

  const handleActivate = () => {
    if (password === 'FURN2026') {
      if (bakeryName.trim()) {
        onActivated(bakeryName.trim());
      } else {
        setError('من فضلك أدخل اسم المخبز أولاً');
      }
    } else {
      setError('كلمة السر غير صحيحة، تواصل مع المطور');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ 
        position: 'fixed', 
        inset: 0, 
        backgroundColor: '#fffbef', 
        zIndex: 5000, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '1.5rem'
      }}
    >
      <div className="card glass" style={{ width: '100%', maxWidth: '450px', textAlign: 'center', padding: '3rem 2rem', border: '2px solid var(--primary-light)' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🥖</div>
        <h2 style={{ marginBottom: '0.5rem', fontWeight: 900, fontSize: '1.8rem', color: 'var(--primary)' }}>تفعيل تطبيق فُـرن</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '2.5rem', lineHeight: '1.6' }}>مرحباً بك في نظام إدارة الأفران الاحترافي. <br/> يرجى تفعيل النسخة لبدء إدارة مخبزك.</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', textAlign: 'right' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem' }}>كلمة سر التفعيل</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              className="input-field" 
              placeholder="أدخل كلمة السر المقدمة لك..."
              style={{ padding: '1rem', borderRadius: '14px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem' }}>اسم المخبز (الفرع الأول)</label>
            <input 
              type="text" 
              value={bakeryName} 
              onChange={e => setBakeryName(e.target.value)}
              className="input-field" 
              placeholder="مثال: مخبز القلعة - فرع 1"
              style={{ padding: '1rem', borderRadius: '14px' }}
            />
          </div>

          {error && (
            <motion.p 
              initial={{ x: -10 }} 
              animate={{ x: 0 }} 
              style={{ color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 800, textAlign: 'center', backgroundColor: '#fef2f2', padding: '0.8rem', borderRadius: '10px' }}
            >
              ⚠️ {error}
            </motion.p>
          )}

          <button onClick={handleActivate} className="btn-primary" style={{ padding: '1.2rem', justifyContent: 'center', marginTop: '1.5rem', fontSize: '1.1rem', borderRadius: '16px' }}>
            تفعيل وبدء العمل الآن 🚀
          </button>
        </div>
        
        <p style={{ marginTop: '3rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
          <b>تنبيه:</b> هذا التطبيق يعمل كلياً بدون إنترنت (Offline). <br/> جميع بياناتك مخزنة بأمان على هاتفك فقط.
        </p>
      </div>
    </motion.div>
  );
};

export default App;
