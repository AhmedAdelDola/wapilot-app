# Missing API Endpoints - Mobile App Requirements

## Overview
This document lists all API endpoints that are missing from the current Chatwoot API and are required for the mobile app to function properly.

---

## 1. Calls

### List Calls
```
GET /api/v1/accounts/{account_id}/calls
```

**Query Parameters:**
- `status` - Filter by status: `all`, `missed`, `no_answer`, `ongoing`, `ended`
- `page` - Page number (default: 1)
- `per_page` - Items per page (default: 20)
- `sort_by` - Sort field: `created_at`, `started_at`, `ended_at`
- `sort_order` - Sort order: `asc`, `desc`

**Response:**
```json
{
  "calls": [
    {
      "id": 123,
      "contact": {
        "id": 456,
        "name": "John Doe",
        "avatar_url": "https://..."
      },
      "inbox": {
        "id": 1,
        "name": "Support Inbox"
      },
      "status": "ended",
      "started_at": "2024-01-15T10:30:00Z",
      "ended_at": "2024-01-15T10:35:00Z",
      "duration": 300,
      "direction": "inbound",
      "agent": {
        "id": 789,
        "name": "Agent Name"
      }
    }
  ],
  "meta": {
    "current_page": 1,
    "total_pages": 5,
    "total_count": 100
  }
}
```

### Get Call Details
```
GET /api/v1/accounts/{account_id}/calls/{call_id}
```

**Response:**
```json
{
  "id": 123,
  "contact": {
    "id": 456,
    "name": "John Doe",
    "avatar_url": "https://...",
    "phone_number": "+1234567890"
  },
  "inbox": {
    "id": 1,
    "name": "Support Inbox"
  },
  "status": "ended",
  "started_at": "2024-01-15T10:30:00Z",
  "ended_at": "2024-01-15T10:35:00Z",
  "duration": 300,
  "direction": "inbound",
  "recording_url": "https://...",
  "agent": {
    "id": 789,
    "name": "Agent Name"
  }
}
```

### Call Counts
```
GET /api/v1/accounts/{account_id}/calls/meta
```

**Query Parameters:**
- `status` - Filter by status

**Response:**
```json
{
  "all": 150,
  "missed": 10,
  "no_answer": 5,
  "ongoing": 2,
  "ended": 133
}
```

---

## 2. Lifecycle Stages

### List Lifecycle Stages
```
GET /api/v1/accounts/{account_id}/lifecycle_stages
```

**Response:**
```json
{
  "lifecycle_stages": [
    {
      "id": 1,
      "name": "New Lead",
      "color": "#4CAF50",
      "icon": "🆕",
      "sort_order": 1,
      "conversation_count": 25
    },
    {
      "id": 2,
      "name": "Hot Lead",
      "color": "#FF5722",
      "icon": "🔥",
      "sort_order": 2,
      "conversation_count": 10
    }
  ]
}
```

### Create Lifecycle Stage
```
POST /api/v1/accounts/{account_id}/lifecycle_stages
```

**Request Body:**
```json
{
  "name": "Qualified Lead",
  "color": "#2196F3",
  "icon": "✅",
  "sort_order": 3
}
```

### Update Conversation Lifecycle
```
PATCH /api/v1/accounts/{account_id}/conversations/{conversation_id}/lifecycle
```

**Request Body:**
```json
{
  "lifecycle_stage_id": 2
}
```

### Get Conversations by Lifecycle
```
GET /api/v1/accounts/{account_id}/conversations?lifecycle_stage_id=1
```

---

## 3. Teams

### List Teams
```
GET /api/v1/accounts/{account_id}/teams
```

**Response:**
```json
{
  "teams": [
    {
      "id": 1,
      "name": "Sales Team",
      "description": "Handles sales inquiries",
      "member_count": 5,
      "conversation_count": 25
    }
  ]
}
```

### Create Team
```
POST /api/v1/accounts/{account_id}/teams
```

**Request Body:**
```json
{
  "name": "Support Team",
  "description": "Handles support tickets",
  "member_ids": [1, 2, 3]
}
```

### Update Team
```
PATCH /api/v1/accounts/{account_id}/teams/{team_id}
```

**Request Body:**
```json
{
  "name": "Updated Team Name",
  "member_ids": [1, 2, 3, 4]
}
```

### Delete Team
```
DELETE /api/v1/accounts/{account_id}/teams/{team_id}
```

### Assign Conversation to Team
```
POST /api/v1/accounts/{account_id}/conversations/{conversation_id}/team
```

**Request Body:**
```json
{
  "team_id": 1
}
```

### Get Team Members
```
GET /api/v1/accounts/{account_id}/teams/{team_id}/members
```

**Response:**
```json
{
  "members": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "avatar_url": "https://..."
    }
  ]
}
```

---

## 4. Customer Segments

### List Customer Segments
```
GET /api/v1/accounts/{account_id}/customer_segments
```

**Response:**
```json
{
  "segments": [
    {
      "id": 1,
      "name": "VIP Customers",
      "description": "Customers with high value",
      "filter_conditions": {
        "min_purchases": 10,
        "total_spent": 500
      },
      "contact_count": 150
    }
  ]
}
```

### Create Customer Segment
```
POST /api/v1/accounts/{account_id}/customer_segments
```

**Request Body:**
```json
{
  "name": "VIP Customers",
  "description": "Customers with high value",
  "filter_conditions": {
    "min_purchases": 10,
    "total_spent": 500
  }
}
```

### Update Customer Segment
```
PATCH /api/v1/accounts/{account_id}/customer_segments/{segment_id}
```

**Request Body:**
```json
{
  "name": "Updated Segment Name",
  "filter_conditions": {
    "min_purchases": 5
  }
}
```

### Delete Customer Segment
```
DELETE /api/v1/accounts/{account_id}/customer_segments/{segment_id}
```

### Get Segment Contacts
```
GET /api/v1/accounts/{account_id}/customer_segments/{segment_id}/contacts
```

**Response:**
```json
{
  "contacts": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "avatar_url": "https://..."
    }
  ]
}
```

### Add Contact to Segment
```
POST /api/v1/accounts/{account_id}/customer_segments/{segment_id}/contacts
```

**Request Body:**
```json
{
  "contact_ids": [1, 2, 3]
}
```

### Remove Contact from Segment
```
DELETE /api/v1/accounts/{account_id}/customer_segments/{segment_id}/contacts/{contact_id}
```

---

## 5. Sidebar Counts

### Get Sidebar Counts
```
GET /api/v1/accounts/{account_id}/conversations/counts
```

**Query Parameters:**
- `assignee_type` - Filter by: `me`, `unassigned`, `all`

**Response:**
```json
{
  "all": 150,
  "mine": 25,
  "unassigned": 30,
  "lifecycle": {
    "1": 10,
    "2": 5,
    "3": 8,
    "4": 200
  },
  "teams": {
    "1": 45,
    "2": 30
  },
  "segments": {
    "1": 15,
    "2": 25
  }
}
```

---

## 6. Profile Updates

### Update Profile
```
PATCH /api/v1/profile
```

**Request Body:**
```json
{
  "name": "Ahmed Adel",
  "email": "dola02264@gmail.com",
  "locale": "en"
}
```

### Change Password
```
POST /api/v1/profile/change_password
```

**Request Body:**
```json
{
  "current_password": "oldpassword",
  "password": "newpassword",
  "password_confirmation": "newpassword"
}
```

### Update Avatar
```
POST /api/v1/profile/avatar
```

**Request Body:**
```
Content-Type: multipart/form-data

avatar: [file]
```

---

## 7. Notification Preferences

### Get Notification Preferences
```
GET /api/v1/accounts/{account_id}/notification_preferences
```

**Response:**
```json
{
  "mobile_push": {
    "enabled": true,
    "filter": "all_contacts_and_mentions",
    "offline_only": false
  },
  "in_app_call_sounds": {
    "enabled": true,
    "filter": "assigned_to_me_and_unassigned"
  },
  "in_app_chat_sounds": {
    "enabled": true,
    "filter": "assigned_to_me_or_unassigned"
  }
}
```

### Update Notification Preferences
```
PATCH /api/v1/accounts/{account_id}/notification_preferences
```

**Request Body:**
```json
{
  "mobile_push": {
    "enabled": true,
    "filter": "all_contacts_and_mentions",
    "offline_only": false
  },
  "in_app_call_sounds": {
    "enabled": true,
    "filter": "assigned_to_me_and_unassigned"
  },
  "in_app_chat_sounds": {
    "enabled": true,
    "filter": "assigned_to_me_or_unassigned"
  }
}
```

---

## 8. Bug Reports

### Submit Bug Report
```
POST /api/v1/accounts/{account_id}/bug_reports
```

**Request Body:**
```
Content-Type: multipart/form-data

bug_location: "Inbox"
bug_summary: "App crashes when opening conversation"
media: [file1, file2]
```

**Response:**
```json
{
  "id": 123,
  "status": "submitted",
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

## 9. Workspace/Account

### Switch Workspace
Already exists: `PUT /api/v1/profile/set_active_account`

### List Workspaces
Already exists: `GET /api/v1/profile` (returns all accounts)

---

## 10. Real-time Updates (WebSocket)

### ActionCable Channels

#### Conversation Updates
```javascript
// Channel: RoomChannel
// Params: { pubsub_token, account_id, user_id }

// Events:
conversation.created
conversation.updated
conversation.message.created
conversation.typing.on
conversation.typing.off
conversation.status.changed
conversation.assignee.changed
```

#### Call Updates
```javascript
// Channel: RoomChannel
// Params: { pubsub_token, account_id, user_id }

// Events:
call.started
call.ended
call.missed
call.ringing
```

#### Sidebar Counts Updates
```javascript
// Channel: RoomChannel
// Params: { pubsub_token, account_id, user_id }

// Events:
conversation.counts.updated
{
  "all": 150,
  "mine": 25,
  "unassigned": 30,
  "lifecycle": { ... },
  "teams": { ... },
  "segments": { ... }
}
```

---

## Summary

| Feature | Endpoint | Method | Status |
|---------|----------|--------|--------|
| Calls | `/calls` | GET | ❌ Missing |
| Call Counts | `/calls/meta` | GET | ❌ Missing |
| Lifecycle Stages | `/lifecycle_stages` | GET | ❌ Missing |
| Lifecycle Stages | `/lifecycle_stages` | POST | ❌ Missing |
| Conversation Lifecycle | `/conversations/{id}/lifecycle` | PATCH | ❌ Missing |
| Teams | `/teams` | GET | ❌ Missing |
| Teams | `/teams` | POST | ❌ Missing |
| Team Members | `/teams/{id}/members` | GET | ❌ Missing |
| Customer Segments | `/customer_segments` | GET | ❌ Missing |
| Customer Segments | `/customer_segments` | POST | ❌ Missing |
| Sidebar Counts | `/conversations/counts` | GET | ❌ Missing |
| Profile Update | `/profile` | PATCH | ❌ Missing |
| Change Password | `/profile/change_password` | POST | ❌ Missing |
| Update Avatar | `/profile/avatar` | POST | ❌ Missing |
| Notification Preferences | `/notification_preferences` | GET | ❌ Missing |
| Notification Preferences | `/notification_preferences` | PATCH | ❌ Missing |
| Bug Reports | `/bug_reports` | POST | ❌ Missing |
| Call Updates | WebSocket | - | ❌ Missing |
| Sidebar Counts Updates | WebSocket | - | ❌ Missing |

---

## Priority

| Priority | Feature | Complexity |
|----------|---------|------------|
| 🔴 High | Calls Endpoints | Medium |
| 🔴 High | Sidebar Counts | Low |
| 🔴 High | Profile Updates | Low |
| 🟡 Medium | Lifecycle Stages | Medium |
| 🟡 Medium | Teams | Medium |
| 🟡 Medium | Customer Segments | Medium |
| 🟡 Medium | Notification Preferences | Low |
| 🟢 Low | Bug Reports | Low |
| 🟢 Low | WebSocket Updates | High |

---

## Notes

1. **Calls**: This is the highest priority as the Calls screen is already built
2. **WebSocket**: Real-time updates are critical for sidebar counts and call notifications
3. **Profile**: Basic profile updates should be straightforward
4. **Teams/Segments**: These can be implemented incrementally
5. **Bug Reports**: Can use external service (e.g., Sentry) instead of custom endpoint
