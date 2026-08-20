# Inbox Screen - Backend Requirements

## Overview
These features require backend implementation. All other features are already supported by the existing Chatwoot API.

---

## 1. Lifecycle Stages

### Description
Custom conversation lifecycle stages (e.g., New Lead, Hot Lead, Payment, Customer).

### Backend Requirements

#### Add lifecycle_stage field to conversations
```sql
ALTER TABLE conversations ADD COLUMN lifecycle_stage VARCHAR(50);
```

#### Create lifecycle_stages table
```sql
CREATE TABLE lifecycle_stages (
  id SERIAL PRIMARY KEY,
  account_id INTEGER REFERENCES accounts(id),
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7),
  icon VARCHAR(50),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### API Endpoints Needed

**List Lifecycle Stages**
```
GET /api/v1/accounts/{account_id}/lifecycle_stages
```

**Create Lifecycle Stage**
```
POST /api/v1/accounts/{account_id}/lifecycle_stages
Body: { "name": "Hot Lead", "color": "#FF5722", "icon": "🔥" }
```

**Update Conversation Lifecycle**
```
PATCH /api/v1/accounts/{account_id}/conversations/{conversation_id}/lifecycle
Body: { "lifecycle_stage_id": 1 }
```

**Filter Conversations by Lifecycle**
```
GET /api/v1/accounts/{account_id}/conversations?lifecycle_stage_id=1
```

---

## 2. Teams

### Description
Team-based conversation filtering.

### Backend Requirements

#### Add team_id field to conversations
```sql
ALTER TABLE conversations ADD COLUMN team_id INTEGER REFERENCES teams(id);
```

#### Create teams table (if not exists)
```sql
CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  account_id INTEGER REFERENCES accounts(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Create team_members table
```sql
CREATE TABLE team_members (
  id SERIAL PRIMARY KEY,
  team_id INTEGER REFERENCES teams(id),
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### API Endpoints Needed

**List Teams**
```
GET /api/v1/accounts/{account_id}/teams
```

**List Team Conversations**
```
GET /api/v1/accounts/{account_id}/conversations?team_id=1
```

**Assign Conversation to Team**
```
POST /api/v1/accounts/{account_id}/conversations/{conversation_id}/team
Body: { "team_id": 1 }
```

---

## 3. Customer Segments

### Description
Custom customer groups/segments.

### Backend Requirements

#### Create customer_segments table
```sql
CREATE TABLE customer_segments (
  id SERIAL PRIMARY KEY,
  account_id INTEGER REFERENCES accounts(id),
  name VARCHAR(100) NOT NULL,
  filter_conditions JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Create segment_contacts table
```sql
CREATE TABLE segment_contacts (
  id SERIAL PRIMARY KEY,
  segment_id INTEGER REFERENCES customer_segments(id),
  contact_id INTEGER REFERENCES contacts(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### API Endpoints Needed

**List Customer Segments**
```
GET /api/v1/accounts/{account_id}/customer_segments
```

**Create Customer Segment**
```
POST /api/v1/accounts/{account_id}/customer_segments
Body: {
  "name": "VIP Customers",
  "filter_conditions": {
    "min_purchases": 10,
    "total_spent": 500
  }
}
```

**List Segment Conversations**
```
GET /api/v1/accounts/{account_id}/conversations?segment_id=1
```

---

## 4. Sidebar Counts (Real-time)

### Description
Real-time counts for each sidebar section.

### Backend Requirements

#### Add WebSocket events for counts
```javascript
// ActionCable channel
class ConversationCountsChannel < ApplicationCable::Channel
  def subscribed
    stream_for "account_#{account_id}_counts"
  end

  # Broadcast counts on:
  # - New conversation
  # - Conversation status change
  # - Conversation assignment change
end
```

#### API Endpoint for Initial Counts
```
GET /api/v1/accounts/{account_id}/conversations/counts
```

**Response:**
```json
{
  "all": 150,
  "mine": 25,
  "unassigned": 30,
  "lifecycle": {
    "new_lead": 10,
    "hot_lead": 5,
    "payment": 8,
    "customer": 200
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

## Database Schema Summary

```sql
-- Lifecycle Stages
CREATE TABLE lifecycle_stages (
  id SERIAL PRIMARY KEY,
  account_id INTEGER REFERENCES accounts(id),
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7),
  icon VARCHAR(50),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Teams
CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  account_id INTEGER REFERENCES accounts(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Team Members
CREATE TABLE team_members (
  id SERIAL PRIMARY KEY,
  team_id INTEGER REFERENCES teams(id),
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Customer Segments
CREATE TABLE customer_segments (
  id SERIAL PRIMARY KEY,
  account_id INTEGER REFERENCES accounts(id),
  name VARCHAR(100) NOT NULL,
  filter_conditions JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Segment Contacts
CREATE TABLE segment_contacts (
  id SERIAL PRIMARY KEY,
  segment_id INTEGER REFERENCES customer_segments(id),
  contact_id INTEGER REFERENCES contacts(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add foreign keys to conversations
ALTER TABLE conversations ADD COLUMN lifecycle_stage_id INTEGER REFERENCES lifecycle_stages(id);
ALTER TABLE conversations ADD COLUMN team_id INTEGER REFERENCES teams(id);
ALTER TABLE conversations ADD COLUMN segment_id INTEGER REFERENCES customer_segments(id);
```

---

## Priority

| Feature | Priority | Complexity |
|---------|----------|------------|
| Lifecycle Stages | High | Medium |
| Teams | High | Low |
| Customer Segments | Medium | Medium |
| Sidebar Counts | High | Low |

---

## Notes

1. **Lifecycle Stages** should be configurable per account
2. **Teams** should support multiple team membership
3. **Customer Segments** can use dynamic filtering (like saved searches)
4. **Sidebar Counts** should update in real-time via WebSocket
