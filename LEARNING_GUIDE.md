# 🎓 Complete Learning Guide: Pet Adoption Backend

This guide will help you understand every part of the codebase so you can work with it independently.

## 📚 Table of Contents

1. [Project Architecture Overview](#1-project-architecture-overview)
2. [Understanding the File Structure](#2-understanding-the-file-structure)
3. [Step-by-Step Code Walkthrough](#3-step-by-step-code-walkthrough)
4. [Data Flow: How Requests Work](#4-data-flow-how-requests-work)
5. [Key Concepts Explained](#5-key-concepts-explained)
6. [How to Modify & Extend](#6-how-to-modify--extend)
7. [Practice Exercises](#7-practice-exercises)

---

## 1. Project Architecture Overview

### What is This Project?

A **REST API** (backend server) for a pet adoption system built with:

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework (handles HTTP requests)
- **TypeScript** - Typed JavaScript (catches errors early)
- **MongoDB** - Database (stores data)
- **Mongoose** - MongoDB object modeling (makes database easier)

### Architecture Pattern: MVC (Model-View-Controller)

- **Models** (`/models`) - Database schemas (what data looks like)
- **Controllers** (`/controllers`) - Business logic (what happens)
- **Routes** (`/routes`) - URL endpoints (where requests go)
- **Middleware** (`/middleware`) - Functions that run before controllers

---

## 2. Understanding the File Structure

```
src/
├── server.ts              # 🚀 Entry point - starts the server
├── config/                 # ⚙️ Configuration files
│   ├── db.ts              # Database connection
│   └── swagger.ts         # API documentation
├── models/                 # 📊 Database schemas (data structure)
│   ├── User.ts            # User model (name, email, password, role)
│   ├── Pet.ts             # Pet model (name, species, breed, etc.)
│   └── Application.ts     # Application model (user applies for pet)
├── controllers/            # 🎮 Business logic (what each endpoint does)
│   ├── authController.ts  # Login, register, password reset
│   ├── petController.ts    # CRUD operations for pets
│   └── applicationController.ts # Handle adoption applications
├── routes/                 # 🛣️ URL routing (which URL calls which function)
│   ├── authRoutes.ts      # /api/auth/* endpoints
│   ├── petRoutes.ts       # /api/pets/* endpoints
│   └── applicationRoutes.ts # /api/applications/* endpoints
├── middleware/             # 🔒 Security & validation
│   ├── auth.ts            # JWT authentication (protect routes)
│   └── roleCheck.ts       # Role-based authorization (admin only)
├── types/                  # 📝 TypeScript type definitions
│   └── index.ts           # All interfaces and types
└── utils/                  # 🛠️ Helper functions
    └── validators.ts       # Input validation rules
```

---

## 3. Step-by-Step Code Walkthrough

### Step 1: Entry Point (`server.ts`)

**What it does:** Starts the Express server and connects everything.

```typescript
// 1. Import dependencies
import express from "express";
import connectDB from "./config/db";

// 2. Load environment variables (.env file)
dotenv.config();

// 3. Connect to MongoDB database
connectDB();

// 4. Create Express app
const app = express();

// 5. Middleware (runs on every request)
app.use(express.json()); // Parse JSON bodies
app.use(cors()); // Allow cross-origin requests

// 6. Mount routes (connect URLs to controllers)
app.use("/api/auth", authRoutes);
app.use("/api/pets", petRoutes);
app.use("/api/applications", applicationRoutes);

// 7. Start server
app.listen(5000);
```

**Key Learning:**

- This is where everything starts
- Routes are "mounted" - `/api/auth` + route path = full URL
- Middleware runs in order (top to bottom)

---

### Step 2: Database Connection (`config/db.ts`)

**What it does:** Connects to MongoDB using the connection string.

```typescript
mongoose.connect(process.env.MONGODB_URI);
```

**Key Learning:**

- Uses environment variable `MONGODB_URI` from `.env` file
- Mongoose is the library that talks to MongoDB

---

### Step 3: Models (`models/`)

**What they do:** Define the structure of data in the database.

#### Example: `User.ts`

```typescript
const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
});

// Pre-save hook: Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
```

**Key Learning:**

- Schema = blueprint for documents
- `pre('save')` = runs automatically before saving
- Methods like `matchPassword()` can be added to the model

**Practice:** Try adding a new field like `avatar` to the User model.

---

### Step 4: Routes (`routes/`)

**What they do:** Map URLs to controller functions.

#### Example: `authRoutes.ts`

```typescript
router.post("/register", registerValidation, validate, register);
//          URL path    Validation rules    Run validation  Controller function
```

**Request Flow:**

1. Request comes to `/api/auth/register`
2. `registerValidation` checks input format
3. `validate` runs validation
4. If valid → `register` controller runs
5. If invalid → returns error

**Key Learning:**

- Routes define the API endpoints
- Middleware runs before controllers
- Order matters!

---

### Step 5: Controllers (`controllers/`)

**What they do:** Contain the actual business logic.

#### Example: `authController.ts` - Register function

```typescript
export const register = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // 1. Get data from request body
    const { name, email, password } = req.body;

    // 2. Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400).json({ success: false, message: "User exists" });
      return;
    }

    // 3. Create new user
    const user = await User.create({ name, email, password });

    // 4. Generate JWT tokens
    const accessToken = generateAccessToken(user._id);

    // 5. Send response
    res.status(201).json({
      success: true,
      data: { user, accessToken },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

**Key Learning:**

- Controllers handle the logic
- `req` = incoming request data
- `res` = response to send back
- Always use try/catch for errors
- Status codes: 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 404 (Not Found), 500 (Server Error)

---

### Step 6: Middleware (`middleware/`)

**What they do:** Functions that run before controllers (security, validation).

#### Example: `auth.ts` - Protect middleware

```typescript
export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // 1. Get token from header
  const token = req.headers.authorization?.split(" ")[1];

  // 2. Check if token exists
  if (!token) {
    res.status(401).json({ message: "Not authorized" });
    return;
  }

  // 3. Verify token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // 4. Find user and attach to request
  req.user = await User.findById(decoded.id);

  // 5. Continue to next middleware/controller
  next();
};
```

**Key Learning:**

- Middleware runs between request and controller
- `next()` = continue to next function
- `req.user` = authenticated user (added by middleware)

#### Example: `roleCheck.ts` - Authorization

```typescript
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user?.role)) {
      res.status(403).json({ message: "Not authorized" });
      return;
    }
    next();
  };
};
```

**Usage:**

```typescript
router.post("/pets", protect, authorize("admin"), createPet);
//          URL    Auth required  Admin only   Controller
```

**Key Learning:**

- `protect` = user must be logged in
- `authorize('admin')` = user must be admin
- Can chain multiple middleware

---

### Step 7: Types (`types/index.ts`)

**What they do:** Define TypeScript types for type safety.

```typescript
export interface IUser extends Document {
  name: string;
  email: string;
  role: "user" | "admin";
  // ...
}
```

**Key Learning:**

- Types prevent errors (can't use wrong data types)
- Interfaces define object shapes
- `extends Document` = Mongoose document type

---

### Step 8: Validators (`utils/validators.ts`)

**What they do:** Validate input data before it reaches controllers.

```typescript
export const registerValidation = [
  body("email").isEmail().withMessage("Invalid email"),
  body("password").isLength({ min: 6 }).withMessage("Password too short"),
];
```

**Key Learning:**

- Validates before controller runs
- Returns errors if validation fails
- Uses `express-validator` library

---

## 4. Data Flow: How Requests Work

### Example: User Registers

```
1. Client sends POST request
   POST /api/auth/register
   Body: { "name": "John", "email": "john@example.com", "password": "123456" }

2. Express receives request
   ↓
3. Routes check: authRoutes.ts matches "/register"
   ↓
4. Middleware runs: registerValidation → validate
   ↓
5. Controller runs: register() in authController.ts
   ↓
6. Controller logic:
   - Check if user exists
   - Create user in database
   - Hash password (automatic via model hook)
   - Generate JWT token
   ↓
7. Response sent back
   Status: 201
   Body: { "success": true, "data": { "user": {...}, "accessToken": "..." } }
```

### Example: User Views Pets (Protected Route)

```
1. Client sends GET request
   GET /api/pets
   Headers: { "Authorization": "Bearer <token>" }

2. Express receives request
   ↓
3. Routes check: petRoutes.ts matches "/"
   ↓
4. Middleware runs: protect (checks token)
   - Extracts token from header
   - Verifies token
   - Finds user in database
   - Attaches user to req.user
   ↓
5. Controller runs: getPets() in petController.ts
   - Queries database for pets
   - Applies filters/search
   - Returns paginated results
   ↓
6. Response sent back
   Status: 200
   Body: { "success": true, "data": [...pets], "page": 1, "total": 50 }
```

---

## 5. Key Concepts Explained

### 5.1 JWT (JSON Web Tokens)

**What:** A secure way to identify users without storing sessions.

**How it works:**

1. User logs in → Server creates token with user ID
2. Client stores token → Sends with every request
3. Server verifies token → Knows who the user is

**In code:**

```typescript
// Generate token
const token = jwt.sign({ id: user._id }, SECRET, { expiresIn: "7d" });

// Verify token
const decoded = jwt.verify(token, SECRET); // Returns { id: "..." }
```

### 5.2 Password Hashing

**Why:** Never store passwords in plain text!

**How:**

- `bcrypt` hashes passwords (one-way encryption)
- Compare hashed password with input password
- Original password can't be recovered

**In code:**

```typescript
// Hash (when saving)
password = await bcrypt.hash(password, 10);

// Compare (when logging in)
const isMatch = await bcrypt.compare(inputPassword, hashedPassword);
```

### 5.3 Middleware Chain

**Order matters!**

```typescript
router.post(
  "/pets",
  protect, // 1. Check authentication
  authorize("admin"), // 2. Check role
  validate, // 3. Validate input
  createPet // 4. Run controller
);
```

If any middleware fails, it stops and returns error.

### 5.4 Async/Await

**Why:** Database operations are slow, don't block the server.

```typescript
// ❌ Bad (blocks server)
const user = User.findOne({ email }); // Waits, blocks everything

// ✅ Good (non-blocking)
const user = await User.findOne({ email }); // Waits, but doesn't block
```

### 5.5 Error Handling

**Always use try/catch:**

```typescript
try {
  // Risky code
  const user = await User.create(data);
} catch (error) {
  // Handle error
  res.status(500).json({ message: error.message });
}
```

---

## 6. How to Modify & Extend

### Adding a New Endpoint

**Step 1:** Add route in `routes/`

```typescript
router.get("/pets/featured", getFeaturedPets);
```

**Step 2:** Create controller in `controllers/`

```typescript
export const getFeaturedPets = async (req: Request, res: Response) => {
  const pets = await Pet.find({ featured: true });
  res.json({ success: true, data: pets });
};
```

**Step 3:** Import and use in route

```typescript
import { getFeaturedPets } from "../controllers/petController";
```

### Adding a New Field to Model

**Step 1:** Update schema in `models/`

```typescript
const petSchema = new Schema({
  // ... existing fields
  featured: { type: Boolean, default: false },
});
```

**Step 2:** Update TypeScript type in `types/index.ts`

```typescript
export interface IPet extends Document {
  // ... existing fields
  featured?: boolean;
}
```

**Step 3:** Update DTO if needed

```typescript
export interface CreatePetDTO {
  // ... existing fields
  featured?: boolean;
}
```

### Adding New Validation

**In `utils/validators.ts`:**

```typescript
export const createPetValidation = [
  body("name").notEmpty().withMessage("Name required"),
  body("featured").isBoolean().withMessage("Featured must be boolean"),
];
```

**Use in route:**

```typescript
router.post("/pets", createPetValidation, validate, createPet);
```

### Adding New Middleware

**Create file `middleware/logger.ts`:**

```typescript
export const logger = (req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path}`);
  next();
};
```

**Use in routes:**

```typescript
router.use(logger); // Runs on all routes
```

---

## 7. Practice Exercises

### Exercise 1: Add a "Favorite Pets" Feature

**Goal:** Allow users to favorite pets.

**Steps:**

1. Add `favorites: [String]` field to User model (array of pet IDs)
2. Create endpoint `POST /api/pets/:id/favorite`
3. Add controller to add/remove pet from favorites
4. Create endpoint `GET /api/users/favorites` to get favorite pets

### Exercise 2: Add Pet Categories

**Goal:** Add a category field to pets (e.g., "senior", "puppy", "special-needs").

**Steps:**

1. Add `category` field to Pet model
2. Update CreatePetDTO type
3. Add validation for category
4. Update getPets controller to filter by category

### Exercise 3: Add Email Notifications

**Goal:** Send email when application is approved.

**Steps:**

1. Install `nodemailer` package
2. Create email utility function
3. Call it in `reviewApplication` controller when status is "approved"

### Exercise 4: Add Pet Images Upload

**Goal:** Allow uploading pet photos.

**Steps:**

1. Install `multer` for file uploads
2. Create upload middleware
3. Add to create/update pet endpoints
4. Store file path in database

### Exercise 5: Add Search by Multiple Criteria

**Goal:** Allow searching pets by multiple fields at once.

**Steps:**

1. Update PetQuery interface
2. Modify getPets controller to handle multiple search terms
3. Use MongoDB `$or` operator

---

## 🎯 Learning Path

### Week 1: Understanding Basics

- [ ] Read through `server.ts` and understand entry point
- [ ] Study one model (User.ts) completely
- [ ] Trace one request from route → controller → database
- [ ] Understand JWT authentication flow

### Week 2: Controllers & Business Logic

- [ ] Study all controllers
- [ ] Understand error handling patterns
- [ ] Practice modifying existing controllers
- [ ] Add console.logs to trace execution

### Week 3: Database & Models

- [ ] Understand Mongoose schemas
- [ ] Study relationships (User → Applications → Pets)
- [ ] Practice creating new models
- [ ] Learn MongoDB query operators

### Week 4: Security & Middleware

- [ ] Understand JWT flow completely
- [ ] Study protect and authorize middleware
- [ ] Practice creating custom middleware
- [ ] Understand password hashing

### Week 5: Advanced Features

- [ ] Add new features (use exercises above)
- [ ] Refactor code
- [ ] Add tests
- [ ] Optimize database queries

---

## 🔍 Debugging Tips

### 1. Use Console Logs

```typescript
console.log("Request body:", req.body);
console.log("User:", req.user);
console.log("Query result:", pets);
```

### 2. Check Request Flow

- Is route matching? → Check route path
- Is middleware running? → Add logs in middleware
- Is controller running? → Add logs at start of controller
- Is database query working? → Check MongoDB Compass

### 3. Common Errors

**"Cannot read property of undefined"**

- Check if data exists before accessing
- Use optional chaining: `req.user?.role`

**"Validation failed"**

- Check validator rules
- Check request body format

**"Unauthorized"**

- Check if token is sent in header
- Check if token is valid (not expired)
- Check if user exists in database

---

## 📖 Additional Resources

### Essential Reading

- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [JWT.io](https://jwt.io/) - Understand JWT tokens

### Practice

- Modify existing endpoints
- Add new features
- Refactor code
- Write comments explaining your understanding

---

## ✅ Checklist: Do You Understand?

- [ ] I can explain what each folder does
- [ ] I understand how a request flows through the system
- [ ] I know how to add a new endpoint
- [ ] I understand JWT authentication
- [ ] I can modify existing code safely
- [ ] I know how to debug errors
- [ ] I can add new fields to models
- [ ] I understand middleware and how to use it

---

## 🚀 Next Steps

1. **Read the code** - Go through each file line by line
2. **Add comments** - Write your own comments explaining what each part does
3. **Make small changes** - Modify existing features to see what happens
4. **Build something new** - Use the exercises above
5. **Ask questions** - When stuck, trace through the code

**Remember:** Understanding comes from doing. Don't just read - modify, break, and fix the code!

---

Good luck! 🎉
