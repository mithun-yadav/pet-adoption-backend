# 🚀 Quick Reference Cheat Sheet

## File Locations

| What You Want | File Location |
|--------------|---------------|
| Start server | `src/server.ts` |
| Database connection | `src/config/db.ts` |
| User data structure | `src/models/User.ts` |
| Pet data structure | `src/models/Pet.ts` |
| Application data structure | `src/models/Application.ts` |
| Login/Register logic | `src/controllers/authController.ts` |
| Pet CRUD logic | `src/controllers/petController.ts` |
| Application logic | `src/controllers/applicationController.ts` |
| Authentication check | `src/middleware/auth.ts` |
| Role check (admin) | `src/middleware/roleCheck.ts` |
| Input validation | `src/utils/validators.ts` |
| TypeScript types | `src/types/index.ts` |
| API routes | `src/routes/*.ts` |

---

## Common Code Patterns

### 1. Create a New Route

```typescript
// In routes file (e.g., petRoutes.ts)
import { controllerFunction } from '../controllers/petController';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/roleCheck';

router.get('/endpoint', protect, controllerFunction);
router.post('/endpoint', protect, authorize('admin'), controllerFunction);
```

### 2. Create a Controller Function

```typescript
// In controllers file
export const myFunction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // 1. Get data from request
    const { field1, field2 } = req.body;
    const { id } = req.params;
    const user = req.user; // From protect middleware

    // 2. Validate/Check
    if (!field1) {
      res.status(400).json({ success: false, message: "Field required" });
      return;
    }

    // 3. Database operation
    const result = await Model.create({ field1, field2 });
    // or
    const result = await Model.findById(id);
    // or
    const result = await Model.find({ field: value });

    // 4. Send response
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
```

### 3. Add Field to Model

```typescript
// In models file
const schema = new Schema({
  // ... existing fields
  newField: {
    type: String,
    required: false, // or true
    default: 'defaultValue'
  }
});
```

### 4. Add Validation

```typescript
// In utils/validators.ts
export const myValidation = [
  body('field').notEmpty().withMessage('Field is required'),
  body('email').isEmail().withMessage('Invalid email')
];

// In routes file
router.post('/endpoint', myValidation, validate, controllerFunction);
```

### 5. Protect Route (Require Login)

```typescript
router.get('/endpoint', protect, controllerFunction);
```

### 6. Admin Only Route

```typescript
router.post('/endpoint', protect, authorize('admin'), controllerFunction);
```

### 7. Get Current User

```typescript
// In controller (after protect middleware)
const currentUser = req.user; // IUser type
const userId = req.user?._id;
const userRole = req.user?.role;
```

### 8. Database Queries

```typescript
// Find one
const user = await User.findOne({ email: 'test@example.com' });

// Find by ID
const pet = await Pet.findById(id);

// Find all with filter
const pets = await Pet.find({ species: 'dog' });

// Create
const user = await User.create({ name: 'John', email: 'john@example.com' });

// Update
await Pet.findByIdAndUpdate(id, { status: 'adopted' });

// Delete
await Pet.findByIdAndDelete(id);

// Count
const count = await Pet.countDocuments({ status: 'available' });
```

### 9. Pagination

```typescript
const page = parseInt(req.query.page || '1');
const limit = parseInt(req.query.limit || '10');
const skip = (page - 1) * limit;

const total = await Model.countDocuments(query);
const results = await Model.find(query).skip(skip).limit(limit);

res.json({
  success: true,
  data: results,
  page,
  total,
  pages: Math.ceil(total / limit)
});
```

### 10. Search with Regex

```typescript
const search = req.query.search;
const query: any = {};

if (search) {
  query.$or = [
    { name: new RegExp(search, 'i') },
    { breed: new RegExp(search, 'i') }
  ];
}

const results = await Pet.find(query);
```

---

## HTTP Status Codes

| Code | Meaning | When to Use |
|------|---------|-------------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST (new resource) |
| 400 | Bad Request | Invalid input, validation failed |
| 401 | Unauthorized | Not logged in, invalid token |
| 403 | Forbidden | Logged in but not authorized (wrong role) |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Unexpected error |

---

## Environment Variables (.env)

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/pet-adoption
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
NODE_ENV=development
```

---

## Common Commands

```bash
# Install dependencies
yarn install

# Run development server
yarn dev

# Build TypeScript
yarn build

# Run production server
yarn start

# Watch TypeScript files
yarn watch
```

---

## Request/Response Examples

### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### Protected Request
```http
GET /api/pets
Authorization: Bearer eyJhbGc...
```

### Create Pet (Admin)
```http
POST /api/pets
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Buddy",
  "species": "dog",
  "breed": "Golden Retriever",
  "age": 2,
  "gender": "male",
  "description": "Friendly dog"
}
```

---

## Debugging Checklist

- [ ] Check if route is correct
- [ ] Check if middleware is applied
- [ ] Check if token is sent in header
- [ ] Check if user exists in database
- [ ] Check if data format matches schema
- [ ] Check console for errors
- [ ] Check MongoDB Compass for data
- [ ] Add console.logs to trace execution

---

## TypeScript Quick Tips

```typescript
// Optional field
field?: string;

// Required field
field: string;

// Array
fields: string[];

// Object type
interface MyType {
  field: string;
}

// Extend interface
interface User extends Document {
  name: string;
}
```

---

## Common Errors & Solutions

| Error | Solution |
|-------|----------|
| `Cannot read property of undefined` | Check if object exists: `req.user?.role` |
| `Validation failed` | Check validator rules and request body |
| `Unauthorized` | Check if token is sent and valid |
| `MongoDB connection failed` | Check MONGODB_URI in .env |
| `Type error` | Check TypeScript types match |

---

## Quick Test Endpoints

```bash
# Health check
curl http://localhost:5000/

# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"123456"}'

# Get pets (public)
curl http://localhost:5000/api/pets
```

---

Keep this file open while coding! 📝

