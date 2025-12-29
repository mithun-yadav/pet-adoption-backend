import swaggerUi from "swagger-ui-express";
import { Express } from "express";

// Basic OpenAPI spec; extend with paths/schemas as needed
const swaggerDocument: any = {
  openapi: "3.0.0",
  info: {
    title: "Pet Adoption API",
    version: "1.0.0",
    description: "API documentation for the Pet Adoption backend",
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
  security: [
    {
      bearerAuth: [],
    },
  ],
  paths: {
    // Auth
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
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
    // Pets
    "/api/pets": {
      get: {
        tags: ["Pets"],
        summary: "List pets with optional filters and pagination",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "limit", in: "query", schema: { type: "integer" } },
          { name: "species", in: "query", schema: { type: "string" } },
          { name: "breed", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "search", in: "query", schema: { type: "string" } },
        ],
        responses: {
          200: { description: "List of pets" },
        },
      },
      post: {
        tags: ["Pets"],
        summary: "Create a new pet (admin only)",
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
        summary: "Update a pet (admin only)",
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
        summary: "Delete a pet (admin only)",
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
        summary: "Update pet status (admin only)",
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
        summary: "Get all applications (admin only)",
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
        summary: "Create an adoption application (authenticated user)",
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
        summary: "Get applications for the current user",
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
        summary: "Delete an application (owner only)",
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
        summary: "Review an application (approve/reject) (admin only)",
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
