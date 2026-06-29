# Backend Members API - Implementation Guide

## 🎯 Quick Start

Implement the group members API endpoint on your backend to replace the hardcoded mock data.

---

## 📋 Implementation Checklist

- [ ] Create route: `GET /api/chat/group-members/:groupId`
- [ ] Create controller: `getGroupMembers`
- [ ] Verify database table: `group_members`
- [ ] Test API endpoint
- [ ] Verify response format

---

## 🔧 Step 1: Create Route

**File:** `routes/chatRoutes.js` (or your routes file)

```javascript
import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { getGroupMembers } from "../controllers/chatController.js";

const router = express.Router();

// Get group members
router.get(
  "/group-members/:groupId",
  verifyToken,
  getGroupMembers
);

export default router;
```

---

## 🔧 Step 2: Create Controller

**File:** `controllers/chatController.js` (or your controllers file)

### Basic Implementation

```javascript
export const getGroupMembers = async (req, res) => {
  try {
    const { groupId } = req.params;

    // Validate groupId
    if (!groupId || isNaN(groupId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Group ID",
      });
    }

    // Query to get group members
    const [members] = await pool.query(
      `
      SELECT
        u.id,
        u.name,
        u.email,
        u.role
      FROM group_members gm
      JOIN users u ON gm.user_id = u.id
      WHERE gm.group_id = ?
      ORDER BY u.name ASC
      `,
      [groupId]
    );

    return res.status(200).json({
      success: true,
      members: members || [],
    });
  } catch (error) {
    console.error("Error fetching group members:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
```

### Enhanced Implementation (with Authorization)

```javascript
export const getGroupMembers = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user?.id;

    // Validate groupId
    if (!groupId || isNaN(groupId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Group ID",
      });
    }

    // Verify user is member of group
    const [userMembership] = await pool.query(
      `
      SELECT id FROM group_members 
      WHERE group_id = ? AND user_id = ?
      `,
      [groupId, userId]
    );

    if (userMembership.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view group members",
      });
    }

    // Fetch all group members
    const [members] = await pool.query(
      `
      SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        gm.joined_at
      FROM group_members gm
      JOIN users u ON gm.user_id = u.id
      WHERE gm.group_id = ?
      ORDER BY u.name ASC
      `,
      [groupId]
    );

    return res.status(200).json({
      success: true,
      members: members || [],
      count: members?.length || 0,
    });
  } catch (error) {
    console.error("Error fetching group members:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
```

---

## 🗄️ Step 3: Verify Database Schema

### Check if `group_members` table exists

```sql
DESCRIBE group_members;
```

### If table doesn't exist, create it

```sql
CREATE TABLE group_members (
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

### Verify `users` table has required columns

```sql
DESCRIBE users;
```

Should have: `id`, `name`, `email`, `role`

### Verify `groups` table exists

```sql
DESCRIBE groups;
```

Should have: `id`, `group_name`, `created_at`, `description`

---

## 🧪 Step 4: Test the API

### Using cURL

```bash
# Get members for group 1
curl -X GET http://localhost:5001/api/chat/group-members/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Using Postman

1. Create new GET request
2. URL: `http://localhost:5001/api/chat/group-members/1`
3. Headers:
   - `Authorization: Bearer YOUR_TOKEN`
4. Send request
5. Check response

### Expected Response

```json
{
  "success": true,
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
  ],
  "count": 2
}
```

---

## 🔍 Step 5: Verify Integration

### Frontend Console Logs

Open DevTools (F12) and check console:

```
✅ "Fetching members for group: 1"
✅ "Members response: {success: true, members: [...]}"
```

### Network Tab

1. Open DevTools → Network tab
2. Select a group in chat
3. Look for GET request to `/api/chat/group-members/{id}`
4. Check status code (should be 200)
5. Check response body

### UI Display

1. Members should appear in right sidebar
2. Loading spinner should appear briefly
3. Member names, roles, and avatars should display
4. Online indicators should work

---

## 🐛 Troubleshooting

### Issue: 404 Not Found

**Cause:** Route not registered

**Solution:**
1. Verify route is in `chatRoutes.js`
2. Verify route is imported in main app file
3. Verify route path is correct: `/api/chat/group-members/:groupId`

### Issue: 401 Unauthorized

**Cause:** Token not sent or invalid

**Solution:**
1. Verify token is in localStorage
2. Verify token is valid
3. Check Authorization header format: `Bearer {token}`

### Issue: 403 Forbidden

**Cause:** User not member of group

**Solution:**
1. Verify user is added to `group_members` table
2. Verify `group_id` and `user_id` match
3. Check database for group membership

### Issue: 500 Server Error

**Cause:** Database query error

**Solution:**
1. Check backend console for error message
2. Verify database connection
3. Verify table names and column names
4. Verify SQL query syntax

### Issue: Empty Members List

**Cause:** No members in database

**Solution:**
1. Add members to `group_members` table
2. Verify `group_id` and `user_id` are correct
3. Check if users exist in `users` table

---

## 📊 Database Queries

### Add member to group

```sql
INSERT INTO group_members (group_id, user_id)
VALUES (1, 2);
```

### Remove member from group

```sql
DELETE FROM group_members
WHERE group_id = 1 AND user_id = 2;
```

### Get all members of a group

```sql
SELECT u.id, u.name, u.email, u.role
FROM group_members gm
JOIN users u ON gm.user_id = u.id
WHERE gm.group_id = 1
ORDER BY u.name ASC;
```

### Get all groups of a user

```sql
SELECT g.id, g.group_name
FROM group_members gm
JOIN groups g ON gm.group_id = g.id
WHERE gm.user_id = 1
ORDER BY g.group_name ASC;
```

### Count members in a group

```sql
SELECT COUNT(*) as member_count
FROM group_members
WHERE group_id = 1;
```

---

## 🔐 Security Best Practices

### 1. Always Verify Authentication
```javascript
router.get(
  "/group-members/:groupId",
  verifyToken,  // ← Always include
  getGroupMembers
);
```

### 2. Validate Input
```javascript
if (!groupId || isNaN(groupId)) {
  return res.status(400).json({
    success: false,
    message: "Invalid Group ID",
  });
}
```

### 3. Check Authorization
```javascript
// Verify user is member of group
const [userMembership] = await pool.query(
  "SELECT id FROM group_members WHERE group_id = ? AND user_id = ?",
  [groupId, userId]
);

if (userMembership.length === 0) {
  return res.status(403).json({
    success: false,
    message: "Not authorized",
  });
}
```

### 4. Handle Errors Gracefully
```javascript
catch (error) {
  console.error("Error:", error);
  return res.status(500).json({
    success: false,
    message: "Server Error",
  });
}
```

---

## 📈 Performance Tips

### 1. Add Indexes
```sql
CREATE INDEX idx_group_id ON group_members(group_id);
CREATE INDEX idx_user_id ON group_members(user_id);
```

### 2. Use Pagination for Large Groups
```javascript
const page = req.query.page || 1;
const limit = req.query.limit || 20;
const offset = (page - 1) * limit;

const [members] = await pool.query(
  `
  SELECT u.id, u.name, u.email, u.role
  FROM group_members gm
  JOIN users u ON gm.user_id = u.id
  WHERE gm.group_id = ?
  ORDER BY u.name ASC
  LIMIT ? OFFSET ?
  `,
  [groupId, limit, offset]
);
```

### 3. Cache Results
```javascript
const cacheKey = `group_members_${groupId}`;
const cached = cache.get(cacheKey);

if (cached) {
  return res.json({ success: true, members: cached });
}

// ... fetch from database ...

cache.set(cacheKey, members, 300); // Cache for 5 minutes
```

---

## 🚀 Next Steps

### Immediate
1. ✅ Implement route and controller
2. ✅ Test API endpoint
3. ✅ Verify frontend integration

### Short Term
1. Add member search
2. Add member management (add/remove)
3. Add member roles/permissions

### Long Term
1. Add member profiles
2. Add member activity tracking
3. Add member notifications

---

## 📞 Support

If you encounter issues:

1. Check backend console for error messages
2. Verify database connection
3. Verify table structure
4. Check API response in Network tab
5. Review this guide for troubleshooting

---

**Version**: 1.0.0  
**Status**: ⏳ Ready to Implement  
**Date**: May 2026

---

## 🎉 Summary

### What to Implement
- ✅ Route: `GET /api/chat/group-members/:groupId`
- ✅ Controller: `getGroupMembers`
- ✅ Database: `group_members` table

### Expected Response
```json
{
  "success": true,
  "members": [
    { "id": 1, "name": "John", "email": "john@example.com", "role": "Admin" }
  ]
}
```

### Frontend Already Ready
- ✅ Fetches members when group selected
- ✅ Displays loading state
- ✅ Shows member list with online status
- ✅ Handles errors gracefully

**Once you implement the backend, the frontend will automatically display real group members!**
