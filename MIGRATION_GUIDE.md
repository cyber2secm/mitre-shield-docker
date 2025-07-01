# Migration Guide: From Base44 to Custom Backend

This guide documents the complete migration of the MITRE Shield application from base44 to a custom backend solution.

## What Was Migrated

### 1. Removed Base44 Dependencies
- ✅ Removed `@base44/sdk` from package.json
- ✅ Deleted `src/api/base44Client.js`
- ✅ Created new `src/api/apiClient.js` with custom HTTP client
- ✅ Updated `src/api/entities.js` with custom entity classes
- ✅ Updated `src/api/integrations.js` with custom integration services

### 2. Added Authentication System
- ✅ Created `src/contexts/AuthContext.jsx` for authentication state management
- ✅ Created `src/components/auth/LoginForm.jsx` for user login
- ✅ Updated `src/App.jsx` to include AuthProvider
- ✅ Updated `src/pages/index.jsx` with authentication checks
- ✅ Updated `src/pages/Layout.jsx` with logout functionality

### 3. Updated API Service Layer
- ✅ `BaseEntity` class for CRUD operations
- ✅ HTTP client with JWT token management
- ✅ Error handling and request/response intercepting
- ✅ File upload support

### 4. Configuration
- ✅ Created `src/config/environment.js` for environment variables
- ✅ Environment variable support for API base URL

## Frontend Changes Summary

### API Client (`src/api/apiClient.js`)
```javascript
// New features:
- JWT token management in localStorage
- Automatic Authorization headers
- Error handling with meaningful messages
- File upload support
- Configurable base URL via environment variables
```

### Entity Layer (`src/api/entities.js`)
```javascript
// Replaced base44 entities with:
- DetectionRule (endpoint: /rules)
- MitreTechnique (endpoint: /techniques)  
- FutureRule (endpoint: /future-rules)
- User authentication service
```

### Authentication (`src/contexts/AuthContext.jsx`)
```javascript
// New authentication features:
- Login/logout functionality
- Token refresh
- Authentication state management
- User information storage
```

## Required Backend Implementation

You need to implement a backend API with the following endpoints:

### Authentication Endpoints
```
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/me
POST /api/auth/refresh
```

### Data Endpoints
```
GET/POST/PUT/DELETE /api/rules
GET/POST/PUT/DELETE /api/techniques
GET/POST/PUT/DELETE /api/future-rules
POST /api/rules/bulk
```

### File Endpoints
```
POST /api/upload
POST /api/extract-data
```

### Analytics Endpoints
```
GET /api/analytics/stats
```

## Setup Instructions

### 1. Frontend Setup

1. **Install dependencies** (base44 removed):
   ```bash
   npm install
   ```

2. **Create environment file**:
   ```bash
   # Create .env file in project root
   echo "VITE_API_BASE_URL=http://localhost:3000/api" > .env
   ```

3. **Start frontend**:
   ```bash
   npm run dev
   ```

### 2. Backend Setup (Example Node.js)

1. **Navigate to backend example**:
   ```bash
   cd backend-example
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Setup environment**:
   ```bash
   cp config.env .env
   # Edit .env with your settings
   ```

4. **Start MongoDB** (required):
   ```bash
   # Install and start MongoDB locally, or use MongoDB Atlas
   mongod
   ```

5. **Start backend**:
   ```bash
   npm run dev
   ```

## Testing the Migration

### 1. Check Frontend Startup
- Frontend should start without base44 errors
- Login form should appear (since no backend is running yet)

### 2. Backend Integration Test
- Start both frontend and backend
- Login form should work with valid credentials
- All pages should load and function
- Data operations should work (CRUD for rules, techniques, future rules)

## Environment Variables

### Frontend (`.env`)
```bash
VITE_API_BASE_URL=http://localhost:3000/api
NODE_ENV=development
```

### Backend (`.env`)
```bash
MONGODB_URI=mongodb://localhost:27017/mitre-shield
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

## Data Models

The backend must support these data models (see `BACKEND_API_SPEC.md` for complete schemas):

1. **User** - Authentication and user management
2. **DetectionRule** - XQL detection rules
3. **MitreTechnique** - MITRE ATT&CK techniques
4. **FutureRule** - Planned rules for future implementation

## Migration Checklist

- [x] Remove base44 SDK dependency
- [x] Create custom API client
- [x] Update entity layer
- [x] Add authentication system
- [x] Update all imports and references
- [x] Create backend API specification
- [x] Provide backend example code
- [x] Test authentication flow
- [x] Verify data operations work
- [ ] **TODO: Implement backend API**
- [ ] **TODO: Test complete integration**
- [ ] **TODO: Deploy backend**
- [ ] **TODO: Update frontend environment for production**

## Next Steps

1. **Implement the backend API** using the provided specification (`BACKEND_API_SPEC.md`)
2. **Set up database** with the required collections/tables
3. **Implement authentication** with JWT tokens
4. **Add file upload and processing** capabilities
5. **Test the complete system** end-to-end
6. **Deploy to production** environment

## Troubleshooting

### Common Issues:

1. **CORS errors**: Make sure backend CORS is configured for frontend URL
2. **Authentication failures**: Check JWT secret and token format
3. **API errors**: Verify backend endpoints match the specification
4. **File upload issues**: Check file size limits and supported formats

### Debug Mode:
Set `NODE_ENV=development` to enable detailed error messages and logging.

## Support

If you encounter issues during migration:

1. Check the browser console for frontend errors
2. Check the server logs for backend errors
3. Verify API endpoints match the specification
4. Ensure environment variables are correctly set
5. Test authentication flow step by step

The migration is now complete on the frontend side. The application is ready to work with your custom backend once implemented according to the API specification. 