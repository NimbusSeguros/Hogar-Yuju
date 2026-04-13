# Hogar Yuju - Plataforma de Seguros

![Yuju Logo](https://raw.githubusercontent.com/username/repo/main/frontend/public/logo.png) <!-- placeholder for logo if available -->

Una plataforma moderna de cotización y emisión de seguros de hogar, integrada directamente con la **SIAPI de Rio Uruguay Seguros (RUS)**. Diseñada para ofrecer una experiencia de usuario premium, rápida y segura.

## 🚀 Estado del Proyecto

Actualmente, el proyecto cuenta con el flujo de cotización completo y las primeras etapas de la emisión.

- **Frontend**: 90% Completado (UI/UX definida, Stepper interactivo, Dashboard de Leads).
- **Backend**: 80% Completado (Integración RUS, Persistencia en Supabase, Gestión de Órdenes).

## ✨ Lo que se ha hecho (Implementado)

### 1. Sistema de Cotización Inteligente
- **Selección de Riesgo**: Flujo dinámico para elegir el tipo de vivienda y riesgos asociados.
- **Formularios Dinámicos**: Integración con los "indicios" y preguntas de la SIAPI de RUS para generar cotizaciones precisas.
- **Comparador de Planes**: Visualización de múltiples propuestas (Packs) con desglose de coberturas y precios.

### 2. Flujo de Emisión (Orden de Venta)
- **Creación de Orden**: El sistema inicia una `Orden de Venta` en RUS al seleccionar un plan.
- **Captura de Datos**: Formularios validados para datos personales y datos del domicilio.
- **Persistencia CRM**: Integración con **Supabase** para guardar cada "Lead" (prospecto) al instante, evitando pérdida de conversiones.

### 3. Dashboard Administrativo
- Visualización en tiempo real de los seguros cotizados.
- Filtrado por tipo de seguro (Hogar/Motos).
- Estado de cada orden (Iniciada, Datos Completos, Domicilio, etc.).

## 🏗️ Lo que falta (Camino a Producción)

> [!IMPORTANT]
> Los siguientes puntos son críticos para finalizar el ciclo de venta online.

- **Emisión Online (Finalización)**: Completar el paso de confirmación final (`confirmarorden`) una vez que todos los datos y pagos sean validados por la compañía.
- **Pasarela de Pagos**:
  - Integración completa de métodos de pago (Tarjetas, CBU).
  - Validación de pagos en tiempo real con la pasarela de RUS.
- **Refinamiento de UX en Pago**: Implementar la pantalla de éxito final con descarga de póliza provisoria.

## 🛠️ Stack Tecnológico

- **Frontend**:
  - [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
  - [TypeScript](https://www.typescriptlang.org/)
  - [Lucide React](https://lucide.dev/) para iconografía premium.
  - CSS Vanila con variables modernas y diseño responsivo.
- **Backend**:
  - [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/)
  - [TypeScript](https://www.typescriptlang.org/)
  - [Supabase SDK](https://supabase.com/) para base de datos y autenticación.
- **APIs**:
  - Integración directa con **RUS SIAPI v1**.

## ⚙️ Configuración e Instalación

### Requisitos Previos
- Node.js (v18 o superior)
- Cuenta en Supabase
- Credenciales de Sandbox de RUS

### Instalación de Dependencias
En la raíz del proyecto, ejecuta:
```bash
npm run install:all
```

### Variables de Entorno
Crea un archivo `.env` en la carpeta `/backend` basado en el siguiente ejemplo:

```env
PORT=3000
RUS_API_BASE_URL=https://api-sandbox.siapi.io/v1
RUS_API_AUTH_URL=https://api-sandbox.siapi.io
RUS_USERNAME=tu_usuario_rus
RUS_PASSWORD=tu_password_rus

SUPABASE_URL=https://tu_proyecto.supabase.co
SUPABASE_KEY=tu_anon_public_key
RUS_DEFAULT_PRODUCER_CODE=1234
```

### Ejecución en Desarrollo
Para iniciar frontend y backend simultáneamente:
```bash
npm run dev
```

## 📂 Estructura del Proyecto

```text
├── backend/
│   ├── src/
│   │   ├── controllers/   # Lógica de las rutas
│   │   ├── services/      # Integración con RUS y Supabase
│   │   ├── routes/        # Definición de Endpoints
│   │   └── server.ts      # Punto de entrada
├── frontend/
│   ├── src/
│   │   ├── components/    # Componentes del Stepper y UI
│   │   ├── App.tsx        # Orquestador del flujo
│   │   └── index.css      # Sistema de diseño y estilos
```

---
Diseñado con ❤️ por el equipo de **Yuju** & **Antigravity**.
