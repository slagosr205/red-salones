# Problema con la API de TodoPago - Login HTTP

## Contexto

La aplicación integra la pasarela de pago **TodoPago** (api.todopago.hn) para procesar pagos. El método `login()` en `TodoPagoClient` obtiene un token de autenticación necesario para todas las operaciones (pagos, reversos, registro de clientes, etc.).

## El problema

En producción, el login fallaba con dos errores diferentes dependiendo del enfoque:

### Error 1: HTTP 405 Method Not Allowed

```
TodoPago login HTTP 405: {"timestamp":"...","status":405,"error":"Method Not Allowed","path":"/login"}
```

**Causa raíz:** Laravel Http client con `asJson()` seguía redirects automáticamente. El servidor de TodoPago devolvía un **301 redirect** en `/login`. Guzzle al seguir el redirect convertía el POST a GET (comportamiento estándar para 301/302), y el endpoint `/login` solo acepta POST → 405.

### Error 2: HTTP 301 Moved Permanently

```
TodoPago login HTTP 301: <html><head><title>301 Moved Permanently</title></head>...
```

**Causa raíz:** Al deshabilitar `allow_redirects` para ver el redirect crudo, el código no manejaba la respuesta 301.

## Diagnóstico

Se creó `scripts/test_login.php` para aislar el problema. Este script usaba:

```php
Http::withHeaders([...])
    ->withOptions(['allow_redirects' => false, 'http_errors' => false])
    ->withBody(json_encode($payload, ...), 'application/json; charset=UTF-8')
    ->post($url);
```

**Resultado:** Funcionaba correctamente. Las diferencias clave con el código original eran:

| Aspecto | Código original (fallaba) | Script test (funcionaba) |
|---|---|---|
| Body encoding | `->asJson()` (Laravel automático) | `->withBody(json_encode(...))` manual |
| Content-Type | `application/json` | `application/json; charset=UTF-8` |
| Redirects | `allow_redirects` por defecto (true) | `allow_redirects => false` |
| HTTP errors | por defecto (true) | `http_errors => false` |
| Payload `userType` | `(int) 2` | `'2'` (string) |
| Payload `version` | `''` (campo vacío incluido) | No incluido |

## Solución aplicada

Cambios en `app/Services/TodoPagoClient.php` método `login()`:

1. **`withBody()` en vez de `asJson()`** — Control manual del Content-Type con `charset=UTF-8`
2. **`allow_redirects => false`** — Evita que Guzzle convierta POST → GET en redirects
3. **Seguimiento manual de redirects** — Si la respuesta es 3xx, se lee el header `Location` y se hace un nuevo POST a esa URL
4. **Payload limpio** — Sin campo `version`, `userType` como string, `user` con `trim()`
5. **URL completa** — Se construye con `rtrim(baseUrl, '/') + path` en vez de usar `Http::baseUrl()`

## Verificación

```
$ php scripts/todopago_smoketest.php

base_url=https://api.todopago.hn
login_path=/login
tenant=HNTP
LOGIN_OK
token=******************************001696
expiration=16/07/2026 04:05:35
```

## Lecciones aprendidas

- La API de TodoPago **redirige** el endpoint `/login` (301). Esto puede cambiar según el entorno (test vs producción).
- `Http::asJson()` de Laravel no incluye `charset=UTF-8` en el Content-Type. El servidor de TodoPago puede ser estricto con esto.
- Guzzle por defecto convierte POST → GET al seguir redirects 301/302. Para APIs que solo aceptan POST, se debe deshabilitar `allow_redirects` o manejar los redirects manualmente.
- El script `test_login.php` es la referencia para debugging de conectividad con TodoPago.
