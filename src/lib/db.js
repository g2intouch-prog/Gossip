import { neon } from '@neondatabase/serverless';

// Initialize the SQL client
// Make sure DATABASE_URL is set in your Vercel Environment Variables
const sql = neon(process.env.DATABASE_URL);

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

// Initialize tables if they don't exist
export async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS groups (
      id VARCHAR(255) PRIMARY KEY,
      data JSONB NOT NULL
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS group_requests (
      id VARCHAR(255) PRIMARY KEY,
      data JSONB NOT NULL
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS members (
      id VARCHAR(255) PRIMARY KEY,
      data JSONB NOT NULL
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS requests (
      id VARCHAR(255) PRIMARY KEY,
      data JSONB NOT NULL
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS password_reset_requests (
      id VARCHAR(255) PRIMARY KEY,
      data JSONB NOT NULL
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS messages (
      id VARCHAR(255) PRIMARY KEY,
      data JSONB NOT NULL
    );
  `;

  // Seed default data if tables are empty
  const groupsCount = await sql`SELECT count(*) FROM groups`;
  if (parseInt(groupsCount[0].count, 10) === 0) {
    await sql`INSERT INTO groups (id, data) VALUES (${DEFAULT_GROUP.id}, ${JSON.stringify(DEFAULT_GROUP)})`;
  }

  const membersCount = await sql`SELECT count(*) FROM members`;
  if (parseInt(membersCount[0].count, 10) === 0) {
    await sql`INSERT INTO members (id, data) VALUES (${DEFAULT_ADMIN.id}, ${JSON.stringify(DEFAULT_ADMIN)})`;
  }
}

// Initialize on first import
const dbInitialized = initDB().catch(console.error);

// GROUPS HELPERS
export async function getGroups() {
  await dbInitialized;
  const rows = await sql`SELECT data FROM groups`;
  return rows.map(r => r.data);
}

export async function addGroup(group) {
  await dbInitialized;
  const newGroup = {
    id: 'grp_' + Math.random().toString(36).substring(2, 9),
    status: 'active',
    paymentStatus: 'paid',
    createdAt: new Date().toISOString(),
    ...group
  };
  await sql`INSERT INTO groups (id, data) VALUES (${newGroup.id}, ${JSON.stringify(newGroup)})`;
  return newGroup;
}

export async function updateGroup(id, updates) {
  await dbInitialized;
  const result = await sql`
    UPDATE groups 
    SET data = data || ${JSON.stringify(updates)}::jsonb 
    WHERE id = ${id} 
    RETURNING data
  `;
  return result.length > 0 ? result[0].data : null;
}

export async function deleteGroup(id) {
  await dbInitialized;
  const result = await sql`DELETE FROM groups WHERE id = ${id} RETURNING id`;
  return result.length > 0;
}

// GROUP CREATION REQUESTS (SUPER ADMIN)
export async function getGroupRequests() {
  await dbInitialized;
  const rows = await sql`SELECT data FROM group_requests`;
  return rows.map(r => r.data);
}

export async function addGroupRequest(request) {
  await dbInitialized;
  const newRequest = {
    id: 'greq_' + Math.random().toString(36).substring(2, 9),
    status: 'pending',
    timestamp: new Date().toISOString(),
    ...request
  };
  await sql`INSERT INTO group_requests (id, data) VALUES (${newRequest.id}, ${JSON.stringify(newRequest)})`;
  return newRequest;
}

export async function updateGroupRequest(id, status) {
  await dbInitialized;
  const result = await sql`
    UPDATE group_requests 
    SET data = data || ${JSON.stringify({ status })}::jsonb 
    WHERE id = ${id} 
    RETURNING data
  `;
  return result.length > 0 ? result[0].data : null;
}

// MEMBERS HELPERS
export async function getMembers() {
  await dbInitialized;
  const rows = await sql`SELECT data FROM members`;
  return rows.map(r => r.data);
}

export async function addMember(member) {
  await dbInitialized;
  const newMember = {
    id: member.id || 'mem_' + Math.random().toString(36).substring(2, 9),
    lunchAvailable: false,
    dinnerAvailable: false,
    lastSeen: new Date().toISOString(),
    ...member
  };
  await sql`INSERT INTO members (id, data) VALUES (${newMember.id}, ${JSON.stringify(newMember)})`;
  return newMember;
}

export async function updateMember(id, updates) {
  await dbInitialized;
  const updateData = { ...updates, lastSeen: new Date().toISOString() };
  const result = await sql`
    UPDATE members 
    SET data = data || ${JSON.stringify(updateData)}::jsonb 
    WHERE id = ${id} 
    RETURNING data
  `;
  return result.length > 0 ? result[0].data : null;
}

export async function deleteMember(id) {
  await dbInitialized;
  const result = await sql`DELETE FROM members WHERE id = ${id} RETURNING id`;
  return result.length > 0;
}

// MEMBERSHIP REQUESTS HELPERS (GROUP ADMINS)
export async function getRequests() {
  await dbInitialized;
  const rows = await sql`SELECT data FROM requests`;
  return rows.map(r => r.data);
}

export async function addRequest(request) {
  await dbInitialized;
  const newRequest = {
    id: 'req_' + Math.random().toString(36).substring(2, 9),
    status: 'pending',
    timestamp: new Date().toISOString(),
    ...request
  };
  await sql`INSERT INTO requests (id, data) VALUES (${newRequest.id}, ${JSON.stringify(newRequest)})`;
  return newRequest;
}

export async function updateRequest(id, status) {
  await dbInitialized;
  const result = await sql`
    UPDATE requests 
    SET data = data || ${JSON.stringify({ status })}::jsonb 
    WHERE id = ${id} 
    RETURNING data
  `;
  return result.length > 0 ? result[0].data : null;
}

// PASSWORD RESET REQUESTS HELPERS
export async function getPasswordResetRequests() {
  await dbInitialized;
  const rows = await sql`SELECT data FROM password_reset_requests`;
  return rows.map(r => r.data);
}

export async function addPasswordResetRequest(request) {
  await dbInitialized;
  const newRequest = {
    id: 'reset_' + Math.random().toString(36).substring(2, 9),
    status: 'pending',
    timestamp: new Date().toISOString(),
    ...request
  };
  await sql`INSERT INTO password_reset_requests (id, data) VALUES (${newRequest.id}, ${JSON.stringify(newRequest)})`;
  return newRequest;
}

export async function updatePasswordResetRequest(id, status) {
  await dbInitialized;
  const result = await sql`
    UPDATE password_reset_requests 
    SET data = data || ${JSON.stringify({ status })}::jsonb 
    WHERE id = ${id} 
    RETURNING data
  `;
  return result.length > 0 ? result[0].data : null;
}

// MESSAGES HELPERS
export async function getMessages() {
  await dbInitialized;
  const rows = await sql`SELECT data FROM messages`;
  return rows.map(r => r.data);
}

export async function addMessage(message) {
  await dbInitialized;
  const newMessage = {
    id: 'msg_' + Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString(),
    ...message
  };
  await sql`INSERT INTO messages (id, data) VALUES (${newMessage.id}, ${JSON.stringify(newMessage)})`;
  return newMessage;
}

// ADMIN CLEAR DATABASE
export async function clearAllData() {
  await dbInitialized;
  try {
    await sql`TRUNCATE TABLE groups, group_requests, members, requests, password_reset_requests, messages`;
    
    // Reseed default data
    await sql`INSERT INTO groups (id, data) VALUES (${DEFAULT_GROUP.id}, ${JSON.stringify(DEFAULT_GROUP)})`;
    await sql`INSERT INTO members (id, data) VALUES (${DEFAULT_ADMIN.id}, ${JSON.stringify(DEFAULT_ADMIN)})`;
    return true;
  } catch (e) {
    console.error('Error clearing database:', e);
    return false;
  }
}

// BULK SAVE HELPERS (Replaces entire table contents)
export async function saveGroups(items) {
  await dbInitialized;
  await sql`TRUNCATE TABLE groups`;
  if (items && items.length > 0) {
    for (const item of items) {
      await sql`INSERT INTO groups (id, data) VALUES (${item.id}, ${JSON.stringify(item)})`;
    }
  }
  return true;
}

export async function saveMembers(items) {
  await dbInitialized;
  await sql`TRUNCATE TABLE members`;
  if (items && items.length > 0) {
    for (const item of items) {
      await sql`INSERT INTO members (id, data) VALUES (${item.id}, ${JSON.stringify(item)})`;
    }
  }
  return true;
}

export async function saveGroupRequests(items) {
  await dbInitialized;
  await sql`TRUNCATE TABLE group_requests`;
  if (items && items.length > 0) {
    for (const item of items) {
      await sql`INSERT INTO group_requests (id, data) VALUES (${item.id}, ${JSON.stringify(item)})`;
    }
  }
  return true;
}

export async function saveRequests(items) {
  await dbInitialized;
  await sql`TRUNCATE TABLE requests`;
  if (items && items.length > 0) {
    for (const item of items) {
      await sql`INSERT INTO requests (id, data) VALUES (${item.id}, ${JSON.stringify(item)})`;
    }
  }
  return true;
}

export async function savePasswordResetRequests(items) {
  await dbInitialized;
  await sql`TRUNCATE TABLE password_reset_requests`;
  if (items && items.length > 0) {
    for (const item of items) {
      await sql`INSERT INTO password_reset_requests (id, data) VALUES (${item.id}, ${JSON.stringify(item)})`;
    }
  }
  return true;
}

export async function saveMessages(items) {
  await dbInitialized;
  await sql`TRUNCATE TABLE messages`;
  if (items && items.length > 0) {
    for (const item of items) {
      await sql`INSERT INTO messages (id, data) VALUES (${item.id}, ${JSON.stringify(item)})`;
    }
  }
  return true;
}
