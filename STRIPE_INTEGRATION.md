# TecniFlux - Integración de Stripe

## ⚠️ IMPORTANTE: Autenticación Requerida

**ESTADO ACTUAL:** El sistema de suscripciones está implementado pero usa un usuario mock (`test-user-id`) para desarrollo.

**ANTES DE PRODUCCIÓN** se debe:
1. Implementar sistema de autenticación completo (login/registro)
2. Reemplazar `mockUserId` en todos los endpoints con el usuario autenticado de la sesión
3. Agregar middleware de autenticación a todos los endpoints de suscripción
4. Implementar búsqueda de usuarios por `stripeCustomerId` en los webhooks

## Configuración Actual

### Variables de Entorno Requeridas

**Desarrollo:**
- `TESTING_STRIPE_SECRET_KEY` - Stripe test secret key
- `TESTING_VITE_STRIPE_PUBLIC_KEY` - Stripe test publishable key  
- `DATABASE_URL` - PostgreSQL connection string

**Producción:**
- `STRIPE_SECRET_KEY` - Stripe live secret key
- `VITE_STRIPE_PUBLIC_KEY` - Stripe live publishable key
- `STRIPE_WEBHOOK_SECRET` - Webhook signing secret (obtener desde Stripe Dashboard)
- `DATABASE_URL` - Production PostgreSQL

### Planes Configurados

#### Test Mode (Actual)
- **Premium**: $5.99/mes - `price_1STazsLSNOGtTm6bRERBWFF1`
- **Plus**: $9.99/mes - `price_1STb1DLSNOGtTm6bchaw1h7H`
- **Pro**: $19.99/mes - `price_1STb1nLSNOGtTm6bLBYKJYVT`

#### Live Mode (Configurar en producción)
- **Premium**: $5.99/mes - `price_1STaTVLSNOGtTm6bZnXTpHak`
- **Plus**: $9.99/mes - `price_1STaUFLSNOGtTm6bP19lGfoY`
- **Pro**: $19.99/mes - `price_1STaV4LSNOGtTm6bV1K4Jpqc`

## Arquitectura

### Flujo de Suscripción

1. **Usuario navega a `/pricing`**
   - Ve los 4 planes (Gratuito, Premium, Plus, Pro)
   
2. **Usuario hace click en "Suscribirse"**
   - Redirige a `/checkout?plan=premium` (o plus/pro)
   - Frontend llama a `POST /api/create-subscription`
   
3. **Backend crea suscripción**
   - Verifica si ya tiene customer ID
   - Crea o reutiliza Stripe customer
   - Crea subscription con `payment_behavior: 'default_incomplete'`
   - Retorna `clientSecret` para Stripe Elements
   
4. **Frontend muestra Stripe Elements**
   - Usuario ingresa tarjeta de crédito
   - Confirma pago con `stripe.confirmPayment()`
   
5. **Stripe procesa pago**
   - Envía webhook a `/api/stripe-webhook`
   - Backend actualiza estado de suscripción en DB
   - Usuario es redirigido a página de éxito

### Webhooks Implementados

El endpoint `/api/stripe-webhook` maneja los siguientes eventos:

- **`customer.subscription.created/updated`**
  - Actualiza plan del usuario en BD
  - Determina plan según Price ID
  - Actualiza límites de búsqueda

- **`customer.subscription.deleted`**
  - Downgrade a plan gratuito
  - Resetea límites a 3 búsquedas/mes

- **`invoice.payment_succeeded`**
  - Resetea contador de búsquedas (renovación mensual)
  
- **`invoice.payment_failed`**
  - Log de error (TODO: notificar al usuario)

## Seguridad

### Webhook Signature Verification

✅ **IMPLEMENTADO:** El webhook usa `express.raw()` middleware para preservar el raw body necesario para verificar la firma de Stripe.

⚠️ **DESARROLLO:** Si no hay `STRIPE_WEBHOOK_SECRET` configurado, el webhook funciona sin verificación (solo para testing local).

🔒 **PRODUCCIÓN:** DEBE configurar `STRIPE_WEBHOOK_SECRET` obtenido desde Stripe Dashboard → Webhooks.

### Autenticación de Endpoints

❌ **PENDIENTE:** Los siguientes endpoints requieren autenticación antes de producción:

- `POST /api/create-subscription` - Crear suscripción
- `POST /api/subscription/cancel` - Cancelar suscripción  
- `POST /api/search/web` - Búsqueda con IA
- `POST /api/search/vin` - Búsqueda por VIN

**Ejemplo de middleware necesario:**

```typescript
// Middleware de autenticación (TODO: implementar)
function requireAuth(req, res, next) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "No autenticado" });
  }
  next();
}

// Usar en rutas protegidas
app.post("/api/create-subscription", requireAuth, async (req, res) => {
  const userId = req.session.userId; // Usuario real de la sesión
  // ... resto del código
});
```

## Testing

### Usuario de Prueba

Se creó un usuario de prueba en la base de datos:

```sql
id: test-user-id
email: test@example.com  
plan: free
searches: 0/3
```

### Tarjetas de Prueba de Stripe

Usar estas tarjetas en test mode:

- **Éxito:** `4242 4242 4242 4242`
- **Requiere autenticación:** `4000 0025 0000 3155`
- **Rechazo:** `4000 0000 0000 9995`

Fecha de expiración: cualquier fecha futura
CVC: cualquier 3 dígitos
ZIP: cualquier código postal

## Checklist de Producción

Antes de pasar a producción, completar:

- [ ] Implementar sistema de autenticación (login/registro/sesiones)
- [ ] Reemplazar todos los `mockUserId` con usuarios reales de sesión
- [ ] Agregar middleware de autenticación a endpoints protegidos
- [ ] Configurar `STRIPE_WEBHOOK_SECRET` en variables de entorno
- [ ] Cambiar Price IDs a los de live mode
- [ ] Cambiar Stripe keys a live mode (STRIPE_SECRET_KEY, VITE_STRIPE_PUBLIC_KEY)
- [ ] Configurar webhook en Stripe Dashboard apuntando a producción
- [ ] Implementar notificaciones por email (pago fallido, cancelación, etc.)
- [ ] Implementar sistema de búsqueda de usuarios por stripeCustomerId
- [ ] Testing completo del flujo de checkout en staging
- [ ] Testing de webhooks con Stripe CLI

## Comandos Útiles

### Stripe CLI (para testing de webhooks local)

```bash
# Instalar Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Escuchar webhooks localmente
stripe listen --forward-to localhost:5000/api/stripe-webhook

# Obtener webhook secret para testing
stripe listen --print-secret
```

### Testing Manual

```bash
# Crear suscripción de prueba
curl -X POST http://localhost:5000/api/create-subscription \
  -H "Content-Type: application/json" \
  -d '{"planId": "premium"}'
```

## Soporte

Para problemas o dudas:
- Revisar logs del servidor para errores de Stripe
- Revisar Stripe Dashboard para estado de suscripciones
- Revisar tabla `users` en PostgreSQL para estado local
