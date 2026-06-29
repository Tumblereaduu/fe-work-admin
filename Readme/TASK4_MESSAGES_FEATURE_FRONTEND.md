# Task 4: Task Messages/Notes Feature - Frontend Implementation

## Status: FRONTEND COMPLETE ✅

**Build Status:** SUCCESS (0 errors, 540 modules, 2.77s)

---

## Frontend Implementation Summary

The task messages/notes feature has been successfully implemented in the Task View/Edit popup. Staff members can add text messages/notes to tasks, and admins/super_admins can view all task messages.

### Changes Made to `src/pages/Tasks.jsx`

#### 1. Added State Management
```javascript
const [messages, setMessages] = useState([]);
const [newMessage, setNewMessage] = useState("");
const [loadingMessages, setLoadingMessages] = useState(false);
const [sendingMessage, setSendingMessage] = useState(false);
```

#### 2. Added Permission Check Functions
- **`canViewTaskMessages(task)`**: Returns true if user is admin or assigned to task
- **`canAddTaskMessage(task)`**: Returns true if user is admin or assigned to task (same logic as canViewTaskMessages)

#### 3. Added Message Management Functions

**`fetchTaskMessages(taskId)`**
- Calls `GET /tasks/:taskId/messages`
- Sets `loadingMessages` state during fetch
- Populates `messages` state with response
- Handles errors gracefully (logs and sets empty messages)

**`handleSendMessage()`**
- Validates message is not empty
- Checks permission via `canAddTaskMessage()`
- Calls `POST /tasks/:taskId/messages` with message text
- Clears textarea and refreshes messages list on success
- Shows toast notification (success/error)
- Handles loading state via `sendingMessage`

**`formatMessageTime(timestamp)`**
- Formats message timestamp to localized date/time string
- Handles invalid timestamps gracefully

#### 4. Updated Modal Opening Logic

**`openDetailModal(task)`**
- Now fetches task messages on modal open if user has permission
- Resets messages and newMessage state
- Prevents loading messages for users without permission

**`closeDetailModal()`**
- Clears messages and newMessage state when closing modal

#### 5. Added Messages Section in Detail Modal

**Location:** After attachments section, before status section

**Features:**
- **Loading State:** Shows 3 skeleton loaders while fetching messages
- **Empty State:** Shows "No messages yet" if task has no messages
- **Message List:**
  - Displays user name, role badge, message text, and timestamp
  - Modern chat/comment style with rounded borders
  - Scrollable container (max-height: 256px)
  - Dark theme styling (slate-800/50 background)

- **Message Input (if user can add):**
  - Textarea with "Add task update message..." placeholder
  - 3 rows by default, resizable
  - Send button with loading state
  - Button disabled when message is empty or sending

- **Permission-Based Display:**
  - Entire messages section only shown if user can view
  - Input section only shown if user can add
  - Non-assigned staff won't see messages section

### API Integration

#### GET `/tasks/:taskId/messages`
**Called:** When detail modal opens (if user has permission)
**Expected Response:**
```json
{
  "data": [
    {
      "id": 1,
      "task_id": 5,
      "user_id": 3,
      "user_name": "John Doe",
      "user_role": "staff",
      "message": "Task in progress, almost done",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### POST `/tasks/:taskId/messages`
**Called:** When "Send Message" button clicked
**Request Body:**
```json
{
  "message": "Working on this task"
}
```
**Expected Response:**
```json
{
  "message": "Message added successfully",
  "data": {
    "id": 2,
    "task_id": 5,
    "user_id": 3,
    "user_name": "John Doe",
    "user_role": "staff",
    "message": "Working on this task",
    "created_at": "2024-01-15T10:35:00Z"
  }
}
```

---

## Backend Implementation Requirements

The following backend APIs need to be implemented for the frontend to work:

### Database Schema
```sql
CREATE TABLE IF NOT EXISTS task_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  user_id INT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### API Endpoints

#### GET `/tasks/:id/messages`
- **Auth:** Required (verifyToken)
- **Permission Logic:**
  - Staff: Can view messages only if assigned to the task
  - Admin/Super_admin: Can view messages for any task
- **Response:** Array of messages with user info

#### POST `/tasks/:id/messages`
- **Auth:** Required (verifyToken)
- **Request Body:** `{ message: string }`
- **Permission Logic:**
  - Staff: Can add message only if assigned to the task
  - Admin/Super_admin: Can add message to any task
- **Validation:** Message cannot be empty
- **Response:** Newly created message object with user info

---

## User Experience

### Staff Member Workflow
1. Opens task detail modal
2. Scrolls to "Messages / Notes" section (visible only if assigned)
3. Sees previous messages from all users on this task
4. Types message in textarea
5. Clicks "Send Message"
6. Message appears in list with their name, role, message, and timestamp
7. Toast shows success notification

### Admin/Super Admin Workflow
1. Opens any task detail modal
2. "Messages / Notes" section always visible
3. Can see all messages from all staff on that task
4. Can add their own messages if desired
5. Can view messages for any task regardless of assignment

---

## Styling

- **Messages Container:** Rounded border, dark slate background, scrollable
- **Individual Message:** Rounded box with darker background, user info at top
- **Role Badge:** Slate-700 background with capitalized text
- **Textarea:** Dark slate theme with blue focus border
- **Send Button:** Blue theme, disabled state, loading state
- **Loading State:** Animated skeleton loaders (3 placeholders)

---

## Testing Checklist

- [ ] **Frontend Builds:** No errors ✅
- [ ] **Modal Opens:** Detail modal loads correctly
- [ ] **Messages Load:** GET endpoint called when modal opens (if permission granted)
- [ ] **No Permission:** Non-assigned staff don't see messages section
- [ ] **Send Message:** POST endpoint called with message text
- [ ] **Textarea Clears:** After sending, textarea is cleared
- [ ] **Messages Refresh:** After sending, new message appears in list
- [ ] **Toast Notifications:** Success/error messages show correctly
- [ ] **Loading States:** Loading spinners show during fetch/send
- [ ] **Empty State:** Shows "No messages yet" when no messages
- [ ] **Timestamp Format:** Dates display in user's locale
- [ ] **Long Messages:** Text wraps properly in message display
- [ ] **Scrolling:** Messages list scrolls when exceeds max-height

---

## Notes

- **No Existing Task UI Modified:** Created task, status updates, attachments remain unchanged
- **Toast Setup Reused:** Uses global ToastContainer already set up in App.jsx
- **Permission Model:** Follows existing staff/admin pattern used in task assignments
- **Offline-First Design:** Doesn't modify task status or other fields automatically
- **Scalability:** Messages section will expand/collapse based on content, not full modal

---

## Next Steps (Backend Team)

1. Create `task_messages` table migration
2. Implement `GET /tasks/:id/messages` endpoint with permission checks
3. Implement `POST /tasks/:id/messages` endpoint with permission checks and validation
4. Test with both staff and admin users
5. Verify cascade delete works when task is deleted

---

**Date Completed:** June 15, 2026
**Files Modified:** 1
  - `src/pages/Tasks.jsx`

**Build Output:** SUCCESS
```
✓ 540 modules transformed
✓ dist/index.html                    0.45 kB
✓ dist/assets/index-DQX4cYHt.css    54.96 kB (gzip: 9.79 kB)
✓ dist/assets/index-NELIvtqQ.js    927.38 kB (gzip: 258.76 kB)
✓ built in 2.77s
```
