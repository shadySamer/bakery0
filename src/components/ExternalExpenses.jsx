import React, { useState } from 'react';
import { Receipt, X, Pencil, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const typeLabel = (type, name) => {
  if (type === 'electricity') return 'كهرباء ⚡';
  if (type === 'gas') return 'غاز 🔥';
  if (type === 'water') return 'مياه 💧';
  if (type === 'fixed_payment') return name || 'دفع ثابت';
  return name || 'أخرى';
};

const ExternalExpenses = ({ utilityExpenses, fixedExpenses, onAddUtility, setFixedExpenses, onUpdateUtility, onDeleteUtility }) => {
  const [newUtility, setNewUtility] = useState({ type: 'electricity', amount: '', name: '' });
  const [editingUtilityId, setEditingUtilityId] = useState(null);
  const [editingUtilityData, setEditingUtilityData] = useState({});
  const [editingFixedId, setEditingFixedId] = useState(null);
  const [editingFixedData, setEditingFixedData] = useState({});

  const handleAddUtility = () => {
    if (!newUtility.amount) {
      toast.error('برجاء إدخال المبلغ');
      return;
    }
    const finalName = newUtility.type === 'fixed_payment' ? newUtility.name : '';
    onAddUtility({ ...newUtility, name: finalName, amount: Number(newUtility.amount) });
    setNewUtility({ type: 'electricity', amount: '', name: '' });
  };

  const handleSaveUtilityEdit = (id) => {
    if (!editingUtilityData.amount) {
      toast.error('برجاء إدخال المبلغ');
      return;
    }
    if (onUpdateUtility) {
      onUpdateUtility(id, { ...editingUtilityData, amount: Number(editingUtilityData.amount) });
    }
    setEditingUtilityId(null);
    toast.success('تم تعديل الفاتورة');
  };

  const handleSaveFixedEdit = (id) => {
    if (!editingFixedData.name || !editingFixedData.amount) {
      toast.error('برجاء إدخال البيان والمبلغ');
      return;
    }
    setFixedExpenses((fixedExpenses || []).map(f =>
      f.id === id ? { ...f, name: editingFixedData.name, amount: Number(editingFixedData.amount) } : f
    ));
    setEditingFixedId(null);
    toast.success('تم تعديل المصرف الثابت');
  };

  const visibleUtilities = utilityExpenses.filter(e => e.type !== 'cylinder_usage');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header>
        <h2 style={{ color: 'var(--danger)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Receipt size={28} /> مصروفات خارجية وإيجار
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>سجل الفواتير والإيجارات التي تُدفع خارج نطاق الورديات. يمكنك الشحن أكثر من مرة.</p>
      </header>

      {/* Add new bill */}
      <div className="card glass">
        <h4 style={{ color: 'var(--secondary)', marginBottom: '1rem' }}>تسجيل دفع فاتورة / شحن</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr) auto', gap: '0.8rem', alignItems: 'end' }}>
          <div>
            <label style={{ fontSize: '0.8rem' }}>نوع الخدمة</label>
            <select
              value={newUtility.type}
              onChange={(e) => setNewUtility({...newUtility, type: e.target.value})}
              className="input-field"
              style={{ width: '100%' }}
            >
              <option value="electricity">كهرباء ⚡</option>
              <option value="gas">غاز 🔥 (شحن عداد)</option>
              <option value="water">مياه 💧</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.8rem' }}>المبلغ (ج.م)</label>
            <input
              type="number"
              value={newUtility.amount}
              onChange={(e) => setNewUtility({...newUtility, amount: e.target.value})}
              placeholder="0.00"
              className="input-field"
              style={{ width: '100%' }}
            />
          </div>
          <button className="btn-primary" onClick={handleAddUtility}>تسجيل دفعة</button>
        </div>

        {/* Bills list with edit/delete */}
        <div style={{ marginTop: '2rem' }}>
          <h5 style={{ marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
            سجل المدفوعات ({visibleUtilities.length})
          </h5>
          {visibleUtilities.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>لا يوجد عمليات مسجلة</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '280px', overflowY: 'auto' }}>
              {visibleUtilities.map(exp => (
                <div key={String(exp.id)} style={{
                  backgroundColor: 'white',
                  borderRadius: '10px',
                  border: '1px solid #eee',
                  padding: '0.75rem 1rem',
                }}>
                  {String(editingUtilityId) === String(exp.id) ? (
                    // Edit mode
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr auto auto', gap: '0.5rem', alignItems: 'center' }}>
                      <select
                        value={editingUtilityData.type}
                        onChange={e => setEditingUtilityData({...editingUtilityData, type: e.target.value})}
                        className="input-field"
                        style={{ padding: '0.4rem', fontSize: '0.85rem' }}
                      >
                        <option value="electricity">كهرباء ⚡</option>
                        <option value="gas">غاز 🔥</option>
                        <option value="water">مياه 💧</option>
                      </select>
                      <input
                        type="number"
                        value={editingUtilityData.amount}
                        onChange={e => setEditingUtilityData({...editingUtilityData, amount: e.target.value})}
                        className="input-field"
                        style={{ padding: '0.4rem', fontSize: '0.85rem' }}
                        placeholder="المبلغ"
                      />
                      <button
                        onClick={() => handleSaveUtilityEdit(exp.id)}
                        style={{ background: '#16a34a', border: 'none', color: 'white', borderRadius: '6px', padding: '0.4rem 0.6rem', cursor: 'pointer' }}
                      ><Check size={14} /></button>
                      <button
                        onClick={() => setEditingUtilityId(null)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.4rem' }}
                      ><X size={14} /></button>
                    </div>
                  ) : (
                    // View mode
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{typeLabel(exp.type, exp.name)}</span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(exp.date).toLocaleDateString('ar-EG', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--danger)', fontSize: '1rem' }}>{exp.amount} ج.م</span>
                        <button
                          onClick={() => { setEditingUtilityId(exp.id); setEditingUtilityData({ type: exp.type, amount: exp.amount }); }}
                          style={{ background: 'rgba(99,102,241,0.1)', border: 'none', color: '#6366f1', borderRadius: '6px', padding: '0.35rem 0.5rem', cursor: 'pointer' }}
                          title="تعديل"
                        ><Pencil size={13} /></button>
                        <button
                          onClick={() => {
                            if (window.confirm('هل تريد حذف هذه الفاتورة؟')) {
                              if (onDeleteUtility) onDeleteUtility(exp.id);
                              else toast.error('خاصية الحذف غير متوفرة');
                            }
                          }}
                          style={{ background: 'rgba(239,68,68,0.08)', border: 'none', color: 'var(--danger)', borderRadius: '6px', padding: '0.35rem 0.5rem', cursor: 'pointer' }}
                          title="حذف"
                        ><X size={13} /></button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fixed expenses (rent etc.) */}
      <div className="card glass" style={{ borderRight: '4px solid #6366f1' }}>
        <h4 style={{ color: '#4f46e5', marginBottom: '1rem' }}>المصاريف الثابتة (إيجار وغيره) 🏠</h4>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          أضف هنا الإيجار الشهري والالتزامات الثابتة. يمكنك تعديل المبالغ في أي وقت إذا تغيرت.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr) auto', gap: '0.8rem', alignItems: 'end', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem' }}>بند المصرف</label>
            <input
              id="fixed-name-ext"
              type="text"
              placeholder="إيجار المحل، تأمينات..."
              className="input-field"
            />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem' }}>المبلغ الشهري</label>
            <input
              id="fixed-amount-ext"
              type="number"
              placeholder="0.00"
              className="input-field"
            />
          </div>
          <button
            className="btn-primary"
            style={{ backgroundColor: '#4f46e5' }}
            onClick={() => {
              const name = document.getElementById('fixed-name-ext').value;
              const amount = document.getElementById('fixed-amount-ext').value;
              if (name && amount) {
                setFixedExpenses([...(fixedExpenses || []), { id: Date.now(), name, amount: Number(amount) }]);
                document.getElementById('fixed-name-ext').value = '';
                document.getElementById('fixed-amount-ext').value = '';
                toast.success('تمت إضافة المصرف الثابت');
              } else {
                toast.error('برجاء إدخال البيان والمبلغ');
              }
            }}
          >إضافة</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {(fixedExpenses || []).map(f => (
            <div key={f.id} style={{
              padding: '0.8rem 1rem',
              backgroundColor: 'white',
              borderRadius: '10px',
              border: '1px solid #eee',
            }}>
              {editingFixedId === f.id ? (
                // Edit mode
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr auto auto', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={editingFixedData.name}
                    onChange={e => setEditingFixedData({...editingFixedData, name: e.target.value})}
                    className="input-field"
                    style={{ padding: '0.4rem', fontSize: '0.85rem' }}
                    placeholder="البيان"
                  />
                  <input
                    type="number"
                    value={editingFixedData.amount}
                    onChange={e => setEditingFixedData({...editingFixedData, amount: e.target.value})}
                    className="input-field"
                    style={{ padding: '0.4rem', fontSize: '0.85rem' }}
                    placeholder="المبلغ الشهري"
                  />
                  <button
                    onClick={() => handleSaveFixedEdit(f.id)}
                    style={{ background: '#16a34a', border: 'none', color: 'white', borderRadius: '6px', padding: '0.4rem 0.6rem', cursor: 'pointer' }}
                  ><Check size={14} /></button>
                  <button
                    onClick={() => setEditingFixedId(null)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.4rem' }}
                  ><X size={14} /></button>
                </div>
              ) : (
                // View mode
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontWeight: 'bold', display: 'block' }}>{f.name}</span>
                    <span style={{ color: '#4f46e5', fontWeight: 'bold', fontSize: '0.85rem' }}>{f.amount} ج.م / شهر</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                      onClick={() => {
                        if(window.confirm(`تأكيد تسجيل دفع (${f.name}) كمصروف مدفوع؟`)) {
                          onAddUtility({ type: 'fixed_payment', amount: f.amount, name: f.name });
                        }
                      }}
                      style={{
                        padding: '0.4rem 0.7rem',
                        backgroundColor: 'rgba(79, 70, 229, 0.1)',
                        color: '#4f46e5',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >تسجيل دفع ✅</button>
                    <button
                      onClick={() => { setEditingFixedId(f.id); setEditingFixedData({ name: f.name, amount: f.amount }); }}
                      style={{ background: 'rgba(99,102,241,0.1)', border: 'none', color: '#6366f1', borderRadius: '6px', padding: '0.35rem 0.5rem', cursor: 'pointer' }}
                      title="تعديل"
                    ><Pencil size={13} /></button>
                    <button
                      onClick={() => setFixedExpenses(fixedExpenses.filter(x => x.id !== f.id))}
                      style={{ backgroundColor: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.4rem' }}
                    ><X size={18} /></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExternalExpenses;
