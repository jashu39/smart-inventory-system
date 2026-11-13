import React, { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { Package, AlertTriangle, IndianRupee, TrendingUp, Plus, Search, Trash2, Pencil, ScanBarcode, LogOut, Wifi, WifiOff, RefreshCw, ShoppingCart } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { cacheProducts, readCachedProducts, queueChange, syncQueue } from './offline';

const API = '/api';
const money = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('si_token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('si_user') || 'null'));
  const [products, setProducts] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [summary, setSummary] = useState({});
  const [trends, setTrends] = useState([]);
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [online, setOnline] = useState(navigator.onLine);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showSale, setShowSale] = useState(false);
  const [saleProduct, setSaleProduct] = useState('');
  const [saleQty, setSaleQty] = useState(1);
  const [form, setForm] = useState({ name:'', category:'General', barcode:'', quantity:0, price:0, reorderLevel:5 });
  const [scanOpen, setScanOpen] = useState(false);

  const headers = useMemo(() => ({ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }), [token]);
  async function api(path, options={}) {
    const response = await fetch(`${API}${path}`, { ...options, headers: { ...headers, ...(options.headers || {}) } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'Request failed');
    return data;
  }
  async function refresh() {
    if (!token) return;
    if (!navigator.onLine) {
      setProducts(await readCachedProducts()); setMessage('Offline mode: showing the last saved product list.');
      return;
    }
    try {
      const [p, a, s, t, tr, sh] = await Promise.all([
        api('/products?limit=100'), api('/alerts/low-stock'), api('/restock/suggestions'),
        api('/analytics/summary'), api('/analytics/trends'), api('/sales/history')
      ]);
      setProducts(p.items); await cacheProducts(p.items);
      setAlerts(a); setSuggestions(s); setSummary(sh); setTrends(t); setSales(tr);
      setMessage('');
    } catch (e) { setMessage(e.message); }
  }
  useEffect(() => {
    const on = () => { setOnline(navigator.onLine); if (navigator.onLine && token) syncQueue(token).then(refresh); };
    window.addEventListener('online', on); window.addEventListener('offline', on);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', on); };
  }, [token]);
  useEffect(() => { if (token) { refresh(); syncQueue(token).then(refresh); } }, [token]);

  async function login(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      const result = await fetch(`${API}/auth/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ email:fd.get('email'), password:fd.get('password') }) }).then(r => r.json().then(d => { if (!r.ok) throw new Error(d.message); return d; }));
      localStorage.setItem('si_token', result.token); localStorage.setItem('si_user', JSON.stringify(result.user));
      setToken(result.token); setUser(result.user); setMessage('Welcome back!');
    } catch (e) { setMessage(e.message); }
  }
  function logout() { localStorage.removeItem('si_token'); localStorage.removeItem('si_user'); setToken(''); setUser(null); setProducts([]); }

  function openNew() { setEditing(null); setForm({ name:'', category:'General', barcode:'', quantity:0, price:0, reorderLevel:5 }); setShowForm(true); }
  function openEdit(p) { setEditing(p); setForm({ name:p.name, category:p.category, barcode:p.barcode || '', quantity:p.quantity, price:p.price, reorderLevel:p.reorderLevel }); setShowForm(true); }
  async function saveProduct(e) {
    e.preventDefault();
    const method = editing ? 'PUT' : 'POST'; const url = editing ? `/products/${editing._id}` : '/products';
    try {
      if (!navigator.onLine) {
        await queueChange({ method, url, body:form });
        setMessage('Saved to offline queue. It will sync when you reconnect.');
      } else {
        await api(url, { method, body:JSON.stringify(form) }); setMessage('Product saved successfully.');
      }
      setShowForm(false); refresh();
    } catch (e) { setMessage(e.message); }
  }
  async function deleteProduct(id) {
    if (user?.role !== 'admin') return setMessage('Only admins can delete products.');
    if (!confirm('Delete this product?')) return;
    try {
      if (!navigator.onLine) { await queueChange({ method:'DELETE', url:`/products/${id}` }); setMessage('Delete queued until you reconnect.'); }
      else { await api(`/products/${id}`, { method:'DELETE' }); setMessage('Product deleted.'); }
      refresh();
    } catch (e) { setMessage(e.message); }
  }
  async function recordSale(e) {
    e.preventDefault();
    try { await api('/sales', { method:'POST', body:JSON.stringify({ productId:saleProduct, quantity:Number(saleQty) }) }); setShowSale(false); setMessage('Sale recorded and stock updated.'); refresh(); }
    catch (e) { setMessage(e.message); }
  }
  function startScanner() {
    setScanOpen(true);
    setTimeout(() => {
      const scanner = new Html5QrcodeScanner('barcode-reader', { fps:10, qrbox:{ width:240, height:120 } }, false);
      scanner.render((decoded) => { setForm(f => ({ ...f, barcode:decoded })); scanner.clear().catch(()=>{}); setScanOpen(false); }, () => {});
    }, 100);
  }
  const visible = products.filter(p => `${p.name} ${p.category} ${p.barcode || ''}`.toLowerCase().includes(search.toLowerCase()));

  if (!token) return <main className="login-shell"><form className="login-card" onSubmit={login}><div className="brand-mark"><Package /></div><p className="eyebrow">SMART INVENTORY PRO</p><h1>Welcome back</h1><p className="muted">Sign in to manage your business inventory.</p><label>Email<input name="email" type="email" defaultValue="admin@example.com" required /></label><label>Password<input name="password" type="password" defaultValue="Admin@12345" required /></label><button className="primary full">Sign in</button><p className="hint">Demo admin: admin@example.com · Admin@12345</p>{message && <p className="notice">{message}</p>}</form></main>;

  return <div className="app-shell">
    <aside className="sidebar"><div className="logo"><div className="brand-mark"><Package /></div><div><b>StockPilot</b><small>Inventory Pro</small></div></div><div className="side-label">WORKSPACE</div><div className="nav-active"><Package size={18}/> Overview</div><div className="sidebar-bottom"><div className="user-chip"><div className="avatar">{user?.name?.[0] || 'U'}</div><div><b>{user?.name}</b><small>{user?.role} account</small></div></div><button className="logout" onClick={logout}><LogOut size={16}/> Sign out</button></div></aside>
    <main className="main">
      <header className="topbar"><div><p className="eyebrow">BUSINESS OVERVIEW</p><h1>Inventory dashboard</h1></div><div className="top-actions"><span className={`connection ${online?'online':'offline'}`}>{online?<Wifi size={15}/>:<WifiOff size={15}/>} {online?'Online':'Offline'}</span><button className="secondary" onClick={refresh}><RefreshCw size={16}/> Refresh</button></div></header>
      {message && <div className="notice">{message}<button onClick={()=>setMessage('')}>×</button></div>}
      <section className="stats-grid">
        <Stat icon={<Package/>} label="Total products" value={summary.totalProducts ?? products.length} tone="blue"/>
        <Stat icon={<AlertTriangle/>} label="Low stock alerts" value={alerts.length} tone="orange"/>
        <Stat icon={<IndianRupee/>} label="Inventory value" value={money(summary.stockValue)} tone="green"/>
        <Stat icon={<TrendingUp/>} label="Units sold · 30 days" value={summary.unitsSold30Days ?? 0} tone="purple"/>
      </section>
      <section className="content-grid">
        <div className="panel chart-panel"><div className="panel-head"><div><h2>Sales trend</h2><p>Daily units sold · last 30 days</p></div><span className="pill">30 DAYS</span></div><div className="chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={trends}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="date" tick={{fontSize:10}} hide/><YAxis tick={{fontSize:11}}/><Tooltip/><Line type="monotone" dataKey="units" stroke="#5268e8" strokeWidth={3} dot={false}/></LineChart></ResponsiveContainer></div></div>
        <div className="panel"><div className="panel-head"><div><h2>Low stock alerts</h2><p>Products at or below reorder level</p></div><span className="count-badge">{alerts.length}</span></div><div className="alert-list">{alerts.slice(0,5).map(p=><div className="alert-row" key={p._id}><div className="product-icon"><AlertTriangle size={16}/></div><div className="grow"><b>{p.name}</b><small>{p.quantity} left · reorder at {p.reorderLevel}</small></div><span className="severity">Low</span></div>)}{!alerts.length && <p className="empty">No low-stock products. Nice work!</p>}</div></div>
      </section>
      <section className="content-grid lower">
        <div className="panel"><div className="panel-head"><div><h2>Inventory items</h2><p>Manage your products and stock levels</p></div><div className="actions"><button className="secondary" onClick={()=>setShowSale(true)}><ShoppingCart size={15}/> Record sale</button><button className="primary" onClick={openNew}><Plus size={16}/> Add item</button></div></div><div className="toolbar"><div className="search"><Search size={16}/><input placeholder="Search name, category or barcode..." value={search} onChange={e=>setSearch(e.target.value)}/></div><span className="muted small">{visible.length} shown</span></div><div className="table-wrap"><table><thead><tr><th>PRODUCT</th><th>BARCODE</th><th>STOCK</th><th>PRICE</th><th>STATUS</th><th></th></tr></thead><tbody>{visible.map(p=><tr key={p._id}><td><b>{p.name}</b><small>{p.category}</small></td><td>{p.barcode || '—'}</td><td>{p.quantity}</td><td>{money(p.price)}</td><td><span className={p.quantity<=p.reorderLevel?'status-low':'status-ok'}>{p.quantity<=p.reorderLevel?'Low stock':'In stock'}</span></td><td><div className="row-actions"><button title="Edit" onClick={()=>openEdit(p)}><Pencil size={15}/></button>{user?.role==='admin' && <button title="Delete" onClick={()=>deleteProduct(p._id)}><Trash2 size={15}/></button>}</div></td></tr>)}</tbody></table>{!visible.length && <p className="empty">No products found. Add your first inventory item.</p>}</div></div>
        <div className="panel"><div className="panel-head"><div><h2>Restock suggestions</h2><p>14-day target based on last 30 days sales</p></div><TrendingUp size={18}/></div><div className="suggestions">{suggestions.slice(0,8).map(s=><div className="suggest-row" key={s.productId}><div className="grow"><b>{s.name}</b><small>Avg. {s.averageDailySales}/day · current {s.currentStock}</small></div><strong>+{s.suggestedOrder}</strong></div>)}{!suggestions.length && <p className="empty">Record sales to generate useful suggestions.</p>}</div></div>
      </section>
      <footer>StockPilot · Smart Inventory Management <span>Offline-ready · Business-scoped data</span></footer>
    </main>

    {showForm && <div className="modal-backdrop"><form className="modal" onSubmit={saveProduct}><div className="modal-head"><div><p className="eyebrow">{editing?'UPDATE ITEM':'NEW ITEM'}</p><h2>{editing?'Edit product':'Add inventory item'}</h2></div><button type="button" className="close" onClick={()=>setShowForm(false)}>×</button></div><label>Product name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><div className="two"><label>Category<input value={form.category} onChange={e=>setForm({...form,category:e.target.value})}/></label><label>Barcode<div className="scan-input"><input value={form.barcode} onChange={e=>setForm({...form,barcode:e.target.value})}/><button type="button" className="secondary icon-btn" onClick={startScanner}><ScanBarcode size={17}/></button></div></label></div>{scanOpen && <div id="barcode-reader" className="scanner"/>}<div className="three"><label>Quantity<input type="number" min="0" required value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})}/></label><label>Price (₹)<input type="number" min="0" step="0.01" required value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/></label><label>Reorder at<input type="number" min="0" value={form.reorderLevel} onChange={e=>setForm({...form,reorderLevel:e.target.value})}/></label></div><button className="primary full">{editing?'Save changes':'Add product'}</button></form></div>}
    {showSale && <div className="modal-backdrop"><form className="modal compact" onSubmit={recordSale}><div className="modal-head"><div><p className="eyebrow">SALES ENTRY</p><h2>Record a sale</h2></div><button type="button" className="close" onClick={()=>setShowSale(false)}>×</button></div><label>Product<select required value={saleProduct} onChange={e=>setSaleProduct(e.target.value)}><option value="">Choose product</option>{products.map(p=><option key={p._id} value={p._id}>{p.name} · stock {p.quantity}</option>)}</select></label><label>Quantity sold<input type="number" min="1" value={saleQty} onChange={e=>setSaleQty(e.target.value)}/></label><button className="primary full">Save sale and update stock</button></form></div>}
  </div>;
}

function Stat({icon,label,value,tone}) { return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div><p>{label}</p><strong>{value}</strong></div></div>; }
