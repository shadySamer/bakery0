import React, { useState } from 'react';
import { Building2, Plus, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Clients = ({ clients, onAddClient, onAddTransaction, isMobile }) => {
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  
  const [showTransactionModal, setShowTransactionModal] = useState(null); // stores client id
  const [transaction, setTransaction] = useState({ type: 'payment', amount: '', note: '' });

  // Compute total debt across all clients
  const totalMarketDebt = clients.reduce((acc, client) => {
    return acc + (client.transactions || []).reduce((tAcc, t) => {
      // debt increases if they take goods (credit_sale), decreases if they pay (payment)
      return tAcc + (t.type === 'credit_sale' ? Number(t.amount) : -Number(t.amount));
    }, 0);
  }, 0);

  const handleCreateClient = () => {
    if (!newClientName.trim()) return;
    onAddClient(newClientName.trim());
    setNewClientName('');
    setShowAddClientModal(false);
  };

  const handleSaveTransaction = () => {
    if (!transaction.amount) return;
    onAddTransaction(showTransactionModal, {
      amount: Number(transaction.amount),
      type: transaction.type, // 'credit_sale' or 'payment'
      note: transaction.note,
      date: new Date().toISOString()
    });
    setTransaction({ type: 'payment', amount: '', note: '' });
    setShowTransactionModal(null);
  };

  const getClientDebt = (client) => {
    return (client.transactions || []).reduce((acc, t) => {
      return acc + (t.type === 'credit_sale' ? Number(t.amount) : -Number(t.amount));
    }, 0);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ color: 'var(--primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building2 size={28} /> حسابات العملاء الآجل
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>متابعة مديونيات البقالات والمطاعم وتسديداتهم.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAddClientModal(true)} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Plus size={20} /> إضافة عميل جديد
        </button>
      </header>

      {/* Overview Card */}
      <div className="card glass" style={{ borderRight: '6px solid var(--primary)' }}>
        <p style={{ color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Wallet size={20} /> إجمالي الديون المستحقة بالسوق للمخبز
        </p>
        <h3 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary)', margin: '0.5rem 0' }}>
          {Math.max(0, totalMarketDebt).toLocaleString()} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>ج.م</span>
        </h3>
      </div>

      {/* Clients List */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
        {clients.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', backgroundColor: 'white', borderRadius: '16px' }}>
             <p>لا يوجد عملاء مضافين لدفتر الآجل.</p>
          </div>
        ) : (
          clients.map(client => {
            const debt = getClientDebt(client);
            return (
              <div key={client.id} className="card glass" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>{client.name}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      المديونية الحالية: <span style={{ fontWeight: 'bold', color: debt > 0 ? 'var(--danger)' : 'var(--success)' }}>{debt} ج.م</span>
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowTransactionModal(client.id)}
                    style={{ backgroundColor: 'var(--primary)15', color: 'var(--primary)', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    تسوية / مديونية
                  </button>
                </div>
                
                {/* Recent Transactions Snippet */}
                {client.transactions && client.transactions.length > 0 && (
                  <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem', marginTop: 'auto' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>آخر الحركات:</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {client.transactions.slice(0, 3).map(t => (
                        <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: t.type === 'payment' ? 'var(--success)' : 'var(--danger)' }}>
                            {t.type === 'payment' ? <ArrowDownRight size={14}/> : <ArrowUpRight size={14}/>} 
                            {t.type === 'payment' ? 'تسديد دفعة' : 'سحب بضاعة آجل'} {t.note ? `(${t.note})` : ''}
                          </span>
                          <span style={{ fontWeight: 'bold' }}>{t.amount} ج.م</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Client Modal */}
      <AnimatePresence>
        {showAddClientModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="card glass" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
              <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>إضافة عميل جديد للآجل</h3>
              <input type="text" className="input-field" value={newClientName} onChange={e => setNewClientName(e.target.value)} placeholder="اسم السوبرماركت أو العميل" autoFocus />
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button className="btn-primary" style={{ flex: 1 }} onClick={handleCreateClient}>إضافة</button>
                <button className="btn-secondary" style={{ flex: 1, backgroundColor: '#f1f5f9', color: '#475569' }} onClick={() => setShowAddClientModal(false)}>إلغاء</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transaction Modal */}
      <AnimatePresence>
        {showTransactionModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="card glass" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>تسجيل حركة للعميل</h3>
              <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 800 }}>
                ({clients.find(c => c.id === showTransactionModal)?.name})
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="input-label">نوع الحركة</label>
                  <select className="input-field" value={transaction.type} onChange={e => setTransaction({...transaction, type: e.target.value})}>
                    <option value="payment">تسديد دفعة مالية (يقلل الديون)</option>
                    <option value="credit_sale">سحب بضاعة آجل (يزيد الديون)</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">المبلغ (ج.م)</label>
                  <input type="number" className="input-field" value={transaction.amount} onChange={e => setTransaction({...transaction, amount: e.target.value})} placeholder="0" />
                </div>
                <div>
                  <label className="input-label">ملاحظات (اختياري)</label>
                  <input type="text" className="input-field" value={transaction.note} onChange={e => setTransaction({...transaction, note: e.target.value})} placeholder="مثال: من حساب يوم الخميس" />
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button className="btn-primary" style={{ flex: 1 }} onClick={handleSaveTransaction}>حفظ</button>
                  <button className="btn-secondary" style={{ flex: 1, backgroundColor: '#f1f5f9', color: '#475569' }} onClick={() => setShowTransactionModal(null)}>إلغاء</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Clients;
