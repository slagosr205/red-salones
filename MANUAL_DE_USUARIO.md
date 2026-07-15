# Manual de Usuario — Red Comercial de Salones

Plataforma B2B de comercio y fidelización para la industria de salones de belleza en Honduras.

---

## Índice

1. [Roles del Sistema](#1-roles-del-sistema)
2. [Primeros Pasos](#2-primeros-pasos)
3. [Módulo Público](#3-módulo-público)
4. [Dashboard](#4-dashboard)
5. [Comprar (Catálogo de Productos)](#5-comprar-catálogo-de-productos)
6. [Carrito de Compras](#6-carrito-de-compras)
7. [POS — Punto de Venta (Admin)](#7-pos--punto-de-venta-admin)
8. [Pedidos](#8-pedidos)
9. [Mis Puntos](#9-mis-puntos)
10. [Canjes](#10-canjes)
11. [Beneficios (Admin)](#11-beneficios-admin)
12. [Promociones (Admin)](#12-promociones-admin)
13. [Artículos / Productos (Admin)](#13-artículos--productos-admin)
14. [Inventario (Admin)](#14-inventario-admin)
15. [Carga Masiva (Admin)](#15-carga-masiva-admin)
16. [Red Comercial](#16-red-comercial)
17. [Zonas (Admin)](#17-zonas-admin)
18. [Solicitudes Pendientes](#18-solicitudes-pendientes)
19. [Reportes](#19-reportes)
20. [Master Classes](#20-master-classes)
21. [Configuración (Admin)](#21-configuración-admin)
22. [Perfil de Usuario](#22-perfil-de-usuario)
23. [Métodos de Pago](#23-métodos-de-pago)
24. [Solución de Problemas](#24-solución-de-problemas)

---

## 1. Roles del Sistema

La plataforma tiene **3 roles** con distintos niveles de acceso:

| Rol | Descripción |
|-----|-------------|
| **Admin** | Acceso completo. Gestiona usuarios, productos, inventario, promociones, beneficios, zonas, pedidos, reportes y POS. |
| **Líder** | Usuario intermedio (gerente regional). Aprueba/rechaza registros de salones, ve su red comercial, crea pedidos, consulta reportes y gestiona puntos. |
| **Salón** | Usuario final (dueño de salón de belleza). Compra productos, acumula y canjea puntos, accede a beneficios y master classes. |

### Sub-tipos de Cliente (Salón)
- **Salón**: Precio regular por defecto.
- **Consumidor Final**: Precio público (más alto).

---

## 2. Primeros Pasos

### 2.1 Registro
1. Ve a **"Solicitar Registro"** desde la página principal.
2. Completa el formulario con tus datos.
3. Recibirás un correo con tus credenciales.
4. Tu cuenta quedará **pendiente de aprobación** por un líder o admin.

### 2.2 Inicio de Sesión
1. Ingresa tu correo electrónico y contraseña.
2. Si tu cuenta está pendiente, verás una pantalla de espera.

### 2.3 Navegación
- **Barra superior**: Icono de notificaciones (campana), carrito de compras (salón/líder), avatar de usuario con menú desplegable (Perfil / Cerrar sesión).
- **Menú lateral izquierdo**: Cambia según tu rol. Se colapsa en pantallas móviles.

---

## 3. Módulo Público

### 3.1 Catálogo Público (`/catalogo`)
Accesible sin iniciar sesión. Muestra productos destacados con imágenes, precios y descripciones. Los artículos se agregan a un carrito local (almacenado en el navegador).

### 3.2 Carrito Público (`/carrito`)
Revisa los productos seleccionados antes de iniciar sesión. Al iniciar sesión, los productos se conservan en tu carrito.

### 3.3 Carnet de Afiliado (`/carnet`)
Vista previa del carnet digital de afiliado. Muestra nombre, nivel (PLATINUM), ID de membresía y fecha de expiración.

### 3.4 Solicitar Registro (`/solicitar-registro`)
Formulario de autorregistro para nuevos salones. Requiere: nombre, correo, teléfono, dirección y ubicación en el mapa.

---

## 4. Dashboard

Disponible para **todos los roles** en `/dashboard`. Muestra indicadores clave según el rol:

### Admin
- Total de usuarios (salones, líderes)
- Total de pedidos y puntos acumulados
- Órdenes recientes
- Salones por líder (gráfico de barras)
- Registros en los últimos 7 días
- Beneficios disponibles (con puntos requeridos)
- Enlaces rápidos a: usuarios, carrito, POS, pedidos

### Líder
- Total de salones a su cargo
- Total de pedidos realizados por sus salones
- Puntos acumulados
- Órdenes recientes
- Enlaces rápidos a: carrito, pedidos, red comercial

### Salón
- Estado de su cuenta y líder asignado
- Total de pedidos realizados
- Puntos acumulados
- Órdenes recientes
- Enlaces rápidos a: comprar productos, carrito, pedidos

---

## 5. Comprar (Catálogo de Productos)

**Rol:** Salón, Líder  
**Ruta:** `/rc/productos`

### Funcionalidades
- **Búsqueda**: Filtra productos por nombre.
- **Categorías**: Filtra por categoría (Shampoo, Acondicionador, Aceites, Folletos, Tarjetas, Banners, Uniformes, Merchandising, Muestras, Regalos, Papelería, Digital, Otros).
- **Precios**: Muestra el precio según tu rol y tipo de cliente:
  - **Salón**: Precio regular (`price`).
  - **Líder**: Precio líder (`leader_price`) — más bajo.
  - **Consumidor Final**: Precio público (`public_price`) — más alto.
- **Stock**: Muestra si hay existencia disponible.
- **Agregar al carrito**: Selecciona cantidad y agrega al carrito. Recibirás una notificación toast de confirmación.
- **Promociones activas**: Los productos en promoción muestran etiquetas como "2x1", "% Descuento" o "Combo".

### Precios por Tipo de Usuario

| Tipo de Usuario | Precio que ve |
|-----------------|---------------|
| Líder (comprando para sí) | Precio líder |
| Líder (comprando para un salón tipo `salon`) | Precio regular |
| Líder (comprando para un salón tipo `consumidor_final`) | Precio público |
| Salón | Precio regular |

---

## 6. Carrito de Compras

**Rol:** Salón, Líder  
**Ruta:** `/rc/carrito`

### Funcionalidades
- **Lista de productos** agregados con cantidad, precio unitario, descuento y subtotal.
- **Ajustar cantidades**: Botones + y - para cada producto.
- **Eliminar producto**: Botón de eliminar por producto.
- **Resumen de compra**:
  - Subtotal
  - Descuento total (promociones aplicadas automáticamente)
  - ISV (15% sobre el subtotal menos descuentos)
  - **Gran total**
- **Seleccionar destino** (solo para líder):
  - "Para mí": Compra para el líder.
  - "Para mi salón": Selecciona un salón de tu red.
- **Datos de envío**: Dirección y ubicación en mapa (opcional).
- **Finalizar compra**:
  1. Confirmar pedido.
  2. Elegir método de pago:
     - **Pagar con tarjeta** (TodoPago): Abre el diálogo de pago con tarjeta.
     - **Confirmar (prototipo)**: Flujo simplificado.
  3. Al completar el pago, se crea el pedido y se muestra un recibo.

---

## 7. POS — Punto de Venta (Admin)

**Rol:** Admin  
**Ruta:** `/rc/pos`

### Funcionalidades
- Interfaz estilo punto de venta para crear pedidos en nombre de clientes.
- **Seleccionar cliente**: Elige un salón o consumidor final de la lista.
- **Buscar productos**: Catálogo completo con búsqueda.
- **Agregar productos al carrito** del POS.
- **Resumen**: Subtotal, descuento, ISV, gran total.
- **Monto recibido**: Ingresa el monto con que paga el cliente, calcula el cambio.
- **Método de pago**: Efectivo, tarjeta (TodoPago).
- **Genera pedido** y recibo imprimible.

---

## 8. Pedidos

**Rol:** Líder, Admin  
**Ruta:** `/rc/pedidos`

### Lista de Pedidos
- **Admin**: Ve todos los pedidos del sistema.
- **Líder**: Ve solo sus propios pedidos.
- **Columnas**: Número de pedido, cliente, salón destino, total, puntos, método de pago, estado, fecha.
- **Buscar** por número de pedido.

### Detalle del Pedido
**Ruta:** `/rc/pedidos/{id}`

- Información completa del pedido.
- **Artículos**: Nombre, cantidad, precio unitario, descuento, subtotal.
- **Resumen**: Subtotal, descuento, ISV, gran total.
- **Información de pago**: Método, ID de transacción (TodoPago/Stripe), estado.
- **Estado actual**: Packaging → In Transit → Delivered → Cancelled.

### Estados del Pedido

| Estado | Significado |
|--------|-------------|
| **Packaging** (En empaque) | Pedido creado, preparándose |
| **In Transit** (En tránsito) | Enviado al cliente |
| **Delivered** (Entregado) | Recibido por el cliente |
| **Cancelled** (Cancelado) | Cancelado (solo si está en "Packaging") |

### Cambiar Estado (Admin)
1. Abre el detalle del pedido.
2. Usa los botones de estado (Packaging → In Transit → Delivered).
3. Al cancelar, si el pago fue por TodoPago, se intenta revertir automáticamente.

---

## 9. Mis Puntos

**Rol:** Líder, Admin  
**Ruta:** `/rc/puntos`

### Funcionalidades
- **Puntos actuales**: Saldo disponible.
- **Total ganado**: Suma de todos los puntos ganados por pedidos.
- **Total canjeado**: Suma de todos los puntos canjeados en beneficios.
- **Historial**: Línea de tiempo con pedidos (puntos ganados) y canjes (puntos gastados), ordenada del más reciente al más antiguo.

### Cómo se ganan puntos
- Cada producto tiene un valor en puntos (`points`).
- Al crear un pedido, los puntos se suman automáticamente a tu saldo.
- Los puntos se acreditan en el momento de crear la orden.

---

## 10. Canjes

**Rol:** Líder, Admin  
**Ruta:** `/rc/canjes`

### Funcionalidades
- Lista de **beneficios activos** disponibles para canjear.
- Cada beneficio muestra: título, tipo, costo en puntos, descripción e imagen.
- **Canjear**: Si tienes suficientes puntos, puedes canjear por el beneficio.
- Al canjear:
  1. Se descuentan los puntos de tu saldo.
  2. Se registra el canje en tu historial.
  3. Recibes una notificación toast de confirmación.

---

## 11. Beneficios (Admin)

**Rol:** Admin  
**Ruta:** `/rc/beneficios`

### Funcionalidades
- **Lista** de todos los beneficios con su estado (activo/inactivo).
- **Crear beneficio**: Título, tipo (Producto, Capacitación, etc.), costo en puntos, descripción, instructor, fecha, modalidad (Virtual/Presencial), cupos, imagen y rol objetivo (`lider`, `salon`, `consumidor_final`).
- **Editar**: Modificar cualquier campo.
- **Eliminar**: Borra el beneficio permanentemente.
- **Activar/Desactivar**: Alterna el estado sin eliminar.
- **Filtro por tipo**: Producto, Capacitación, etc.

---

## 12. Promociones (Admin)

**Rol:** Admin  
**Ruta:** `/rc/promociones`

### Funcionalidades
- **Lista** de promociones con estado, fechas y tipo.
- **Tipos de promoción**:
  - **2x1**: Lleva 2 productos y paga 1 (el descuento es el precio de 1).
  - **Descuento**: Porcentaje de descuento (ej. 10 = 10% off).
  - **Combo**: Descuento por combo (misma fórmula que descuento).
- **Crear**: Nombre, tipo, valor, fechas de inicio/fin, productos asociados, rol objetivo.
- **Editar / Eliminar**: Modificar o borrar promociones.
- **Activar/Desactivar**: Alterna el estado.
- Una promoción sin productos asociados aplica a **todos** los productos.

---

## 13. Artículos / Productos (Admin)

**Rol:** Admin  
**Ruta:** `/rc/articulos`

### Lista de Artículos
- Todos los productos con nombre, marca, categoría, precios (3 niveles), stock, puntos y estado destacado.
- **Buscar** por nombre.
- **Filtrar** por categoría.
- **Destacar**: Marca un producto como "destacado" para que aparezca en el catálogo público.

### Crear Artículo
**Ruta:** `/rc/articulos/crear`
- Nombre, marca, categoría.
- Precios (3 niveles): Precio regular, Precio líder, Precio público.
- Stock y stock mínimo.
- Puntos que otorga.
- Descripción / resumen.
- Imagen (se redimensiona automáticamente).

### Editar Artículo
**Ruta:** `/rc/articulos/{id}/editar`
- Mismos campos que crear.
- Puedes reemplazar la imagen.

---

## 14. Inventario (Admin)

**Rol:** Admin  
**Ruta:** `/rc/inventario`

### Funcionalidades
- **Lista de productos** con stock actual y stock mínimo.
- **Alertas**: Productos con stock bajo (menor al mínimo) y sin stock (0 o null).
- **Entrada de stock**: Registrar aumento de inventario (tipo, cantidad, nota).
- **Stock mínimo**: Configurar el nivel mínimo de alerta para cada producto.
- **Movimientos**: Historial de últimos 50 movimientos (entradas, ventas, ajustes).

---

## 15. Carga Masiva (Admin)

**Rol:** Admin  
**Ruta:** `/rc/carga-masiva`

### Carga de Artículos
- Descarga una **plantilla CSV** con el formato requerido.
- Columnas: nombre, marca, categoría, precio, precio_líder, precio_público, stock, puntos, descripción.
- Sube el archivo CSV para crear múltiples artículos a la vez.

### Carga de Stock
- Descarga la plantilla CSV.
- Columnas: ID del artículo, operación (`set` o `increment`), cantidad.
- **Set**: Establece el stock al valor indicado.
- **Increment**: Suma la cantidad al stock existente.
- Cada carga crea movimientos de inventario tipo `adjustment`.

---

## 16. Red Comercial

**Rol:** Líder, Admin  
**Ruta:** `/rc/red-comercial`

### Funcionalidades
- **Árbol jerárquico**: Visualización de la estructura de la red.
- **Admin**: Ve todos los líderes y sus salones asignados.
- **Líder**: Ve solo sus salones asignados.
- **Pestañas**:
  - **Usuarios**: Lista de todos los usuarios con su rol, estado, líder asignado, zona y tipo de cliente.
  - **Jerarquía**: Vista de árbol (Admin → Líderes → Salones).
  - **Zonas**: Mapa de zonas (admin).
- **Crear usuario**: Botón para crear nuevos usuarios (líderes o salones).
- **Asignar líder**: Cambiar el líder asignado a un salón.
- **Carnet de afiliado**: Ver y enviar por correo el carnet digital de cualquier usuario.
- **Filtros**: Por rol, estado, líder, zona, tipo de cliente.

---

## 17. Zonas (Admin)

**Rol:** Admin  
**Ruta:** `/rc/zonas`

### Funcionalidades
- **Lista de zonas**: Nombre y descripción.
- **Crear zona**: Nombre y descripción.
- **Editar**: Modificar nombre y descripción.
- **Eliminar**: Borrar zona.
- **Asignar líderes**: Seleccionar qué líderes pertenecen a cada zona.

---

## 18. Solicitudes Pendientes

**Rol:** Líder, Admin  
**Ruta:** `/rc/pendientes`

### Funcionalidades
- Lista de usuarios con estado **pendiente**.
- **Admin**: Puede aprobar/rechazar a cualquier usuario pendiente.
- **Líder**: Solo ve los salones que solicitan registrarse (si está configurado como líder para aprobar).
- **Aprobar**: Activa la cuenta, asignas tipo de cliente (Salón o Consumidor Final) y envías correo de bienvenida.
- **Rechazar**: Elimina la solicitud.

---

## 19. Reportes

**Rol:** Líder, Admin  
**Ruta:** `/rc/reportes`

### Funcionalidades
- **Admin**: Ve datos de todos los usuarios.
- **Líder**: Ve datos de su propia red.
- **Indicadores**:
  - Total de pedidos.
  - Total de ingresos (suma de gran_total).
  - Promedio por pedido.
  - Pedidos por líder (gráfico de barras).
  - Top 5 productos más vendidos.
  - Ingresos por mes (gráfico de línea).
  - Pedidos por estado (gráfico de pastel).
- **Exportable**: Los datos se pueden visualizar en gráficos interactivos.

---

## 20. Master Classes

**Rol:** Todos  
**Ruta:** `/rc/master-classes`

### Funcionalidades
- Lista de beneficios tipo "Capacitación" o que tengan instructor/fecha asignada.
- Muestra: título, instructor, fecha, modalidad (Virtual/Presencial), cupos disponibles.
- **Inscribirse**: Si tienes suficientes puntos, puedes canjear puntos por la master class.
- Las master classes se gestionan desde la sección de Beneficios (admin).

---

## 21. Configuración (Admin)

**Rol:** Admin  
**Ruta:** `/rc/configuracion`

### Funcionalidades
- **Configuración del recibo**: Nombre de la empresa, teléfono, dirección, correo electrónico.
- Estos datos aparecen en los recibos impresos y digitales.

---

## 22. Perfil de Usuario

**Ruta:** `/profile`

### Funcionalidades
- **Editar perfil**: Cambiar nombre y correo electrónico.
- **Actualizar contraseña**: Cambiar contraseña (requiere contraseña actual).
- **Eliminar cuenta**: Eliminar tu cuenta permanentemente.

---

## 23. Métodos de Pago

### 23.1 TodoPago (Pasarela Hondureña)
- Principal método de pago con tarjeta de crédito/débito.
- **Pago directo**: Ingresa número de tarjeta, titular, mes/año de expiración y CVC.
- **Flujo de pago**:
  1. El frontend envía los datos al backend.
  2. El backend se autentica con TodoPago (token en caché por 10 min).
  3. Se procesa el pago directo.
  4. Si es exitoso, se crea el pedido.
  5. Si falla la creación del pedido, el pago se revierte automáticamente.
- **Campos enviados**: Monto (base gravable), impuestos (ISV 15%), descuento.
- **Reversión**: Al cancelar un pedido pagado con TodoPago, el sistema intenta revertir la transacción automáticamente.

### 23.2 Stripe
- Método alternativo de pago con tarjeta.
- Crea un PaymentIntent y devuelve un `clientSecret` para renderizar el formulario de Stripe Elements en el frontend.

---

## 24. Solución de Problemas

### 24.1 No puedo iniciar sesión
- Verifica que tu cuenta esté **activa** (no pendiente ni rechazada).
- Usa la opción **"¿Olvidaste tu contraseña?"** en la pantalla de login.
- Contacta a tu líder o admin si el problema persiste.

### 24.2 Mi cuenta está pendiente
- Un líder o admin debe aprobar tu registro.
- Recibirás un correo cuando tu cuenta sea activada.
- Si han pasado varios días, contacta a tu líder directamente.

### 24.3 El carrito no muestra los productos
- Los productos se guardan en tu navegador (localStorage).
- Si borras los datos del navegador o usas otro dispositivo, el carrito estará vacío.
- Recarga la página o verifica que no haya errores en la consola.

### 24.4 No puedo canjear puntos
- Verifica que tengas **suficientes puntos** para el beneficio deseado.
- Asegúrate de que el beneficio esté **activo** y disponible para tu rol.
- Si el beneficio tiene cupos, verifica que aún haya disponibilidad.

### 24.5 Error al procesar pago
- Verifica los datos de la tarjeta (número, fecha, CVC).
- Asegúrate de tener fondos suficientes.
- Si el error persiste, intenta con otro método de pago.
- Si el pedido no se creó pero el pago se cobró, el sistema lo revierte automáticamente. Si no ocurre, contacta al administrador.

### 24.6 No veo todos los productos
- Algunos productos pueden tener **stock 0** y estar ocultos del catálogo.
- Filtra por categoría o usa el buscador.
- Si eres admin, revisa el inventario en `/rc/articulos`.

### 24.7 El badge del carrito no se actualiza
- El badge se actualiza automáticamente al agregar o quitar productos.
- Si no ves el cambio, haz clic en cualquier lugar de la página o navega a otra sección y regresa.

---

## Glosario

| Término | Significado |
|---------|-------------|
| ISV | Impuesto Sobre Ventas (15% en Honduras) |
| SKU | Código interno del producto |
| Stock mínimo | Cantidad mínima de producto antes de generar alerta |
| Puntos | Unidad de fidelización canjeable por beneficios |
| 2x1 | Promoción "Lleva 2, paga 1" |
| TodoPago | Pasarela de pago hondureña |
| POS | Punto de Venta (interfaz para crear pedidos en tienda) |
| Carnet de afiliado | Tarjeta digital de membresía con nivel PLATINUM |
