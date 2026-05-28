'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Home, 
  MessageSquare, 
  Settings, 
  UserPlus, 
  Send, 
  Trash2, 
  Edit, 
  Check, 
  X, 
  Plus, 
  Search, 
  LogOut, 
  Lock, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Share2,
  Users,
  Key,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export default function GossipApp() {
  // Authentication & Session States
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [username, setUsername] = useState('');
  const [passcode, setPasscode] = useState('');
  const [selectedLoginGroupId, setSelectedLoginGroupId] = useState('');
  const [authError, setAuthError] = useState('');

  // Dropdown options for active groups
  const [publicGroups, setPublicGroups] = useState([]);

  // Access Request States (Join Group)
  const [requestName, setRequestName] = useState('');
  const [requestUsername, setRequestUsername] = useState('');
  const [requestPhone, setRequestPhone] = useState('');
  const [requestGroupId, setRequestGroupId] = useState('');
  const [requestStatus, setRequestStatus] = useState(null); // 'submitting' | 'success' | 'error'
  const [requestError, setRequestError] = useState('');
  const [showRequestForm, setShowRequestForm] = useState(false);

  // Group Registration States (Create New Group)
  const [regGroupName, setRegGroupName] = useState('');
  const [regAdminName, setRegAdminName] = useState('');
  const [regAdminUsername, setRegAdminUsername] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAadharNumber, setRegAadharNumber] = useState('');
  const [regAadharName, setRegAadharName] = useState('');
  const [regPaymentTxnId, setRegPaymentTxnId] = useState('');
  const [regStatus, setRegStatus] = useState(null); // 'submitting' | 'success' | 'error'
  const [regError, setRegError] = useState('');
  const [showGroupRegForm, setShowGroupRegForm] = useState(false);

  // Forgot Password States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotGroupId, setForgotGroupId] = useState('');
  const [forgotStatus, setForgotStatus] = useState(null); // 'submitting' | 'success' | 'error'
  const [forgotError, setForgotError] = useState('');

  // Change Password States (Home Tab)
  const [oldPasscode, setOldPasscode] = useState('');
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmNewPasscode, setConfirmNewPasscode] = useState('');
  const [changePasswordStatus, setChangePasswordStatus] = useState(null); // 'submitting' | 'success' | 'error'
  const [changePasswordError, setChangePasswordError] = useState('');
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  // Tab & Navigation State
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'chat' | 'admin' | 'requests'

  // Data States
  const [members, setMembers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [passwordResets, setPasswordResets] = useState([]);
  const [messages, setMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatRecipient, setChatRecipient] = useState('group'); // 'group' | memberId
  const [chatInput, setChatInput] = useState('');
  const [localClearTimestamp, setLocalClearTimestamp] = useState(0);

  // Contact list Modal States (Chat tab Selector)
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactSearchQuery, setContactSearchQuery] = useState('');

  // CRUD Member States
  const [editingMember, setEditingMember] = useState(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberUsername, setNewMemberUsername] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberPasscode, setNewMemberPasscode] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('member');
  const [memberError, setMemberError] = useState('');

  // WhatsApp Invitation States
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [whatsappPasscode, setWhatsappPasscode] = useState('');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  // Status Approve Alert State
  const [approvedPasscodeAlert, setApprovedPasscodeAlert] = useState(null);

  // Password reset resolution (Admin resolving request)
  const [resolvingReset, setResolvingReset] = useState(null);
  const [resetPasscodeValue, setResetPasscodeValue] = useState('');
  const [resetError, setResetError] = useState('');

  // UI States
  const [refreshing, setRefreshing] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch authentication status and active public groups on load
  useEffect(() => {
    checkAuth();
    fetchPublicGroups();
  }, []);

  // Poll for live updates (messages & member status) every 5 seconds when authenticated
  useEffect(() => {
    if (!user) return;
    
    // Initial fetch
    fetchData();

    const interval = setInterval(() => {
      fetchLiveUpdates();
    }, 5000);

    return () => clearInterval(interval);
  }, [user]);

  // Load local chat clearing timestamp on load or user change
  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem(`gossip_clear_timestamp_${user.id}`);
      if (stored) {
        setLocalClearTimestamp(parseInt(stored, 10));
      } else {
        setLocalClearTimestamp(0);
      }
    }
  }, [user]);

  // Auto scroll chat to bottom when messages list or recipient changes
  useEffect(() => {
    if (activeTab === 'chat') {
      scrollToBottom();
    }
  }, [messages, chatRecipient, activeTab]);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth');
      const data = await res.json();
      if (data.authenticated) {
        setUser(data.user);
        setActiveTab('home');
      }
    } catch (e) {
      console.error('Auth check failed:', e);
    } finally {
      setCheckingAuth(false);
    }
  };

  const fetchPublicGroups = async () => {
    try {
      const res = await fetch('/api/public-groups');
      if (res.ok) {
        const data = await res.json();
        setPublicGroups(data);
        if (data.length > 0) {
          setRequestGroupId(data[0].id);
          setForgotGroupId(data[0].id);
          setSelectedLoginGroupId(data[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to load active public groups:', e);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'member', username, passcode }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setUser(data.user);
      setUsername('');
      setPasscode('');
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth', { method: 'DELETE' });
      setUser(null);
      setActiveTab('home');
      setChatRecipient('group');
      fetchPublicGroups();
    } catch (e) {
      console.error('Logout failed:', e);
    }
  };

  const handleRequestAccess = async (e) => {
    e.preventDefault();
    setRequestStatus('submitting');
    setRequestError('');
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: requestName, 
          username: requestUsername,
          phone: requestPhone, 
          groupId: requestGroupId 
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit request');
      }
      setRequestStatus('success');
      setRequestName('');
      setRequestUsername('');
      setRequestPhone('');
    } catch (err) {
      setRequestStatus('error');
      setRequestError(err.message);
    }
  };

  // Handle Group Signup registration
  const handleRegisterGroup = async (e) => {
    e.preventDefault();
    setRegStatus('submitting');
    setRegError('');
    try {
      const res = await fetch('/api/super/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupName: regGroupName,
          adminName: regAdminName,
          adminUsername: regAdminUsername,
          phone: regPhone,
          aadharNumber: regAadharNumber,
          aadharName: regAadharName,
          paymentTxnId: regPaymentTxnId
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit request');
      }
      setRegStatus('success');
      setRegGroupName('');
      setRegAdminName('');
      setRegAdminUsername('');
      setRegPhone('');
      setRegAadharNumber('');
      setRegAadharName('');
      setRegPaymentTxnId('');
    } catch (err) {
      setRegStatus('error');
      setRegError(err.message);
    }
  };

  // Submit password reset request
  const handleRequestForgotPassword = async (e) => {
    e.preventDefault();
    setForgotStatus('submitting');
    setForgotError('');
    try {
      const res = await fetch('/api/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: forgotUsername, groupId: forgotGroupId })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit reset request');
      }
      setForgotStatus('success');
      setForgotUsername('');
    } catch (err) {
      setForgotStatus('error');
      setForgotError(err.message);
    }
  };

  // Self change password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangePasswordStatus('submitting');
    setChangePasswordError('');
    if (newPasscode !== confirmNewPasscode) {
      setChangePasswordStatus('error');
      setChangePasswordError('New passcodes do not match.');
      return;
    }
    try {
      const res = await fetch('/api/auth', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPasscode, newPasscode })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update passcode');
      }
      setChangePasswordStatus('success');
      setOldPasscode('');
      setNewPasscode('');
      setConfirmNewPasscode('');
    } catch (err) {
      setChangePasswordStatus('error');
      setChangePasswordError(err.message);
    }
  };

  const fetchData = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchMembers(),
      fetchMessages(),
      user?.role === 'admin' ? Promise.all([fetchRequests(), fetchPasswordResets()]) : Promise.resolve(),
    ]);
    setRefreshing(false);
  };

  const fetchLiveUpdates = async () => {
    await fetchMembers();
    await fetchMessages();
    if (user?.role === 'admin') {
      await fetchRequests();
      await fetchPasswordResets();
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/members');
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (e) {
      console.error('Error fetching members:', e);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/requests');
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (e) {
      console.error('Error fetching requests:', e);
    }
  };

  const fetchPasswordResets = async () => {
    try {
      const res = await fetch('/api/admin/password-resets');
      if (res.ok) {
        const data = await res.json();
        setPasswordResets(data);
      }
    } catch (e) {
      console.error('Error fetching password resets:', e);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/chat');
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (e) {
      console.error('Error fetching messages:', e);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Toggle availability status
  const handleToggleStatus = async (type) => {
    if (!user) return;
    
    const currentMember = members.find(m => m.id === user.id);
    if (!currentMember) return;

    const updates = {};
    if (type === 'lunch') {
      updates.lunchAvailable = !currentMember.lunchAvailable;
    } else if (type === 'dinner') {
      updates.dinnerAvailable = !currentMember.dinnerAvailable;
    }

    // Optimistic UI update
    setMembers(prev => prev.map(m => m.id === user.id ? { ...m, ...updates } : m));

    try {
      const res = await fetch('/api/members', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, ...updates }),
      });
      if (!res.ok) {
        throw new Error('Failed to update status');
      }
      const data = await res.json();
      setMembers(prev => prev.map(m => m.id === user.id ? data : m));
    } catch (e) {
      console.error('Error toggling status:', e);
      fetchMembers();
    }
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const text = chatInput.trim();
    setChatInput('');

    // Optimistic UI message
    const tempMsg = {
      id: 'temp_' + Date.now(),
      senderId: user.id,
      senderName: user.name,
      receiverId: chatRecipient === 'group' ? null : chatRecipient,
      text,
      timestamp: new Date().toISOString(),
      optimistic: true
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          receiverId: chatRecipient === 'group' ? null : chatRecipient
        }),
      });
      if (!res.ok) {
        throw new Error('Failed to send message');
      }
      const data = await res.json();
      setMessages(prev => prev.map(m => m.id === tempMsg.id ? data : m));
    } catch (e) {
      console.error('Error sending message:', e);
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      setChatInput(text); // Restore text
    }
  };

  // Clear local chat history
  const handleClearLocalChat = () => {
    if (!window.confirm('Clear your local view of this chat? Message history is still saved in database.')) return;
    const now = Date.now();
    localStorage.setItem(`gossip_clear_timestamp_${user.id}`, now.toString());
    setLocalClearTimestamp(now);
  };

  // Admin: CRUD Add Member
  const handleAddMember = async (e) => {
    e.preventDefault();
    setMemberError('');
    if (!newMemberName || !newMemberUsername || !newMemberPhone || !newMemberPasscode) {
      setMemberError('All fields are required');
      return;
    }
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newMemberName,
          username: newMemberUsername,
          phone: newMemberPhone,
          passcode: newMemberPasscode,
          role: newMemberRole
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add member');
      }

      setMembers(prev => [...prev, data]);
      setNewMemberName('');
      setNewMemberUsername('');
      setNewMemberPhone('');
      setNewMemberPasscode('');
      setNewMemberRole('member');
      setShowAddMember(false);
    } catch (err) {
      setMemberError(err.message);
    }
  };

  // Admin: CRUD Update Member details
  const handleUpdateMemberDetails = async (e) => {
    e.preventDefault();
    setMemberError('');
    try {
      const res = await fetch('/api/members', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingMember),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update member');
      }

      setMembers(prev => prev.map(m => m.id === editingMember.id ? data : m));
      setEditingMember(null);
    } catch (err) {
      setMemberError(err.message);
    }
  };

  // Admin: CRUD Delete Member
  const handleDeleteMember = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete member: ${name}?`)) return;
    try {
      const res = await fetch(`/api/members?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete member');
      }
      setMembers(prev => prev.filter(m => m.id !== id));
      if (chatRecipient === id) {
        setChatRecipient('group');
      }
    } catch (e) {
      alert(e.message);
    }
  };

  // Admin: Approve Request
  const handleApproveRequest = async (id) => {
    try {
      const res = await fetch('/api/requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'approved' }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to approve request');
      }

      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
      if (data.member) {
        setMembers(prev => [...prev, data.member]);
      }
      
      setApprovedPasscodeAlert({
        name: data.member.name,
        phone: data.member.phone,
        passcode: data.passcode
      });
    } catch (e) {
      alert(e.message);
    }
  };

  // Admin: Reject Request
  const handleRejectRequest = async (id) => {
    if (!window.confirm('Reject this request?')) return;
    try {
      const res = await fetch('/api/requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'rejected' }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to reject request');
      }
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
    } catch (e) {
      alert(e.message);
    }
  };

  // Admin: Resolve Password Reset Request
  const handleResolvePasswordReset = async (e) => {
    e.preventDefault();
    setResetError('');
    if (!resetPasscodeValue) {
      setResetError('A new passcode is required.');
      return;
    }
    try {
      const res = await fetch('/api/admin/password-resets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: resolvingReset.id, newPasscode: resetPasscodeValue })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to resolve password reset');
      }
      setPasswordResets(prev => prev.filter(r => r.id !== resolvingReset.id));
      setResolvingReset(null);
      setResetPasscodeValue('');
      alert('Password successfully reset and request resolved.');
    } catch (err) {
      setResetError(err.message);
    }
  };

  // Admin: Delete All Chat Data
  const handleDeleteAllChatData = async () => {
    const doubleConfirm = window.confirm('🚨 WARNING 🚨\n\nThis will DELETE ALL MESSAGES, MEMBERS, and REQUESTS for this group from database. This action is irreversible!\n\nAre you absolutely sure?');
    if (!doubleConfirm) return;
    
    const finalConfirm = window.prompt('Type "DELETE" to confirm wiping group database:');
    if (finalConfirm !== 'DELETE') {
      alert('Database wipe cancelled.');
      return;
    }

    try {
      const res = await fetch('/api/admin/clear', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to wipe database');
      }
      alert('Group database successfully wiped! Logging out...');
      setUser(null);
    } catch (e) {
      alert(e.message);
    }
  };

  // WhatsApp Pre-filled Invite link generation
  const handleGenerateWhatsAppInvite = (phoneNum, passcodeVal) => {
    setWhatsappPhone(phoneNum || '');
    setWhatsappPasscode(passcodeVal || '');
    setInviteModalOpen(true);
  };

  const getWhatsAppURL = () => {
    const cleanPhone = whatsappPhone.replace(/\D/g, '');
    const appUrl = window.location.origin;
    const msg = `Hey! You've been invited to join our private Gossip Group. 🤐\n\n1. Visit the chat link: ${appUrl}\n2. Enter your credentials\n3. Log in with Username: ${whatsappPhone} (or your chosen username) & Passcode: ${whatsappPasscode}\n\nSee you inside!`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  };

  // Helper: check if a user is available
  const getUserStatus = (m) => {
    const lastSeenTime = new Date(m.lastSeen);
    const isOnline = (new Date() - lastSeenTime) < 60000; // active in last 60s
    return {
      lunch: !!m.lunchAvailable,
      dinner: !!m.dinnerAvailable,
      online: isOnline
    };
  };

  // Filtered members list for home and selection
  const filteredMembers = members.filter(m => 
    (m.name && m.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (m.username && m.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Filtered contact list for contact popup modal
  const filteredContacts = members.filter(m => 
    m.id !== user?.id &&
    ((m.name && m.name.toLowerCase().includes(contactSearchQuery.toLowerCase())) ||
     (m.username && m.username.toLowerCase().includes(contactSearchQuery.toLowerCase())))
  );

  // Selected DM recipient
  const activeChatUser = chatRecipient !== 'group' ? members.find(m => m.id === chatRecipient) : null;
  const activeChatUserStatus = activeChatUser ? getUserStatus(activeChatUser) : null;

  // Filtered messages list based on recipient selection and local clear timestamp
  const displayMessages = messages.filter(msg => {
    const msgTime = new Date(msg.timestamp).getTime();
    if (msgTime < localClearTimestamp) return false;

    if (chatRecipient === 'group') {
      return !msg.receiverId || msg.receiverId === 'group';
    } else {
      const isMyMsg = msg.senderId === user.id && msg.receiverId === chatRecipient;
      const isTheirMsg = msg.senderId === chatRecipient && msg.receiverId === user.id;
      return isMyMsg || isTheirMsg;
    }
  });

  if (checkingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gossip-dark text-white p-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-gossip-purple border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gossip-pink animate-pulse">🤐</div>
        </div>
        <p className="mt-4 text-sm text-gray-400 font-medium animate-pulse">Entering the Secret Gossip Zone...</p>
      </div>
    );
  }

  // --- UNAUTHENTICATED SCREENS (LOGIN / REQUEST ACCESS / REGISTER GROUP) ---
  if (!user) {
    return (
      <div className="flex flex-col min-h-screen justify-center items-center px-4 py-8 safe-bottom-padding select-none">
        
        {/* Splash Header */}
        <div className="text-center mb-8 max-w-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gossip-panel rounded-2xl border border-gossip-border mb-4 glow-purple">
            <span className="text-3xl animate-bounce">🤐</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-gossip-purple via-gossip-pink to-gossip-amber bg-clip-text text-transparent">
            Gossip Group
          </h1>
          <p className="mt-2 text-xs text-gray-400">
            A secure, multi-tenant sandbox for availability status and top-secret gossip.
          </p>
        </div>

        {/* Dynamic Card Container */}
        <div className="w-full max-w-md p-6 rounded-3xl glass-panel relative overflow-hidden">
          
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-gossip-pink opacity-20 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-gossip-purple opacity-20 rounded-full blur-2xl pointer-events-none"></div>

          {!showRequestForm && !showGroupRegForm ? (
            // --- LOGIN FORM ---
            <form onSubmit={handleLogin} className="space-y-5">
              <h2 className="text-md font-bold text-white text-center">Sign In to Gossip</h2>

              {authError && (
                <div className="flex items-center gap-2 bg-red-950/50 border border-red-500/40 text-red-200 text-xs p-3 rounded-xl animate-shake">
                  <AlertCircle size={16} className="text-red-400 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {/* Group Selector */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 pl-1">Select Your Group</label>
                {publicGroups.length === 0 ? (
                  <div className="w-full px-4 py-3 rounded-xl text-xs glass-input text-gray-500 italic">
                    No active groups available
                  </div>
                ) : (
                  <select
                    value={selectedLoginGroupId}
                    onChange={(e) => setSelectedLoginGroupId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-xs glass-input bg-gossip-dark text-white cursor-pointer"
                    required
                  >
                    {publicGroups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 pl-1">Username</label>
                <input
                  type="text"
                  required
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-xs glass-input"
                />
              </div>

              {/* Passcode */}
              <div>
                <div className="flex justify-between items-center mb-1.5 pl-1 pr-1">
                  <label className="block text-xs font-medium text-gray-400">Passcode</label>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedLoginGroupId) setForgotGroupId(selectedLoginGroupId);
                      setShowForgotModal(true);
                      setForgotStatus(null);
                      setForgotError('');
                    }}
                    className="text-[10px] text-gossip-pink hover:underline font-semibold"
                  >
                    Forgot Passcode?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  placeholder="Enter your passcode"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-xs glass-input text-center tracking-widest font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={publicGroups.length === 0}
                className="w-full py-3.5 bg-gradient-to-r from-gossip-purple to-gossip-pink hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all shadow-md text-xs cursor-pointer active:scale-[0.98] disabled:opacity-40"
              >
                Access Gossip Chat
              </button>

              <div className="flex flex-col gap-2.5 items-center pt-3 border-t border-gossip-border/30">
                <button
                  type="button"
                  onClick={() => { setShowRequestForm(true); setRequestStatus(null); setRequestError(''); }}
                  className="text-xs text-gossip-pink hover:underline font-semibold flex items-center gap-1"
                >
                  Want to join an active group? Request access <ArrowRight size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => { setShowGroupRegForm(true); setRegStatus(null); setRegError(''); }}
                  className="text-xs text-gossip-amber hover:underline font-semibold flex items-center gap-1"
                >
                  Need a new Gossip Group? Create group <Plus size={12} />
                </button>
              </div>
            </form>
          ) : showRequestForm ? (
            // --- MEMBER REQUEST ACCESS FORM ---
            <form onSubmit={handleRequestAccess} className="space-y-4">
              <h2 className="text-md font-bold text-white text-center">Request Gossip Membership</h2>
              <p className="text-xs text-gray-400 text-center">
                Submit details below. The administrator of the chosen group must validate your request.
              </p>

              {requestStatus === 'success' ? (
                <div className="text-center py-6 space-y-3">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-green-950 text-green-400 border border-green-500/40 rounded-full animate-bounce">
                    <CheckCircle2 size={24} />
                  </div>
                  <h3 className="text-xs font-bold text-green-400">Request Submitted!</h3>
                  <p className="text-[10px] text-gray-400 max-w-xs mx-auto">
                    Once the group admin approves your request, log in using your Username and generated passcode.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setShowRequestForm(false); setRequestStatus(null); }}
                    className="mt-4 px-4 py-2 bg-gossip-dark border border-gossip-border hover:bg-gossip-border text-xs rounded-xl transition-all font-bold text-white cursor-pointer"
                  >
                    Back to Login
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {requestError && (
                    <div className="flex items-center gap-2 bg-red-950/50 border border-red-500/40 text-red-200 text-xs p-3 rounded-xl">
                      <AlertCircle size={16} className="text-red-400 shrink-0" />
                      <span>{requestError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1 pl-1">Select Gossip Group</label>
                    <select
                      value={requestGroupId}
                      onChange={(e) => setRequestGroupId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-xs glass-input bg-gossip-dark"
                      required
                    >
                      {publicGroups.length === 0 ? (
                        <option value="">No active groups available</option>
                      ) : (
                        publicGroups.map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1 pl-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jane Doe"
                      value={requestName}
                      onChange={(e) => setRequestName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-xs glass-input"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1 pl-1">Desired Username</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. janedoe"
                      value={requestUsername}
                      onChange={(e) => setRequestUsername(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-xs glass-input"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1 pl-1">WhatsApp Phone Number</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 1234567890"
                      value={requestPhone}
                      onChange={(e) => setRequestPhone(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-xs glass-input"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={requestStatus === 'submitting' || publicGroups.length === 0}
                    className="w-full py-3 bg-gradient-to-r from-gossip-purple to-gossip-pink text-white font-bold rounded-xl transition-all text-xs cursor-pointer disabled:opacity-40 active:scale-[0.98]"
                  >
                    {requestStatus === 'submitting' ? 'Submitting...' : 'Submit Join Request'}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => { setShowRequestForm(false); setRequestStatus(null); }}
                      className="text-xs text-gossip-purple hover:underline font-semibold"
                    >
                      Cancel and return to Login
                    </button>
                  </div>
                </div>
              )}
            </form>
          ) : (
            // --- NEW GROUP CREATION SIGNUP (SUPER ADMIN QUEUE) ---
            <form onSubmit={handleRegisterGroup} className="space-y-4">
              <h2 className="text-md font-bold text-white text-center">Register a New Gossip Group</h2>
              <p className="text-xs text-gray-400 text-center">
                Submit Aadhar and payment credentials. Super Admin will review details and approve your group admin profile.
              </p>

              {regStatus === 'success' ? (
                <div className="text-center py-6 space-y-3">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-green-950 text-green-400 border border-green-500/40 rounded-full animate-bounce">
                    <CheckCircle2 size={24} />
                  </div>
                  <h3 className="text-xs font-bold text-green-400">Creation Request Filed!</h3>
                  <p className="text-[10px] text-gray-400 max-w-xs mx-auto">
                    Super Admin is validating your transaction and identity credentials. Check back soon!
                  </p>
                  <button
                    type="button"
                    onClick={() => { setShowGroupRegForm(false); setRegStatus(null); }}
                    className="mt-4 px-4 py-2 bg-gossip-dark border border-gossip-border hover:bg-gossip-border text-xs rounded-xl transition-all font-bold text-white cursor-pointer"
                  >
                    Back to Login
                  </button>
                </div>
              ) : (
                <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
                  {regError && (
                    <div className="flex items-center gap-2 bg-red-950/50 border border-red-500/40 text-red-200 text-xs p-3 rounded-xl">
                      <AlertCircle size={16} className="text-red-400 shrink-0" />
                      <span>{regError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1 pl-1">Gossip Group Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Royal Gossip Club"
                      value={regGroupName}
                      onChange={(e) => setRegGroupName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-xs glass-input"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1 pl-1">Admin Display Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. John Admin"
                        value={regAdminName}
                        onChange={(e) => setRegAdminName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-xs glass-input"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1 pl-1">Admin Username</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. johnadmin"
                        value={regAdminUsername}
                        onChange={(e) => setRegAdminUsername(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-xs glass-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1 pl-1">Contact Phone</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 1234567890"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-xs glass-input"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1 pl-1">Aadhar Card Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Name on Card"
                        value={regAadharName}
                        onChange={(e) => setRegAadharName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-xs glass-input"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1 pl-1">Aadhar Number</label>
                      <input
                        type="text"
                        required
                        placeholder="12 digit number"
                        value={regAadharNumber}
                        onChange={(e) => setRegAadharNumber(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-xs glass-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1 pl-1">Payment Reference/Txn ID</label>
                    <input
                      type="text"
                      required
                      placeholder="UPI/Bank reference ID"
                      value={regPaymentTxnId}
                      onChange={(e) => setRegPaymentTxnId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-xs glass-input font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={regStatus === 'submitting'}
                    className="w-full py-2.5 bg-gradient-to-r from-gossip-amber to-gossip-pink text-white font-bold rounded-xl text-xs cursor-pointer active:scale-[0.98] mt-2"
                  >
                    {regStatus === 'submitting' ? 'Submitting details...' : 'Submit Group Creation Request'}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => { setShowGroupRegForm(false); setRegStatus(null); }}
                      className="text-xs text-gossip-purple hover:underline font-semibold"
                    >
                      Cancel and return to Login
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}

        </div>

        {/* FORGOT PASSWORD MODAL */}
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <div className="w-full max-w-sm bg-gossip-panel border border-gossip-border/50 p-6 rounded-3xl relative animate-fadeIn shadow-2xl">
              <button 
                onClick={() => setShowForgotModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <X size={18} />
              </button>

              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
                🔑 Password Reset Request
              </h3>

              {forgotStatus === 'success' ? (
                <div className="space-y-4 text-center py-4">
                  <div className="w-12 h-12 bg-green-950 text-green-400 rounded-full flex items-center justify-center mx-auto border border-green-500/20">
                    <Check size={24} />
                  </div>
                  <p className="text-xs text-gray-300">
                    Reset request submitted! Please notify your group administrator to reset or provide your passcode.
                  </p>
                  <button
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2 bg-gossip-purple text-white text-xs font-bold rounded-xl"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRequestForgotPassword} className="space-y-4">
                  {forgotError && (
                    <div className="bg-red-950/50 border border-red-500/30 text-red-400 text-[10px] p-3 rounded-xl flex items-center gap-2">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>{forgotError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Select Your Group</label>
                    <select
                      value={forgotGroupId}
                      onChange={(e) => setForgotGroupId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs glass-input bg-gossip-dark"
                      required
                    >
                      {publicGroups.length === 0 ? (
                        <option value="">No active groups</option>
                      ) : (
                        publicGroups.map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Username</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter your username"
                      value={forgotUsername}
                      onChange={(e) => setForgotUsername(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs glass-input"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={forgotStatus === 'submitting' || publicGroups.length === 0}
                    className="w-full py-2.5 bg-gossip-pink text-white font-bold rounded-xl text-xs"
                  >
                    {forgotStatus === 'submitting' ? 'Submitting...' : 'File Password Reset Request'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

      </div>
    );
  }

  // --- AUTHENTICATED APP LAYOUT ---
  const currentMember = members.find(m => m.id === user.id);
  const userStatus = currentMember ? getUserStatus(currentMember) : { lunch: false, dinner: false };

  return (
    <div className="flex flex-col min-h-screen text-white relative select-none">
      
      {/* HEADER BAR */}
      <header className="sticky top-0 z-40 bg-gossip-dark/80 backdrop-blur-md border-b border-gossip-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl animate-pulse">🤐</span>
          <div>
            <h1 className="text-xs font-black text-gray-500 uppercase tracking-widest">
              Gossip Portal
            </h1>
            <p className="text-[10px] text-purple-400 font-extrabold bg-purple-950/40 border border-purple-500/20 px-2 py-0.5 rounded-lg mt-0.5 max-w-[160px] truncate shadow-sm">
              🏢 {user.groupName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setShowChangePasswordModal(true);
              setChangePasswordStatus(null);
              setChangePasswordError('');
            }}
            className="p-2 rounded-xl bg-gossip-panel border border-gossip-border text-gray-400 hover:text-gossip-purple transition-all"
            title="Change Passcode"
          >
            <Key size={14} />
          </button>

          <button
            onClick={fetchData}
            disabled={refreshing}
            className={`p-2 rounded-xl bg-gossip-panel border border-gossip-border hover:text-gossip-purple transition-all ${
              refreshing ? 'animate-spin text-gossip-purple' : 'text-gray-400'
            }`}
            title="Refresh Data"
          >
            <RefreshCw size={14} />
          </button>
          
          <div className="flex items-center gap-2 bg-gossip-panel border border-gossip-border px-3 py-1.5 rounded-xl">
            <div className="text-right">
              <p className="text-xs font-bold text-white max-w-[80px] truncate">{user.name}</p>
              <p className="text-[9px] text-gossip-pink font-semibold uppercase tracking-wider">{user.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1 rounded-lg text-gray-400 hover:text-red-400 transition-all cursor-pointer"
              title="Logout"
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN SCREEN PORTAL */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 pt-4 pb-24">
        
        {/* --- TAB 1: HOME (STATUS TOGGLES, MEMBER LIST, CHANGE PASSWORD) --- */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            
            {/* Status Hand Toggle Section */}
            {currentMember && (
              <div className="p-4 rounded-3xl glass-panel relative overflow-hidden text-center space-y-4 shadow-lg">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gossip-purple opacity-10 rounded-full blur-xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-gossip-amber opacity-10 rounded-full blur-xl pointer-events-none"></div>
                
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">Set Availability Status</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Lunch Toggle - Right Hand */}
                  <button
                    onClick={() => handleToggleStatus('lunch')}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all cursor-pointer ${
                      userStatus.lunch 
                        ? 'bg-amber-950/40 border-gossip-amber glow-amber text-gossip-amber scale-[1.02]' 
                        : 'bg-gossip-dark border-gossip-border text-gray-400 hover:border-gray-650'
                    }`}
                  >
                    <span className={`text-4xl mb-2 select-none ${userStatus.lunch ? 'animate-wave-right' : ''}`}>
                      🙋‍♂️
                    </span>
                    <span className="text-xs font-bold">Lunch Available</span>
                    <span className="text-[10px] text-gray-500 mt-1">Right Hand</span>
                  </button>

                  {/* Dinner Toggle - Left Hand */}
                  <button
                    onClick={() => handleToggleStatus('dinner')}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all cursor-pointer ${
                      userStatus.dinner 
                        ? 'bg-pink-950/40 border-gossip-pink glow-pink text-gossip-pink scale-[1.02]' 
                        : 'bg-gossip-dark border-gossip-border text-gray-400 hover:border-gray-650'
                    }`}
                  >
                    <span className={`text-4xl mb-2 select-none ${userStatus.dinner ? 'animate-wave-left' : ''}`}>
                      🙋‍♀️
                    </span>
                    <span className="text-xs font-bold">Dinner Available</span>
                    <span className="text-[10px] text-gray-500 mt-1">Left Hand</span>
                  </button>
                </div>
              </div>
            )}

            {/* Member List Container */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  👥 Group Members ({members.length})
                </h3>
                
                <div className="flex gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-950/50 text-gossip-amber border border-gossip-amber/30 text-[10px] font-bold">
                    🙋‍♂️ Lunch: {members.filter(m => m.lunchAvailable).length}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-pink-950/50 text-gossip-pink border border-gossip-pink/30 text-[10px] font-bold">
                    🙋‍♀️ Dinner: {members.filter(m => m.dinnerAvailable).length}
                  </span>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search members by name or username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs glass-input"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Members List */}
              <div className="space-y-2.5">
                {filteredMembers.length === 0 ? (
                  <div className="text-center py-8 bg-gossip-panel/30 border border-gossip-border/50 rounded-2xl">
                    <p className="text-xs text-gray-500 font-medium">No members found matching "{searchQuery}"</p>
                  </div>
                ) : (
                  filteredMembers.map((m) => {
                    const status = getUserStatus(m);
                    const isSelf = m.id === user.id;

                    return (
                      <div 
                        key={m.id}
                        className={`flex items-center justify-between p-3.5 rounded-2xl glass-panel border transition-all ${
                          isSelf ? 'border-gossip-purple/35 bg-gossip-panel/50 shadow-md' : 'border-gossip-border/40'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 bg-gradient-to-tr from-gossip-purple/30 to-gossip-pink/20 rounded-xl flex items-center justify-center font-bold text-gossip-purple border border-gossip-border text-sm shadow-inner">
                            {m.name.substring(0, 2).toUpperCase()}
                            {status.online && (
                              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-gossip-dark animate-pulse"></span>
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-bold text-white">{m.name}</h4>
                              {isSelf && (
                                <span className="text-[8px] bg-gossip-purple/30 border border-gossip-purple/50 text-gossip-purple px-1.5 py-0.2 rounded font-bold uppercase">You</span>
                              )}
                              {m.role === 'admin' && (
                                <span className="text-[8px] bg-red-950 border border-red-500/30 text-red-400 px-1.5 py-0.2 rounded font-bold uppercase">Admin</span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-500 mt-0.5 font-mono">@{m.username}</p>
                          </div>
                        </div>

                        {/* Availability Hand Toggles */}
                        <div className="flex items-center gap-1.5">
                          {status.lunch && (
                            <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-950/40 border border-gossip-amber/30 text-gossip-amber rounded-full text-[10px] font-bold shadow-sm">
                              <span>🙋‍♂️</span>
                              <span>Lunch</span>
                            </div>
                          )}
                          
                          {status.dinner && (
                            <div className="flex items-center gap-1 px-2.5 py-1 bg-pink-950/40 border border-gossip-pink/30 text-gossip-pink rounded-full text-[10px] font-bold shadow-sm">
                              <span>🙋‍♀️</span>
                              <span>Dinner</span>
                            </div>
                          )}

                          {!status.lunch && !status.dinner && (
                            <span className="text-[10px] text-gray-500 font-semibold italic pr-1">Not available</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 2: CHAT INTERFACE (BROADCAST & DIRECT PRIVATE MESSAGES) --- */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-[75vh] glass-panel rounded-3xl overflow-hidden border border-gossip-border shadow-2xl relative">
            
            {/* Chat Target Header Selector */}
            <div className="p-3 bg-gossip-dark/50 border-b border-gossip-border flex items-center justify-between z-10">
              <div className="flex items-center gap-2.5">
                {/* Contact Selection Animated Button */}
                <button
                  onClick={() => {
                    setShowContactModal(true);
                    setContactSearchQuery('');
                  }}
                  className="flex items-center gap-2 bg-gradient-to-r from-gossip-purple/80 to-gossip-pink/80 hover:from-purple-500 hover:to-pink-500 hover:scale-[1.03] active:scale-[0.98] text-white px-3.5 py-2 rounded-2xl text-xs font-bold shadow-md transition-all duration-300"
                >
                  <Users size={14} className="animate-pulse" />
                  <span>Choose Chat</span>
                </button>

                {/* Display Chosen Recipient */}
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white">
                    {chatRecipient === 'group' ? '📣 Group Broadcast' : `💬 ${activeChatUser?.name}`}
                  </span>
                  {chatRecipient !== 'group' && activeChatUser && (
                    <span className="text-[9px] text-gray-500 -mt-0.5">@{activeChatUser.username}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearLocalChat}
                  className="flex items-center gap-1 text-[10px] font-bold text-gossip-pink hover:text-pink-400 bg-gossip-panel border border-gossip-border/50 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-sm"
                  title="Clear feed history locally"
                >
                  <Trash2 size={10} />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            {/* Hand Status indicators displayed above the chatbox when in DM */}
            {chatRecipient !== 'group' && activeChatUserStatus && (
              <div className="bg-slate-900/60 px-4 py-2 border-b border-gossip-border/20 flex gap-4 text-xs select-none">
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider self-center">Status:</span>
                
                {activeChatUserStatus.lunch && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-950/40 border border-gossip-amber/35 text-gossip-amber rounded-full text-[9px] font-bold animate-pulse">
                    🙋‍♂️ Lunch Available
                  </span>
                )}
                {activeChatUserStatus.dinner && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-pink-950/40 border border-gossip-pink/35 text-gossip-pink rounded-full text-[9px] font-bold animate-pulse">
                    🙋‍♀️ Dinner Available
                  </span>
                )}
                {!activeChatUserStatus.lunch && !activeChatUserStatus.dinner && (
                  <span className="text-[10px] text-gray-500 font-semibold italic self-center">Not available (Lunch/Dinner)</span>
                )}
              </div>
            )}

            {/* Chat Thread Panel */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gossip-dark/30">
              {displayMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                  <span className="text-3xl">🤫</span>
                  <h4 className="text-xs font-bold text-gray-400">No gossip yet in this feed</h4>
                  <p className="text-[10px] text-gray-500 max-w-[200px]">
                    {chatRecipient === 'group' 
                      ? 'Messages sent here are visible to all members of this group.' 
                      : 'This is a private direct message thread. Only you and this member can view it.'}
                  </p>
                </div>
              ) : (
                displayMessages.map((msg) => {
                  const isMine = msg.senderId === user.id;
                  const msgTime = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <div 
                      key={msg.id} 
                      className="flex flex-col animate-slideIn"
                      style={{ alignItems: isMine ? 'flex-end' : 'flex-start' }}
                    >
                      {!isMine && chatRecipient === 'group' && (
                        <span className="text-[9px] font-bold text-gossip-purple pl-1.5 mb-0.5">{msg.senderName}</span>
                      )}

                      <div 
                        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs relative shadow-md ${
                          isMine 
                            ? 'bg-gossip-purple text-white rounded-tr-none' 
                            : 'bg-gossip-panel text-gray-200 rounded-tl-none border border-gossip-border/50'
                        } ${msg.optimistic ? 'opacity-60 animate-pulse' : ''}`}
                      >
                        <p className="break-words">{msg.text}</p>
                        
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className="text-[8px] text-gray-400 opacity-80">{msgTime}</span>
                          {!msg.optimistic && (
                            <span className="text-[8px] text-gray-400">
                              {msg.receiverId ? '🔒' : '📣'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Form */}
            <form onSubmit={handleSendMessage} className="p-3 bg-gossip-panel/80 border-t border-gossip-border flex gap-2">
              <input
                type="text"
                placeholder={
                  chatRecipient === 'group' 
                    ? 'Broadcast gossip to the group...' 
                    : `Send private DM...`
                }
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs glass-input"
              />
              <button
                type="submit"
                className="p-2.5 bg-gossip-purple hover:bg-purple-500 rounded-xl text-white transition-all shadow-md cursor-pointer shrink-0"
              >
                <Send size={14} />
              </button>
            </form>

            {/* CONTACT SELECTOR MODAL OVERLAY */}
            {showContactModal && (
              <div className="absolute inset-0 bg-gossip-dark/95 backdrop-blur-md flex flex-col z-20 animate-fadeIn p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Select Contact</h3>
                  <button 
                    onClick={() => setShowContactModal(false)}
                    className="p-1 hover:bg-gossip-panel rounded-lg text-gray-400 hover:text-white transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Contact Search Input */}
                <div className="relative mb-4">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={contactSearchQuery}
                    onChange={(e) => setContactSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl text-xs glass-input"
                  />
                </div>

                {/* Contacts List Grid */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {/* Option for Group Broadcast */}
                  <button
                    onClick={() => {
                      setChatRecipient('group');
                      setShowContactModal(false);
                    }}
                    className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
                      chatRecipient === 'group'
                        ? 'bg-gossip-purple/20 border-gossip-purple text-white font-bold'
                        : 'bg-gossip-panel border-gossip-border/50 text-gray-300 hover:bg-gossip-panel'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gossip-purple/35 flex items-center justify-center text-white text-xs font-bold">📣</div>
                      <div className="text-left">
                        <p className="text-xs font-bold">Broadcast Group</p>
                        <p className="text-[9px] text-gray-500">Messages visible to everyone</p>
                      </div>
                    </div>
                  </button>

                  {/* Individual Group Members */}
                  {filteredContacts.length === 0 ? (
                    <p className="text-center text-xs text-gray-500 py-6">No matching members found</p>
                  ) : (
                    filteredContacts.map(m => {
                      const status = getUserStatus(m);
                      return (
                        <button
                          key={m.id}
                          onClick={() => {
                            setChatRecipient(m.id);
                            setShowContactModal(false);
                          }}
                          className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
                            chatRecipient === m.id
                              ? 'bg-gossip-pink/20 border-gossip-pink text-white font-bold'
                              : 'bg-gossip-panel border-gossip-border/50 text-gray-300 hover:bg-gossip-panel'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative w-8 h-8 rounded-lg bg-gossip-panel flex items-center justify-center text-gossip-purple border border-gossip-border text-xs font-bold">
                              {m.name.substring(0, 2).toUpperCase()}
                              {status.online && (
                                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-gossip-dark"></span>
                              )}
                            </div>
                            <div className="text-left">
                              <p className="text-xs font-bold">{m.name}</p>
                              <p className="text-[9px] text-gray-500">@{m.username}</p>
                            </div>
                          </div>

                          {/* Quick indicators of hand status in list */}
                          <div className="flex items-center gap-1">
                            {status.lunch && <span className="text-xs">🙋‍♂️</span>}
                            {status.dinner && <span className="text-xs">🙋‍♀️</span>}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

          </div>
        )}

        {/* --- TAB 3: ADMIN PANEL (MEMBER MANAGEMENT, WHATSAPP INVITER, WIPE DB) --- */}
        {activeTab === 'admin' && user?.role === 'admin' && (
          <div className="space-y-6">
            
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                ⚙️ Admin Controls
              </h3>
              <button
                onClick={() => setShowAddMember(!showAddMember)}
                className="flex items-center gap-1 bg-gossip-purple hover:bg-purple-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-all shadow-md cursor-pointer"
              >
                {showAddMember ? <X size={12} /> : <Plus size={12} />}
                <span>{showAddMember ? 'Cancel' : 'New Member'}</span>
              </button>
            </div>

            {/* Add Member Form Panel */}
            {showAddMember && (
              <form onSubmit={handleAddMember} className="p-4 rounded-3xl glass-panel space-y-4 border-gossip-purple/40">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Register New Group Member</h4>
                
                {memberError && (
                  <div className="flex items-center gap-2 bg-red-950/50 border border-red-500/40 text-red-200 text-xs p-3 rounded-xl">
                    <AlertCircle size={16} className="text-red-400 shrink-0" />
                    <span>{memberError}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-medium text-gray-400 mb-1 pl-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-xs glass-input"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-gray-400 mb-1 pl-1">Desired Username</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. johndoe"
                      value={newMemberUsername}
                      onChange={(e) => setNewMemberUsername(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-xs glass-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-medium text-gray-400 mb-1 pl-1">WhatsApp Phone</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 1234567890"
                      value={newMemberPhone}
                      onChange={(e) => setNewMemberPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-xs glass-input"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-gray-400 mb-1 pl-1">Passcode (PIN)</label>
                    <input
                      type="text"
                      required
                      placeholder="PIN e.g. 1234"
                      value={newMemberPasscode}
                      onChange={(e) => setNewMemberPasscode(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-xs glass-input font-mono text-center"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-gray-400 mb-1 pl-1">Group Role</label>
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs glass-input bg-gossip-dark"
                  >
                    <option value="member">Regular Member</option>
                    <option value="admin">Group Admin</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gossip-purple hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
                >
                  Create Member Account
                </button>
              </form>
            )}

            {/* Edit Member Modal Overlay */}
            {editingMember && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <form onSubmit={handleUpdateMemberDetails} className="w-full max-w-sm p-5 rounded-3xl glass-panel space-y-4 border-gossip-pink/40">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Edit Member Profile</h4>
                    <button type="button" onClick={() => setEditingMember(null)} className="text-gray-400 hover:text-white">
                      <X size={16} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-medium text-gray-400 mb-1 pl-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={editingMember.name}
                        onChange={(e) => setEditingMember({...editingMember, name: e.target.value})}
                        className="w-full px-3 py-2 rounded-lg text-xs glass-input"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-400 mb-1 pl-1">Username</label>
                      <input
                        type="text"
                        required
                        value={editingMember.username}
                        onChange={(e) => setEditingMember({...editingMember, username: e.target.value})}
                        className="w-full px-3 py-2 rounded-lg text-xs glass-input"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-400 mb-1 pl-1">Phone Number</label>
                      <input
                        type="tel"
                        required
                        value={editingMember.phone}
                        onChange={(e) => setEditingMember({...editingMember, phone: e.target.value})}
                        className="w-full px-3 py-2 rounded-lg text-xs glass-input"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-400 mb-1 pl-1">Passcode</label>
                      <input
                        type="text"
                        required
                        value={editingMember.passcode}
                        onChange={(e) => setEditingMember({...editingMember, passcode: e.target.value})}
                        className="w-full px-3 py-2 rounded-lg text-xs glass-input font-mono text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-400 mb-1 pl-1">Role</label>
                      <select
                        value={editingMember.role || 'member'}
                        onChange={(e) => setEditingMember({...editingMember, role: e.target.value})}
                        className="w-full px-3 py-2 rounded-lg text-xs glass-input bg-gossip-dark"
                      >
                        <option value="member">Regular Member</option>
                        <option value="admin">Group Admin</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-gossip-purple to-gossip-pink text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
                  >
                    Save Changes
                  </button>
                </form>
              </div>
            )}

            {/* PASSWORD RESET REQUESTS SUB-SECTION */}
            {passwordResets.length > 0 && (
              <div className="p-4 rounded-3xl border border-gossip-pink/35 bg-pink-950/10 space-y-3">
                <h4 className="text-xs font-bold text-gossip-pink uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert size={14} /> Password Reset Requests ({passwordResets.length})
                </h4>
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                  {passwordResets.map(reset => (
                    <div key={reset.id} className="p-3 bg-gossip-panel/80 rounded-xl border border-gossip-border/55 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-white">@{reset.username}</p>
                        <p className="text-[9px] text-gray-500">{new Date(reset.timestamp).toLocaleDateString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <button
                        onClick={() => {
                          setResolvingReset(reset);
                          setResetPasscodeValue('');
                          setResetError('');
                        }}
                        className="bg-gossip-pink hover:bg-pink-650 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg"
                      >
                        Reset PIN
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Member Management List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">Manage Members ({members.length})</h4>
              <div className="space-y-2">
                {members.map(m => (
                  <div 
                    key={m.id}
                    className="p-3.5 rounded-2xl glass-panel border border-gossip-border/40 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">{m.name}</span>
                        {m.role === 'admin' && (
                          <span className="text-[8px] bg-red-950 border border-red-500/30 text-red-400 px-1 py-0.2 rounded font-extrabold uppercase">Admin</span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5">@{m.username} | {m.phone || 'No phone'} | Key: <span className="font-mono font-bold text-gossip-purple">{m.passcode}</span></p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleGenerateWhatsAppInvite(m.phone || '1234567890', m.passcode)}
                        className="p-2 bg-green-950/60 border border-green-500/20 text-green-400 hover:bg-green-900 rounded-xl transition-all cursor-pointer"
                        title="Send WhatsApp Invite Link"
                      >
                        <Share2 size={12} />
                      </button>

                      <button
                        onClick={() => setEditingMember(m)}
                        className="p-2 bg-gossip-panel hover:bg-gossip-border text-gray-300 rounded-xl transition-all cursor-pointer border border-gossip-border/50"
                        title="Edit details"
                      >
                        <Edit size={12} />
                      </button>

                      <button
                        onClick={() => handleDeleteMember(m.id, m.name)}
                        disabled={m.id === 'admin-id-default' || m.id === user.id}
                        className="p-2 bg-red-950/60 border border-red-500/20 text-red-400 hover:bg-red-900 rounded-xl transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                        title="Delete member"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* DANGER ZONE - CLEAR GROUP DATA */}
            <div className="p-4 rounded-3xl border border-red-500/30 bg-red-950/20 space-y-3">
              <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-1.5">
                ⚠️ DANGER ZONE
              </h4>
              <p className="text-[10px] text-gray-400">
                Wiping the group database clears all members (except your admin account), resets availability status parameters, and deletes all group chat message histories.
              </p>
              <button
                onClick={handleDeleteAllChatData}
                className="w-full py-2.5 bg-red-900 hover:bg-red-800 text-white font-extrabold rounded-xl text-xs transition-all shadow-md cursor-pointer border border-red-500/40"
              >
                Delete Group Chat & Member Data
              </button>
            </div>

          </div>
        )}

        {/* --- TAB 4: JOINING REQUESTS (ADMIN ONLY VIEW) --- */}
        {activeTab === 'requests' && user?.role === 'admin' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 pl-1">
              📥 Pending Access Requests ({requests.filter(r => r.status === 'pending').length})
            </h3>

            {/* Approved Passcode Copy Popup */}
            {approvedPasscodeAlert && (
              <div className="p-4 rounded-3xl border border-green-500/30 bg-green-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-green-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> Account Created!
                  </h4>
                  <button onClick={() => setApprovedPasscodeAlert(null)} className="text-gray-400 hover:text-white">
                    <X size={14} />
                  </button>
                </div>
                <p className="text-[10px] text-gray-300">
                  Member <b>{approvedPasscodeAlert.name}</b> has been registered! Copy and send them this passcode:
                </p>
                <div className="flex items-center justify-between bg-gossip-dark/80 p-3 rounded-xl border border-gossip-border">
                  <span className="font-mono font-extrabold text-lg text-gossip-amber tracking-widest">{approvedPasscodeAlert.passcode}</span>
                  <button
                    onClick={() => handleGenerateWhatsAppInvite(approvedPasscodeAlert.phone, approvedPasscodeAlert.passcode)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-gossip-purple text-white text-[10px] font-bold rounded-lg transition-all"
                  >
                    <Share2 size={10} /> Send Invite
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2.5">
              {requests.length === 0 ? (
                <div className="text-center py-10 bg-gossip-panel/30 border border-gossip-border/50 rounded-3xl">
                  <p className="text-xs text-gray-500 font-medium">No membership requests received</p>
                </div>
              ) : (
                [...requests].reverse().map(req => {
                  const reqTime = new Date(req.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

                  return (
                    <div 
                      key={req.id}
                      className="p-4 rounded-2xl glass-panel border border-gossip-border/40 flex flex-col gap-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-white">{req.name}</h4>
                          <p className="text-[10px] text-gray-500 mt-0.5">@{req.username} | {req.phone} | <span className="text-[9px]">{reqTime}</span></p>
                        </div>
                        
                        <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                          req.status === 'pending'
                            ? 'bg-amber-950 border-amber-500/30 text-gossip-amber'
                            : req.status === 'approved'
                            ? 'bg-green-950 border-green-500/30 text-green-400'
                            : 'bg-red-950 border-red-500/30 text-red-400'
                        }`}>
                          {req.status}
                        </span>
                      </div>

                      {req.status === 'pending' && (
                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gossip-border/30">
                          <button
                            onClick={() => handleRejectRequest(req.id)}
                            className="py-1.5 bg-gossip-dark border border-gossip-border hover:bg-gossip-border text-red-400 text-[10px] font-bold rounded-xl transition-all cursor-pointer text-center"
                          >
                            Reject Request
                          </button>
                          
                          <button
                            onClick={() => handleApproveRequest(req.id)}
                            className="py-1.5 bg-gossip-purple hover:bg-purple-500 text-white text-[10px] font-bold rounded-xl transition-all cursor-pointer text-center shadow"
                          >
                            Approve Access
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

      </main>

      {/* ADMIN RESOLVING PASSWORD RESET MODAL */}
      {resolvingReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-sm bg-gossip-panel border border-gossip-border/50 p-6 rounded-3xl shadow-2xl relative">
            <button 
              onClick={() => setResolvingReset(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
              🛡️ Reset Passcode for @{resolvingReset.username}
            </h3>
            <p className="text-[10px] text-gray-500 mb-4">Set a new passcode PIN for this member.</p>

            {resetError && (
              <div className="bg-red-500/15 border border-red-500/30 text-red-400 text-[10px] p-3 rounded-xl mb-3 flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            <form onSubmit={handleResolvePasswordReset} className="space-y-4">
              <div>
                <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1 pl-0.5">New PIN (4 digits)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 9876"
                  value={resetPasscodeValue}
                  onChange={(e) => setResetPasscodeValue(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs glass-input font-mono text-center tracking-widest"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gossip-purple text-white font-bold rounded-xl text-xs"
              >
                Reset PIN & Resolve Request
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- WHATSAPP PRE-FILLED INVITATION MODAL --- */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-sm p-5 rounded-3xl glass-panel space-y-4 border-gossip-purple/40">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1">
                💬 Generate WhatsApp Invite
              </h4>
              <button onClick={() => setInviteModalOpen(false)} className="text-gray-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-medium text-gray-400 mb-1 pl-1">WhatsApp Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. 1234567890"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs glass-input"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-400 mb-1 pl-1">Member Passcode (PIN)</label>
                <input
                  type="text"
                  placeholder="e.g. 1234"
                  value={whatsappPasscode}
                  onChange={(e) => setWhatsappPasscode(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs glass-input text-center font-mono tracking-widest"
                />
              </div>
            </div>

            <div className="p-3 bg-gossip-dark/50 border border-gossip-border/50 rounded-xl text-[10px] text-gray-400 leading-relaxed break-words font-medium">
              <span className="font-extrabold text-white text-[9px] uppercase tracking-wider block mb-1">Pre-filled Message Preview:</span>
              Hi! You have been invited to join our private Gossip Group. 🤐<br/>
              1. Visit: <i>{window.location.origin}</i><br/>
              2. Log in using Passcode: <b>{whatsappPasscode}</b>
            </div>

            <a
              href={getWhatsAppURL()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setInviteModalOpen(false)}
              className="block w-full py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl text-xs transition-all shadow-md text-center cursor-pointer"
            >
              Open WhatsApp Chat & Send
            </a>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL OVERLAY */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-sm bg-gossip-panel border border-gossip-border/50 p-6 rounded-3xl relative animate-fadeIn shadow-2xl">
            <button 
              onClick={() => setShowChangePasswordModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
              🔑 Change Your Passcode
            </h3>

            {changePasswordStatus === 'success' && (
              <div className="bg-emerald-500/10 border border-emerald-500/35 text-emerald-400 text-xs p-3 rounded-xl flex items-center gap-2 mb-4">
                <CheckCircle2 size={16} />
                <span>Passcode updated successfully!</span>
              </div>
            )}

            {changePasswordStatus === 'error' && (
              <div className="bg-red-500/10 border border-red-500/35 text-red-400 text-xs p-3 rounded-xl flex items-center gap-2 mb-4">
                <AlertCircle size={16} />
                <span>{changePasswordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Current Passcode</label>
                <input
                  type="password"
                  required
                  placeholder="Enter current PIN"
                  value={oldPasscode}
                  onChange={(e) => setOldPasscode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs glass-input font-mono tracking-widest text-center"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">New Passcode (4-8 digits)</label>
                <input
                  type="password"
                  required
                  placeholder="Enter new PIN"
                  value={newPasscode}
                  onChange={(e) => setNewPasscode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs glass-input font-mono tracking-widest text-center"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Confirm New Passcode</label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter PIN"
                  value={confirmNewPasscode}
                  onChange={(e) => setConfirmNewPasscode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs glass-input font-mono tracking-widest text-center"
                />
              </div>

              <button
                type="submit"
                disabled={changePasswordStatus === 'submitting'}
                className="w-full py-2.5 bg-gossip-purple hover:bg-purple-500 text-white font-bold rounded-xl text-xs"
              >
                {changePasswordStatus === 'submitting' ? 'Updating...' : 'Update Passcode'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- BOTTOM FLOATING NAVIGATION BAR (HOME, CHAT, ADMIN, REQUESTS) --- */}
      <nav className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-40 bg-gossip-panel/80 backdrop-blur-lg border border-gossip-border/80 px-2 py-2 rounded-2xl flex items-center justify-around shadow-2xl safe-bottom-margin">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'home' 
              ? 'text-gossip-purple bg-gossip-dark/60 font-bold border border-gossip-border/30 shadow-sm' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Home size={18} className={activeTab === 'home' ? 'animate-pulse' : ''} />
          <span className="text-[10px] mt-1">Home</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'chat' 
              ? 'text-gossip-purple bg-gossip-dark/60 font-bold border border-gossip-border/30 shadow-sm' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <div className="relative">
            <MessageSquare size={18} />
            {messages.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-gossip-pink rounded-full border border-gossip-panel animate-ping"></span>
            )}
          </div>
          <span className="text-[10px] mt-1">Chat</span>
        </button>

        {user?.role === 'admin' && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'admin' 
                ? 'text-gossip-purple bg-gossip-dark/60 font-bold border border-gossip-border/30 shadow-sm' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Settings size={18} />
            <span className="text-[10px] mt-1">Admin</span>
          </button>
        )}

        {user?.role === 'admin' && (
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'requests' 
                ? 'text-gossip-purple bg-gossip-dark/60 font-bold border border-gossip-border/30 shadow-sm' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <div className="relative">
              <UserPlus size={18} />
              {(requests.filter(r => r.status === 'pending').length > 0 || passwordResets.length > 0) && (
                <span className="absolute -top-1 -right-1.5 bg-gossip-pink text-white text-[8px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border border-gossip-panel glow-pink animate-bounce">
                  {requests.filter(r => r.status === 'pending').length + passwordResets.length}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-1">Requests</span>
          </button>
        )}
      </nav>

    </div>
  );
}
