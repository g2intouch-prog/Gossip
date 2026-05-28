'use client';

import { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  Database, 
  Plus, 
  Trash2, 
  Edit, 
  Check, 
  X, 
  CreditCard, 
  FileText, 
  RefreshCw, 
  LogOut, 
  TrendingUp,
  AlertCircle,
  Activity
} from 'lucide-react';

export default function SuperAdminPortal() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Dashboard Data States
  const [groups, setGroups] = useState([]);
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'requests' | 'groups'
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // CRUD Group State
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  
  // Form states for adding group
  const [newGroupName, setNewGroupName] = useState('');
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPasscode, setNewAdminPasscode] = useState('');
  const [newAadharNumber, setNewAadharNumber] = useState('');
  const [newAadharName, setNewAadharName] = useState('');
  const [newPaymentStatus, setNewPaymentStatus] = useState('paid');

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (authenticated) {
      fetchDashboardData();
    }
  }, [authenticated]);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/super/auth');
      const data = await res.json();
      if (data.authenticated) {
        setAuthenticated(true);
      }
    } catch (e) {
      console.error('Super Admin auth check failed:', e);
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('/api/super/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }
      setAuthenticated(true);
      setUsername('');
      setPassword('');
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/super/auth', { method: 'DELETE' });
      setAuthenticated(false);
    } catch (e) {
      console.error('Logout failed:', e);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [groupsRes, requestsRes] = await Promise.all([
        fetch('/api/super/groups'),
        fetch('/api/super/requests')
      ]);

      if (groupsRes.ok && requestsRes.ok) {
        const groupsData = await groupsRes.json();
        const requestsData = await requestsRes.json();
        setGroups(groupsData);
        setRequests(requestsData);
      } else {
        throw new Error('Failed to load dashboard data');
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Process group creation requests
  const handleProcessRequest = async (id, status) => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/super/requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to process request');
      }
      
      if (status === 'approved') {
        setSuccessMsg(`Group "${data.group.name}" approved! Admin credentials generated: Username: ${data.admin.username}, Passcode: ${data.passcode}`);
      } else {
        setSuccessMsg('Request successfully rejected.');
      }
      fetchDashboardData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  // Add Group manually
  const handleAddGroup = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!newGroupName || !newAdminUsername || !newAdminPasscode) {
      setErrorMsg('Group Name, Admin Username, and Admin Passcode are required');
      return;
    }
    try {
      const res = await fetch('/api/super/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGroupName,
          adminUsername: newAdminUsername,
          adminPasscode: newAdminPasscode,
          aadharNumber: newAadharNumber,
          aadharName: newAadharName,
          paymentStatus: newPaymentStatus
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add group');
      }

      setSuccessMsg(`Group "${data.group.name}" created successfully!`);
      setShowAddGroupModal(false);
      
      // Reset fields
      setNewGroupName('');
      setNewAdminUsername('');
      setNewAdminPasscode('');
      setNewAadharNumber('');
      setNewAadharName('');
      setNewPaymentStatus('paid');
      
      fetchDashboardData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  // Edit Group Details
  const handleUpdateGroup = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/super/groups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingGroup)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update group');
      }
      setSuccessMsg(`Group updated successfully!`);
      setEditingGroup(null);
      fetchDashboardData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  // Delete Group
  const handleDeleteGroup = async (id, name) => {
    if (!window.confirm(`DANGER: Are you sure you want to delete the group "${name}"? This will permanently delete all associated members, messages, and requests.`)) return;
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch(`/api/super/groups?id=${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete group');
      }
      setSuccessMsg(`Group "${name}" deleted.`);
      fetchDashboardData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
          <p className="text-purple-400 font-medium">Verifying Credentials...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-sans px-4 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-purple-900/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-900/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-purple-500/20 p-8 rounded-3xl shadow-2xl relative z-10">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25 mb-4 animate-pulse">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-indigo-300 bg-clip-text text-transparent">
              Super Admin Gate
            </h1>
            <p className="text-slate-400 text-sm mt-1">Authorized Personnel Only</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {authError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <div>
              <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="superadmin"
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-purple-500 text-white placeholder-slate-600 px-4 py-3.5 rounded-xl transition-all duration-300 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-purple-500 text-white placeholder-slate-600 px-4 py-3.5 rounded-xl transition-all duration-300 focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-[0.98] text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all duration-300"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Dashboard Stats Calculations
  const totalGroups = groups.length;
  const activeGroups = groups.filter(g => g.status === 'active').length;
  const inactiveGroups = totalGroups - activeGroups;
  const pendingRequests = requests.filter(r => r.status === 'pending').length;
  const totalUsersGlobally = groups.reduce((acc, g) => acc + (g.memberCount || 0), 0);
  const paidGroups = groups.filter(g => g.paymentStatus === 'paid').length;
  const pendingPaymentGroups = totalGroups - paidGroups;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col relative overflow-x-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-900/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <header className="sticky top-0 bg-slate-900/70 backdrop-blur-xl border-b border-purple-950/45 px-6 py-4 flex justify-between items-center z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">Gossip Console</h1>
            <p className="text-xs text-purple-400 font-medium">Super Admin Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors duration-200"
            title="Refresh Data"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-950/20 hover:bg-red-950/45 border border-red-500/25 px-4 py-2 rounded-xl text-red-400 text-sm font-semibold transition-all duration-300"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8 relative z-10">
        {/* Navigation Tabs */}
        <div className="flex bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800/80 max-w-md">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === 'overview' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <Activity className="w-4 h-4" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold relative transition-all duration-300 ${activeTab === 'requests' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <FileText className="w-4 h-4" />
            Requests
            {pendingRequests > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white ring-2 ring-slate-950 animate-bounce">
                {pendingRequests}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === 'groups' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <Database className="w-4 h-4" />
            Groups
          </button>
        </div>

        {/* Global Notifications */}
        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm p-4 rounded-2xl flex justify-between items-start gap-3">
            <div className="flex gap-2">
              <Check className="w-5 h-5 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg('')} className="text-emerald-400 hover:text-emerald-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-2xl flex justify-between items-start gap-3">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg('')} className="text-red-400 hover:text-red-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-md">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Groups</span>
                  <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400"><Database className="w-5 h-5" /></div>
                </div>
                <div className="text-3xl font-black">{totalGroups}</div>
                <p className="text-xs text-purple-400 font-medium mt-2">{activeGroups} Active, {inactiveGroups} Suspended</p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-md">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Group Requests</span>
                  <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400"><FileText className="w-5 h-5" /></div>
                </div>
                <div className="text-3xl font-black">{requests.length}</div>
                <p className="text-xs text-indigo-400 font-medium mt-2">{pendingRequests} Pending Validation</p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-md">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Active Users</span>
                  <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400"><Users className="w-5 h-5" /></div>
                </div>
                <div className="text-3xl font-black">{totalUsersGlobally}</div>
                <p className="text-xs text-amber-400 font-medium mt-2">Aggregated across all groups</p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-md">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Billing Audit</span>
                  <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400"><CreditCard className="w-5 h-5" /></div>
                </div>
                <div className="text-3xl font-black">{paidGroups}</div>
                <p className="text-xs text-emerald-400 font-medium mt-2">Paid Profiles ({Math.round((paidGroups / (totalGroups || 1)) * 100)}%)</p>
              </div>
            </div>

            {/* Visual Analytics */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Payment Statistics Chart (SVG Ring) */}
              <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl backdrop-blur-md flex flex-col items-center">
                <h3 className="text-md font-bold self-start mb-6 text-slate-300">Tenant Billing Overview</h3>
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="#1e293b" strokeWidth="8" fill="transparent" />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#10b981"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - (paidGroups / (totalGroups || 1)))}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-3xl font-black text-emerald-400">
                      {Math.round((paidGroups / (totalGroups || 1)) * 100)}%
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Paid Groups</span>
                  </div>
                </div>
                <div className="flex gap-6 mt-6">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span className="text-xs text-slate-400">Paid ({paidGroups})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-slate-800"></span>
                    <span className="text-xs text-slate-400">Pending ({pendingPaymentGroups})</span>
                  </div>
                </div>
              </div>

              {/* Group Users Distribution (Bar Graph) */}
              <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl backdrop-blur-md flex flex-col">
                <h3 className="text-md font-bold mb-6 text-slate-300">Top Tenants (User Capacity)</h3>
                <div className="flex-1 space-y-4">
                  {groups.length === 0 ? (
                    <p className="text-slate-600 text-sm text-center py-8">No group data available</p>
                  ) : (
                    groups.slice(0, 5).map((g, idx) => {
                      const maxVal = Math.max(...groups.map(x => x.memberCount || 1), 10);
                      const percent = ((g.memberCount || 0) / maxVal) * 100;
                      return (
                        <div key={g.id} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-300">{g.name}</span>
                            <span className="text-purple-400">{g.memberCount || 0} users</span>
                          </div>
                          <div className="w-full bg-slate-950 h-3.5 rounded-full overflow-hidden border border-slate-900">
                            <div
                              style={{ width: `${percent}%` }}
                              className="bg-gradient-to-r from-purple-600 to-indigo-500 h-full rounded-full transition-all duration-500"
                            ></div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GROUP CREATION REQUESTS */}
        {activeTab === 'requests' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-extrabold text-slate-200">Pending Group Creation Requests</h2>
              <span className="text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-slate-400 font-semibold uppercase tracking-wider">
                {requests.filter(r => r.status === 'pending').length} requests
              </span>
            </div>

            {requests.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-12 text-center">
                <FileText className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <h3 className="font-bold text-slate-400">All caught up!</h3>
                <p className="text-slate-500 text-sm mt-1">No pending group requests require approval.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {requests.map(req => (
                  <div 
                    key={req.id} 
                    className={`bg-slate-900/60 border rounded-3xl p-6 backdrop-blur-md flex flex-col justify-between transition-all duration-300 ${req.status === 'pending' ? 'border-purple-500/20 hover:border-purple-500/40 shadow-lg hover:shadow-purple-500/5' : 'border-slate-850 opacity-60'}`}
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-extrabold text-lg text-white">{req.groupName}</h3>
                          <span className="text-[10px] bg-slate-950 text-slate-400 border border-slate-800 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider mt-1.5 inline-block">
                            Txn ID: {req.paymentTxnId || 'N/A'}
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider ${req.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                          {req.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 bg-slate-950/60 border border-slate-900 p-4 rounded-2xl text-xs">
                        <div>
                          <p className="text-slate-500 font-semibold mb-0.5">Admin Display Name</p>
                          <p className="text-slate-200 font-bold">{req.adminName}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 font-semibold mb-0.5">Admin Username</p>
                          <p className="text-purple-400 font-bold">{req.adminUsername}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 font-semibold mb-0.5">Aadhar Number</p>
                          <p className="text-slate-200 font-mono font-bold">{req.aadharNumber}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 font-semibold mb-0.5">Aadhar Name</p>
                          <p className="text-slate-200 font-bold">{req.aadharName}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-slate-500 font-semibold mb-0.5">Contact Number</p>
                          <p className="text-slate-200 font-bold">{req.phone}</p>
                        </div>
                      </div>
                    </div>

                    {req.status === 'pending' && (
                      <div className="flex gap-3 mt-6 pt-4 border-t border-slate-800/60">
                        <button
                          onClick={() => handleProcessRequest(req.id, 'rejected')}
                          className="flex-1 bg-red-950/20 hover:bg-red-950/45 border border-red-500/25 py-2.5 px-4 rounded-xl text-red-400 text-xs font-bold transition-all duration-200"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleProcessRequest(req.id, 'approved')}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white py-2.5 px-4 rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/10 transition-all duration-200"
                        >
                          Approve Aadhar & Txn
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: GROUPS MANAGEMENT */}
        {activeTab === 'groups' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-extrabold text-slate-200">Active Tenant Groups</h2>
              <button
                onClick={() => setShowAddGroupModal(true)}
                className="bg-purple-600 hover:bg-purple-500 active:scale-[0.98] text-white font-semibold py-2.5 px-4 rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all duration-300"
              >
                <Plus className="w-4 h-4" />
                Add Group
              </button>
            </div>

            {/* List Table */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/80 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <th className="py-4 px-6">Group Info</th>
                      <th className="py-4 px-6">Admin Account</th>
                      <th className="py-4 px-6">Billing Info</th>
                      <th className="py-4 px-6">Members</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-sm">
                    {groups.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-slate-600 font-medium">No groups currently registered</td>
                      </tr>
                    ) : (
                      groups.map(g => (
                        <tr key={g.id} className="hover:bg-slate-900/25 transition-colors duration-200">
                          <td className="py-4 px-6">
                            <div className="font-bold text-white">{g.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">{g.id}</div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="text-xs font-semibold text-slate-300">
                              User: <span className="text-purple-400 font-mono font-bold">{g.adminUsername}</span>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              Pass: <span className="text-slate-400 font-mono">{g.adminPasscode}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${g.paymentStatus === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                              {g.paymentStatus}
                            </span>
                            {g.aadharNumber && (
                              <div className="text-[10px] text-slate-500 font-medium mt-1">Aadhar: {g.aadharNumber}</div>
                            )}
                          </td>
                          <td className="py-4 px-6 font-bold text-purple-300">
                            {g.memberCount || 0}
                          </td>
                          <td className="py-4 px-6">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${g.status === 'active' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-slate-800 text-slate-500 border border-slate-700/50'}`}>
                              {g.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setEditingGroup(g)}
                                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors duration-200"
                                title="Edit Group"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteGroup(g.id, g.name)}
                                className="p-2 hover:bg-red-950/20 rounded-lg text-red-400 hover:text-red-300 transition-colors duration-200"
                                title="Delete Group"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: ADD GROUP MANUALLY */}
      {showAddGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-900 border border-purple-500/20 p-8 rounded-3xl shadow-2xl relative">
            <button
              onClick={() => setShowAddGroupModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold mb-6 text-white">Create Gossip Group</h3>

            <form onSubmit={handleAddGroup} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Group Name</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  placeholder="Gossip Lounge"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 text-white px-4 py-3 rounded-xl focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Admin Username</label>
                  <input
                    type="text"
                    value={newAdminUsername}
                    onChange={e => setNewAdminUsername(e.target.value)}
                    placeholder="loungeadmin"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 text-white px-4 py-3 rounded-xl focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Admin Passcode</label>
                  <input
                    type="text"
                    value={newAdminPasscode}
                    onChange={e => setNewAdminPasscode(e.target.value)}
                    placeholder="123456"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 text-white px-4 py-3 rounded-xl focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Aadhar Name</label>
                  <input
                    type="text"
                    value={newAadharName}
                    onChange={e => setNewAadharName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 text-white px-4 py-3 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Aadhar Number</label>
                  <input
                    type="text"
                    value={newAadharNumber}
                    onChange={e => setNewAadharNumber(e.target.value)}
                    placeholder="000000000000"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 text-white px-4 py-3 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Payment Status</label>
                <select
                  value={newPaymentStatus}
                  onChange={e => setNewPaymentStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 text-white px-4 py-3 rounded-xl focus:outline-none"
                >
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-purple-500/20 mt-4 transition-colors"
              >
                Create Group
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT GROUP */}
      {editingGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-900 border border-purple-500/20 p-8 rounded-3xl shadow-2xl relative">
            <button
              onClick={() => setEditingGroup(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold mb-6 text-white">Modify Group: {editingGroup.name}</h3>

            <form onSubmit={handleUpdateGroup} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Group Name</label>
                <input
                  type="text"
                  value={editingGroup.name}
                  onChange={e => setEditingGroup({ ...editingGroup, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 text-white px-4 py-3 rounded-xl focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Admin Username</label>
                  <input
                    type="text"
                    value={editingGroup.adminUsername}
                    onChange={e => setEditingGroup({ ...editingGroup, adminUsername: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 text-white px-4 py-3 rounded-xl focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Admin Passcode</label>
                  <input
                    type="text"
                    value={editingGroup.adminPasscode}
                    onChange={e => setEditingGroup({ ...editingGroup, adminPasscode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 text-white px-4 py-3 rounded-xl focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Aadhar Name</label>
                  <input
                    type="text"
                    value={editingGroup.aadharName || ''}
                    onChange={e => setEditingGroup({ ...editingGroup, aadharName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 text-white px-4 py-3 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Aadhar Number</label>
                  <input
                    type="text"
                    value={editingGroup.aadharNumber || ''}
                    onChange={e => setEditingGroup({ ...editingGroup, aadharNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 text-white px-4 py-3 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Group Status</label>
                  <select
                    value={editingGroup.status}
                    onChange={e => setEditingGroup({ ...editingGroup, status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 text-white px-4 py-3 rounded-xl focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive / Suspended</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Payment Status</label>
                  <select
                    value={editingGroup.paymentStatus}
                    onChange={e => setEditingGroup({ ...editingGroup, paymentStatus: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 text-white px-4 py-3 rounded-xl focus:outline-none"
                  >
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-purple-500/20 mt-4 transition-colors"
              >
                Save Updates
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
