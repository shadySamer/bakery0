import React, { useState } from 'react';
import toast from 'react-hot-toast';

const Expenses = ({ ingredients, workers, gasSystem, onSave, isMobile, onAddUtility, fixedExpenses = [], clients = [], inventoryList = [], dailyRecords = [], initialData = null }) => {
  const [sacks, setSacks] = useState('');
  const [revenue, setRevenue] = useState('');
  const [shift, setShift] = useState('shift_1');
  const [selectedWorkers, setSelectedWorkers] = useState([]);
  const [materialQuantities, setMaterialQuantities] = useState({});
  const [cylinderCount, setCylinderCount] = useState('');
  
  // الهالك (Waste)
  const [wasteCount, setWasteCount] = useState(''); 
  const [wastePrice, setWastePrice] = useState(''); 
  const [wasteBearer, setWasteBearer] = useState('loss'); // 'loss', 'sold', or workerId

  // Edit Mode state
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  // Credit Sales - multiple entries
  const [creditEntries, setCreditEntries] = useState([]); // [{clientId, totalAmount, paidAmount, id}]
  const [creditForm, setCreditForm] = useState({ clientId: '', totalAmount: '', paidAmount: '' });

  // Shift Utilities
  const [shiftUtilities, setShiftUtilities] = useState([]);
  const [shiftUtilityForm, setShiftUtilityForm] = useState({ type: 'maintenance', amount: '', name: '' });

  const handleAddShiftUtility = () => {
    if (!shiftUtilityForm.amount) {
      toast.error('برجاء إدخال المبلغ');
      return;
    }
    setShiftUtilities([...shiftUtilities, { ...shiftUtilityForm, id: Date.now(), amount: Number(shiftUtilityForm.amount) }]);
    setShiftUtilityForm({ type: 'maintenance', amount: '', name: '' });
  };

  const removeShiftUtility = (id) => {
    setShiftUtilities(shiftUtilities.filter(u => u.id !== id));
  };
  
  // Utility form state
  const [newUtility, setNewUtility] = useState({ type: 'electricity', amount: '', name: '' });

  const handleAddUtility = () => {
    if (!newUtility.amount) {
      toast.error('برجاء إدخال المبلغ');
      return;
    }
    const finalName = newUtility.type === 'fixed_payment' ? newUtility.name : '';
    onAddUtility({ ...newUtility, name: finalName, amount: Number(newUtility.amount) });
    setNewUtility({ type: 'electricity', amount: '', name: '' });
  };

  // Inventory Live Tracking
  const totalFlourAdded = inventoryList.filter(i => i.type === 'flour').reduce((acc, item) => acc + Number(item.quantity), 0);
  const totalFlourUsed = dailyRecords.reduce((acc, r) => acc + Number(r.sacks || 0), 0);
  const currentFlourStock = totalFlourAdded - totalFlourUsed;

  const totalGasAdded = inventoryList.filter(i => i.type === 'gas').reduce((acc, item) => acc + Number(item.quantity), 0);
  const totalGasUsed = dailyRecords.reduce((acc, r) => acc + Number(r.gasUsage || 0), 0);
  const currentGasStock = totalGasAdded - totalGasUsed;

  // Initialize Edit Mode if initialData is provided
  React.useEffect(() => {
    if (initialData) {
      setEditMode(true);
      setEditId(initialData.id);
      setSacks(initialData.sacks?.toString() || '');
      setRevenue(initialData.revenue?.toString() || '');
      setShift(initialData.shift || 'shift_1');
      setSelectedWorkers(initialData.workers || []);
      setMaterialQuantities(initialData.materialUsage || {});
      setCylinderCount(initialData.gasSystem === 'cylinder' ? (initialData.gasUsage?.toString() || '') : '');
      setWasteCount(initialData.wasteCount?.toString() || '');
      setWastePrice(initialData.wastePrice?.toString() || '');
      setWasteBearer(initialData.wasteBearer || 'loss');
      if (initialData.creditSales) {
        // Support both old single-entry format and new array format
        if (Array.isArray(initialData.creditSales)) {
          setCreditEntries(initialData.creditSales);
        } else if (initialData.creditSales.clientId) {
          setCreditEntries([{ id: 1, clientId: initialData.creditSales.clientId, totalAmount: initialData.creditSales.amount, paidAmount: 0 }]);
        }
      } else {
        setCreditEntries([]);
      }
      setShiftUtilities(initialData.shiftUtilities || []);
    }
  }, [initialData, fixedExpenses]);

  // Add/Remove worker from this shift
  const toggleWorker = (worker) => {
    const exists = selectedWorkers.find(w => w.id === worker.id);
    if (exists) {
      setSelectedWorkers(selectedWorkers.filter(w => w.id !== worker.id));
    } else {
      setSelectedWorkers([...selectedWorkers, { ...worker, advance: '' }]);
    }
  };

  // Override worker rate/type/customSacks/advance for this shift specifically
  const updateShiftWorker = (id, field, value) => {
    setSelectedWorkers(selectedWorkers.map(w => {
      if (w.id === id) {
        if (field === 'type' || field === 'name') return { ...w, [field]: value };
        return { ...w, [field]: value !== '' ? Number(value) : '' };
      }
      return w;
    }));
  };

  const updateMaterialQty = (id, val) => {
    setMaterialQuantities({ ...materialQuantities, [id]: Number(val) });
  };

  // Calculate costs
  const flourIng = ingredients.find(i => i.id === 'flour');
  const gasIng = ingredients.find(i => i.id === 'gas');
  
  const flourCost = (Number(sacks) || 0) * (flourIng?.unitPrice || 0);
  
  let gasCost = 0;
  if (gasSystem === 'meter') {
    const gasPerSack = (gasIng?.unitPrice || 0) / 10;
    gasCost = (Number(sacks) || 0) * gasPerSack;
  } else {
    gasCost = (Number(cylinderCount) || 0) * (gasIng?.unitPrice || 0);
  }
  
  const otherMaterialsCost = ingredients.reduce((acc, ing) => {
    if (ing.id === 'flour' || ing.id === 'gas') return acc;
    const qty = materialQuantities[ing.id] || 0;
    return acc + (qty * ing.unitPrice);
  }, 0);

  const workerCost = selectedWorkers.reduce((acc, w) => {
    let wage = 0;
    if (w.type === 'commission') {
      const sacksWorked = (w.customSacks !== undefined && w.customSacks !== null && w.customSacks !== '') ? w.customSacks : (Number(sacks) || 0);
      wage = (w.rate * sacksWorked);
    } else {
      wage = w.rate;
    }
    return acc + wage;
  }, 0);
  
  const wasteValue = (Number(wasteCount) || 0) * (Number(wastePrice) || 0);

  // السلف الحقيقية فقط
  const totalAdvances = selectedWorkers.reduce((acc, w) => acc + (Number(w.advance) || 0), 0);

  const totalShiftUtilities = shiftUtilities.reduce((acc, u) => acc + u.amount, 0);

  // Revenue from credit = total amount of all credit sales (what the client owes)
  const totalCreditAmount = creditEntries.reduce((acc, e) => acc + (Number(e.totalAmount) || 0), 0);

  // Adjust worker cost and revenue based on waste action
  let actualWorkerCost = workerCost;
  let actualRevenue = (Number(revenue) || 0) + totalCreditAmount;

  if (wasteBearer === 'sold' || wasteBearer === 'drawer') {
     // Sold to someone, so bakery got cash/revenue for it
     actualRevenue += wasteValue;
  } else if (wasteBearer !== 'loss') {
     // It means wasteBearer is a worker ID. It's a penalty.
     // Worker pays for it directly from their wage, reducing the actual cost the bakery pays for workers.
     actualWorkerCost -= wasteValue;
  }
  
  const grossRevenue = actualRevenue;
  const totalCost = flourCost + gasCost + otherMaterialsCost + actualWorkerCost;
  const profit = grossRevenue - totalCost - totalShiftUtilities;
  // It is the cash revenue MINUS what they paid from the drawer (utilities + advances + remaining cash wages?)
  // This is handled in the reports. Here we just calculate the abstract "profit" for the owners.

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header className="card glass" style={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row', 
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'stretch' : 'center',
        gap: '1.5rem'
      }}>
        <div>
          <h3 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>{editMode ? 'تعديل بيانات الوردية ✏️' : 'تسجيل يومية الوردية'}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{editMode ? 'أنت الآن تقوم بتعديل وردية محفوظة سلفاً.' : 'أدخل بيانات الوردية الحالية وطقم العمال والخامات.'}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(146, 64, 14, 0.05)', padding: '0.5rem 0.8rem', borderRadius: '16px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap' }}>رقم الوردية:</span>
          <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
            {['الأولى 🌅', 'الثانية 🌤️', 'الثالثة 🌙', 'الرابعة ⭐'].map((label, i) => (
              <button
                key={i}
                onClick={() => setShift(`shift_${i + 1}`)}
                style={{
                  padding: '0.4rem 0.7rem',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  backgroundColor: shift === `shift_${i + 1}` ? 'white' : 'transparent',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  color: shift === `shift_${i + 1}` ? 'var(--primary)' : 'var(--text-muted)',
                  border: shift === `shift_${i + 1}` ? '1px solid rgba(146,64,14,0.15)' : '1px solid transparent',
                  boxShadow: shift === `shift_${i + 1}` ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
                }}
              >{label}</button>
            ))}
            <input
              type="text"
              value={!['shift_1','shift_2','shift_3','shift_4'].includes(shift) ? shift : ''}
              onChange={e => setShift(e.target.value)}
              placeholder="أو اكتب اسم..."
              style={{ padding: '0.3rem 0.6rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.75rem', width: '100px' }}
            />
          </div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        {/* Left Column: Shift Details & Workers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card glass">
            <h4 style={{ color: 'var(--primary)', marginBottom: '1.2rem' }}>الإنتاج والمبيعات</h4>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>عدد أجولة الدقيق</label>
                <input type="number" value={sacks} onChange={(e) => setSacks(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #ddd' }} placeholder="0" />
                {sacks && inventoryList.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem', fontSize: '0.75rem', padding: '0.2rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>رصيد المخزن المتاح:</span>
                    <span style={{ fontWeight: 'bold', color: currentFlourStock - (!editMode ? Number(sacks) : 0) < 0 ? 'var(--danger)' : 'var(--success)' }}>
                      {currentFlourStock} شوال
                    </span>
                  </div>
                )}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>الإيراد الكاش (الدرج) (ج.م)</label>
                <input type="number" value={revenue} onChange={(e) => setRevenue(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #ddd' }} placeholder="0" />
              </div>
            </div>

            {/* Credit Sales & Waste */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: '1.5rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
              {/* Credit Sales - Multiple Entries */}
              <div style={{ backgroundColor: '#f0f9ff', padding: '0.8rem', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.8rem', color: '#0369a1', fontWeight: 'bold' }}>إضافة مبيعات آجل (اختياري) 📋</label>
                
                {/* Add entry form */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr 1fr auto', gap: '0.5rem', alignItems: 'end', marginBottom: '0.8rem' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#0369a1', display: 'block', marginBottom: '0.2rem' }}>اسم العميل</label>
                    <select value={creditForm.clientId} onChange={e => setCreditForm({...creditForm, clientId: e.target.value})} className="input-field" style={{ padding: '0.5rem', width: '100%' }}>
                      <option value="">اختار العميل...</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#0369a1', display: 'block', marginBottom: '0.2rem' }}>إجمالي المبلغ</label>
                    <input type="number" placeholder="0" value={creditForm.totalAmount} onChange={e => setCreditForm({...creditForm, totalAmount: e.target.value})} className="input-field" style={{ padding: '0.5rem', width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#c2410c', display: 'block', marginBottom: '0.2rem' }}>دفع الآن (اختياري)</label>
                    <input type="number" placeholder="0" value={creditForm.paidAmount} onChange={e => setCreditForm({...creditForm, paidAmount: e.target.value})} className="input-field" style={{ padding: '0.5rem', width: '100%', borderColor: '#fdba74' }} />
                  </div>
                  <button
                    onClick={() => {
                      if (!creditForm.clientId || !creditForm.totalAmount) { toast.error('برجاء تحديد العميل والمبلغ'); return; }
                      setCreditEntries([...creditEntries, { id: Date.now(), ...creditForm, totalAmount: Number(creditForm.totalAmount), paidAmount: Number(creditForm.paidAmount) || 0 }]);
                      setCreditForm({ clientId: '', totalAmount: '', paidAmount: '' });
                    }}
                    className="btn-primary"
                    style={{ padding: '0.5rem 0.8rem', whiteSpace: 'nowrap' }}
                  >إضافة +</button>
                </div>

                {/* Entries list */}
                {creditEntries.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {creditEntries.map(entry => {
                      const client = clients.find(c => c.id === entry.clientId);
                      const remaining = entry.totalAmount - entry.paidAmount;
                      return (
                        <div key={entry.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '0.5rem 0.8rem', borderRadius: '8px', border: `1px solid ${remaining > 0 ? '#fbbf24' : '#86efac'}` }}>
                          <div>
                            <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{client?.name || 'عميل'}</span>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', gap: '0.8rem', marginTop: '0.1rem' }}>
                              <span>الإجمالي: <strong>{entry.totalAmount} ج.م</strong></span>
                              {entry.paidAmount > 0 && <span style={{ color: '#16a34a' }}>دفع: <strong>{entry.paidAmount} ج.م</strong></span>}
                              {remaining > 0 && <span style={{ color: '#dc2626' }}>متبقي: <strong>{remaining} ج.م</strong></span>}
                            </div>
                          </div>
                          <button onClick={() => setCreditEntries(creditEntries.filter(e => e.id !== entry.id))} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '1.1rem', padding: '0.2rem 0.5rem' }}>×</button>
                        </div>
                      );
                    })}
                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#0369a1', padding: '0.3rem 0.5rem', backgroundColor: '#e0f2fe', borderRadius: '6px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>إجمالي الآجل:</span>
                      <span>{totalCreditAmount} ج.م (متبقي: {creditEntries.reduce((a, e) => a + e.totalAmount - e.paidAmount, 0)} ج.م)</span>
                    </div>
                  </div>
                )}
              </div>
              <div style={{ backgroundColor: '#fff1f2', padding: '1rem', borderRadius: '8px', border: '1px solid #fecaca' }}>
                 <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.8rem', color: 'var(--danger)', fontWeight: 800 }}>تسجيل الهالك من الخبز</label>
                 <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1.5fr', gap: '0.8rem' }}>
                   <div>
                     <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '0.3rem' }}>الكمية بالرغيف</label>
                     <input type="number" value={wasteCount} onChange={(e) => setWasteCount(e.target.value)} className="input-field" style={{ width: '100%', padding: '0.5rem' }} placeholder="0" />
                   </div>
                   <div>
                     <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '0.3rem' }}>سعر الرغيف</label>
                     <input type="number" value={wastePrice} onChange={(e) => setWastePrice(e.target.value)} className="input-field" style={{ width: '100%', padding: '0.5rem' }} placeholder="0" />
                   </div>
                   <div>
                     <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '0.3rem' }}>محمل على (يُخصم من):</label>
                     <select value={wasteBearer} onChange={e => setWasteBearer(e.target.value)} className="input-field" style={{ width: '100%', padding: '0.5rem' }}>
                       <option value="loss">إعدام وخسارة (بدون ثمن)</option>
                       <option value="sold">مباع كعلف/كسر (يُضاف لإيراد المخبز)</option>
                       {selectedWorkers.length > 0 && <option disabled>──────────</option>}
                       {selectedWorkers.map(w => (
                         <option key={w.id} value={w.id}>غرامة تخصم من العامل: {w.name}</option>
                       ))}
                     </select>
                   </div>
                 </div>
                 {wasteValue > 0 && (
                   <div style={{ marginTop: '0.8rem', fontSize: '0.8rem', color: '#be123c', fontWeight: 'bold' }}>
                     قيمة الهالك الإجمالية: {Math.round(wasteValue)} ج.م
                     {wasteBearer === 'loss' && ' (مُسجلة كخسارة ولن تؤثر على الإيرادات)'}
                     {wasteBearer === 'sold' && ' (سيُضاف هذا المبلغ لحسبة إيرادات المخبز وتزيد الربحية)'}
                     {wasteBearer !== 'loss' && wasteBearer !== 'sold' && ' (هذه القيمة تم خصمها استرداداً من أجر العامل المنعكسة بالأرباح)'}
                   </div>
                 )}
              </div>
            </div>
          </div>

          <div className="card glass">
            <h4 style={{ color: 'var(--secondary)', marginBottom: '1.2rem' }}>استهلاك الخامات (غير الدقيق)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
              {ingredients.filter(i => i.id !== 'flour' && i.id !== 'gas').map(ing => (
                <div key={ing.id} style={{ backgroundColor: '#fdfcf7', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(146, 64, 14, 0.05)' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-main)' }}>{ing.name} ({ing.unitName})</label>
                  <input 
                    type="number" 
                    value={materialQuantities[ing.id] || ''} 
                    onChange={(e) => updateMaterialQty(ing.id, e.target.value)}
                    className="input-field"
                    style={{ padding: '0.5rem' }}
                    placeholder="0"
                  />
                </div>
              ))}
              {gasSystem === 'cylinder' && (
                <div style={{ backgroundColor: '#fff7ed', padding: '1rem', borderRadius: '12px', border: '1px solid #fdba74' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.5rem', color: '#c2410c' }}>عدد الأنابيب ⛽</label>
                  <input 
                    type="number" 
                    value={cylinderCount} 
                    onChange={(e) => setCylinderCount(e.target.value)}
                    className="input-field"
                    style={{ padding: '0.5rem', borderColor: '#fdba74' }}
                    placeholder="0"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="card glass">
            <h4 style={{ color: 'var(--primary)', marginBottom: '1.2rem' }}>طاقم العمل في هذه الوردية</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', marginBottom: '1.5rem', backgroundColor: '#fdfdfd', padding: '1rem', borderRadius: '12px', border: '1px dashed #ddd' }}>
              {workers.map(w => {
                const isSelected = selectedWorkers.find(sw => sw.id === w.id);
                return (
                  <button 
                    key={w.id}
                    onClick={() => toggleWorker(w)}
                    style={{ 
                      padding: '0.6rem 1.2rem', borderRadius: '2rem', border: isSelected ? 'none' : '1px solid #ccc', cursor: 'pointer',
                      backgroundColor: isSelected ? 'var(--primary)' : 'white',
                      color: isSelected ? 'white' : 'var(--text-main)',
                      fontWeight: isSelected ? 'bold' : 'normal',
                      boxShadow: isSelected ? '0 4px 10px rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    {w.name} {isSelected ? '✓' : ''}
                  </button>
                );
              })}
            </div>

            {selectedWorkers.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h5 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>تحديد أجور العمل والسلف المخصومة:</h5>
                {selectedWorkers.map(sw => (
                  <div key={sw.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', backgroundColor: '#f9fafb', padding: '0.8rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '800', fontSize: '0.95rem', color: 'var(--primary)' }}>{sw.name}</span>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <select 
                          value={sw.type} 
                          onChange={(e) => updateShiftWorker(sw.id, 'type', e.target.value)} 
                          style={{ padding: '0.3rem', fontSize: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                        >
                          <option value="fixed">ثابت</option>
                          <option value="commission">عمولة</option>
                        </select>
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: sw.type === 'commission' ? '1fr 1fr 1fr' : '1fr 1fr', gap: '0.8rem', paddingBottom: '0.5rem' }}>
                      <div>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>قيمة الأجر</label>
                        <input type="number" value={sw.rate} onChange={(e) => updateShiftWorker(sw.id, 'rate', e.target.value)} style={{ padding: '0.5rem', width: '100%', fontSize: '0.85rem', borderRadius: '8px', border: '1px solid #ddd' }} />
                      </div>
                      {sw.type === 'commission' && (
                        <div>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>عدد أجولة العامل</label>
                          <input type="number" value={sw.customSacks || ''} onChange={(e) => updateShiftWorker(sw.id, 'customSacks', e.target.value)} placeholder={sacks || '0'} style={{ padding: '0.5rem', width: '100%', fontSize: '0.85rem', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: sw.customSacks ? '#fff' : '#f0f9ff' }} />
                        </div>
                      )}
                      <div>
                        <label style={{ fontSize: '0.7rem', color: '#c2410c', fontWeight: 'bold', display: 'block', marginBottom: '0.2rem' }}>سحب نقدي (سلفة يومية)</label>
                        <input type="number" value={sw.advance === 0 ? '' : (sw.advance || '')} onChange={(e) => updateShiftWorker(sw.id, 'advance', e.target.value)} placeholder="0" style={{ padding: '0.5rem', width: '100%', fontSize: '0.85rem', borderRadius: '8px', border: '1px solid #fdba74', backgroundColor: '#fff7ed', color: '#c2410c', fontWeight: 'bold' }} />
                      </div>
                    </div>

                    {(() => {
                      const wage = sw.type === 'commission' ? (sw.rate * (Number(sw.customSacks || sacks) || 0)) : Number(sw.rate);
                      const adv = Number(sw.advance) || 0;
                      const workerWaste = wasteBearer === sw.id ? wasteValue : 0;
                      const net = wage - adv - workerWaste;
                      
                      return (
                        <div style={{ marginTop: '0.3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#e0f2fe', padding: '0.6rem 0.8rem', borderRadius: '8px', fontSize: '0.85rem', border: '1px dashed #7dd3fc' }}>
                          <span style={{ color: '#0369a1', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                             <span>يومية: <strong>{Math.round(wage)}</strong></span>
                             {workerWaste > 0 && <span style={{ color: '#be123c' }}>- هالك: <strong>{Math.round(workerWaste)}</strong></span>}
                             {adv > 0 && <span style={{ color: '#c2410c' }}>- سلفة: <strong>{Math.round(adv)}</strong></span>}
                             <span>=</span>
                          </span>
                          <span style={{ fontWeight: 800, color: '#075985', fontSize: '0.95rem' }}>
                            باقي الصافي: {Math.round(net)} ج.م
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="card glass">
            <h4 style={{ color: 'var(--danger)', marginBottom: '1.2rem' }}>نثريات وطوارئ الوردية (الدرج)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(120px, 1fr) 1.5fr 1fr auto', gap: '0.5rem', alignItems: 'end', marginBottom: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', marginBottom: '0.3rem', display: 'block' }}>النوع</label>
                <select value={shiftUtilityForm.type} onChange={e => setShiftUtilityForm({...shiftUtilityForm, type: e.target.value, name: ''})} className="input-field" style={{ padding: '0.6rem' }}>
                  <option value="maintenance">صيانة طارئة 🛠️</option>
                  <option value="food">فطار/شاي ☕</option>
                  <option value="other">مصاريف أخرى 📝</option>
                </select>
              </div>
              {shiftUtilityForm.type === 'other' && (
                <div>
                  <label style={{ fontSize: '0.75rem', marginBottom: '0.3rem', display: 'block' }}>البيان (اسم المصروف)</label>
                  <input type="text" value={shiftUtilityForm.name} onChange={e => setShiftUtilityForm({...shiftUtilityForm, name: e.target.value})} className="input-field" style={{ padding: '0.6rem' }} placeholder="ورق، أكياس..." />
                </div>
              )}
              <div>
                <label style={{ fontSize: '0.75rem', marginBottom: '0.3rem', display: 'block' }}>المبلغ</label>
                <input type="number" value={shiftUtilityForm.amount} onChange={e => setShiftUtilityForm({...shiftUtilityForm, amount: e.target.value})} className="input-field" style={{ padding: '0.6rem' }} placeholder="0" />
              </div>
              <button className="btn-primary" onClick={handleAddShiftUtility} style={{ padding: '0.6rem 1rem', backgroundColor: 'var(--danger)' }}>إضافة</button>
            </div>
            {shiftUtilities.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {shiftUtilities.map(u => (
                  <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                      {u.type === 'maintenance' ? 'صيانة طارئة' : u.type === 'food' ? 'فطار/شاي' : (u.name || 'أخرى')}
                    </span>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <span style={{ color: 'var(--danger)', fontWeight: 'bold', fontSize: '0.8rem' }}>{u.amount} ج.م</span>
                      <button onClick={() => removeShiftUtility(u.id)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '1.2rem', padding: '0 0.4rem' }}>×</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Summaries */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card glass" style={{ background: 'var(--primary-gradient)', color: 'white', border: 'none' }}>
            <h4 style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '0.8rem', fontWeight: 800 }}>حسبة الوردية (تقديري)</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ opacity: 0.9 }}>إجمالي الدقيق والخامات:</span>
                <span style={{ fontWeight: 700 }}>{Math.round(flourCost + gasCost + otherMaterialsCost)} ج.م</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ opacity: 0.9 }}>أجور طاقم الوردية:</span>
                <span style={{ fontWeight: 700 }}>{Math.round(actualWorkerCost)} ج.م</span>
              </div>
              {shiftUtilities.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ffb3b3' }}>
                  <span style={{ opacity: 0.9 }}>فواتير مسحوبة من الدرج:</span>
                  <span style={{ fontWeight: 700 }}>{Math.round(totalShiftUtilities)} ج.م</span>
                </div>
              )}

              
              <div style={{ 
                marginTop: '1rem', 
                backgroundColor: 'rgba(255,255,255,0.1)', 
                padding: '1.2rem', 
                borderRadius: '16px',
                display: 'flex', 
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                {grossRevenue !== Number(revenue) && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', color: '#bae6fd' }}>
                    <span>إجمالي المبيعات (كاش + آجل):</span>
                    <span style={{ fontWeight: 'bold' }}>{Math.round(grossRevenue).toLocaleString()} ج.م</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 800 }}>أرباح الوردية التشغيلية:</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: profit >= 0 ? '#4ade80' : '#f87171' }}>
                      {Math.round(profit).toLocaleString()} <span style={{ fontSize: '0.8rem' }}>ج.م</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Disclaimer notice */}
              <div style={{
                marginTop: '1rem',
                backgroundColor: 'rgba(251, 191, 36, 0.15)',
                border: '1px solid rgba(251, 191, 36, 0.4)',
                borderRadius: '10px',
                padding: '0.8rem 1rem',
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'flex-start'
              }}>
                <span style={{ fontSize: '1rem', flexShrink: 0 }}>⚠️</span>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: 1.5 }}>
                  هذا الربح <strong>تشغيلي فقط</strong> ولا يشمل خصم الإيجار أو فواتير الكهرباء والمياه.<br/>
                  الربح الصافي الحقيقي بعد خصم كل المصاريف يظهر في <strong>صفحة التقارير</strong>.
                </p>
              </div>
            </div>
            <button 
              className="btn-primary" 
              style={{ 
                width: '100%', 
                padding: '1.25rem', 
                marginTop: '1.5rem', 
                fontSize: '1.1rem',
                backgroundColor: editMode ? 'var(--warning)' : 'white',
                color: editMode ? 'white' : 'var(--primary)',
                boxShadow: '0 8px 20px rgba(0,0,0,0.1)'
              }}
              onClick={() => {
                onSave({ 
                  id: editMode ? editId : Date.now().toString(),
                  sacks: Number(sacks), 
                  revenue: Number(revenue), // physical cash
                  grossRevenue,             // physical + credit + sold waste
                  creditSales: creditEntries.length > 0 ? creditEntries : null, // new array format
                  wasteCount: Number(wasteCount),
                  wastePrice: Number(wastePrice),
                  wasteBearer,
                  wasteValue,
                  shift, 
                  flourCost,
                  workerCost: actualWorkerCost,
                  gasCost,
                  otherMaterialsCost,
                  totalCost, 
                  profit, 
                  workers: selectedWorkers, 
                  ingredientsSnapshot: ingredients,
                  materialUsage: materialQuantities,
                  gasUsage: gasSystem === 'cylinder' ? Number(cylinderCount) : Number(sacks), // Track usage
                  shiftUtilities,
                  totalAdvances
                }, editMode);
              }}
            >{editMode ? 'تحديث وحفظ التعديلات 📝' : 'حفظ الوردية الجارية ✅'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Expenses;
