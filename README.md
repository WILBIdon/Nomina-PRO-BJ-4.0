# 🧾 Nómina BJ Pro 4.0

Sistema de gestión de nómina para Colombia, basado en la normativa laboral vigente.

![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![React](https://img.shields.io/badge/React-19-blue)
![Express](https://img.shields.io/badge/Express-4.x-black)
![Deploy](https://img.shields.io/badge/Deploy-Railway-purple)

## ✨ Características

- ✅ **Cálculo automático** de nómina semanal/mensual
- ✅ **Fórmulas exactas** basadas en normativa colombiana 2022
- ✅ **Gestión de empleados** (CRUD completo)
- ✅ **Horas extras y recargos** (diurnos, nocturnos, dominicales)
- ✅ **Historial de liquidaciones** por período
- ✅ **Exportación de datos** en JSON
- ✅ **API REST documentada**
- ✅ **Gestión de errores** robusta
- ✅ **Interfaz responsive** moderna

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18 o superior
- npm 9 o superior

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/TU_USUARIO/nomina-bj-pro.git
cd nomina-bj-pro

# Instalar dependencias del servidor
npm install

# Instalar dependencias del cliente
cd client && npm install && cd ..

# Iniciar en modo desarrollo
npm run dev
```

### URLs

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000/api
- **Health Check:** http://localhost:3000/api/health

## 📁 Estructura del Proyecto

```
nomina-bj-pro/
├── server/                    # Backend Express
│   ├── index.js               # Entry point
│   ├── routes/                # Rutas API
│   │   ├── empleados.js
│   │   ├── config.js
│   │   └── nominas.js
│   ├── services/              # Lógica de negocio
│   │   └── calculoNomina.js   # Motor de cálculo
│   ├── middleware/
│   │   └── errorHandler.js    # Gestión de errores
│   └── data/                  # Base de datos JSON
│       ├── empleados.json
│       ├── config.json
│       └── nominas/
│
├── client/                    # Frontend React + Vite
│   └── src/
│       ├── App.jsx
│       └── App.css
│
└── docs/                      # Documentación
    ├── API.md
    └── FORMULAS.md
```

## 📚 API Reference

Ver [docs/API.md](docs/API.md) para la documentación completa.

### Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | Estado del servidor |
| GET | `/api/empleados` | Listar empleados |
| POST | `/api/empleados` | Crear empleado |
| GET | `/api/config` | Ver configuración |
| GET | `/api/config/formulas` | Ver fórmulas |
| POST | `/api/nominas/liquidar` | Liquidar nómina |
| GET | `/api/nominas` | Historial de nóminas |

## 📐 Fórmulas de Cálculo

Ver [docs/FORMULAS.md](docs/FORMULAS.md) para el detalle de todas las fórmulas.

### Resumen

- **Valor Día:** salario / 30
- **Hora Ordinaria:** salario / 240
- **H.E. Diurna:** hora × 1.25
- **H.E. Nocturna:** hora × 1.75
- **Salud/Pensión:** 4% cada una

## 🚂 Deploy en Railway

1. Conecta tu repositorio de GitHub a Railway
2. Configura las variables de entorno:
   ```
   NODE_ENV=production
   PORT=3000
   ```
3. Railway detectará automáticamente el proyecto Node.js
4. El comando de inicio es `npm start`

## 🔧 Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `NODE_ENV` | Ambiente (development/production) | development |
| `PORT` | Puerto del servidor | 3000 |
| `FRONTEND_URL` | URL del frontend (CORS) | - |

## 📝 Scripts Disponibles

```bash
npm run dev       # Inicia servidor y cliente en desarrollo
npm run server    # Solo el servidor Express
npm run client    # Solo el cliente Vite
npm run build     # Build de producción del cliente
npm start         # Inicia el servidor (producción)
```

## 📊 Datos de Ejemplo

El sistema viene precargado con:
- 26 empleados del archivo Excel original
- Configuración de variables legales 2022
- Tipos de cuenta: AHORROS, NEQUI, EFECTIVO

## 🤝 Contribuir

1. Fork el repositorio
2. Crea tu rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

ISC © 2022 BJ Pro

---

**Desarrollado con ❤️ para la gestión de nómina en Colombia**
