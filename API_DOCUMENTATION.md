# Famtry Backend API Documentation

## Base URL
```
http://localhost:5001/api
```

## Endpoints

### User Endpoints

#### Create User
- **POST** `/api/users`
- **Body:**
  ```json
  {
    "name": "John Doe",
    "familyId": "optional-family-id"
  }
  ```
- **Response:** Created user object

#### Get User
- **GET** `/api/users/:id`
- **Response:** User object with populated family

#### Get User's Family
- **GET** `/api/users/:id/family`
- **Response:** Family object with populated members

---

### Family Endpoints

#### Create Family
- **POST** `/api/families`
- **Body:**
  ```json
  {
    "name": "Smith Family",
    "userId": "optional-user-id"
  }
  ```
- **Response:** Created family object

#### Get Family
- **GET** `/api/families/:id`
- **Response:** Family object with populated members

#### Join Family
- **POST** `/api/families/:id/join`
- **Body:**
  ```json
  {
    "userId": "user-id"
  }
  ```
- **Response:** Updated family object with new member

#### Get Family Members
- **GET** `/api/families/:id/members`
- **Response:** Array of family members

---

### Item Endpoints

#### Get All Items for a Family
- **GET** `/api/items/families/:familyId/items`
- **Response:** Array of items with populated owners and pendingOwners

#### Create Item
- **POST** `/api/items/families/:familyId/items`
- **Body:**
  ```json
  {
    "name": "Milk",
    "quantity": 2,
    "expirationDate": "2024-12-31T00:00:00.000Z",
    "ownerId": "user-id"
  }
  ```
- **Response:** Created item object
- **Note:** `expirationDate` is optional

#### Get Item
- **GET** `/api/items/:id`
- **Response:** Item object with populated owners, pendingOwners, and family

#### Update Item (Owners Only)
- **PUT** `/api/items/:id`
- **Body:**
  ```json
  {
    "quantity": 3,
    "expirationDate": "2024-12-31T00:00:00.000Z",
    "userId": "user-id"
  }
  ```
- **Response:** Updated item object
- **Note:** Only owners can update items

#### Delete Item (Owners Only)
- **DELETE** `/api/items/:id`
- **Body:**
  ```json
  {
    "userId": "user-id"
  }
  ```
- **Response:** Success message
- **Note:** Only owners can delete items

#### Request Ownership
- **POST** `/api/items/:id/request-ownership`
- **Body:**
  ```json
  {
    "userId": "user-id"
  }
  ```
- **Response:** Updated item object with user in pendingOwners

#### Approve Ownership Request
- **POST** `/api/items/:id/approve-ownership/:userId`
- **Body:**
  ```json
  {
    "approverId": "owner-user-id"
  }
  ```
- **Response:** Updated item object with user moved from pendingOwners to owners
- **Note:** Only existing owners can approve

#### Reject Ownership Request
- **POST** `/api/items/:id/reject-ownership/:userId`
- **Body:**
  ```json
  {
    "approverId": "owner-user-id"
  }
  ```
- **Response:** Updated item object with user removed from pendingOwners
- **Note:** Only existing owners can reject

#### Remove Self as Owner
- **DELETE** `/api/items/:id/remove-owner/:userId`
- **Response:** Updated item object or deletion message
- **Note:** If all owners remove themselves, the item is automatically deleted

---

## Business Rules

1. **One Family Per User:** A user can only belong to one family at a time
2. **Item Ownership:** Multiple users can own the same item
3. **Ownership Approval:** New owners must be approved by existing owners
4. **Equal Permissions:** All owners have equal permissions (update, delete)
5. **Auto-Delete:** If all owners remove themselves, the item is deleted
6. **Expiration Dates:** Optional, shared across all owners
7. **Family Scoping:** Items belong to exactly one family

---

## Error Responses

All errors follow this format:
```json
{
  "error": "Error message"
}
```

Common status codes:
- `400` - Bad Request (validation errors)
- `403` - Forbidden (permission denied)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error
