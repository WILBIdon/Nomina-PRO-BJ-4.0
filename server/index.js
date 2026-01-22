/**
 * Servidor Principal - Nómina BJ Pro 4.0
 * 
 * Sistema de gestión de nómina para Colombia
 * Basado en normativa laboral vigente
 * 
 * @author BJ Pro
 * @version 4.0.0
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Rutas
const empleadosRoutes = require('./routes/empleados');
const configRoutes = require('./routes/config');
const nominasRoutes = require('./routes/nominas');

// Configuración
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ========================
// INICIALIZACIÓN DE DATOS
// ========================
// Asegurar que existan archivos de datos (para persistencia en Railway Volumes)
const DATA_DIR = path.join(__dirname, 'data');
const DEFAULTS_DIR = path.join(__dirname, 'defaults');
const NOMINAS_DIR = path.join(DATA_DIR, 'nominas');

try {
    // 1. Crear directorios
    if (!fs.existsSync(DATA_DIR)) {
        console.log('[INIT] Creando directorio data...');
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(NOMINAS_DIR)) {
        console.log('[INIT] Creando directorio nominas...');
        fs.mkdirSync(NOMINAS_DIR, { recursive: true });
    }

    // 2. Copiar archivos por defecto si no existen
    const initFile = (filename) => {
        const destPath = path.join(DATA_DIR, filename);
        if (!fs.existsSync(destPath)) {
            const srcPath = path.join(DEFAULTS_DIR, filename);
            if (fs.existsSync(srcPath)) {
                console.log(`[INIT] Inicializando ${filename} desde defaults...`);
                fs.copyFileSync(srcPath, destPath);
            } else {
                console.warn(`[WARN] No se encontró default para ${filename}`);
            }
        }
    };

    initFile('config.json');
    initFile('empleados.json');

} catch (err) {
    console.error('[FATAL] Error inicializando datos:', err);
}

// Crear app Express
const app = express();

// ========================
// MIDDLEWARE
// ========================

// CORS - permitir frontend
app.use(cors({
    origin: NODE_ENV === 'production'
        ? process.env.FRONTEND_URL
        : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON
app.use(express.json());

// Logging de requests (desarrollo)
if (NODE_ENV === 'development') {
    app.use((req, res, next) => {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${req.method} ${req.path}`);
        next();
    });
}

// ========================
// RUTAS API
// ========================

// Endpoint de salud
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Nómina BJ Pro 4.0 - API funcionando',
        version: '4.0.0',
        environment: NODE_ENV,
        timestamp: new Date().toISOString()
    });
});

// Rutas principales
app.use('/api/empleados', empleadosRoutes);
app.use('/api/config', configRoutes);
app.use('/api/nominas', nominasRoutes);

// ========================
// FRONTEND (Producción)
// ========================

// Servir archivos estáticos del frontend en producción
if (NODE_ENV === 'production') {
    const clientBuildPath = path.join(__dirname, '../client/dist');
    app.use(express.static(clientBuildPath));

    // Todas las rutas no-API van al frontend
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api/')) {
            return next();
        }
        res.sendFile(path.join(clientBuildPath, 'index.html'));
    });
}

// ========================
// MANEJO DE ERRORES
// ========================

// Ruta no encontrada
app.use(notFoundHandler);

// Handler de errores global
app.use(errorHandler);

// ========================
// INICIAR SERVIDOR
// ========================

app.listen(PORT, () => {
    console.log('');
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║                                                    ║');
    console.log('║         🧾 NÓMINA BJ PRO 4.0                      ║');
    console.log('║         Sistema de Gestión de Nómina              ║');
    console.log('║                                                    ║');
    console.log('╠════════════════════════════════════════════════════╣');
    console.log(`║  🌐 Servidor: http://localhost:${PORT}              ║`);
    console.log(`║  🔧 Ambiente: ${NODE_ENV.padEnd(28)}         ║`);
    console.log('║                                                    ║');
    console.log('║  📌 Endpoints disponibles:                        ║');
    console.log('║     GET  /api/health                              ║');
    console.log('║     GET  /api/empleados                           ║');
    console.log('║     GET  /api/config                              ║');
    console.log('║     GET  /api/config/formulas                     ║');
    console.log('║     GET  /api/nominas                             ║');
    console.log('║     POST /api/nominas/liquidar                    ║');
    console.log('║                                                    ║');
    console.log('╚════════════════════════════════════════════════════╝');
    console.log('');
});

// Manejo de señales de terminación
process.on('SIGTERM', () => {
    console.log('[INFO] Recibida señal SIGTERM. Cerrando servidor...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n[INFO] Recibida señal SIGINT. Cerrando servidor...');
    process.exit(0);
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
    console.error('[FATAL] Error no capturado:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[WARN] Promise rechazada sin manejar:', reason);
});

module.exports = app;
