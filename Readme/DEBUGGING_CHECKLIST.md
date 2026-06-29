# Groups Loading - Debugging Checklist

## 🚀 Quick Start

### Step 1: Run Development Server
```bash
npm run dev
```

### Step 2: Open Chat Page
Navigate to the chat page in your browser.

### Step 3: Open Browser DevTools
Press `F12` to open DevTools.

### Step 4: Check Console
Look for these logs:
```
✅ "Fetching groups..."
✅ "Groups response: {...}"
```

If you see errors, follow the debugging steps below.

---

## ✅ Verification Checklist

### Frontend Checks

- [ ] **Console Logs**
  - [ ] "Fetching groups..." appears
  - [ ] "Groups response: {...}" appears
  - [ ] No error messages

- [ ] **Network Tab**
  - [ ] GET request to `/api/chat/groups`
  - [ ] Status code is 200
  - [ ] Response contains groups array

- [ ] **React DevTools**
  - [ ] ChatLayout component exists
  - [ ] `groups` state is an array
  - [ ] `loading` state is `false`
  - [ ] `selectedGroup` state is `null`

- [ ] **UI Display**
  - [ ] Sidebar shows groups
  - [ ] Group names are visible
  - [ ] Avatars display correctly
  - [ ] No loading spinner

### Backend Checks

- [ ] **API Endpoint**
  - [ ] Route exists: `GET /chat/groups`
  - [ ] Route is protected with auth
  - [ ] Controller returns correct format

- [ ] **Response Format**
  - [ ] Returns `{ data: [...] }` or `{ groups: [...] }`
  - [ ] Each group has `id`, `group_name`
  - [ ] Status code is 200

- [ ] **Authentication**
  - [ ] Token is being sent
  - [ ] Token is valid
  - [ ] User has permission

### Configuration Checks

- [ ] **Axios Configuration**
  - [ ] baseURL is correct: `http://localhost:5001/api`
  - [ ] Token interceptor is working
  - [ ] Authorization header is set

- [ ] **Socket.IO Configuration**
  - [ ] Connected to correct server
  - [ ] Socket ID appears in console

---

## 🔍 Debugging Steps

### If Groups Don't Load

#### Step 1: Check Console Logs
```javascript
// In browser console, you should see:
"Fetching groups..."
"Groups response: {data: [...]}"
```

**If not:**
- Check if component mounted
- Verify useEffect is running
- Check for JavaScript errors

#### Step 2: Check Network Request
1. Open DevTools → Network tab
2. Filter by XHR/Fetch
3. Look for `/api/chat/groups` request
4. Check response status (should be 200)
5. Check response body (should have groups)

**If request fails:**
- Check API endpoint URL
- Verify backend is running
- Check authentication token
- Check CORS configuration

#### Step 3: Check React State
1. Open DevTools → React tab
2. Select ChatLayout component
3. Check state values:
   - `groups`: Should be array
   - `loading`: Should be false
   - `selectedGroup`: Should be null

**If state is wrong:**
- Check fetchGroups function
- Verify setGroups is called
- Check error handling

#### Step 4: Check Authentication
In browser console:
```javascript
// Check token
localStorage.getItem("token")

// Check user
JSON.parse(localStorage.getItem("user"))

// Check API headers
// Open Network tab, click request, check Headers
```

**If token is missing:**
- User not logged in
- Login first
- Check localStorage

#### Step 5: Check Backend Response
In Network tab, click the `/api/chat/groups` request:
1. Click "Response" tab
2. Check response format
3. Verify groups array exists
4. Check group properties

**Expected response:**
```json
{
  "data": [
    {
      "id": 1,
      "group_name": "Engineering",
      "description": "Team discussions",
      "created_at": "2024-01-01T00:00:00Z",
      "last_message": "See you tomorrow!"
    }
  ]
}
```

---

## 🐛 Common Issues & Quick Fixes

### Issue: Loading Spinner Never Stops

**Cause:** `setLoading(false)` not called

**Fix:**
```javascript
// Verify finally block exists
finally {
  setLoading(false);  // ← Must be here
}
```

**Check:**
- [ ] `setLoading(false)` in finally block
- [ ] No infinite loops in useEffect
- [ ] API call completes

---

### Issue: Groups Array is Empty

**Cause:** API returns no groups or wrong format

**Fix:**
```javascript
// Check response format
const groupsData = response.data.data || response.data.groups || [];
console.log("Groups data:", groupsData);
```

**Check:**
- [ ] Backend returns groups
- [ ] Response format is correct
- [ ] Groups have required properties

---

### Issue: "Failed to load groups" Toast

**Cause:** API request failed

**Fix:**
```javascript
// Check error details
catch (error) {
  console.error("Error:", error.response?.data || error.message);
  console.error("Status:", error.response?.status);
}
```

**Check:**
- [ ] Backend is running
- [ ] API endpoint is correct
- [ ] Authentication token is valid
- [ ] CORS is configured

---

### Issue: Groups Load But Don't Display

**Cause:** Sidebar not receiving props or rendering

**Fix:**
```javascript
// In Sidebar.jsx, add debug log
console.log("Sidebar received groups:", groups);
console.log("Sidebar loading:", loading);
```

**Check:**
- [ ] Groups prop is passed to Sidebar
- [ ] Loading prop is passed to Sidebar
- [ ] Sidebar renders groups correctly

---

## 🔧 Manual Testing

### Test 1: Verify API Works
```bash
# In terminal, test API directly
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5001/api/chat/groups
```

**Expected:** Returns groups array

---

### Test 2: Check Token
```javascript
// In browser console
localStorage.getItem("token")
```

**Expected:** Returns a token string

---

### Test 3: Check User
```javascript
// In browser console
JSON.parse(localStorage.getItem("user"))
```

**Expected:** Returns user object with id, name, email

---

### Test 4: Manually Call fetchGroups
```javascript
// In browser console (if you expose it)
window.fetchGroups()
```

**Expected:** Groups load and appear in sidebar

---

## 📊 Debug Output Template

When reporting issues, provide:

```
Browser: Chrome/Firefox/Safari
OS: Windows/Mac/Linux
Console Logs:
- [paste console output]

Network Response:
- Status: 200/400/401/500
- Response: [paste response]

React State:
- groups: [paste state]
- loading: [paste state]
- selectedGroup: [paste state]

Error Message:
- [paste error]
```

---

## ✅ Success Indicators

When everything works:

- ✅ Console shows "Fetching groups..."
- ✅ Console shows "Groups response: {...}"
- ✅ Network request returns 200
- ✅ Groups appear in sidebar
- ✅ Loading spinner disappears
- ✅ Can click groups
- ✅ Messages load when group selected
- ✅ No console errors

---

## 🚀 Next Steps

### If Groups Load Successfully
1. ✅ Test group selection
2. ✅ Test message sending
3. ✅ Test typing indicator
4. ✅ Test online status

### If Groups Don't Load
1. Check console logs
2. Check network request
3. Check backend response
4. Check authentication
5. Check CORS configuration

---

## 📞 Support Resources

- **Console Logs**: Check browser console (F12)
- **Network Tab**: Check API requests (F12 → Network)
- **React DevTools**: Check component state (F12 → React)
- **Backend Logs**: Check server console
- **Documentation**: See GROUPS_LOADING_FIX.md

---

**Version**: 1.0.0  
**Status**: ✅ Ready to Debug  
**Date**: May 2026
