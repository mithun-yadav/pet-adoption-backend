import swaggerUi from "swagger-ui-express";
import { Express } from "express";

// Basic OpenAPI spec; extend with paths/schemas as needed
const swaggerDocument: any = {
  openapi: "3.0.0",
  info: {
    title: "Pet Adoption API",
    version: "1.0.0",
    description: `API documentation for the Pet Adoption backend.

## User Types & Access Levels:

### 👤 Visitor (Public - No Authentication Required)
- View list of available pets
- Search pets by name or breed
- Filter pets by species, breed, and age
- View pet details
- Pagination on pet list

### 🔐 User (Authenticated)
- Register/Login
- Apply to adopt available pets
- View own adoption applications and statuses
- Change password

### 👑 Admin (Admin Role Required)
- Add/Edit/Delete pets
- View all adoption applications
- Approve or reject applications
- Update pet status automatically or manually`,
  },
  servers: [
    {
      url: "http://localhost:5000",
      description: "Local server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  paths: {
    // Auth
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
        description:
          "**User Feature** - Public endpoint. Register a new user account. Default role is 'user'.",
        security: [], // Public endpoint
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 6 },
                  phone: { type: "string" },
                  address: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "User registered successfully" },
          400: { description: "User already exists or validation error" },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login user",
        description:
          "**User Feature** - Public endpoint. Login with email and password. Returns access token and refresh token.",
        security: [], // Public endpoint
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Login successful" },
          401: { description: "Invalid credentials" },
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get current logged-in user",
        description:
          "**User/Admin Feature** - Requires authentication. Returns the currently logged-in user's details.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Current user details" },
          401: { description: "Not authorized" },
        },
      },
    },
    "/api/auth/refresh-token": {
      post: {
        tags: ["Auth"],
        summary: "Refresh access token",
        description:
          "**User/Admin Feature** - Public endpoint. Refresh an expired access token using a valid refresh token.",
        security: [], // Public endpoint
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["refreshToken"],
                properties: {
                  refreshToken: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "New access token issued" },
          400: { description: "Missing refresh token" },
          401: { description: "Invalid or expired refresh token" },
        },
      },
    },
    "/api/auth/forgot-password": {
      post: {
        tags: ["Auth"],
        summary: "Request password reset token",
        description:
          "Generates a password reset token for the user. Works for both regular users and admins. The token is returned in the response (in production, this should be sent via email).",
        security: [], // Public endpoint
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                    description: "User's email address",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Password reset token generated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    data: {
                      type: "object",
                      properties: {
                        resetToken: {
                          type: "string",
                          description:
                            "Reset token to use in reset-password endpoint",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          404: { description: "No user found with that email" },
          500: { description: "Server error" },
        },
      },
    },
    "/api/auth/reset-password/{token}": {
      post: {
        tags: ["Auth"],
        summary: "Reset password using reset token",
        description:
          "Resets the user's password using the token received from forgot-password. Works for both regular users and admins. Token expires after 1 hour.",
        security: [], // Public endpoint
        parameters: [
          {
            name: "token",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Reset token received from forgot-password endpoint",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["password"],
                properties: {
                  password: {
                    type: "string",
                    minLength: 6,
                    description: "New password (minimum 6 characters)",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Password reset successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          400: {
            description: "Invalid or expired password reset token",
          },
          500: { description: "Server error" },
        },
      },
    },
    "/api/auth/change-password": {
      post: {
        tags: ["Auth"],
        summary: "Change password (authenticated users)",
        description:
          "Allows logged-in users (including admins) to change their own password by providing their current password.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["currentPassword", "newPassword"],
                properties: {
                  currentPassword: {
                    type: "string",
                    description: "User's current password",
                  },
                  newPassword: {
                    type: "string",
                    minLength: 6,
                    description: "New password (minimum 6 characters)",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Password changed successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          400: {
            description: "Current password is incorrect",
          },
          401: {
            description: "Not authorized - authentication required",
          },
          404: { description: "User not found" },
          500: { description: "Server error" },
        },
      },
    },
    // Pets
    "/api/pets": {
      get: {
        tags: ["Pets"],
        summary: "List pets with optional filters and pagination",
        description:
          "**Visitor Feature** - Public endpoint. View list of available pets with search, filter, and pagination capabilities. Supports filtering by species, breed, age range, and status. Search by name or breed.",
        security: [], // Public endpoint
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer" },
            description: "Page number for pagination",
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer" },
            description: "Number of items per page",
          },
          {
            name: "species",
            in: "query",
            schema: { type: "string" },
            description: "Filter by species (dog, cat, bird, rabbit, other)",
          },
          {
            name: "breed",
            in: "query",
            schema: { type: "string" },
            description: "Filter by breed",
          },
          {
            name: "minAge",
            in: "query",
            schema: { type: "integer" },
            description: "Minimum age filter",
          },
          {
            name: "maxAge",
            in: "query",
            schema: { type: "integer" },
            description: "Maximum age filter",
          },
          {
            name: "status",
            in: "query",
            schema: { type: "string" },
            description:
              "Filter by status (available, pending, adopted). Defaults to 'available'",
          },
          {
            name: "search",
            in: "query",
            schema: { type: "string" },
            description: "Search pets by name or breed",
          },
        ],
        responses: {
          200: { description: "List of pets" },
        },
      },
      post: {
        tags: ["Pets"],
        summary: "Create a new pet",
        description:
          "**Admin Feature** - Requires admin role. Add a new pet to the adoption system.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: [
                  "name",
                  "species",
                  "breed",
                  "age",
                  "gender",
                  "description",
                ],
                properties: {
                  name: { type: "string" },
                  species: { type: "string" },
                  breed: { type: "string" },
                  age: { type: "number" },
                  gender: { type: "string" },
                  size: { type: "string" },
                  color: { type: "string" },
                  description: { type: "string" },
                  photo: { type: "string" },
                  vaccinated: { type: "boolean" },
                  neutered: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Pet created" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden (admin only)" },
        },
      },
    },
    "/api/pets/{id}": {
      get: {
        tags: ["Pets"],
        summary: "Get a single pet by ID",
        description:
          "**Visitor Feature** - Public endpoint. View detailed information about a specific pet.",
        security: [], // Public endpoint
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Pet found" },
          404: { description: "Pet not found" },
        },
      },
      put: {
        tags: ["Pets"],
        summary: "Update a pet",
        description:
          "**Admin Feature** - Requires admin role. Edit pet information.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object" },
            },
          },
        },
        responses: {
          200: { description: "Pet updated" },
          404: { description: "Pet not found" },
        },
      },
      delete: {
        tags: ["Pets"],
        summary: "Delete a pet",
        description:
          "**Admin Feature** - Requires admin role. Remove a pet from the system.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Pet deleted" },
          404: { description: "Pet not found" },
        },
      },
    },
    "/api/pets/{id}/status": {
      patch: {
        tags: ["Pets"],
        summary: "Update pet status",
        description:
          "**Admin Feature** - Requires admin role. Manually update pet status (available, pending, adopted).",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Pet status updated" },
          404: { description: "Pet not found" },
        },
      },
    },
    // Applications
    "/api/applications": {
      get: {
        tags: ["Applications"],
        summary: "Get all applications",
        description:
          "**Admin Feature** - Requires admin role. View all adoption applications with pagination and status filtering.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "limit", in: "query", schema: { type: "integer" } },
          { name: "status", in: "query", schema: { type: "string" } },
        ],
        responses: {
          200: { description: "List of applications" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden (admin only)" },
        },
      },
      post: {
        tags: ["Applications"],
        summary: "Create an adoption application",
        description:
          "**User Feature** - Requires authentication. Apply to adopt an available pet. The pet status will automatically change to 'pending'.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: [
                  "petId",
                  "reason",
                  "experience",
                  "livingSpace",
                  "hasOtherPets",
                ],
                properties: {
                  petId: { type: "string" },
                  reason: { type: "string" },
                  experience: { type: "string" },
                  livingSpace: { type: "string" },
                  hasOtherPets: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Application created" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/api/applications/my-applications": {
      get: {
        tags: ["Applications"],
        summary: "Get my applications",
        description:
          "**User Feature** - Requires authentication. View all adoption applications submitted by the current user and their statuses.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "List of user's applications" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/api/applications/{id}": {
      get: {
        tags: ["Applications"],
        summary: "Get a single application by ID",
        description:
          "**User/Admin Feature** - Requires authentication. Users can view their own applications. Admins can view any application.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Application details" },
          404: { description: "Application not found" },
        },
      },
      delete: {
        tags: ["Applications"],
        summary: "Delete an application",
        description:
          "**User Feature** - Requires authentication. Users can delete their own pending applications only. If deleted, pet status may revert to 'available' if no other pending applications exist.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Application deleted" },
          403: { description: "Forbidden" },
          404: { description: "Application not found" },
        },
      },
    },
    "/api/applications/{id}/review": {
      patch: {
        tags: ["Applications"],
        summary: "Review an application (approve/reject)",
        description:
          "**Admin Feature** - Requires admin role. Approve or reject an adoption application. When approved, the pet status automatically changes to 'adopted' and all other pending applications for that pet are rejected.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: { type: "string" },
                  adminNotes: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Application reviewed" },
          400: { description: "Invalid status or already reviewed" },
          404: { description: "Application not found" },
        },
      },
    },
  },
};

export const setupSwagger = (app: Express): void => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};
