# Pet Adoption Management System - Backend (TypeScript)

A comprehensive REST API for managing pet adoptions with role-based authentication, built with Node.js, Express, MongoDB, and TypeScript.

## 🚀 Features

### User Roles

- **Visitor**: Browse pets, search, filter
- **User**: Register, login, apply for adoption, track applications
- **Admin**: Full CRUD on pets, manage applications, approve/reject

### Core Functionality

- JWT-based authentication with role-based authorization
- Pet management with search, filters, and pagination
- Adoption application workflow
- Automatic pet status updates
- Full TypeScript type safety
- Input validation and error handling

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Yarn (package manager)
- TypeScript knowledge

## 🛠️ Installation

1. **Clone the repository**

```bash
git clone <your-repo-url>
cd pet-adoption-backend
```

2. **Install dependencies**

```bash
yarn install
```

3. **Set up environment variables**

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/pet-adoption
JWT_SECRET=your_secret_key_change_this
JWT_EXPIRE=7d
NODE_ENV=development
```

4. **Start MongoDB** (if running locally)

```bash
mongod
```

5. **Run the server**

```bash
# Development mode with auto-restart and TypeScript compilation
yarn dev

# Build TypeScript to JavaScript
yarn build

# Production mode (after build)
yarn start

# Watch mode (compile on changes)
yarn watch
```

Server will run on `http://localhost:5000`

## 📁 Project Structure

```
pet-adoption-backend/
├── src/
│   ├── types/
│   │   └── index.ts              # TypeScript interfaces & types
│   ├── config/
│   │   └── db.ts                 # Database connection
│   ├── models/
│   │   ├── User.ts               # User schema
│   │   ├── Pet.ts                # Pet schema
│   │   └── Application.ts        # Application schema
│   ├── middleware/
│   │   ├── auth.ts               # JWT authentication
│   │   └── roleCheck.ts          # Role authorization
│   ├── controllers/
│   │   ├── authController.ts     # Auth logic
│   │   ├── petController.ts      # Pet CRUD
│   │   └── applicationController.ts  # Application logic
│   ├── routes/
│   │   ├── authRoutes.ts         # Auth routes
│   │   ├── petRoutes.ts          # Pet routes
│   │   └── applicationRoutes.ts  # Application routes
│   ├── utils/
│   │   └── validators.ts         # Input validation
│   └── server.ts                 # App entry point
├── dist/                         # Compiled JavaScript (generated)
├── .env.example
├── .gitignore
├── tsconfig.json                 # TypeScript configuration
├── package.json
└── README.md
```

## 📘 TypeScript Types

The project includes comprehensive TypeScript types for all entities:

### Main Interfaces

- `IUser` - User document interface
- `IPet` - Pet document interface
- `IApplication` - Application document interface
- `AuthRequest` - Extended Express Request with user
- Various DTO types for request bodies

All types are defined in `src/types/index.ts` for easy importing:

```typescript
import { IUser, IPet, AuthRequest, CreatePetDTO } from "../types";
```

## 📚 API Documentation

### Base URL

```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register User

```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "1234567890",
  "address": "123 Main St"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "token": "jwt_token_here"
  }
}
```

#### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User

```http
GET /auth/me
Authorization: Bearer <token>
```

### Pet Endpoints

#### Get All Pets (Public)

```http
GET /pets?page=1&limit=10&species=dog&search=golden&status=available
```

**Query Parameters:**

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `species` - Filter: dog, cat, bird, rabbit, other
- `breed` - Filter by breed name
- `minAge`, `maxAge` - Age range filter
- `status` - available, pending, adopted
- `search` - Search by name or breed

**Response:**

```json
{
  "success": true,
  "count": 10,
  "total": 50,
  "page": 1,
  "pages": 5,
  "data": [...]
}
```

#### Get Single Pet

```http
GET /pets/:id
```

#### Create Pet (Admin Only)

```http
POST /pets
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Max",
  "species": "dog",
  "breed": "Golden Retriever",
  "age": 3,
  "gender": "male",
  "size": "large",
  "color": "Golden",
  "description": "Friendly and energetic",
  "photo": "https://example.com/photo.jpg",
  "vaccinated": true,
  "neutered": true
}
```

#### Update Pet (Admin Only)

```http
PUT /pets/:id
Authorization: Bearer <admin-token>
```

#### Delete Pet (Admin Only)

```http
DELETE /pets/:id
Authorization: Bearer <admin-token>
```

#### Update Pet Status (Admin Only)

```http
PATCH /pets/:id/status
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "available"
}
```

### Application Endpoints

#### Create Application (User)

```http
POST /applications
Authorization: Bearer <user-token>
Content-Type: application/json

{
  "petId": "pet_id_here",
  "reason": "I love dogs and have experience",
  "experience": "Had 2 dogs for 10 years",
  "livingSpace": "house",
  "hasOtherPets": false
}
```

#### Get My Applications (User)

```http
GET /applications/my-applications
Authorization: Bearer <user-token>
```

#### Get All Applications (Admin)

```http
GET /applications?page=1&limit=10&status=pending
Authorization: Bearer <admin-token>
```

#### Review Application (Admin)

```http
PATCH /applications/:id/review
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "approved",
  "adminNotes": "Great candidate"
}
```

## 🔐 Creating an Admin User

Update a user to admin role in MongoDB:

```javascript
// MongoDB shell
use pet-adoption

db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

Or create a TypeScript seeder script.

## 🔄 Workflow

1. **Register** → Get JWT token
2. **Browse pets** (public, no auth)
3. **User applies** → Pet status: `pending`
4. **Admin reviews** →
   - Approve → Pet: `adopted`, other apps rejected
   - Reject → Check pending apps, set `available` if none

## 🛡️ Type Safety Features

- Strict TypeScript configuration
- Interface definitions for all models
- Type-safe request/response handlers
- Validated DTOs for API inputs
- Custom AuthRequest type with user property

## 🧪 Testing with Postman

1. Import endpoints
2. Set environment variables:
   - `base_url`: http://localhost:5000/api
   - `token`: (set after login)
3. Use `{{token}}` in Authorization headers

## 🚀 Building for Production

```bash
# Compile TypeScript
yarn build

# Run compiled JavaScript
yarn start
```

The compiled files will be in the `dist/` directory.

## 📦 Key Dependencies

**Production:**

- `express` - Web framework
- `mongoose` - MongoDB ODM
- `jsonwebtoken` - JWT authentication
- `bcryptjs` - Password hashing
- `express-validator` - Input validation
- `cors` - CORS middleware
- `dotenv` - Environment variables

**Development:**

- `typescript` - TypeScript compiler
- `ts-node` - TypeScript execution
- `ts-node-dev` - Dev server with auto-restart
- `@types/*` - TypeScript type definitions

## 🐛 Error Responses

```json
{
  "success": false,
  "message": "Error description",
  "errors": []
}
```

## 🚀 Deployment

### Prepare for Deployment

1. Set `NODE_ENV=production`
2. Build TypeScript: `yarn build`
3. Upload `dist/` folder and `package.json`
4. Install production dependencies: `yarn install --production`
5. Run: `yarn start`

### Environment Variables (Production)

Required for deployment:

- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Strong secret key
- `JWT_EXPIRE` - Token expiration
- `NODE_ENV=production`
- `PORT` - Server port

## ✨ TypeScript Benefits

- **Type Safety** - Catch errors at compile time
- **Autocomplete** - Better IDE support
- **Documentation** - Self-documenting code
- **Refactoring** - Safe code changes
- **Maintainability** - Easier to understand

## 📝 Next Steps

1. Test all endpoints with Postman
2. Create admin user
3. Add database seeders (optional)
4. Build React frontend with TypeScript
5. Deploy to production

## 📄 License

MIT

---

**Happy Coding with TypeScript! 🐾**
