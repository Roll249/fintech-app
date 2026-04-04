# Fintech App API Documentation

**Version:** 1.0.0  
**Base URL:** `http://localhost:3000/api/v1`  
**Authentication:** Bearer Token (JWT)

---

## Table of Contents

1. [Authentication](#authentication)
2. [User Management](#user-management)
3. [Account Management](#account-management)
4. [Transactions](#transactions)
5. [Budgets](#budgets)
6. [Bills & OCR](#bills--ocr)
7. [Funds](#funds)
8. [Notifications](#notifications)
9. [Reports](#reports)
10. [Admin](#admin)
11. [Integration](#integration)
12. [Error Codes](#error-codes)

---

## Authentication

### Register
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "phone": "+84123456789" // optional
}

Response 201:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "550e8400-e29b-41d4-a716-446655440000",
  "expiresIn": 604800,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "+84123456789",
    "role": "user"
  }
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response 200: Same as Register
```

### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "550e8400-e29b-41d4-a716-446655440000"
}

Response 200:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "new-refresh-token",
  "expiresIn": 604800
}
```

### Forgot Password
```http
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}

Response 200:
{
  "message": "If email exists, reset link sent"
}
```

### Reset Password
```http
POST /auth/reset-password
Content-Type: application/json

{
  "token": "reset-token-from-email",
  "newPassword": "newPassword123"
}

Response 200:
{
  "success": true
}
```

### Logout
```http
POST /auth/logout
Authorization: Bearer {token}
Content-Type: application/json

{
  "refreshToken": "550e8400-e29b-41d4-a716-446655440000"
}

Response 200:
{
  "message": "Logged out successfully"
}
```

---

## User Management

### Get Current User
```http
GET /users/me
Authorization: Bearer {token}

Response 200:
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "phone": "+84123456789",
  "avatarUrl": "https://...",
  "role": "user",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### Update Profile
```http
PUT /users/me
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Jane Doe",
  "phone": "+84987654321",
  "avatarUrl": "https://..."
}

Response 200: Updated User object
```

### Change Password
```http
PUT /users/me/password
Authorization: Bearer {token}
Content-Type: application/json

{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456"
}

Response 200:
{
  "message": "Password changed successfully"
}
```

### Delete Account
```http
DELETE /users/me
Authorization: Bearer {token}

Response 200:
{
  "success": true
}
```

---

## Account Management

### List Accounts
```http
GET /accounts
Authorization: Bearer {token}

Response 200:
[
  {
    "id": "uuid",
    "userId": "uuid",
    "bankCode": "VCB",
    "bankName": "Vietcombank",
    "accountNumber": "1234567890",
    "accountName": "NGUYEN VAN A",
    "balance": 5000000,
    "currency": "VND",
    "type": "checking",
    "status": "active",
    "lastSyncedAt": "2024-01-01T12:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### Get Account Summary
```http
GET /accounts/summary
Authorization: Bearer {token}

Response 200:
{
  "totalBalance": 10000000,
  "byType": {
    "checking": 5000000,
    "savings": 3000000,
    "credit": -2000000
  },
  "count": 3
}
```

### Get Supported Banks
```http
GET /accounts/banks
Authorization: Bearer {token}

Response 200:
[
  {
    "code": "VCB",
    "name": "Vietcombank",
    "logo": "https://..."
  },
  {
    "code": "TCB",
    "name": "Techcombank",
    "logo": "https://..."
  }
]
```

### Connect Account
```http
POST /accounts/connect
Authorization: Bearer {token}
Content-Type: application/json

{
  "bankCode": "VCB",
  "accountNumber": "1234567890",
  "accountName": "NGUYEN VAN A"
}

Response 201: Account object
```

### Sync Account
```http
POST /accounts/:id/sync
Authorization: Bearer {token}

Response 200: Updated Account object
```

### Get Account Transactions
```http
GET /accounts/:id/transactions?page=1&limit=20&startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer {token}

Response 200:
{
  "items": [...Transaction objects],
  "page": 1,
  "pageSize": 20,
  "total": 100
}
```

### Disconnect Account
```http
DELETE /accounts/:id
Authorization: Bearer {token}

Response 200:
{
  "success": true
}
```

---

## Transactions

### List Transactions
```http
GET /transactions?page=1&limit=20&accountId=uuid&categoryId=uuid&type=expense&startDate=2024-01-01&endDate=2024-01-31&search=coffee
Authorization: Bearer {token}

Response 200:
{
  "items": [
    {
      "id": "uuid",
      "accountId": "uuid",
      "userId": "uuid",
      "amount": 50000,
      "type": "expense",
      "categoryId": "uuid",
      "category": {
        "id": "uuid",
        "name": "Food & Dining",
        "icon": "restaurant",
        "color": "#FF5722"
      },
      "description": "Coffee at Highlands",
      "merchantName": "Highlands Coffee",
      "date": "2024-01-15",
      "isManual": false,
      "tags": ["coffee", "breakfast"],
      "createdAt": "2024-01-15T08:30:00.000Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 150
}
```

### Get Transaction Summary
```http
GET /transactions/summary?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer {token}

Response 200:
{
  "income": 10000000,
  "expense": 7000000,
  "net": 3000000,
  "count": 85
}
```

### Create Transaction
```http
POST /transactions
Authorization: Bearer {token}
Content-Type: application/json

{
  "accountId": "uuid",
  "amount": 150000,
  "type": "expense",
  "categoryId": "uuid",
  "description": "Lunch with team",
  "merchantName": "Pizza Hut",
  "date": "2024-01-20",
  "tags": ["food", "team"]
}

Response 201: Transaction object
```

### Update Transaction
```http
PUT /transactions/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 200000,
  "categoryId": "uuid",
  "description": "Updated description"
}

Response 200: Updated Transaction object
```

### Delete Transaction
```http
DELETE /transactions/:id
Authorization: Bearer {token}

Response 200:
{
  "success": true
}
```

### Get Categories
```http
GET /transactions/categories
Authorization: Bearer {token}

Response 200:
[
  {
    "id": "uuid",
    "name": "Food & Dining",
    "icon": "restaurant",
    "color": "#FF5722",
    "type": "expense",
    "isSystem": true
  }
]
```

---

## Budgets

### List Budgets
```http
GET /budgets?period=monthly
Authorization: Bearer {token}

Response 200:
[
  {
    "id": "uuid",
    "userId": "uuid",
    "categoryId": "uuid",
    "category": {
      "name": "Food & Dining",
      "icon": "restaurant"
    },
    "amountLimit": 3000000,
    "spent": 2500000,
    "remaining": 500000,
    "period": "monthly",
    "startDate": "2024-01-01",
    "endDate": "2024-01-31",
    "alertThreshold": 80,
    "isExceeded": false,
    "progress": 83.3
  }
]
```

### Get Budget Summary
```http
GET /budgets/summary
Authorization: Bearer {token}

Response 200:
{
  "totalBudget": 10000000,
  "totalSpent": 7500000,
  "remaining": 2500000,
  "healthScore": 75,
  "exceededCount": 1
}
```

### Get Budget Alerts
```http
GET /budgets/alerts
Authorization: Bearer {token}

Response 200:
[
  {
    "budgetId": "uuid",
    "categoryName": "Food & Dining",
    "percentage": 95,
    "alertType": "warning",
    "message": "You've spent 95% of your budget"
  }
]
```

### Create Budget
```http
POST /budgets
Authorization: Bearer {token}
Content-Type: application/json

{
  "categoryId": "uuid",
  "amountLimit": 3000000,
  "period": "monthly",
  "alertThreshold": 80
}

Response 201: Budget object
```

### Update Budget
```http
PUT /budgets/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "amountLimit": 3500000,
  "alertThreshold": 85
}

Response 200: Updated Budget object
```

### Delete Budget
```http
DELETE /budgets/:id
Authorization: Bearer {token}

Response 200:
{
  "success": true
}
```

---

## Bills & OCR

### Upload Bill
```http
POST /bills/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

image: <file>

Response 201:
{
  "id": "uuid",
  "userId": "uuid",
  "imageUrl": "/uploads/uuid-timestamp.jpg",
  "status": "processing",
  "createdAt": "2024-01-20T10:00:00.000Z"
}
```

### List Bills
```http
GET /bills?page=1&limit=20&status=completed
Authorization: Bearer {token}

Response 200:
{
  "items": [
    {
      "id": "uuid",
      "userId": "uuid",
      "imageUrl": "/uploads/uuid-timestamp.jpg",
      "ocrRawText": "Full OCR text...",
      "ocrConfidence": 87.5,
      "merchantName": "Circle K",
      "totalAmount": 125000,
      "billDate": "2024-01-20",
      "items": [
        {
          "name": "Coffee",
          "quantity": 2,
          "unitPrice": 50000,
          "totalPrice": 100000
        }
      ],
      "status": "completed",
      "ocrProvider": "google_vision",
      "billType": "supermarket",
      "taxAmount": 11364,
      "subtotal": 113636,
      "linkedTransactionId": "uuid",
      "createdAt": "2024-01-20T10:00:00.000Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 45
}
```

### Get Bill
```http
GET /bills/:id
Authorization: Bearer {token}

Response 200: Bill object (detailed)
```

### Update Bill
```http
PUT /bills/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "merchantName": "Corrected Merchant",
  "totalAmount": 130000
}

Response 200: Updated Bill object
```

### Reprocess Bill
```http
POST /bills/:id/reprocess
Authorization: Bearer {token}

Response 200: Bill object with updated OCR
```

### Create Transaction from Bill
```http
POST /bills/:id/create-transaction
Authorization: Bearer {token}
Content-Type: application/json

{
  "accountId": "uuid",
  "categoryId": "uuid"
}

Response 201: Transaction object
```

### Set Bill Reminder
```http
POST /bills/:id/set-reminder
Authorization: Bearer {token}
Content-Type: application/json

{
  "remindAt": "2024-02-01T09:00:00.000Z"
}

Response 201:
{
  "id": "uuid",
  "billId": "uuid",
  "remindAt": "2024-02-01T09:00:00.000Z"
}
```

---

## Funds

### List Funds
```http
GET /funds
Authorization: Bearer {token}

Response 200:
[
  {
    "id": "uuid",
    "name": "Summer Vacation 2024",
    "description": "Family trip to Da Nang",
    "targetAmount": 20000000,
    "currentAmount": 15000000,
    "progress": 75,
    "coverImageUrl": "https://...",
    "ownerId": "uuid",
    "status": "active",
    "deadline": "2024-06-01",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### Get Fund Details
```http
GET /funds/:id
Authorization: Bearer {token}

Response 200:
{
  "id": "uuid",
  "name": "Summer Vacation 2024",
  "members": [
    {
      "userId": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "avatarUrl": "https://...",
      "role": "owner",
      "contribution": 8000000,
      "joinedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  ...
}
```

### Create Fund
```http
POST /funds
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Summer Vacation 2024",
  "description": "Family trip",
  "targetAmount": 20000000,
  "coverImageUrl": "https://...",
  "deadline": "2024-06-01"
}

Response 201: Fund object
```

### Contribute to Fund
```http
POST /funds/:id/contribute
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 1000000,
  "note": "Monthly contribution"
}

Response 201:
{
  "id": "uuid",
  "fundId": "uuid",
  "userId": "uuid",
  "amount": 1000000,
  "type": "deposit",
  "note": "Monthly contribution",
  "createdAt": "2024-01-20T10:00:00.000Z"
}
```

### Invite Member
```http
POST /funds/:id/invite
Authorization: Bearer {token}
Content-Type: application/json

{
  "email": "friend@example.com"
}

Response 201: FundMember object
```

### Export Fund
```http
GET /funds/:id/export?format=csv
Authorization: Bearer {token}

Response 200: CSV file download
```

---

## Notifications

### List Notifications
```http
GET /notifications?page=1&limit=20&unreadOnly=true
Authorization: Bearer {token}

Response 200:
{
  "items": [
    {
      "id": "uuid",
      "userId": "uuid",
      "type": "budget_warning",
      "title": "Budget Warning: Food & Dining",
      "body": "You've spent 85% of your budget",
      "data": {
        "budgetId": "uuid"
      },
      "isRead": false,
      "createdAt": "2024-01-20T10:00:00.000Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 12
}
```

### Get Notification Summary
```http
GET /notifications/summary
Authorization: Bearer {token}

Response 200:
{
  "unreadCount": 5,
  "recent": [...5 most recent notifications]
}
```

### Mark as Read
```http
PUT /notifications/:id/read
Authorization: Bearer {token}

Response 200: Updated Notification object
```

### Register Device (FCM)
```http
POST /notifications/devices
Authorization: Bearer {token}
Content-Type: application/json

{
  "fcmToken": "firebase-token-here",
  "platform": "android",
  "deviceName": "Pixel 6",
  "appVersion": "1.0.0"
}

Response 200:
{
  "success": true
}
```

---

## Reports

### Generate Report
```http
POST /reports/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "type": "monthly",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31"
}

Response 201:
{
  "id": "uuid",
  "type": "monthly",
  "status": "generating",
  "createdAt": "2024-02-01T00:00:00.000Z"
}
```

### Get Monthly Report
```http
GET /reports/monthly/2024/1
Authorization: Bearer {token}

Response 200:
{
  "totalIncome": 15000000,
  "totalExpense": 12000000,
  "netSavings": 3000000,
  "savingsRate": 20,
  "topExpenseCategories": [
    {
      "categoryName": "Food & Dining",
      "amount": 3500000,
      "percentage": 29.2
    }
  ],
  "transactionCount": 156
}
```

### Get Trends
```http
GET /reports/trends?months=6
Authorization: Bearer {token}

Response 200:
[
  {
    "month": "2024-01",
    "income": 15000000,
    "expense": 12000000,
    "savings": 3000000
  }
]
```

---

## Admin

### List Users
```http
GET /admin/users?page=1&limit=50&search=john&status=active
Authorization: Bearer {admin-token}

Response 200:
{
  "items": [...User objects],
  "page": 1,
  "pageSize": 50,
  "total": 1250
}
```

### Get Dashboard Stats
```http
GET /admin/dashboard
Authorization: Bearer {admin-token}

Response 200:
{
  "totalUsers": 1250,
  "activeUsers": 1100,
  "totalTransactions": 45678,
  "totalBills": 8900,
  "ocrSuccessRate": 87.5
}
```

### Broadcast Notification
```http
POST /admin/notifications/broadcast
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "title": "System Maintenance",
  "body": "Scheduled maintenance on Feb 1",
  "data": {
    "type": "maintenance"
  }
}

Response 200:
{
  "sent": 1250
}
```

---

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

---

## Rate Limiting

- **Anonymous:** 100 requests/hour
- **Authenticated:** 1000 requests/hour
- **Admin:** 5000 requests/hour

---

## Pagination

All list endpoints support pagination:
```
?page=1&limit=20
```

Response format:
```json
{
  "items": [...],
  "page": 1,
  "pageSize": 20,
  "total": 150
}
```

---

## Date Formats

- **Date:** `YYYY-MM-DD` (e.g., `2024-01-20`)
- **DateTime:** ISO 8601 (e.g., `2024-01-20T10:30:00.000Z`)

---

## Currency

Default: `VND` (Vietnamese Dong)

---

## Webhook Integration

Bank webhooks are received at:
```
POST /integrations/banks/:bankCode/callback
```

Requires HMAC signature verification via `X-Bank-Signature` header.

---

*Last Updated: 2024-04-04*
