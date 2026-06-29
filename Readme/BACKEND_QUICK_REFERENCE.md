# Backend Quick Reference - Chat Module

## 🎯 What You Need to Implement

Three API endpoints and two database tables.

---

## 📋 Quick Checklist

```
Database:
  [ ] CREATE TABLE groups
  [ ] CREATE TABLE group_members

API Endpoints:
  [ ] POST /api/chat/create-group
  [ ] POST /api/chat/add-members
  [ ] GET /admin/users

Socket Events:
  [ ] Emit "groupCreated"
  [ ] Emit "membersUpdated"
```

---

## 🗄️ Database Tables (Copy & Paste)

```sql
-- Groups table
CREATE TABLE IF NOT EXISTS groups (
  id INT PRIMARY KEY AUTO_INCREMENT,
  group_name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_created_by (created_by),
  INDEX idx_created_at (created_at)
);

-- Group members table
CREATE TABLE IF NOT EXISTS group_members (
  id INT PRIMARY KEY AUTO_INCREMENT,
  group_id INT NOT NULL,
  user_id INT NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_group_member (group_id, user_id),
  INDEX idx_group_id (group_id),
  INDEX idx_user_id (user_id)
);
```

---

## 🔧 API Endpoints

### 1. Create Group

```
POST /api/chat/create-group
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "group_name": "Frontend Team",
  "description": "Frontend development team",
  "members": [1, 2, 3]
}

Response (201):
{
  "success": true,
  "message": "Group created successfully",
  "group": {
    "id": 1,
    "group_name": "Frontend Team",
    "description": "Frontend development team",
    "created_by": 1,
    "created_at": "2024-01-01T10:00:00Z"
  }
}

Error (400):
{
  "success": false,
  "message": "Group name is required"
}
```

**Key Points:**
- Validate group_name (required, non-empty)
- Validate members array (required, at least 1)
- Add creator automatically
- Emit "groupCreated" socket event
- Return created group

---

### 2. Add Members

```
POST /api/chat/add-members
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "group_id": 1,
  "members": [4, 5, 6]
}

Response (200):
{
  "success": true,
  "message": "Members added successfully",
  "members": [
    { "id": 1, "name": "John Doe", "email": "john@example.com", "role": "Admin" },
    { "id": 2, "name": "Jane Smith", "email": "jane@example.com", "role": "Member" }
  ]
}

Error (400):
{
  "success": false,
  "message": "Invalid request"
}
```

**Key Points:**
- Validate group_id (required, exists)
- Validate members array (required, at least 1)
- Prevent duplicate members
- Emit "membersUpdated" socket event
- Return all group members

---

### 3. Get All Users

```
GET /admin/users
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": [
    { "id": 1, "name": "John Doe", "email": "john@example.com", "role": "Admin" },
    { "id": 2, "name": "Jane Smith", "email": "jane@example.com", "role": "Member" }
  ]
}

Error (500):
{
  "success": false,
  "message": "Server Error"
}
```

**Key Points:**
- Return all users
- Include id, name, email, role
- Sort by name
- No pagination needed

---

## 💻 Controller Code (Copy & Paste)

```javascript
// controllers/chatController.js

import pool from "../config/database.js";

export const createGroup = async (req, res) => {
  try {
    const { group_name, description, members } = req.body;
    const userId = req.user?.id;

    if (!group_name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Group name is required",
      });
    }

    if (!members || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Select at least one member",
      });
    }

    const [result] = await pool.query(
      "INSERT INTO groups (group_name, description, created_by) VALUES (?, ?, ?)",
      [group_name.trim(), description?.trim() || null, userId]
    );

    const groupId = result.insertId;

    await pool.query(
      "INSERT INTO group_members (group_id, user_id) VALUES (?, ?)",
      [groupId, userId]
    );

    for (const memberId of members) {
      try {
        await pool.query(
          "INSERT INTO group_members (group_id, user_id) VALUES (?, ?)",
          [groupId, memberId]
        );
      } catch (error) {
        if (error.code !== "ER_DUP_ENTRY") throw error;
      }
    }

    const [group] = await pool.query(
      "SELECT id, group_name, description, created_by, created_at FROM groups WHERE id = ?",
      [groupId]
    );

    if (global.io) {
      global.io.emit("groupCreated", group[0]);
    }

    return res.status(201).json({
      success: true,
      message: "Group created successfully",
      group: group[0],
    });
  } catch (error) {
    console.error("Error creating group:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const addMembers = async (req, res) => {
  try {
    const { group_id, members } = req.body;

    if (!group_id || !members || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid request",
      });
    }

    const [groupExists] = await pool.query(
      "SELECT id FROM groups WHERE id = ?",
      [group_id]
    );

    if (groupExists.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    for (const memberId of members) {
      try {
        await pool.query(
          "INSERT INTO group_members (group_id, user_id) VALUES (?, ?)",
          [group_id, memberId]
        );
      } catch (error) {
        if (error.code !== "ER_DUP_ENTRY") throw error;
      }
    }

    const [updatedMembers] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role
       FROM group_members gm
       JOIN users u ON gm.user_id = u.id
       WHERE gm.group_id = ?
       ORDER BY u.name ASC`,
      [group_id]
    );

    if (global.io) {
      global.io.emit("membersUpdated", {
        group_id,
        members: updatedMembers,
      });
    }

    return res.json({
      success: true,
      message: "Members added successfully",
      members: updatedMembers,
    });
  } catch (error) {
    console.error("Error adding members:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const [users] = await pool.query(
      "SELECT id, name, email, role FROM users ORDER BY name ASC"
    );

    return res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
```

---

## 🛣️ Route Registration

```javascript
// routes/chat.js

import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { createGroup, addMembers } from "../controllers/chatController.js";

const router = express.Router();

router.post("/create-group", verifyToken, createGroup);
router.post("/add-members", verifyToken, addMembers);

export default router;

// In your main app.js:
// import chatRoutes from "./routes/chat.js";
// app.use("/api/chat", chatRoutes);
```

```javascript
// routes/admin.js

import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { getAllUsers } from "../controllers/adminController.js";

const router = express.Router();

router.get("/users", verifyToken, getAllUsers);

export default router;

// In your main app.js:
// import adminRoutes from "./routes/admin.js";
// app.use("/api/admin", adminRoutes);
```

---

## 🔌 Socket.IO Setup

```javascript
// In your server.js or app.js

import { Server } from "socket.io";
import http from "http";

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Make io globally accessible
global.io = io;

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(process.env.PORT || 5000);
```

---

## 🧪 Postman Testing

### Create Group
```
POST http://localhost:5000/api/chat/create-group
Authorization: Bearer <token>

{
  "group_name": "Frontend Team",
  "description": "Frontend development team",
  "members": [1, 2, 3]
}
```

### Add Members
```
POST http://localhost:5000/api/chat/add-members
Authorization: Bearer <token>

{
  "group_id": 1,
  "members": [4, 5, 6]
}
```

### Get Users
```
GET http://localhost:5000/api/admin/users
Authorization: Bearer <token>
```

---

## ⚠️ Common Mistakes

### ❌ Don't
```javascript
// String concatenation (SQL injection)
const query = `INSERT INTO groups VALUES ('${group_name}', ${userId})`;

// Missing validation
if (members) { // Should check if array and length > 0
  // ...
}

// Not handling duplicates
// Will crash if member already in group

// Not emitting socket events
// Frontend won't get real-time updates

// Returning wrong response format
// Frontend expects { success, message, group/members }
```

### ✅ Do
```javascript
// Parameterized queries
const [result] = await pool.query(
  "INSERT INTO groups VALUES (?, ?)",
  [group_name, userId]
);

// Proper validation
if (!Array.isArray(members) || members.length === 0) {
  return res.status(400).json({ success: false });
}

// Handle duplicates
try {
  await pool.query(...);
} catch (error) {
  if (error.code !== "ER_DUP_ENTRY") throw error;
}

// Emit socket events
if (global.io) {
  global.io.emit("groupCreated", group);
}

// Correct response format
return res.json({
  success: true,
  message: "...",
  group: { ... }
});
```

---

## 🔍 Debugging Tips

### Check Database
```sql
-- Verify tables exist
SHOW TABLES;

-- Check groups
SELECT * FROM groups;

-- Check group members
SELECT * FROM group_members;

-- Check with joins
SELECT g.*, u.name as creator_name
FROM groups g
JOIN users u ON g.created_by = u.id;
```

### Check API
```bash
# Test with curl
curl -X POST http://localhost:5000/api/chat/create-group \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"group_name":"Test","members":[1,2]}'

# Check response
# Should return { success: true, group: {...} }
```

### Check Socket Events
```javascript
// In your socket handler
io.on("connection", (socket) => {
  console.log("Connected:", socket.id);
});

// When emitting
console.log("Emitting groupCreated:", group);
global.io.emit("groupCreated", group);
```

---

## 📊 Expected Database State

After creating a group with members [1, 2, 3]:

```
groups table:
id | group_name | description | created_by | created_at
1  | Frontend   | ...         | 1          | 2024-01-01

group_members table:
id | group_id | user_id | joined_at
1  | 1        | 1       | 2024-01-01
2  | 1        | 2       | 2024-01-01
3  | 1        | 3       | 2024-01-01
```

---

## 🚀 Implementation Order

1. **Create database tables** (5 min)
2. **Implement getAllUsers** (5 min)
3. **Implement createGroup** (10 min)
4. **Implement addMembers** (10 min)
5. **Setup Socket.IO** (5 min)
6. **Test with Postman** (10 min)
7. **Test with frontend** (10 min)

**Total: ~55 minutes**

---

## ✅ Verification Checklist

After implementation:

- [ ] Database tables created
- [ ] POST /api/chat/create-group works
- [ ] POST /api/chat/add-members works
- [ ] GET /admin/users works
- [ ] Socket events emit
- [ ] Frontend receives events
- [ ] No console errors
- [ ] Duplicate members prevented
- [ ] Creator added automatically
- [ ] All validations work

---

## 📞 Quick Help

**Q: How do I test the API?**  
A: Use Postman. See "Postman Testing" section above.

**Q: How do I emit socket events?**  
A: Use `global.io.emit("eventName", data)` in your controller.

**Q: How do I prevent duplicate members?**  
A: The code handles it with `ER_DUP_ENTRY` check.

**Q: What if group_id doesn't exist?**  
A: Check with `SELECT id FROM groups WHERE id = ?` first.

**Q: How do I get all members of a group?**  
A: Use the JOIN query in addMembers controller.

---

## 📚 Full Documentation

For complete details, see `BACKEND_IMPLEMENTATION_GUIDE.md`

---

**Version:** 1.0.0  
**Status:** Ready to Implement  
**Time to Complete:** ~1 hour

