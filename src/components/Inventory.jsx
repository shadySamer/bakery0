import React, { useState } from 'react';
import { Package, Plus, TrendingUp, AlertTriangle, ArrowDownCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Inventory = ({ inventoryList, dailyRecords, onAddInventory, onUpdateInventory, onDeleteInventory, isMobile, ingredients }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({ type: 'flour', name: 'شيكارة دقيق (50 كجم)', quantity: '', totalCost: '' });
  const [editItemId, setEditItemId] = useState(null);

  // Calculate current stock dynamically
  // 1. Total Flour added to inventory
  const totalFlourAdded = inventoryList.filter(i => i.type === 'flour').reduce((acc, item) => acc + Number(item.quantity), 0);
  // 2. Total Flour used in shifts
  const totalFlourUsed = dailyRecords.reduce((acc, r) => acc + Number(r.sacks || 0), 0);
  const currentFlourStock = totalFlourAdded - totalFlourUsed;

  // Gas Cylinders
  const totalGasAdded = inventoryList.filter(i => i.type === 'gas').reduce((acc, item) => acc + Number(item.quantity), 0);
  const totalGasUsed = dailyRecords.reduce((acc, r) => acc + Number(r.gasUsage || 0), 0);
  const currentGasStock = totalGasAdded - totalGasUsed;

  const handleAdd = () => {
    if (!newItem.quantity || !newItem.totalCost) return;
    
    const cost = Number(newItem.totalCost);
    const qty = Number(newItem.quantity);
    
    if (editItemId) {
      onUpdateInventory(editItemId, {
        type: newItem.type,
        name: newItem.name,
        quantity: qty,
        totalCost: cost,
        unitCost: cost / qty
      });
    } else {
      onAddInventory({
        id: Date.now().toString(),
        type: newItem.type,
        name: newItem.name,
        quantity: qty,
        totalCost: cost,
        unitCost: cost / qty,
        addedAt: new Date().toISOString()
      });
    }
    
    setNewItem({ type: 'flour', name: 'شيكارة دقيق (50 كجم)', quantity: '', totalCost: '' });
    setEditItemId(null);
    setShowAddModal(false);
  };

  const handleEditClick = (item) => {
    setEditItemId(item.id);
    setNewItem({
      type: item.type,
      name: item.name,
      quantity: item.quantity.toString(),
      totalCost: item.totalCost.toString()
    });
    setShowAddModal(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ color: 'var(--primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={28} /> إدارة المخازن
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>تابع الرصيد الحي للخامات وحركة المشتريات.</p>
        </div>
        <button className="btn-primary" onClick={() => {
          setEditItemId(null);
          setNewItem({ type: 'flour', name: 'شيكارة دقيق (50 كجم)', quantity: '', totalCost: '' });
          setShowAddModal(true);
        }} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Plus size={20} /> تسجيل وارد جديد
        </button>
      </header>

      {/* Stock Cards */}
      <div className="responsive-grid">
        <div className="card glass" style={{ borderRight: currentFlourStock < 20 ? '6px solid var(--danger)' : '6px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <p style={{ color: 'var(--text-muted)', fontWeight: 700 }}>رصيد الدقيق الحالي</p>
            {currentFlourStock < 20 && <AlertTriangle size={20} color="var(--danger)" />}
          </div>
          <h3 style={{ fontSize: '2.5rem', fontWeight: 900, color: currentFlourStock < 20 ? 'var(--danger)' : 'var(--text-main)', margin: '0.5rem 0' }}>
            {currentFlourStock} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>شوال</span>
          </h3>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem' }}>
            <span style={{ color: 'var(--success)' }}>وارد: {totalFlourAdded}</span>
            <span style={{ color: 'var(--danger)' }}>مستهلك: {totalFlourUsed}</span>
          </div>
        </div>

        <div className="card glass" style={{ borderRight: currentGasStock < 5 ? '6px solid var(--warning)' : '6px solid var(--primary)' }}>
          <p style={{ color: 'var(--text-muted)', fontWeight: 700 }}>رصيد أسطوانات الغاز</p>
          <h3 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-main)', margin: '0.5rem 0' }}>
            {currentGasStock} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>أسطوانة</span>
          </h3>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem' }}>
             <span style={{ color: 'var(--success)' }}>وارد: {totalGasAdded}</span>
             <span style={{ color: 'var(--danger)' }}>مستهلك: {totalGasUsed}</span>
          </div>
        </div>
      </div>

      {/* History Log */}
      <div className="card glass">
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={20} color="var(--primary)" /> سجل الواردات (المشتريات)
        </h3>
        
        {inventoryList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <Package size={48} opacity={0.2} style={{ margin: '0 auto 1rem' }} />
            <p>لا توجد أي مشتريات مسجلة في المخزن.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>التاريخ</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>الصنف</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>الكمية</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>التكلفة الإجمالية</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>تكلفة الوحدة</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {inventoryList.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt)).map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{new Date(item.addedAt).toLocaleDateString('ar-EG')}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', backgroundColor: item.type === 'flour' ? '#f0fdf4' : '#fff7ed', color: item.type === 'flour' ? '#166534' : '#c2410c', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                        <ArrowDownCircle size={14} /> {item.name}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold' }}>{item.quantity}</td>
                    <td style={{ padding: '1rem', textAlign: 'center', color: 'var(--danger)', fontWeight: 'bold' }}>{item.totalCost.toLocaleString()} ج.م</td>
                    <td style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>{Math.round(item.unitCost).toLocaleString()} ج.م</td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button onClick={() => handleEditClick(item)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--warning)', fontWeight: 'bold' }}>تعديل ✏️</button>
                        <button onClick={() => { if(window.confirm('موافق على الحذف؟')) onDeleteInventory(item.id); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontWeight: 'bold' }}>حذف 🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="card glass" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
              <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>{editItemId ? 'تعديل فاتورة وارد للمخزن' : 'تسجيل مشتريات واردة'}</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="input-label">نوع الصنف</label>
                  <select 
                    className="input-field"
                    value={newItem.type}
                    onChange={(e) => {
                      const type = e.target.value;
                      if (type === 'flour') {
                         setNewItem({ ...newItem, type, name: 'شيكارة دقيق (50 كجم)' });
                      } else if (type === 'gas') {
                         setNewItem({ ...newItem, type, name: 'أسطوانة غاز تجاري' });
                      } else if (type === 'other') {
                         setNewItem({ ...newItem, type, name: '' });
                      } else {
                         const ing = ingredients?.find(i => i.id === type);
                         setNewItem({ ...newItem, type, name: ing ? ing.name : '' });
                      }
                    }}
                  >
                    <option value="flour">طحين / دقيق</option>
                    <option value="gas">أسطوانات غاز</option>
                    {ingredients && ingredients.filter(i => i.id !== 'flour' && i.id !== 'gas').map(ing => (
                      <option key={ing.id} value={ing.id}>{ing.name}</option>
                    ))}
                    <option value="other">إضافة صنف جديد كلياً +</option>
                  </select>
                </div>

                {newItem.type === 'other' && (
                  <div>
                    <label className="input-label">اسم الصنف الجديد</label>
                    <input type="text" className="input-field" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} placeholder="سيتم إضافته لإعدادات المخبز وإسعاره" />
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label className="input-label">الكمية الواردة</label>
                    <input type="number" className="input-field" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: e.target.value})} placeholder="العدد" />
                  </div>
                  <div>
                    <label className="input-label">إجمالي التكلفة (ج.م)</label>
                    <input type="number" className="input-field" value={newItem.totalCost} onChange={e => setNewItem({...newItem, totalCost: e.target.value})} placeholder="المبلغ الكلي المدفوع" />
                  </div>
                </div>

                {newItem.quantity && newItem.totalCost && (
                  <div style={{ padding: '0.8rem', backgroundColor: '#f8fafc', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center', marginTop: '0.5rem' }}>
                    تكلفة الوحدة الواحدة: <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{Math.round(Number(newItem.totalCost) / Number(newItem.quantity)).toLocaleString()} ج.م</span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button className="btn-primary" style={{ flex: 1 }} onClick={handleAdd}>{editItemId ? 'حفظ التعديلات' : 'حفظ الوارد'}</button>
                  <button className="btn-secondary" style={{ flex: 1, backgroundColor: '#f1f5f9', color: '#475569' }} onClick={() => setShowAddModal(false)}>إلغاء</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Inventory;
