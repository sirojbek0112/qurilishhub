import { Router } from 'express';

const router = Router();

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'QurilishHub REST API',
    version: '1.0.0',
    description:
      'Uzbekistan Construction Ecosystem API covering Auth & RBAC, Marketplace, Services, Construction Projects, Smart Cost Estimates, Orders, Click/Payme/Uzum Sandbox Payments, Real-Time Chat, and Admin Moderation.',
  },
  servers: [{ url: '/api', description: 'Primary API Gateway' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
  paths: {
    '/auth/register': { post: { tags: ['Auth'], summary: 'Register user with role & region' } },
    '/auth/login': { post: { tags: ['Auth'], summary: 'Authenticate and receive JWT + Refresh token' } },
    '/auth/refresh': { post: { tags: ['Auth'], summary: 'Rotate refresh token and issue new access token' } },
    '/auth/me': { get: { tags: ['Auth'], security: [{ bearerAuth: [] }], summary: 'Get authenticated profile' } },
    '/products': {
      get: { tags: ['Marketplace'], summary: 'List/filter/sort building materials in UZS' },
      post: { tags: ['Marketplace'], security: [{ bearerAuth: [] }], summary: 'Create product (SELLER/ADMIN)' },
    },
    '/price-comparison': { get: { tags: ['Marketplace'], summary: 'Compare supplier prices across regions' } },
    '/services': {
      get: { tags: ['Services'], summary: 'List verified construction services' },
      post: { tags: ['Services'], security: [{ bearerAuth: [] }], summary: 'Publish service (CONTRACTOR/ARCHITECT/COMPANY)' },
    },
    '/companies': { get: { tags: ['Companies'], summary: 'List verified construction companies' } },
    '/architects': { get: { tags: ['Architects'], summary: 'List verified architects & studios' } },
    '/projects': {
      get: { tags: ['Projects'], summary: 'List public or user-scoped construction projects' },
      post: { tags: ['Projects'], security: [{ bearerAuth: [] }], summary: 'Create new construction project' },
    },
    '/projects/{id}/tasks': { post: { tags: ['Projects'], security: [{ bearerAuth: [] }], summary: 'Create project task' } },
    '/projects/{id}/expenses': { post: { tags: ['Projects'], security: [{ bearerAuth: [] }], summary: 'Record project expense in UZS' } },
    '/estimates/calculate': { post: { tags: ['Estimates'], summary: 'Calculate preliminary construction cost estimate in UZS' } },
    '/estimates/configs/{key}': { patch: { tags: ['Estimates'], security: [{ bearerAuth: [] }], summary: 'Update unit price / coefficient (ADMIN/COMPANY)' } },
    '/orders': {
      get: { tags: ['Orders'], security: [{ bearerAuth: [] }], summary: 'List customer or seller orders' },
      post: { tags: ['Orders'], security: [{ bearerAuth: [] }], summary: 'Place material order with atomic inventory deduction' },
    },
    '/payments/initiate': { post: { tags: ['Payments'], security: [{ bearerAuth: [] }], summary: 'Initiate Click/Payme/Uzum sandbox payment' } },
    '/payments/{id}/confirm-sandbox': { post: { tags: ['Payments'], security: [{ bearerAuth: [] }], summary: 'Confirm sandbox webhook with HMAC verification' } },
    '/conversations': { get: { tags: ['Chat'], security: [{ bearerAuth: [] }], summary: 'List real-time conversations with unread counts' } },
    '/admin/overview': { get: { tags: ['Admin'], security: [{ bearerAuth: [] }], summary: 'Platform analytics & role breakdown (ADMIN)' } },
    '/admin/audit-logs': { get: { tags: ['Admin'], security: [{ bearerAuth: [] }], summary: 'Security & administrative audit logs (ADMIN)' } },
  },
};

router.get('/openapi.json', (_req, res) => {
  res.json(openApiSpec);
});

router.get('/docs', (_req, res) => {
  res.type('html').send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>QurilishHub API Documentation</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 2rem auto; max-width: 960px; padding: 0 1rem; color: #0f172a; background: #f8fafc; }
    h1 { font-size: 1.75rem; margin-bottom: 0.25rem; }
    .endpoint { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.9rem 1.1rem; margin-bottom: 0.75rem; display: flex; justify-content: space-between; align-items: center; }
    code { background: #f1f5f9; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.875rem; }
    .method { font-weight: 700; color: #1e40af; margin-right: 0.75rem; }
  </style>
</head>
<body>
  <h1>QurilishHub OpenAPI 3.0 Documentation</h1>
  <p>OpenAPI JSON: <a href="/api/openapi.json">/api/openapi.json</a></p>
  <div id="routes"></div>
  <script>
    const spec = ${JSON.stringify(openApiSpec)};
    const container = document.getElementById('routes');
    Object.entries(spec.paths).forEach(([path, methods]) => {
      Object.entries(methods).forEach(([method, meta]) => {
        const el = document.createElement('div');
        el.className = 'endpoint';
        el.innerHTML = '<div><span class="method">' + method.toUpperCase() + '</span><code>/api' + path + '</code></div><span>' + (meta.summary || '') + '</span>';
        container.appendChild(el);
      });
    });
  </script>
</body>
</html>`);
});

export default router;
