const { port } = require('../config/env');

const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'ResQ Kenya API',
    version: '1.0.0',
    description: 'Emergency reporting, dispatch, authority messaging, admin, and profile APIs.',
  },
  servers: [{ url: `http://localhost:${port}/api` }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Jane Doe' },
          email: { type: 'string', example: 'jane@example.com' },
          phone: { type: 'string', example: '+254700000001' },
          role: { type: 'string', example: 'user' },
          avatarUrl: { type: 'string', nullable: true, example: 'https://example.com/avatar.png' },
          organizationId: { type: 'integer', nullable: true, example: 2 },
          organizationName: { type: 'string', nullable: true, example: 'Kenya Police' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          user: { $ref: '#/components/schemas/User' },
        },
      },
      MessageResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Operation completed successfully.' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Validation failed.' },
          errors: { type: 'array', items: { type: 'string' } },
        },
      },
      Report: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 101 },
          title: { type: 'string', example: 'Road accident near CBD' },
          description: { type: 'string', example: 'Two vehicles involved.' },
          status: { type: 'string', example: 'open' },
          latitude: { type: 'number', example: -1.286389 },
          longitude: { type: 'number', example: 36.817223 },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      LoginBody: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', example: 'admin@resq.ke' },
          password: { type: 'string', example: 'Admin@123' },
        },
      },
      RegisterBody: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', example: 'Jane Doe' },
          email: { type: 'string', example: 'jane@example.com' },
          phone: { type: 'string', example: '+254700000001' },
          password: { type: 'string', example: 'Strong@123' },
        },
      },
      ProfileBody: {
        type: 'object',
        required: ['name', 'email'],
        properties: {
          name: { type: 'string', example: 'Jane Doe' },
          email: { type: 'string', example: 'jane@example.com' },
          phone: { type: 'string', example: '+254700000001' },
          avatarUrl: { type: 'string', example: 'https://example.com/avatar.png' },
        },
      },
      ChangePasswordBody: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string', example: 'Old@1234' },
          newPassword: { type: 'string', example: 'NewStrong@123' },
        },
      },
      CommentBody: {
        type: 'object',
        required: ['text'],
        properties: {
          text: { type: 'string', example: 'Please stay safe, help is on the way.' },
        },
      },
      AdminStatusBody: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', example: 'responding' },
          message: { type: 'string', example: 'Response team dispatched.' },
        },
      },
      ResetBody: {
        type: 'object',
        required: ['password'],
        properties: {
          password: { type: 'string', example: 'Admin@123' },
        },
      },
      CreateOrganizationBody: {
        type: 'object',
        required: ['name', 'contactEmail'],
        properties: {
          name: { type: 'string', example: 'Kenya Police' },
          contactEmail: { type: 'string', example: 'desk@police.go.ke' },
        },
      },
      DispatchBody: {
        type: 'object',
        required: ['organizationId'],
        properties: {
          organizationId: { type: 'string', example: 'all' },
          note: { type: 'string', example: 'Urgent intervention required.' },
        },
      },
      MessageBody: {
        type: 'object',
        required: ['text'],
        properties: {
          text: { type: 'string', example: 'Team has arrived at the location.' },
        },
      },
      DispatchStatusBody: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', example: 'responding' },
          message: { type: 'string', example: 'Case is now in progress.' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/health': { get: { tags: ['System'], summary: 'Health check', security: [] } },

    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register user',
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterBody' } } },
        },
        responses: {
          201: {
            description: 'Registered successfully',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
          },
          400: {
            description: 'Invalid input',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login user',
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginBody' } } },
        },
        responses: {
          200: {
            description: 'Login successful',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
          },
          401: {
            description: 'Invalid credentials',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user',
        responses: {
          200: {
            description: 'Current user profile',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } },
          },
        },
      },
    },
    '/auth/profile': {
      put: {
        tags: ['Auth'],
        summary: 'Update profile',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ProfileBody' } } },
        },
        responses: {
          200: {
            description: 'Profile updated',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } },
          },
        },
      },
    },
    '/auth/change-password': {
      put: {
        tags: ['Auth'],
        summary: 'Change password',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ChangePasswordBody' } } },
        },
        responses: {
          200: {
            description: 'Password changed',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } } },
          },
        },
      },
    },

    '/reports': {
      get: {
        tags: ['Reports'],
        summary: 'Get reports (supports nearby filters)',
        security: [],
        parameters: [
          { name: 'nearLat', in: 'query', schema: { type: 'number' } },
          { name: 'nearLng', in: 'query', schema: { type: 'number' } },
          { name: 'radiusKm', in: 'query', schema: { type: 'number', default: 1 } },
        ],
        responses: {
          200: {
            description: 'Reports list',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Report' } },
              },
            },
          },
        },
      },
      post: {
        tags: ['Reports'],
        summary: 'Create report with images (multipart/form-data)',
        security: [],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['title', 'description', 'latitude', 'longitude', 'images'],
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  category: { type: 'string' },
                  severity: { type: 'string' },
                  latitude: { type: 'number' },
                  longitude: { type: 'number' },
                  locationText: { type: 'string' },
                  anonymous: { type: 'boolean' },
                  contactPhone: { type: 'string' },
                  images: { type: 'array', items: { type: 'string', format: 'binary' } },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Report created',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Report' } } },
          },
        },
      },
    },
    '/reports/mine': { get: { tags: ['Reports'], summary: 'Get current user reports' } },
    '/reports/{id}': {
      get: {
        tags: ['Reports'],
        summary: 'Get report by id',
        security: [],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      },
    },
    '/reports/{id}/comments': {
      post: {
        tags: ['Reports'],
        summary: 'Add comment to report',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CommentBody' } } },
        },
      },
    },

    '/social/reports/{id}/like': {
      post: {
        tags: ['Social'],
        summary: 'Toggle report support/like',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      },
    },

    '/contacts': { get: { tags: ['Contacts'], summary: 'Get emergency contacts', security: [] } },

    '/admin/reports': { get: { tags: ['Admin'], summary: 'Get all reports' } },
    '/admin/reports/{id}/status': {
      patch: {
        tags: ['Admin'],
        summary: 'Update report status',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/AdminStatusBody' } } },
        },
      },
    },
    '/admin/reports/{id}': {
      delete: {
        tags: ['Admin'],
        summary: 'Delete report',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      },
    },
    '/admin/reports/{id}/dispatch': {
      post: {
        tags: ['Admin'],
        summary: 'Dispatch report to authority/all authorities',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/DispatchBody' } } },
        },
      },
    },
    '/admin/reset-all': {
      post: {
        tags: ['Admin'],
        summary: 'Reset all data except current admin (password required)',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ResetBody' } } },
        },
      },
    },

    '/admin/users': { get: { tags: ['Admin'], summary: 'List users' } },
    '/admin/users/{id}/promote': {
      post: {
        tags: ['Admin'],
        summary: 'Promote user to admin',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      },
    },
    '/admin/users/{id}/demote': {
      post: {
        tags: ['Admin'],
        summary: 'Demote admin to user',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      },
    },
    '/admin/users/{id}': {
      delete: {
        tags: ['Admin'],
        summary: 'Revoke user account',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      },
    },

    '/admin/organizations': {
      get: { tags: ['Admin'], summary: 'List organizations' },
      post: {
        tags: ['Admin'],
        summary: 'Create organization account + invite link',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateOrganizationBody' } } },
        },
      },
    },
    '/admin/dispatches': { get: { tags: ['Admin'], summary: 'List all dispatches' } },
    '/admin/logs': { get: { tags: ['Admin'], summary: 'List site logs' } },

    '/messages/invite/{token}': {
      get: {
        tags: ['Messages'],
        summary: 'Resolve authority invite token',
        security: [],
        parameters: [{ name: 'token', in: 'path', required: true, schema: { type: 'string' } }],
      },
    },
    '/messages/inbox': { get: { tags: ['Messages'], summary: 'Get current user inbox dispatches' } },
    '/messages/dispatches/{id}/messages': {
      get: {
        tags: ['Messages'],
        summary: 'Get conversation for dispatch',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      },
      post: {
        tags: ['Messages'],
        summary: 'Send message in dispatch conversation',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/MessageBody' } } },
        },
      },
    },
    '/messages/dispatches/{id}/status': {
      patch: {
        tags: ['Messages'],
        summary: 'Update dispatch/report progress',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/DispatchStatusBody' } } },
        },
      },
    },
  },
};

module.exports = { openApiSpec };
