// Dynamic import for @vercel/kv to avoid build crashes if not configured
let kv = null;
const isKVConfigured = !!(process.env.KV_REST_API_URL || process.env.KV_URL);

if (isKVConfigured) {
  try {
    const kvModule = await import('@vercel/kv');
    kv = kvModule.kv;
  } catch (e) {
    console.warn('Failed to import @vercel/kv, falling back to mock DB:', e.message);
  }
}

// Seed default group data
const DEFAULT_GROUP = {
  id: 'group-default-id',
  name: 'Gossip Club',
  adminUsername: 'admin',
  adminPasscode: '1234',
  status: 'active',
  paymentStatus: 'paid',
  aadharNumber: '000000000000',
  aadharName: 'Admin User',
  createdAt: new Date().toISOString()
};

// Seed default admin member data
const DEFAULT_ADMIN = {
  id: 'admin-id-default',
  name: 'Admin User',
  username: 'admin',
  phone: '1234567890',
  passcode: '1234',
  role: 'admin',
  groupId: 'group-default-id',
  lunchAvailable: false,
  dinnerAvailable: false,
  lastSeen: new Date().toISOString()
};

// In-memory fallback store for serverless environments (Vercel)
// Data here does NOT persist across function invocations without KV!
let inMemoryDB = null;

function getDefaultDB() {
  return {
    groups: [DEFAULT_GROUP],
    groupRequests: [],
    members: [DEFAULT_ADMIN],
    messages: [],
    requests: [],
    passwordResetRequests: []
  };
}

// Detect if we can use the filesystem (local dev) or need in-memory (Vercel)
// Cache the fs module reference for reuse
let useFilesystem = false;
let MOCK_DB_PATH = '';
let fsModule = null;

try {
  const fsImport = await import('fs');
  const pathImport = await import('path');
  fsModule = fsImport.default;
  MOCK_DB_PATH = pathImport.default.join(process.cwd(), 'gossip_mock_db.json');
  // Test if we can write to the filesystem
  if (fsModule.existsSync(MOCK_DB_PATH)) {
    useFilesystem = true;
  } else {
    // Try creating the file to verify write access
    fsModule.writeFileSync(MOCK_DB_PATH, JSON.stringify(getDefaultDB(), null, 2));
    useFilesystem = true;
  }
} catch (e) {
  // Filesystem not available (Vercel serverless), use in-memory
  useFilesystem = false;
  console.warn('Filesystem not available, using in-memory DB. Configure Vercel KV for persistence.');
}

function getMockDB() {
  if (useFilesystem && fsModule) {
    try {
      if (!fsModule.existsSync(MOCK_DB_PATH)) {
        const initialData = getDefaultDB();
        fsModule.writeFileSync(MOCK_DB_PATH, JSON.stringify(initialData, null, 2));
        return initialData;
      }
      const content = fsModule.readFileSync(MOCK_DB_PATH, 'utf-8');
      const data = JSON.parse(content);
      // Ensure all collections exist
      if (!data.groups) data.groups = [DEFAULT_GROUP];
      if (!data.groupRequests) data.groupRequests = [];
      if (!data.members) data.members = [DEFAULT_ADMIN];
      if (!data.messages) data.messages = [];
      if (!data.requests) data.requests = [];
      if (!data.passwordResetRequests) data.passwordResetRequests = [];
      return data;
    } catch (e) {
      console.error('Error reading mock DB file:', e);
    }
  }

  // In-memory fallback
  if (!inMemoryDB) {
    inMemoryDB = getDefaultDB();
  }
  return inMemoryDB;
}

function writeMockDB(data) {
  if (useFilesystem && fsModule) {
    try {
      fsModule.writeFileSync(MOCK_DB_PATH, JSON.stringify(data, null, 2));
      return;
    } catch (e) {
      console.error('Error writing mock DB file, storing in memory:', e);
    }
  }
  // In-memory fallback
  inMemoryDB = data;
}

// GROUPS HELPERS
export async function getGroups() {
  if (isKVConfigured) {
    try {
      let groups = await kv.get('gossip:groups');
      if (!groups || groups.length === 0) {
        groups = [DEFAULT_GROUP];
        await kv.set('gossip:groups', groups);
      }
      return groups;
    } catch (e) {
      console.error('Error reading groups from KV, falling back to mock:', e);
    }
  }
  return getMockDB().groups;
}

export async function saveGroups(groups) {
  if (isKVConfigured) {
    try {
      await kv.set('gossip:groups', groups);
      return true;
    } catch (e) {
      console.error('Error saving groups to KV:', e);
    }
  }
  const db = getMockDB();
  db.groups = groups;
  writeMockDB(db);
  return true;
}

export async function addGroup(group) {
  const groups = await getGroups();
  const newGroup = {
    id: 'grp_' + Math.random().toString(36).substring(2, 9),
    status: 'active',
    paymentStatus: 'paid',
    createdAt: new Date().toISOString(),
    ...group
  };
  groups.push(newGroup);
  await saveGroups(groups);
  return newGroup;
}

export async function updateGroup(id, updates) {
  const groups = await getGroups();
  let updatedGroup = null;
  const updatedGroups = groups.map(g => {
    if (g.id === id) {
      updatedGroup = { ...g, ...updates };
      return updatedGroup;
    }
    return g;
  });
  if (updatedGroup) {
    await saveGroups(updatedGroups);
  }
  return updatedGroup;
}

export async function deleteGroup(id) {
  const groups = await getGroups();
  const filteredGroups = groups.filter(g => g.id !== id);
  if (filteredGroups.length !== groups.length) {
    await saveGroups(filteredGroups);
    return true;
  }
  return false;
}

// GROUP CREATION REQUESTS (SUPER ADMIN)
export async function getGroupRequests() {
  if (isKVConfigured) {
    try {
      const requests = await kv.get('gossip:groupRequests');
      return requests || [];
    } catch (e) {
      console.error('Error reading groupRequests from KV:', e);
    }
  }
  return getMockDB().groupRequests || [];
}

export async function saveGroupRequests(requests) {
  if (isKVConfigured) {
    try {
      await kv.set('gossip:groupRequests', requests);
      return true;
    } catch (e) {
      console.error('Error saving groupRequests to KV:', e);
    }
  }
  const db = getMockDB();
  db.groupRequests = requests;
  writeMockDB(db);
  return true;
}

export async function addGroupRequest(request) {
  const requests = await getGroupRequests();
  const newRequest = {
    id: 'greq_' + Math.random().toString(36).substring(2, 9),
    status: 'pending',
    timestamp: new Date().toISOString(),
    ...request
  };
  requests.push(newRequest);
  await saveGroupRequests(requests);
  return newRequest;
}

export async function updateGroupRequest(id, status) {
  const requests = await getGroupRequests();
  let updatedRequest = null;
  const updatedRequests = requests.map(r => {
    if (r.id === id) {
      updatedRequest = { ...r, status };
      return updatedRequest;
    }
    return r;
  });
  if (updatedRequest) {
    await saveGroupRequests(updatedRequests);
  }
  return updatedRequest;
}

// MEMBERS HELPERS
export async function getMembers() {
  if (isKVConfigured) {
    try {
      let members = await kv.get('gossip:members');
      if (!members || members.length === 0) {
        members = [DEFAULT_ADMIN];
        await kv.set('gossip:members', members);
      }
      return members;
    } catch (e) {
      console.error('Error reading members from KV, falling back to mock:', e);
    }
  }
  return getMockDB().members;
}

export async function saveMembers(members) {
  if (isKVConfigured) {
    try {
      await kv.set('gossip:members', members);
      return true;
    } catch (e) {
      console.error('Error saving members to KV:', e);
    }
  }
  const db = getMockDB();
  db.members = members;
  writeMockDB(db);
  return true;
}

export async function addMember(member) {
  const members = await getMembers();
  const newMember = {
    id: member.id || 'mem_' + Math.random().toString(36).substring(2, 9),
    lunchAvailable: false,
    dinnerAvailable: false,
    lastSeen: new Date().toISOString(),
    ...member
  };
  members.push(newMember);
  await saveMembers(members);
  return newMember;
}

export async function updateMember(id, updates) {
  const members = await getMembers();
  let updatedMember = null;
  const updatedMembers = members.map(m => {
    if (m.id === id) {
      updatedMember = { ...m, ...updates, lastSeen: new Date().toISOString() };
      return updatedMember;
    }
    return m;
  });
  if (updatedMember) {
    await saveMembers(updatedMembers);
  }
  return updatedMember;
}

export async function deleteMember(id) {
  const members = await getMembers();
  const filteredMembers = members.filter(m => m.id !== id);
  if (filteredMembers.length !== members.length) {
    await saveMembers(filteredMembers);
    return true;
  }
  return false;
}

// MEMBERSHIP REQUESTS HELPERS (GROUP ADMINS)
export async function getRequests() {
  if (isKVConfigured) {
    try {
      const requests = await kv.get('gossip:requests');
      return requests || [];
    } catch (e) {
      console.error('Error reading requests from KV:', e);
    }
  }
  return getMockDB().requests || [];
}

export async function saveRequests(requests) {
  if (isKVConfigured) {
    try {
      await kv.set('gossip:requests', requests);
      return true;
    } catch (e) {
      console.error('Error saving requests to KV:', e);
    }
  }
  const db = getMockDB();
  db.requests = requests;
  writeMockDB(db);
  return true;
}

export async function addRequest(request) {
  const requests = await getRequests();
  const newRequest = {
    id: 'req_' + Math.random().toString(36).substring(2, 9),
    status: 'pending',
    timestamp: new Date().toISOString(),
    ...request
  };
  requests.push(newRequest);
  await saveRequests(requests);
  return newRequest;
}

export async function updateRequest(id, status) {
  const requests = await getRequests();
  let updatedRequest = null;
  const updatedRequests = requests.map(r => {
    if (r.id === id) {
      updatedRequest = { ...r, status };
      return updatedRequest;
    }
    return r;
  });
  if (updatedRequest) {
    await saveRequests(updatedRequests);
  }
  return updatedRequest;
}

// PASSWORD RESET REQUESTS HELPERS
export async function getPasswordResetRequests() {
  if (isKVConfigured) {
    try {
      const requests = await kv.get('gossip:passwordResetRequests');
      return requests || [];
    } catch (e) {
      console.error('Error reading passwordResetRequests from KV:', e);
    }
  }
  return getMockDB().passwordResetRequests || [];
}

export async function savePasswordResetRequests(requests) {
  if (isKVConfigured) {
    try {
      await kv.set('gossip:passwordResetRequests', requests);
      return true;
    } catch (e) {
      console.error('Error saving passwordResetRequests to KV:', e);
    }
  }
  const db = getMockDB();
  db.passwordResetRequests = requests;
  writeMockDB(db);
  return true;
}

export async function addPasswordResetRequest(request) {
  const requests = await getPasswordResetRequests();
  const newRequest = {
    id: 'reset_' + Math.random().toString(36).substring(2, 9),
    status: 'pending',
    timestamp: new Date().toISOString(),
    ...request
  };
  requests.push(newRequest);
  await savePasswordResetRequests(requests);
  return newRequest;
}

export async function updatePasswordResetRequest(id, status) {
  const requests = await getPasswordResetRequests();
  let updatedRequest = null;
  const updatedRequests = requests.map(r => {
    if (r.id === id) {
      updatedRequest = { ...r, status };
      return updatedRequest;
    }
    return r;
  });
  if (updatedRequest) {
    await savePasswordResetRequests(updatedRequests);
  }
  return updatedRequest;
}

// MESSAGES HELPERS
export async function getMessages() {
  if (isKVConfigured) {
    try {
      const messages = await kv.get('gossip:messages');
      return messages || [];
    } catch (e) {
      console.error('Error reading messages from KV:', e);
    }
  }
  return getMockDB().messages || [];
}

export async function saveMessages(messages) {
  if (isKVConfigured) {
    try {
      await kv.set('gossip:messages', messages);
      return true;
    } catch (e) {
      console.error('Error saving messages to KV:', e);
    }
  }
  const db = getMockDB();
  db.messages = messages;
  writeMockDB(db);
  return true;
}

export async function addMessage(message) {
  const messages = await getMessages();
  const newMessage = {
    id: 'msg_' + Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString(),
    ...message
  };
  messages.push(newMessage);
  await saveMessages(messages);
  return newMessage;
}

// ADMIN CLEAR DATABASE
export async function clearAllData() {
  if (isKVConfigured) {
    try {
      await kv.set('gossip:groups', [DEFAULT_GROUP]);
      await kv.set('gossip:groupRequests', []);
      await kv.set('gossip:members', [DEFAULT_ADMIN]);
      await kv.set('gossip:messages', []);
      await kv.set('gossip:requests', []);
      await kv.set('gossip:passwordResetRequests', []);
      return true;
    } catch (e) {
      console.error('Error clearing Vercel KV:', e);
      return false;
    }
  }
  const initialData = {
    groups: [DEFAULT_GROUP],
    groupRequests: [],
    members: [DEFAULT_ADMIN],
    messages: [],
    requests: [],
    passwordResetRequests: []
  };
  writeMockDB(initialData);
  return true;
}
