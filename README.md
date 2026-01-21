# AInstein Frontend - Guía de Instalación y Despliegue

Interfaz de usuario para la plataforma AInstein/EPICRISIS - Sistema de gestión de epicrisis clínicas.

---

## 📋 Requisitos Previos

| Requisito | Versión Mínima |
|-----------|----------------|
| Node.js | 18.0+ |
| npm | 9.0+ |
| Git | 2.30+ |

---

## 🚀 Instalación Paso a Paso

### 1. Clonar el Repositorio

```bash
git clone https://github.com/zeron-team/ainstein_fe.git
cd ainstein_fe
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

**Para Desarrollo:**
```env
VITE_API_URL=http://localhost:8000
```

**Para Producción:** crear `.env.production`
```env
VITE_API_URL=https://api.tudominio.com
```

### 4. Ejecutar en Desarrollo

```bash
npm run dev
```

El servidor de desarrollo estará disponible en: `http://localhost:5173`

### 5. Compilar para Producción

```bash
npm run build
```

Los archivos compilados se generarán en la carpeta `dist/`

### 6. Previsualizar Build de Producción

```bash
npm run preview
```

---

## 🌐 Despliegue en Producción

### Opción A: Servidor Nginx

1. **Compilar el proyecto:**
```bash
npm run build
```

2. **Copiar archivos a Nginx:**
```bash
sudo cp -r dist/* /var/www/ainstein/
```

3. **Configurar Nginx:** `/etc/nginx/sites-available/ainstein`
```nginx
server {
    listen 80;
    server_name tudominio.com;
    root /var/www/ainstein;
    index index.html;

    # SPA: redirigir todas las rutas a index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache de assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Proxy al backend API
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

4. **Activar sitio y reiniciar:**
```bash
sudo ln -s /etc/nginx/sites-available/ainstein /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Opción B: PM2 + Vite Preview

```bash
npm install -g pm2
npm run build
pm2 start "npm run preview" --name ainstein-frontend
pm2 save
pm2 startup
```

---

## 📁 Estructura del Proyecto

```
ainstein_fe/
├── public/                        # Assets públicos
│   └── favicon.png
│
├── src/
│   ├── main.tsx                   # Punto de entrada React
│   ├── App.tsx                    # Componente raíz + rutas
│   ├── router.tsx                 # Configuración de rutas
│   ├── index.css                  # Estilos globales base
│   │
│   ├── api/                       # Cliente API
│   │   └── axios.ts               # Instancia Axios configurada
│   │
│   ├── auth/                      # Autenticación
│   │   ├── AuthContext.tsx        # Context provider JWT
│   │   ├── PrivateRoute.tsx       # Rutas protegidas
│   │   └── PublicRoute.tsx        # Rutas públicas (login)
│   │
│   ├── components/                # Componentes reutilizables
│   │   ├── KPI.tsx                # Tarjeta de KPI
│   │   ├── kpi.css
│   │   ├── EpcHistoryTimeline.jsx # Timeline historial EPC
│   │   ├── EpcHistoryTimeline.css
│   │   ├── HelpModal.tsx          # Modal de ayuda
│   │   ├── HelpModal.css
│   │   │
│   │   └── layout/                # Componentes de layout
│   │       ├── AppLayout.tsx      # Layout principal
│   │       ├── Header.tsx         # Cabecera
│   │       ├── Sidebar.tsx        # Barra lateral
│   │       ├── Footer.tsx         # Pie de página
│   │       ├── layout.css
│   │       └── sidebar.css
│   │
│   ├── pages/                     # Páginas/vistas
│   │   ├── Login.tsx              # Página de login
│   │   ├── Dashboard.tsx          # Dashboard principal
│   │   ├── dashboard.css
│   │   ├── ErrorPage.tsx          # Página de error 404
│   │   ├── AinsteinWsPage.tsx     # Integración WS
│   │   ├── AinsteinWsPage.css
│   │   │
│   │   ├── Patients/              # Módulo pacientes
│   │   │   ├── List.tsx           # Lista de pacientes
│   │   │   ├── patients-list.css
│   │   │   ├── Form.tsx           # Formulario paciente
│   │   │   └── patient-form.css
│   │   │
│   │   ├── EPC/                   # Módulo epicrisis
│   │   │   ├── ViewEdit.tsx       # Ver/Editar EPC
│   │   │   └── ViewEditEPC.css
│   │   │
│   │   ├── Users/                 # Módulo usuarios
│   │   │   ├── UsersCRUD.tsx      # CRUD usuarios
│   │   │   └── UsersCRUD.css
│   │   │
│   │   ├── Admin/                 # Panel administrador
│   │   │   ├── FeedbackDashboard.tsx   # Dashboard feedback
│   │   │   ├── FeedbackDashboard.css
│   │   │   ├── CostsDashboard.tsx      # Dashboard costos LLM
│   │   │   ├── CostsDashboard.css
│   │   │   ├── HealthCheck.tsx         # Healthcheck sistema
│   │   │   └── HealthCheck.css
│   │   │
│   │   └── Settings/              # Configuración
│   │       └── Branding.tsx       # Personalización marca
│   │
│   ├── styles/                    # Estilos globales
│   │   ├── tokens.css             # Variables CSS (colores, tipografía)
│   │   └── global.css             # Estilos base
│   │
│   └── types/                     # Tipos TypeScript
│       └── index.ts
│
├── .env                           # Variables desarrollo (NO commitear)
├── .env.production                # Variables producción
├── .gitignore
├── index.html                     # HTML base
├── package.json
├── tsconfig.json                  # Configuración TypeScript
├── vite.config.ts                 # Configuración Vite
└── README.md
```

---

## 🗺️ Rutas de la Aplicación

| Ruta | Componente | Acceso | Descripción |
|------|------------|--------|-------------|
| `/login` | Login | Público | Autenticación |
| `/` | Dashboard | Privado | Panel principal |
| `/patients` | List | Privado | Lista pacientes |
| `/patients/new` | Form | Privado | Nuevo paciente |
| `/patients/:id/edit` | Form | Privado | Editar paciente |
| `/epc/:patientId` | ViewEdit | Privado | Ver/Editar EPC |
| `/users` | UsersCRUD | Admin | Gestión usuarios |
| `/admin/feedback` | FeedbackDashboard | Admin | Dashboard feedback IA |
| `/admin/costs` | CostsDashboard | Admin | Costos LLM |
| `/admin/health` | HealthCheck | Admin | Estado del sistema |
| `/ainstein` | AinsteinWsPage | Privado | Integración externa |
| `/settings/branding` | Branding | Admin | Personalización |

---

## 🎨 Sistema de Diseño

### Variables CSS (tokens.css)

```css
:root {
  /* Colores primarios */
  --color-primary: #0284c7;
  --color-primary-dark: #0369a1;
  
  /* Colores de estado */
  --color-success: #16a34a;
  --color-warning: #d97706;
  --color-danger: #dc2626;
  
  /* Neutros */
  --color-bg: #f8fafc;
  --color-surface: #ffffff;
  --color-text: #1e293b;
  --color-muted: #64748b;
  
  /* Bordes y sombras */
  --border-color: rgba(148, 163, 184, 0.35);
  --shadow-sm: 0 4px 8px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 10px 22px rgba(0, 0, 0, 0.08);
  
  /* Tipografía */
  --font-family: 'Inter', system-ui, sans-serif;
  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 18px;
  --radius-full: 999px;
}
```

---

## 🔧 Scripts Disponibles

| Script | Comando | Descripción |
|--------|---------|-------------|
| `dev` | `npm run dev` | Servidor desarrollo con HMR |
| `build` | `npm run build` | Compilar para producción |
| `preview` | `npm run preview` | Previsualizar build |

---

## 📦 Dependencias Principales

| Paquete | Versión | Uso |
|---------|---------|-----|
| react | 18.3.1 | Framework UI |
| react-router-dom | 6.30.1 | Enrutamiento SPA |
| axios | 1.7.4 | Cliente HTTP |
| react-icons | 5.5.0 | Iconos |
| vite | 5.4.10 | Bundler/Dev server |
| typescript | 5.6.3 | Tipado estático |

---

## 🐛 Troubleshooting

| Problema | Solución |
|----------|----------|
| `npm install` falla | Borrar `node_modules` y `package-lock.json`, reinstalar |
| Error CORS en desarrollo | Verificar `VITE_API_URL` apunta al backend correcto |
| Página en blanco | Abrir consola del navegador para ver errores |
| Rutas no funcionan en producción | Configurar Nginx con `try_files` para SPA |
| Build muy lento | Verificar que `node_modules` no esté en carpeta sincronizada |

---

## 🔄 Actualizar desde GitHub

```bash
git pull origin main
npm install
npm run build
# Copiar dist/ al servidor web
```

---

## 📄 Licencia

Propiedad de Zeron Team - Todos los derechos reservados.