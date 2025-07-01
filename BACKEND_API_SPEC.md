# Backend API Specification

This document outlines the API endpoints that need to be implemented to support the MITRE Shield frontend application.

## Base URL
```
http://localhost:3000/api
```

## Authentication
All endpoints (except `/auth/login`) require a JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## API Endpoints

### Authentication

#### POST /auth/login
Login user and return JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "analyst"
  }
}
```

#### POST /auth/logout
Logout user (invalidate token).

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### GET /auth/me
Get current user information.

**Response:**
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "name": "User Name",
  "role": "analyst"
}
```

#### POST /auth/refresh
Refresh JWT token.

**Response:**
```json
{
  "success": true,
  "token": "new_jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "analyst"
  }
}
```

### Detection Rules

#### GET /rules
Get all detection rules with optional filtering and sorting.

**Query Parameters:**
- `limit` (int): Number of results to return (default: 1000)
- `sort` (string): Field to sort by (e.g., "created_date", "name")
- `order` (string): Sort order ("asc" or "desc")
- `platform` (string): Filter by platform
- `status` (string): Filter by status
- `tactic` (string): Filter by tactic
- `severity` (string): Filter by severity

**Response:**
```json
[
  {
    "id": "rule_id_1",
    "rule_id": "RULE-001",
    "name": "Suspicious PowerShell Activity",
    "description": "Detects suspicious PowerShell commands",
    "technique_id": "T1059.001",
    "platform": "Windows",
    "tactic": "Execution",
    "status": "Active",
    "xql_query": "dataset = xdr_data | filter agent_os_type = AGENT_OS_WINDOWS",
    "tags": ["powershell", "execution"],
    "severity": "High",
    "false_positive_rate": "Low",
    "assigned_user": "John Doe",
    "created_date": "2024-01-01T00:00:00Z",
    "updated_date": "2024-01-01T00:00:00Z"
  }
]
```

#### GET /rules/:id
Get a specific detection rule by ID.

#### POST /rules
Create a new detection rule.

**Request Body:**
```json
{
  "rule_id": "RULE-002",
  "name": "Malicious File Download",
  "description": "Detects malicious file downloads",
  "technique_id": "T1105",
  "platform": "Windows",
  "tactic": "Command and Control",
  "status": "Testing",
  "xql_query": "dataset = xdr_data | filter action_file_download_url != null",
  "tags": ["download", "malware"],
  "severity": "Medium",
  "false_positive_rate": "Medium",
  "assigned_user": "Jane Smith"
}
```

#### PUT /rules/:id
Update an existing detection rule.

#### DELETE /rules/:id
Delete a detection rule.

#### POST /rules/bulk
Create multiple detection rules.

**Request Body:**
```json
{
  "items": [
    {
      "rule_id": "RULE-003",
      "name": "Rule Name",
      // ... other rule fields
    }
  ]
}
```

### MITRE Techniques

#### GET /techniques
Get all MITRE ATT&CK techniques.

**Query Parameters:**
- `limit` (int): Number of results to return
- `sort` (string): Field to sort by
- `order` (string): Sort order
- `tactic` (string): Filter by tactic
- `platform` (string): Filter by platform

**Response:**
```json
[
  {
    "id": "technique_id_1",
    "technique_id": "T1059",
    "name": "Command and Scripting Interpreter",
    "description": "Adversaries may abuse command and script interpreters...",
    "tactic": "Execution",
    "platforms": ["Windows", "macOS", "Linux"],
    "data_sources": ["Process", "Command"],
    "is_subtechnique": false,
    "created_date": "2024-01-01T00:00:00Z",
    "updated_date": "2024-01-01T00:00:00Z"
  }
]
```

#### GET /techniques/:id
Get a specific technique by ID.

#### POST /techniques
Create a new technique.

#### PUT /techniques/:id
Update an existing technique.

#### DELETE /techniques/:id
Delete a technique.

### Future Rules

#### GET /future-rules
Get all future rules.

**Response:**
```json
[
  {
    "id": "future_rule_id_1",
    "name": "Planned Rule for T1078",
    "description": "Future rule to detect account abuse",
    "technique_id": "T1078",
    "platform": "Windows",
    "tactic": "Initial Access",
    "priority": "High",
    "status": "Planned",
    "assigned_to": "Security Team",
    "target_date": "2024-06-01T00:00:00Z",
    "notes": "Waiting for data source integration",
    "created_date": "2024-01-01T00:00:00Z",
    "updated_date": "2024-01-01T00:00:00Z"
  }
]
```

#### POST /future-rules
Create a new future rule.

#### PUT /future-rules/:id
Update an existing future rule.

#### DELETE /future-rules/:id
Delete a future rule.

#### POST /future-rules/:id/promote
Promote a future rule to a detection rule (moves from future-rules to rules).

### File Operations

#### POST /upload
Upload a file and return file URL.

**Request:** Multipart form data with file

**Response:**
```json
{
  "success": true,
  "file_url": "https://your-storage.com/files/uploaded_file.csv",
  "filename": "uploaded_file.csv",
  "size": 1024
}
```

#### POST /extract-data
Extract structured data from uploaded CSV/Excel file.

**Request Body:**
```json
{
  "file_url": "https://your-storage.com/files/uploaded_file.csv",
  "json_schema": {
    "type": "array",
    "items": {
      "type": "object",
      "properties": {
        "rule_id": { "type": "string" },
        "name": { "type": "string" }
      }
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "rule_id": "RULE-001",
      "name": "Rule Name"
    }
  ]
}
```

### Analytics

#### GET /analytics/stats
Get overall statistics.

**Response:**
```json
{
  "total_rules": 150,
  "active_rules": 120,
  "testing_rules": 25,
  "inactive_rules": 5,
  "coverage_percentage": 75,
  "total_techniques": 200
}
```

## Data Models

### User
```javascript
{
  id: String (UUID),
  email: String (unique),
  password: String (hashed),
  name: String,
  role: Enum ['admin', 'analyst', 'viewer'],
  created_date: DateTime,
  updated_date: DateTime
}
```

### DetectionRule
```javascript
{
  id: String (UUID),
  rule_id: String (unique),
  name: String,
  description: String,
  technique_id: String,
  platform: Enum ['Windows', 'macOS', 'Linux', 'AWS', 'Azure', 'GCP', 'Oracle', 'Containers'],
  tactic: String,
  status: Enum ['Active', 'Testing', 'Inactive'],
  xql_query: String,
  tags: Array<String>,
  severity: Enum ['Critical', 'High', 'Medium', 'Low'],
  false_positive_rate: Enum ['Low', 'Medium', 'High'],
  assigned_user: String,
  created_date: DateTime,
  updated_date: DateTime
}
```

### MitreTechnique
```javascript
{
  id: String (UUID),
  technique_id: String (unique),
  name: String,
  description: String,
  tactic: String,
  platforms: Array<String>,
  data_sources: Array<String>,
  is_subtechnique: Boolean,
  created_date: DateTime,
  updated_date: DateTime
}
```

### FutureRule
```javascript
{
  id: String (UUID),
  name: String,
  description: String,
  technique_id: String,
  platform: String,
  tactic: String,
  priority: Enum ['Critical', 'High', 'Medium', 'Low'],
  status: Enum ['Planned', 'In Progress', 'Ready for Review'],
  assigned_to: String,
  target_date: DateTime,
  notes: String,
  created_date: DateTime,
  updated_date: DateTime
}
```

## Error Responses

All error responses follow this format:
```json
{
  "success": false,
  "error": "Error message here",
  "code": "ERROR_CODE"
}
```

Common HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Environment Variables

The frontend expects these environment variables:

```bash
# Required
VITE_API_BASE_URL=http://localhost:3000/api

# Optional
NODE_ENV=development
```

Create a `.env` file in the project root with:
```
VITE_API_BASE_URL=http://localhost:3000/api
``` 