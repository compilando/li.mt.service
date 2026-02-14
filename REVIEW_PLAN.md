# 📋 Plan de Mejoras - Limt (li.mt.service)

**Fecha:** 14/02/2026  
**Autor:** Code Review  
**Objetivo:** Preparar el proyecto para compartir con el equipo con mejoras de seguridad, clean code, testing y mantenibilidad.

---

## 🎯 Resumen Ejecutivo

Este documento contiene un plan detallado para implementar 25 mejoras identificadas en la revisión de código del proyecto Limt. Las mejoras están priorizadas en 3 categorías:

- **🔴 CRÍTICO** (8 items) - Seguridad y bugs que deben arreglarse ANTES de producción
- **🟡 IMPORTANTE** (12 items) - Clean code y mantenibilidad que mejoran significativamente el proyecto
- **🟢 OPCIONAL** (5 items) - Nice-to-have que pueden hacerse después

**Tiempo estimado total:** 16-20 horas de trabajo

---

## 📊 Priorización

### Fase 1: Seguridad (🔴 Crítico) - 6-8 horas
1. Headers de seguridad
2. Auth guards consolidados
3. Validación de authorization en analytics
4. Rate limiting básico
5. Validación de redirects

### Fase 2: Clean Code (🟡 Importante) - 6-8 horas
6. Refactorizar componentes duplicados
7. Estandarizar ActionResult pattern
8. Eliminar `any` types
9. Consolidar generación de short codes

### Fase 3: Testing (🟡 Importante) - 4-6 horas
10. Tests para routing engine
11. Tests para analytics
12. Tests para redirect route

---

## 🔴 FASE 1: SEGURIDAD CRÍTICA

### 1.1 ✅ Añadir Headers de Seguridad

**Archivo:** `middleware.ts`

**Problema:** Faltan headers críticos de seguridad (CSP, HSTS, Permissions-Policy).

**Solución:**
```typescript
// middleware.ts - DESPUÉS de la línea 30
response.headers.set(
  "Content-Security-Policy",
  "default-src 'self'; " +
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
  "style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' data: https:; " +
  "font-src 'self' data:; " +
  "connect-src 'self'; " +
  "frame-ancestors 'none';"
);

if (process.env.NODE_ENV === "production") {
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );
}

response.headers.set(
  "Permissions-Policy",
  "camera=(), microphone=(), geolocation=(), interest-cohort=()"
);
```

**Tests:**
- Verificar que los headers aparecen en las respuestas HTTP
- Verificar que CSP no rompe la funcionalidad actual

**Tiempo estimado:** 30 min

---

### 1.2 ✅ Consolidar Auth Guards en Módulo Compartido

**Problema:** `requireAuth()` y `requireOrgMembership()` están duplicados en 5 archivos.

**Archivos afectados:**
- `lib/actions/links.ts`
- `lib/actions/teams.ts`
- `lib/actions/analytics.ts`
- `lib/actions/routing.ts`
- `lib/actions/tags.ts`

**Solución:**

**Paso 1:** Crear nuevo archivo `lib/auth-guards.ts`:
```typescript
"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/user";
import { UnauthorizedError, ForbiddenError, NotFoundError } from "@/lib/errors";

/**
 * Require authenticated user session
 * @throws {UnauthorizedError} if no session exists
 */
export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) {
    throw new UnauthorizedError();
  }
  return session;
}

/**
 * Require user to be a member of an organization
 * @throws {ForbiddenError} if user is not a member
 */
export async function requireOrgMembership(organizationId: string, userId: string) {
  const member = await prisma.member.findFirst({
    where: { organizationId, userId },
  });
  if (!member) {
    throw new ForbiddenError("You are not a member of this organization");
  }
  return member;
}

/**
 * Require user to have specific role(s) in an organization
 * @throws {ForbiddenError} if user doesn't have required role
 */
export async function requireOrgRole(
  organizationId: string,
  userId: string,
  allowedRoles: string[]
) {
  const member = await requireOrgMembership(organizationId, userId);
  if (!allowedRoles.includes(member.role)) {
    throw new ForbiddenError(
      `Only ${allowedRoles.join(" or ")} can perform this action`
    );
  }
  return member;
}

/**
 * Require user to own a specific link
 * @throws {NotFoundError} if link doesn't exist
 * @throws {ForbiddenError} if user doesn't own the link
 */
export async function requireLinkOwnership(linkId: string, userId: string) {
  const link = await prisma.link.findUnique({
    where: { id: linkId },
    include: { organization: { include: { members: true } } },
  });
  if (!link) {
    throw new NotFoundError("Link");
  }
  const isMember = link.organization.members.some((m) => m.userId === userId);
  if (!isMember) {
    throw new ForbiddenError();
  }
  return link;
}
```

**Paso 2:** Reemplazar en cada archivo de actions:

```typescript
// ANTES
async function requireAuth() { ... }
async function requireOrgMembership() { ... }

// DESPUÉS
import { requireAuth, requireOrgMembership, requireLinkOwnership } from "@/lib/auth-guards";
```

**Tests necesarios:** Crear `__tests__/lib/auth-guards.test.ts`
```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { requireAuth, requireOrgMembership, requireLinkOwnership } from "@/lib/auth-guards";
import { mockAuthenticated, mockUnauthenticated, resetAllMocks } from "../helpers";

describe("Auth Guards", () => {
  beforeEach(() => {
    resetAllMocks();
  });

  describe("requireAuth", () => {
    it("returns session when authenticated", async () => {
      const session = mockAuthenticated();
      const result = await requireAuth();
      expect(result).toEqual(session);
    });

    it("throws UnauthorizedError when not authenticated", async () => {
      mockUnauthenticated();
      await expect(requireAuth()).rejects.toThrow("signed in");
    });
  });

  // ... más tests
});
```

**Tiempo estimado:** 2 horas

---

### 1.3 ✅ Validar Authorization en Analytics

**Problema:** `getLinkAnalytics()` y `getOrganizationAnalytics()` no verifican que el usuario sea miembro de la organización del link.

**Archivo:** `lib/actions/analytics.ts`

**Solución:**
```typescript
// lib/actions/analytics.ts
import { requireAuth, requireOrgMembership } from "@/lib/auth-guards";

export async function getLinkAnalytics(linkId: string, days: number = 30) {
  const session = await requireAuth();

  // NUEVO: Verificar que el link pertenece a una org del usuario
  const link = await prisma.link.findUnique({
    where: { id: linkId },
    select: { organizationId: true },
  });

  if (!link) {
    throw new NotFoundError("Link");
  }

  await requireOrgMembership(link.organizationId, session.user.id);

  // ... resto del código existente
}

export async function getOrganizationAnalytics(organizationId: string, days: number = 30) {
  const session = await requireAuth();
  
  // NUEVO: Verificar membership
  await requireOrgMembership(organizationId, session.user.id);

  // ... resto del código existente
}
```

**Tests:** Añadir a `__tests__/lib/actions/analytics.test.ts` (nuevo archivo):
```typescript
it("requires link ownership for getLinkAnalytics", async () => {
  mockAuthenticated({ id: "user-2" }); // Different user
  const mockLink = createMockLink({ organizationId: "org-1" });
  vi.mocked(prisma.link.findUnique).mockResolvedValue(mockLink as never);
  mockOrgMembership(false); // Not a member

  await expect(getLinkAnalytics("link-1")).rejects.toThrow("not a member");
});
```

**Tiempo estimado:** 1 hora

---

### 1.4 ✅ Añadir Rate Limiting Básico

**Problema:** Sin rate limiting, las rutas son vulnerables a abuse.

**Solución:** Usar `@upstash/ratelimit` con Vercel KV o implementación simple en memoria para desarrollo.

**Paso 1:** Instalar dependencia:
```bash
pnpm add @upstash/ratelimit @upstash/redis
```

**Paso 2:** Crear `lib/rate-limit.ts`:
```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// En desarrollo, usar Map en memoria
// En producción, usar Upstash Redis
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// Rate limiters
export const redirectRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 requests per minute
    })
  : null;

export const apiRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, "1 m"), // 30 requests per minute
    })
  : null;

export const passwordVerifyRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 m"), // 5 attempts per minute
    })
  : null;
```

**Paso 3:** Aplicar en redirect route:
```typescript
// app/r/[shortCode]/route.ts
import { redirectRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest, ...) {
  // Rate limiting
  if (redirectRateLimit) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const { success } = await redirectRateLimit.limit(ip);
    if (!success) {
      return new NextResponse("Too many requests", { status: 429 });
    }
  }

  // ... resto del código
}
```

**Paso 4:** Aplicar en password verify:
```typescript
// lib/actions/links.ts - verifyLinkPassword
import { passwordVerifyRateLimit } from "@/lib/rate-limit";

export async function verifyLinkPassword(...) {
  // Rate limiting
  if (passwordVerifyRateLimit) {
    const { success } = await passwordVerifyRateLimit.limit(shortCode);
    if (!success) {
      return { success: false, error: "Too many attempts. Please try again later." };
    }
  }

  // ... resto del código
}
```

**Tiempo estimado:** 2 horas

---

### 1.5 ✅ Validar URLs en Redirect

**Problema:** Potencial open redirect si alguien guarda URLs maliciosas.

**Archivo:** `app/r/[shortCode]/route.ts`

**Solución:**
```typescript
// app/r/[shortCode]/route.ts
export async function GET(...) {
  // ... código existente hasta obtener finalDestinationUrl

  // NUEVO: Validar que la URL es segura antes de redirigir
  try {
    const url = new URL(finalDestinationUrl);
    const allowedProtocols = ['http:', 'https:'];
    
    if (!allowedProtocols.includes(url.protocol)) {
      console.error(`Blocked redirect to invalid protocol: ${url.protocol}`);
      return NextResponse.redirect(new URL("/", request.url));
    }
  } catch (error) {
    console.error(`Invalid redirect URL: ${finalDestinationUrl}`);
    return NextResponse.redirect(new URL("/", request.url));
  }

  // ... resto del código
}
```

**Tests:** Añadir a `__tests__/app/r/redirect.test.ts` (nuevo):
```typescript
it("blocks javascript: protocol redirects", async () => {
  const maliciousLink = createMockLink({ url: "javascript:alert(1)" });
  vi.mocked(prisma.link.findUnique).mockResolvedValue(maliciousLink as never);

  const response = await GET(mockRequest, { params: { shortCode: "test" } });
  
  expect(response.status).toBe(307);
  expect(response.headers.get("Location")).not.toContain("javascript:");
});
```

**Tiempo estimado:** 1 hora

---

## 🟡 FASE 2: CLEAN CODE

### 2.1 ✅ Refactorizar Link Create/Edit en Componente Compartido

**Problema:** `link-create.tsx` (500 líneas) y `link-edit.tsx` (500 líneas) tienen ~80% código duplicado.

**Solución:** Extraer lógica común en un componente `LinkForm`.

**Estrategia:**
1. Crear `components/dashboard/link-form.tsx` con toda la lógica del formulario
2. `link-create.tsx` y `link-edit.tsx` se convierten en wrappers que pasan props

**Archivo nuevo:** `components/dashboard/link-form.tsx`

```typescript
"use client";

interface LinkFormProps {
  mode: "create" | "edit";
  organizationId: string;
  initialData?: {
    id?: string;
    url?: string;
    shortCode?: string;
    title?: string;
    // ... todos los campos
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function LinkForm({ mode, organizationId, initialData, onSuccess, onCancel }: LinkFormProps) {
  // Toda la lógica del formulario aquí
  // ...
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === "create") {
      const result = await createLink({ /* ... */ });
      // ...
    } else {
      const result = await updateLink({ /* ... */ });
      // ...
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Todo el JSX del formulario */}
    </form>
  );
}
```

**Archivos simplificados:**

```typescript
// components/dashboard/link-create.tsx
import { LinkForm } from "./link-form";

export default function LinkCreate({ organizationId, children, onSuccess }: LinkCreateProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <LinkForm
          mode="create"
          organizationId={organizationId}
          onSuccess={() => {
            setOpen(false);
            onSuccess?.();
          }}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
```

```typescript
// components/dashboard/link-edit.tsx
import { LinkForm } from "./link-form";

export function LinkEdit({ link, organizationId, open, onOpenChange, onSuccess }: LinkEditProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <LinkForm
          mode="edit"
          organizationId={organizationId}
          initialData={link}
          onSuccess={() => {
            onOpenChange(false);
            onSuccess?.();
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
```

**Tiempo estimado:** 3-4 horas

---

### 2.2 ✅ Estandarizar ActionResult en TODAS las Server Actions

**Problema:** `getLinks()`, `getLinkById()`, `getTagsByOrganization()`, etc. no retornan `ActionResult<T>`.

**Archivos afectados:**
- `lib/actions/links.ts`
- `lib/actions/tags.ts`
- `lib/actions/analytics.ts`
- `lib/actions/routing.ts`

**Solución:** Envolver todas las funciones GET en el patrón ActionResult.

**Ejemplo:**
```typescript
// ANTES
export async function getLinks(input: ListLinksInput) {
  const session = await requireAuth();
  // ...
  return { links, pagination };
}

// DESPUÉS
export async function getLinks(input: ListLinksInput): Promise<ActionResult<{
  links: Link[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}>> {
  try {
    const session = await requireAuth();
    await requireOrgMembership(input.organizationId, session.user.id);
    
    // ... código existente
    
    return { 
      success: true, 
      data: { links, pagination } 
    };
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return { success: false, error: error.message, code: error.code };
    }
    console.error("Error getting links:", error);
    return { success: false, error: "Failed to get links" };
  }
}
```

**Actualizar en componentes:**
```typescript
// app/app/links/content.tsx - ANTES
const result = await getLinks({ ... });
setLinks(result.links);

// DESPUÉS
const result = await getLinks({ ... });
if (result.success) {
  setLinks(result.data.links);
} else {
  console.error(result.error);
}
```

**Tiempo estimado:** 2 horas

---

### 2.3 ✅ Eliminar `any` Types

**Problema:** `error: any`, `where: any`, `orderBy: any` en múltiples archivos.

**Solución:**

**1. Error handling:**
```typescript
// ANTES
} catch (error: any) {
  if (error.code) {
    return { success: false, error: error.message, code: error.code };
  }
}

// DESPUÉS
} catch (error: unknown) {
  if (error instanceof AppError) {
    return { success: false, error: error.message, code: error.code };
  }
  console.error("Unexpected error:", error);
  return { success: false, error: "An unexpected error occurred" };
}
```

**2. Prisma types:**
```typescript
// ANTES
const where: any = { organizationId };

// DESPUÉS
import { Prisma } from "@/generated/prisma/client";

const where: Prisma.LinkWhereInput = { organizationId };
const orderBy: Prisma.LinkOrderByWithRelationInput = { createdAt: "desc" };
```

**Tiempo estimado:** 1 hora

---

### 2.4 ✅ Consolidar Generación de Short Codes

**Problema:** `link-create.tsx` y `link-edit.tsx` tienen implementación inline de generación.

**Solución:** Usar siempre `generateShortCode()` de `lib/short-code.ts`.

```typescript
// components/dashboard/link-create.tsx y link-edit.tsx

// ANTES
const handleGenerateShortCode = () => {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 7; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  setShortCode(code);
};

// DESPUÉS
import { generateShortCode } from "@/lib/short-code";

const handleGenerateShortCode = () => {
  setShortCode(generateShortCode());
};
```

**Tiempo estimado:** 15 min

---

### 2.5 ✅ Añadir Toast Notifications

**Problema:** `sonner` está instalado pero no se usa. Los usuarios no reciben feedback visual de acciones exitosas.

**Solución:**

**Paso 1:** Añadir Toaster en layout:
```typescript
// app/layout.tsx
import { Toaster } from "sonner";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <ThemeProvider>
          <TooltipProvider>
            {children}
            <Toaster position="top-right" richColors />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

**Paso 2:** Usar en componentes:
```typescript
// components/dashboard/link-card.tsx
import { toast } from "sonner";

const handleDelete = async () => {
  if (!confirm("...")) return;
  
  const result = await deleteLink(link.id);
  if (result.success) {
    toast.success("Link deleted successfully");
    onUpdate?.();
  } else {
    toast.error(result.error);
  }
};

const handleCopy = async () => {
  await navigator.clipboard.writeText(shortUrl);
  toast.success("URL copied to clipboard");
};
```

**Tiempo estimado:** 30 min

---

## 🟡 FASE 3: TESTING

### 3.1 ✅ Tests para Routing Engine

**Archivo nuevo:** `__tests__/lib/routing-engine.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { evaluateRoutingRules, buildRequestContext, detectDevice } from "@/lib/routing-engine";

describe("Routing Engine", () => {
  describe("detectDevice", () => {
    it("detects mobile devices", () => {
      const ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)";
      const result = detectDevice(ua);
      expect(result.type).toBe("mobile");
      expect(result.os).toBe("iOS");
    });

    it("detects desktop devices", () => {
      const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0";
      const result = detectDevice(ua);
      expect(result.type).toBe("desktop");
      expect(result.os).toBe("Windows");
    });
  });

  describe("evaluateRoutingRules", () => {
    it("returns no match when no rules", () => {
      const context = buildRequestContext("", {}, {});
      const result = evaluateRoutingRules([], context);
      expect(result.matched).toBe(false);
    });

    it("matches simple rule", () => {
      const rules = [{
        id: "1",
        linkId: "link1",
        name: "iOS Users",
        destinationUrl: "https://apps.apple.com",
        priority: 0,
        weight: null,
        enabled: true,
        conditions: [{
          id: "c1",
          ruleId: "1",
          variable: "device.os",
          operator: "equals",
          value: "iOS",
        }],
      }];

      const context = buildRequestContext(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
        {},
        {}
      );

      const result = evaluateRoutingRules(rules, context);
      expect(result.matched).toBe(true);
      expect(result.destinationUrl).toBe("https://apps.apple.com");
    });

    // ... más tests para operadores, A/B testing, prioridades
  });
});
```

**Tiempo estimado:** 2 horas

---

### 3.2 ✅ Tests para Analytics Actions

**Archivo:** `__tests__/lib/actions/analytics.test.ts`

```typescript
describe("Analytics Actions", () => {
  describe("getLinkAnalytics", () => {
    it("requires authentication", async () => {
      mockUnauthenticated();
      await expect(getLinkAnalytics("link-1")).rejects.toThrow();
    });

    it("requires link ownership", async () => {
      mockAuthenticated({ id: "user-2" });
      // ... test
    });

    it("returns analytics data", async () => {
      mockAuthenticated();
      // ... mock prisma queries
      const result = await getLinkAnalytics("link-1");
      expect(result.totalClicks).toBeDefined();
    });
  });
});
```

**Tiempo estimado:** 2 horas

---

## 🟢 FASE 4: MEJORAS OPCIONALES

### 4.1 Soft Delete para Links

**Tiempo:** 1 hora

### 4.2 CI/CD Pipeline

**Tiempo:** 2 horas

### 4.3 API Key Hashing Fix

**Tiempo:** 1 hora

---

## 📝 Checklist de Implementación

### Antes de empezar
- [ ] Crear branch `feature/code-review-improvements`
- [ ] Asegurar que todos los tests actuales pasan: `pnpm test --run`
- [ ] Hacer backup de la DB de desarrollo

### Por cada mejora
- [ ] Leer la sección del plan
- [ ] Implementar el código
- [ ] Escribir/actualizar tests
- [ ] Ejecutar tests: `pnpm test --run`
- [ ] Ejecutar linter: `pnpm lint`
- [ ] Commit con mensaje descriptivo
- [ ] Marcar como completada en este documento

### Al finalizar cada fase
- [ ] Ejecutar tests completos
- [ ] Verificar coverage: `pnpm test:coverage`
- [ ] Probar manualmente las features afectadas
- [ ] Push del branch
- [ ] Documentar cambios en CHANGELOG (si existe)

---

## 🎓 Mejores Prácticas a Seguir

### Durante la Implementación

1. **Un cambio a la vez**: No mezclar mejoras. Un PR por mejora (o por fase).

2. **Tests primero**: Escribir el test que falla, luego implementar la solución.

3. **Commits atómicos**: 
   ```
   git commit -m "security: add CSP and HSTS headers to middleware"
   git commit -m "refactor: consolidate auth guards into shared module"
   ```

4. **Code review interno**: Antes de marcar como completo, revisar el diff tú mismo.

5. **No romper compatibilidad**: Si cambias la firma de una función, actualizar TODOS los usos.

### Estándares de Código

- Usar tipos explícitos, nunca `any`
- Añadir JSDoc comments a funciones públicas
- Mantener funciones < 50 líneas
- Un concepto por función
- Nombres descriptivos > comentarios

### Testing

- Mínimo 80% coverage en nuevos archivos
- Test de happy path + error cases + edge cases
- Mock solo lo externo (DB, APIs), no lógica interna

---

## 📞 Dudas y Bloqueos

Si durante la implementación hay dudas:

1. **Decisiones de diseño**: Consultar con el equipo antes de implementar
2. **Breaking changes**: Notificar y consensuar
3. **Cambios de scope**: Actualizar este documento

---

## ✅ Criterios de Completitud

Una mejora se considera completa cuando:

- ✅ Código implementado y funcionando
- ✅ Tests escritos y pasando
- ✅ Coverage >= 80%
- ✅ ESLint sin errores
- ✅ Documentación actualizada (JSDoc, README si aplica)
- ✅ Probado manualmente
- ✅ Commit pusheado

---

**Última actualización:** 14/02/2026  
**Versión:** 1.0
