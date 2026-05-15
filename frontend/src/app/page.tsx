'use client';

import { useEffect, useState, useCallback } from 'react';
import { api, User, Transaction } from '@/lib/api';

type Tab = 'overview' | 'send' | 'history' | 'new-account';
type Toast = { msg: string; type: 'success' | 'error' } | null;

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [toast, setToast] = useState<Toast>(null);
  const [loading, setLoading] = useState(true);

  // Send form
  const [sendTo, setSendTo] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendNote, setSendNote] = useState('');
  const [sending, setSending] = useState(false);

  // New account form
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newBalance, setNewBalance] = useState('');
  const [creating, setCreating] = useState(false);
  const [formErrors, setFormErrors] = useState<{ name?: string; email?: string; balance?: string }>({});

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    try {
      const [u, t] = await Promise.all([api.getUsers(), api.getTransactions()]);
      setUsers(u);
      setTransactions(t);
    } catch {
      showToast('Could not connect to server', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const totalVolume = transactions.reduce((s, t) => s + Number(t.amount), 0);

  // ── Send payment ──
  const handleSend = async () => {
    if (!selectedUser || !sendTo || !sendAmount) return;
    const amount = parseFloat(sendAmount);
    if (isNaN(amount) || amount <= 0) { showToast('Enter a valid amount', 'error'); return; }

    setSending(true);
    try {
      await api.sendPayment({ senderId: selectedUser.id, receiverId: parseInt(sendTo), amount, note: sendNote || undefined });
      showToast('Payment sent successfully', 'success');
      setSendAmount(''); setSendNote(''); setSendTo('');
      await loadData();
      const updated = await api.getUser(selectedUser.id);
      setSelectedUser(updated);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Payment failed', 'error');
    } finally {
      setSending(false);
    }
  };

  // ── Create account ──
  const validateForm = () => {
    const errors: typeof formErrors = {};
    if (!newName.trim()) errors.name = 'Full name is required';
    else if (newName.trim().length < 2) errors.name = 'Name must be at least 2 characters';
    if (!newEmail.trim()) errors.email = 'Email address is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) errors.email = 'Enter a valid email address';
    if (newBalance && isNaN(parseFloat(newBalance))) errors.balance = 'Enter a valid amount';
    else if (newBalance && parseFloat(newBalance) < 0) errors.balance = 'Balance cannot be negative';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateAccount = async () => {
    if (!validateForm()) return;
    setCreating(true);
    try {
      const created = await api.createUser({
        name: newName.trim(),
        email: newEmail.trim().toLowerCase(),
        initialBalance: newBalance ? parseFloat(newBalance) : 0,
      });
      showToast(`Account created for ${created.name}`, 'success');
      setNewName(''); setNewEmail(''); setNewBalance(''); setFormErrors({});
      await loadData();
      setSelectedUser(created);
      setTab('overview');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Could not create account', 'error');
    } finally {
      setCreating(false);
    }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const visibleTx = selectedUser
    ? transactions.filter(t => t.senderId === selectedUser.id || t.receiverId === selectedUser.id)
    : transactions;

  return (
    <>
      <nav>
        <a href="/" className="nav-logo">PayVault.</a>
        <ul className="nav-links">
          <li><a href="#" className={tab === 'overview' ? 'active' : ''} onClick={e => { e.preventDefault(); setTab('overview'); }}>Accounts</a></li>
          <li><a href="#" className={tab === 'send' ? 'active' : ''} onClick={e => { e.preventDefault(); setTab('send'); }}>Send</a></li>
          <li><a href="#" className={tab === 'history' ? 'active' : ''} onClick={e => { e.preventDefault(); setTab('history'); }}>History</a></li>
        </ul>
        <button className="btn" onClick={() => setTab('new-account')}>
          + Open account
        </button>
      </nav>

      <main className="page">
        {/* Hero */}
        <div className="hero">
          <div>
            <div className="section-label">Payment system</div>
            <h1 className="hero-title">Pay<br />Vault.</h1>
            <p className="hero-sub">Simple · Instant · Minimal</p>
          </div>
          <div className="hero-stat">
            <div>
              <div className="stat-label">Total volume</div>
              <div className="stat-value">{fmt(totalVolume)}</div>
            </div>
            <div>
              <div className="stat-label">Active accounts</div>
              <div className="stat-value">{users.length}</div>
            </div>
            <div>
              <div className="stat-label">Transactions</div>
              <div className="stat-value">{transactions.length}</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          {(['overview', 'send', 'history', 'new-account'] as Tab[]).map(t => (
            <button key={t} className={`tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
              {t === 'overview' ? 'Accounts' : t === 'send' ? 'Send money' : t === 'history' ? 'History' : 'Open account'}
            </button>
          ))}
        </div>

        {loading && <div className="loading">Loading…</div>}

        {/* ── Accounts tab ── */}
        {!loading && tab === 'overview' && (
          <>
            <div className="overview-header">
              <div className="section-label">
                {selectedUser ? `Selected — ${selectedUser.name}` : `${users.length} accounts`}
              </div>
              <button className="btn" onClick={() => setTab('new-account')}>+ Open account</button>
            </div>

            <div className="users-grid">
              {users.map(u => (
                <div
                  key={u.id}
                  className={`user-tile${selectedUser?.id === u.id ? ' selected' : ''}`}
                  onClick={() => setSelectedUser(prev => prev?.id === u.id ? null : u)}
                >
                  <div className="user-avatar">{u.name.split(' ').map(n => n[0]).join('').slice(0,2)}</div>
                  <div className="user-name">{u.name}</div>
                  <div className="user-email">{u.email}</div>
                  <div className="balance-label">Balance</div>
                  <div className="user-balance">{fmt(Number(u.balance))}</div>
                </div>
              ))}
            </div>

            {selectedUser && (
              <>
                <hr className="divider" />
                <div className="account-detail">
                  <div className="account-detail-left">
                    <div className="section-label">Account holder</div>
                    <h2 className="detail-name">{selectedUser.name}</h2>
                    <div className="detail-email">{selectedUser.email}</div>
                    <div className="detail-balance-row">
                      <div>
                        <div className="stat-label">Current balance</div>
                        <div className="detail-balance">{fmt(Number(selectedUser.balance))}</div>
                      </div>
                      <div>
                        <div className="stat-label">Transactions</div>
                        <div className="detail-balance">{visibleTx.length}</div>
                      </div>
                    </div>
                    <div className="detail-actions">
                      <button className="btn btn-fill" onClick={() => setTab('send')}>Send money</button>
                      <button className="btn" onClick={() => setSelectedUser(null)}>Deselect</button>
                    </div>
                  </div>
                  <div className="account-detail-right">
                    <div className="section-label" style={{ marginBottom: '1.5rem' }}>Recent activity</div>
                    <TxTable transactions={visibleTx.slice(0, 6)} selectedUserId={selectedUser.id} fmt={fmt} fmtDate={fmtDate} />
                    {visibleTx.length > 6 && (
                      <button className="see-all" onClick={() => setTab('history')}>
                        See all {visibleTx.length} transactions →
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ── Send tab ── */}
        {!loading && tab === 'send' && (
          <div className="send-panel">
            <div>
              <div className="section-label" style={{ marginBottom: '1.5rem' }}>From account</div>
              <div className="users-grid">
                {users.map(u => (
                  <div
                    key={u.id}
                    className={`user-tile${selectedUser?.id === u.id ? ' selected' : ''}`}
                    onClick={() => setSelectedUser(prev => prev?.id === u.id ? null : u)}
                  >
                    <div className="user-avatar">{u.name.split(' ').map(n => n[0]).join('').slice(0,2)}</div>
                    <div className="user-name">{u.name}</div>
                    <div className="user-email">{u.email}</div>
                    <div className="balance-label">Available</div>
                    <div className="user-balance">{fmt(Number(u.balance))}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="section-label" style={{ marginBottom: '1.5rem' }}>Payment details</div>

              <div className="form-group">
                <label>To</label>
                <select value={sendTo} onChange={e => setSendTo(e.target.value)}>
                  <option value="">— Select recipient —</option>
                  {users.filter(u => u.id !== selectedUser?.id).map(u => (
                    <option key={u.id} value={u.id}>{u.name} — {fmt(Number(u.balance))}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Amount (USD)</label>
                <input type="number" min="0.01" step="0.01" placeholder="0.00" value={sendAmount} onChange={e => setSendAmount(e.target.value)} />
                {selectedUser && <div className="field-hint">Available: {fmt(Number(selectedUser.balance))}</div>}
              </div>

              <div className="form-group">
                <label>Note (optional)</label>
                <textarea placeholder="What's this for?" value={sendNote} onChange={e => setSendNote(e.target.value)} />
              </div>

              {!selectedUser && (
                <p className="field-hint" style={{ marginBottom: '1.5rem' }}>← Select a sender account first</p>
              )}

              <button className="btn btn-fill" onClick={handleSend} disabled={!selectedUser || !sendTo || !sendAmount || sending}>
                {sending ? 'Sending…' : 'Send payment'}
              </button>
            </div>
          </div>
        )}

        {/* ── History tab ── */}
        {!loading && tab === 'history' && (
          <>
            <div className="section-label" style={{ marginBottom: '1.5rem' }}>
              All transactions — {transactions.length} records
            </div>
            <TxTable transactions={transactions} selectedUserId={null} fmt={fmt} fmtDate={fmtDate} />
          </>
        )}

        {/* ── New account tab ── */}
        {!loading && tab === 'new-account' && (
          <div className="new-account-layout">
            <div className="new-account-left">
              <div className="section-label">New account</div>
              <h2 className="new-account-title">Open an<br />account.</h2>
              <p className="new-account-body">
                Create a new PayVault account. Set an optional opening balance to get started immediately.
              </p>
              <div className="new-account-meta">
                <div className="meta-item">
                  <span className="meta-num">{users.length}</span>
                  <span className="meta-label">Active accounts</span>
                </div>
                <div className="meta-item">
                  <span className="meta-num">{transactions.length}</span>
                  <span className="meta-label">Transactions</span>
                </div>
              </div>
            </div>

            <div className="new-account-form">
              <div className="section-label" style={{ marginBottom: '2rem' }}>Account details</div>

              <div className="form-group">
                <label>Full name</label>
                <input
                  type="text"
                  placeholder="e.g. Amara Okonkwo"
                  value={newName}
                  onChange={e => { setNewName(e.target.value); setFormErrors(p => ({ ...p, name: undefined })); }}
                  className={formErrors.name ? 'input-error' : ''}
                />
                {formErrors.name && <div className="field-error">{formErrors.name}</div>}
              </div>

              <div className="form-group">
                <label>Email address</label>
                <input
                  type="text"
                  placeholder="e.g. amara@email.com"
                  value={newEmail}
                  onChange={e => { setNewEmail(e.target.value); setFormErrors(p => ({ ...p, email: undefined })); }}
                  className={formErrors.email ? 'input-error' : ''}
                />
                {formErrors.email && <div className="field-error">{formErrors.email}</div>}
              </div>

              <div className="form-group">
                <label>Opening balance (USD) — optional</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={newBalance}
                  onChange={e => { setNewBalance(e.target.value); setFormErrors(p => ({ ...p, balance: undefined })); }}
                  className={formErrors.balance ? 'input-error' : ''}
                />
                {formErrors.balance && <div className="field-error">{formErrors.balance}</div>}
                {!formErrors.balance && <div className="field-hint">Leave empty to start with $0.00</div>}
              </div>

              <hr className="divider" />

              <div className="form-actions">
                <button className="btn btn-fill" onClick={handleCreateAccount} disabled={creating}>
                  {creating ? 'Creating…' : 'Open account'}
                </button>
                <button className="btn" onClick={() => { setTab('overview'); setNewName(''); setNewEmail(''); setNewBalance(''); setFormErrors({}); }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </>
  );
}

function TxTable({ transactions, selectedUserId, fmt, fmtDate }: {
  transactions: Transaction[];
  selectedUserId: number | null;
  fmt: (n: number) => string;
  fmtDate: (s: string) => string;
}) {
  if (transactions.length === 0) {
    return <div className="empty">No transactions yet</div>;
  }
  return (
    <table className="tx-table">
      <thead>
        <tr>
          <th>From</th>
          <th>To</th>
          <th>Amount</th>
          <th>Note</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        {transactions.map(tx => {
          const isDebit  = selectedUserId !== null && tx.senderId   === selectedUserId;
          const isCredit = selectedUserId !== null && tx.receiverId === selectedUserId;
          return (
            <tr key={tx.id}>
              <td>{tx.senderName}</td>
              <td>{tx.receiverName}</td>
              <td>
                <span className={`tx-amount${isDebit ? ' tx-debit' : isCredit ? ' tx-credit' : ''}`}>
                  {isDebit ? '−' : isCredit ? '+' : ''}{fmt(Number(tx.amount))}
                </span>
              </td>
              <td><span className="tx-note">{tx.note || '—'}</span></td>
              <td><span className="tx-date">{fmtDate(tx.createdAt)}</span></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
