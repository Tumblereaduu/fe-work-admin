# Backend Implementation Guide - Chat Module Upgrade

## 📋 Overview

This guide provides complete backend implementation for the professional team chat system. The frontend is complete and waiting for these three API endpoints:

1. **POST `/api/chat/create-group`** - Create a new group
2. **POST `/api/chat/add-members`** - Add members to an existing group  
3. **GET `/admin/users`** - Get all users for the multi-select picker

---

## 🗄️ Database Schema

### Create Tables

Run these SQL commands to create the required tables:

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

### Verify Existing Tables

If you already have these tables, verify they have the correct structure:

```sql
-- Check groups table
DESCRIBE groups;

-- Check group_members table
DESCRIBE group_members;
```

---

## 🔧 API Endpoints Implementation

### 1. Create Group API

**Endpoint:** `POST /api/chat/create-group`

**Request Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "group_name": "Frontend Team",
  "description": "Frontend development team",
  "members": [1, 2, 3]
}
```

**Response (Success - 201):**
```json
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
```

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "Group name is required"
}
```

**Controller Implementation:**

```javascript
// File: routes/chat.js or controllers/chatController.js

export const createGroup = async (req, res) => {
  try {
    const { group_name, description, members } = req.body;
    const userId = req.user?.id;

    // Validation
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

    // Create group
    const [result] = await pool.query(
      "INSERT INTO groups (group_name, description, created_by) VALUES (?, ?, ?)",
      [group_name.trim(), description?.trim() || null, userId]
    );

    const groupId = result.insertId;

    // Add creator as member
    await pool.query(
      "INSERT INTO group_members (group_id, user_id) VALUES (?, ?)",
      [groupId, userId]
    );

    // Add selected members (skip if already added)
    for (const memberId of members) {
      try {
        await pool.query(
          "INSERT INTO group_members (group_id, user_id) VALUES (?, ?)",
          [groupId, memberId]
        );
      } catch (error) {
        // Ignore duplicate key errors
        if (error.code !== "ER_DUP_ENTRY") {
          throw error;
        }
      }
    }

    // Fetch created group
    const [group] = await pool.query(
      "SELECT id, group_name, description, created_by, created_at FROM groups WHERE id = ?",
      [groupId]
    );

    // Emit socket event for real-time update
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
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
```

**Route Registration:**

```javascript
// File: routes/chat.js

import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { createGroup } from "../controllers/chatController.js";

const router = express.Router();

router.post("/create-group", verifyToken, createGroup);

export default router;
```

---

### 2. Add Members API

**Endpoint:** `POST /api/chat/add-members`

**Request Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "group_id": 1,
  "members": [4, 5, 6]
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Members added successfully",
  "members": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "Admin"
    },
    {
      "id": 2,
      "name": "Jane Smith",
      "email": "jane@example.com",
      "role": "Member"
    }
  ]
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "Invalid request"
}
```

**Controller Implementation:**

```javascript
// File: controllers/chatController.js

export const addMembers = async (req, res) => {
  try {
    const { group_id, members } = req.body;

    // Validation
    if (!group_id || !members || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid request",
      });
    }

    // Verify group exists
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

    // Add members
    for (const memberId of members) {
      try {
        await pool.query(
          "INSERT INTO group_members (group_id, user_id) VALUES (?, ?)",
          [group_id, memberId]
        );
      } catch (error) {
        // Ignore duplicate key errors
        if (error.code !== "ER_DUP_ENTRY") {
          throw error;
        }
      }
    }

    // Fetch updated members
    const [updatedMembers] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role
       FROM group_members gm
       JOIN users u ON gm.user_id = u.id
       WHERE gm.group_id = ?
       ORDER BY u.name ASC`,
      [group_id]
    );

    // Emit socket event for real-time update
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
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
```

---

### 3. Get All Users API

**Endpoint:** `GET /admin/users`

**Request Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "Admin"
    },
    {
      "id": 2,
      "name": "Jane Smith",
      "email": "jane@example.com",
      "role": "Member"
    }
  ]
}
```

**Response (Error - 500):**
```json
{
  "success": false,
  "message": "Server Error"
}
```

**Controller Implementation:**

```javascript
// File: controllers/adminController.js

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
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
```

**Route Registration:**

```javascript
// File: routes/admin.js

import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { getAllUsers } from "../controllers/adminController.js";

const router = express.Router();

router.get("/users", verifyToken, getAllUsers);

export default router;
```

---

## 🔌 Socket.IO Integration

### Emit Events

The backend should emit these Socket.IO events for real-time updates:

```javascript
// When group is created
io.emit("groupCreated", {
  id: 1,
  group_name: "Frontend Team",
  description: "Frontend development team",
  created_by: 1,
  created_at: "2024-01-01T10:00:00Z"
});

// When members are added
io.emit("membersUpdated", {
  group_id: 1,
  members: [
    { id: 1, name: "John Doe", email: "john@example.com", role: "Admin" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", role: "Member" }
  ]
});
```

### Socket.IO Setup

```javascript
// File: server.js or app.js

import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Make io globally accessible
global.io = io;

// Socket.IO connection handler
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
});
```

---

## 🔐 Security Considerations

### Input Validation

```javascript
// Validate group name
if (!group_name || typeof group_name !== "string" || group_name.trim().length === 0) {
  return res.status(400).json({
    success: false,
    message: "Invalid group name",
  });
}

// Validate members array
if (!Array.isArray(members) || members.length === 0) {
  return res.status(400).json({
    success: false,
    message: "Invalid members array",
  });
}

// Validate member IDs
for (const memberId of members) {
  if (!Number.isInteger(memberId) || memberId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid member ID",
    });
  }
}
```

### Authentication & Authorization

```javascript
// Verify token middleware
export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "No token provided",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};
```

### SQL Injection Prevention

Always use parameterized queries:

```javascript
// ✅ GOOD - Parameterized query
const [result] = await pool.query(
  "INSERT INTO groups (group_name, created_by) VALUES (?, ?)",
  [group_name, userId]
);

// ❌ BAD - String concatenation
const query = `INSERT INTO groups (group_name, created_by) VALUES ('${group_name}', ${userId})`;
```

---

## 🧪 Testing with Postman

### 1. Create Group

**Method:** POST  
**URL:** `http://localhost:5000/api/chat/create-group`

**Headers:**
```
Authorization: Bearer <your_token>
Content-Type: application/json
```

**Body:**
```json
{
  "group_name": "Frontend Team",
  "description": "Frontend development team",
  "members": [1, 2, 3]
}
```

### 2. Add Members

**Method:** POST  
**URL:** `http://localhost:5000/api/chat/add-members`

**Headers:**
```
Authorization: Bearer <your_token>
Content-Type: application/json
```

**Body:**
```json
{
  "group_id": 1,
  "members": [4, 5, 6]
}
```

### 3. Get All Users

**Method:** GET  
**URL:** `http://localhost:5000/api/admin/users`

**Headers:**
```
Authorization: Bearer <your_token>
Content-Type: application/json
```

---

## 📊 Complete Controller File Example

```javascript
// File: controllers/chatController.js

import pool from "../config/database.js";

export const createGroup = async (req, res) => {
  try {
    const { group_name, description, members } = req.body;
    const userId = req.user?.id;

    // Validation
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

    // Create group
    const [result] = await pool.query(
      "INSERT INTO groups (group_name, description, created_by) VALUES (?, ?, ?)",
      [group_name.trim(), description?.trim() || null, userId]
    );

    const groupId = result.insertId;

    // Add creator as member
    await pool.query(
      "INSERT INTO group_members (group_id, user_id) VALUES (?, ?)",
      [groupId, userId]
    );

    // Add selected members
    for (const memberId of members) {
      try {
        await pool.query(
          "INSERT INTO group_members (group_id, user_id) VALUES (?, ?)",
          [groupId, memberId]
        );
      } catch (error) {
        if (error.code !== "ER_DUP_ENTRY") {
          throw error;
        }
      }
    }

    // Fetch created group
    const [group] = await pool.query(
      "SELECT id, group_name, description, created_by, created_at FROM groups WHERE id = ?",
      [groupId]
    );

    // Emit socket event
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

    // Validation
    if (!group_id || !members || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid request",
      });
    }

    // Verify group exists
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

    // Add members
    for (const memberId of members) {
      try {
        await pool.query(
          "INSERT INTO group_members (group_id, user_id) VALUES (?, ?)",
          [group_id, memberId]
        );
      } catch (error) {
        if (error.code !== "ER_DUP_ENTRY") {
          throw error;
        }
      }
    }

    // Fetch updated members
    const [updatedMembers] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role
       FROM group_members gm
       JOIN users u ON gm.user_id = u.id
       WHERE gm.group_id = ?
       ORDER BY u.name ASC`,
      [group_id]
    );

    // Emit socket event
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

## 📋 Implementation Checklist

### Database Setup
- [ ] Create `groups` table
- [ ] Create `group_members` table
- [ ] Add foreign keys
- [ ] Add indexes
- [ ] Verify table structure

### API Implementation
- [ ] Create `POST /api/chat/create-group` endpoint
- [ ] Create `POST /api/chat/add-members` endpoint
- [ ] Create `GET /admin/users` endpoint
- [ ] Add input validation
- [ ] Add error handling
- [ ] Add authentication middleware

### Socket.IO Integration
- [ ] Emit `groupCreated` event
- [ ] Emit `membersUpdated` event
- [ ] Test real-time updates

### Testing
- [ ] Test create group with Postman
- [ ] Test add members with Postman
- [ ] Test get users with Postman
- [ ] Test with frontend
- [ ] Test error handling
- [ ] Test socket events

### Security
- [ ] Verify authentication
- [ ] Validate input
- [ ] Use parameterized queries
- [ ] Handle errors gracefully
- [ ] Test with invalid data

---

## 🚀 Quick Start

1. **Create database tables** - Run the SQL commands above
2. **Implement controllers** - Copy the controller code
3. **Register routes** - Add routes to your Express app
4. **Setup Socket.IO** - Make `io` globally accessible
5. **Test with Postman** - Verify all endpoints work
6. **Test with frontend** - Run the React app and test the UI

---

## 📞 Troubleshooting

### Issue: "Group name is required"
- **Cause:** Empty or missing group_name in request
- **Fix:** Ensure group_name is provided and not empty

### Issue: "Select at least one member"
- **Cause:** Empty or missing members array
- **Fix:** Ensure members array has at least one user ID

### Issue: "Group not found"
- **Cause:** Invalid group_id
- **Fix:** Verify group_id exists in database

### Issue: Socket events not emitting
- **Cause:** `global.io` not set
- **Fix:** Ensure Socket.IO is initialized and `global.io = io` is set

### Issue: Duplicate members error
- **Cause:** Trying to add member already in group
- **Fix:** The code handles this with `ER_DUP_ENTRY` check

---

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [JWT Authentication](https://jwt.io/)

---

**Version:** 1.0.0  
**Status:** Ready for Implementation  
**Date:** May 2026

