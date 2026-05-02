# EchoAPI Testing

EchoAPI Desktop can import the local smoke-test OpenAPI file:

```text
echoapi/pickle-power-sports-smoke.openapi.json
```

## Import Steps

1. Open EchoAPI Desktop.
2. Create or open a local workspace/project.
3. Choose Import.
4. Import `echoapi/pickle-power-sports-smoke.openapi.json`.
5. Turn `Add host to API paths` on during import, or set the request host to `http://localhost:3000` manually after import.
6. Run the imported smoke requests.

## Missing Host Error

If EchoAPI shows `Error: getaddrinfo ENOTFOUND healthz`, the request URL is missing the host. Change the request URL from:

```text
/healthz
```

to:

```text
http://localhost:3000/healthz
```

Do the same for other imported requests, or re-import with `Add host to API paths` enabled.

## Included Smoke Tests

The OpenAPI file contains public/local smoke tests for:

- `/`
- `/healthz`
- `/readyz`
- `/trpc/healthCheck`
- `/trpc`
- Product filters and product list
- Venue list and venue search
- Testimonials
- Paddle Finder recommendations

Authenticated and mutating flows are intentionally not included yet because they need a real Better Auth session cookie from the web app. Add those later once the frontend auth flow and seed data are in place.

EchoAPI is used here only for manual and smoke testing. Production frontend code should still use the typed tRPC client.
