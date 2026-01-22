/**
 * Rutas de Nóminas - API REST
 * 
 * Endpoints:
 * GET  /api/nominas              - Listar todas las nóminas
 * GET  /api/nominas/:periodo     - Obtener nómina de un período
 * POST /api/nominas/liquidar     - Liquidar nómina de un empleado
 * POST /api/nominas/liquidar-all - Liquidar nómina de todos los empleados
 */

const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { asyncHandler, createError } = require('../middleware/errorHandler');
const { calcularNominaSemanal, calcularNominaMensual } = require('../services/calculoNomina');

const NOMINAS_PATH = path.join(__dirname, '../data/nominas');
const EMPLEADOS_PATH = path.join(__dirname, '../data/empleados.json');
const CONFIG_PATH = path.join(__dirname, '../data/config.json');

/**
 * Lee empleados del archivo JSON
 */
async function leerEmpleados() {
    const data = await fs.readFile(EMPLEADOS_PATH, 'utf-8');
    return JSON.parse(data);
}

/**
 * Lee la configuración del archivo JSON
 */
async function leerConfig() {
    const data = await fs.readFile(CONFIG_PATH, 'utf-8');
    return JSON.parse(data);
}

/**
 * Lee una nómina específica
 */
async function leerNomina(periodo) {
    const filePath = path.join(NOMINAS_PATH, `${periodo}.json`);
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return null;
        }
        throw error;
    }
}

/**
 * Guarda una nómina
 */
async function guardarNomina(periodo, data) {
    // Asegurar que existe el directorio
    await fs.mkdir(NOMINAS_PATH, { recursive: true });

    const filePath = path.join(NOMINAS_PATH, `${periodo}.json`);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Lista todos los archivos de nómina
 */
async function listarNominas() {
    try {
        await fs.mkdir(NOMINAS_PATH, { recursive: true });
        const files = await fs.readdir(NOMINAS_PATH);
        return files
            .filter(f => f.endsWith('.json'))
            .map(f => f.replace('.json', ''));
    } catch (error) {
        return [];
    }
}

/**
 * GET /api/nominas
 * Listar todas las nóminas
 */
router.get('/', asyncHandler(async (req, res) => {
    const periodos = await listarNominas();

    // Cargar resumen de cada nómina
    const nominas = await Promise.all(
        periodos.map(async (periodo) => {
            const nomina = await leerNomina(periodo);
            return {
                periodo,
                estado: nomina?.estado || 'desconocido',
                fechaInicio: nomina?.fechaInicio,
                fechaFin: nomina?.fechaFin,
                totalEmpleados: nomina?.liquidaciones?.length || 0,
                totalNomina: nomina?.totales?.totalNomina || 0,
                totalConsignado: nomina?.totales?.totalConsignado || 0,
                procesadoAt: nomina?.procesadoAt
            };
        })
    );

    // Ordenar por período descendente
    nominas.sort((a, b) => b.periodo.localeCompare(a.periodo));

    res.json({
        success: true,
        data: nominas,
        total: nominas.length
    });
}));

/**
 * GET /api/nominas/:periodo
 * Obtener nómina de un período
 */
router.get('/:periodo', asyncHandler(async (req, res) => {
    const { periodo } = req.params;
    const nomina = await leerNomina(periodo);

    if (!nomina) {
        throw createError('NOMINA_NOT_FOUND', `Período ${periodo} no encontrado`);
    }

    res.json({
        success: true,
        data: nomina
    });
}));

/**
 * POST /api/nominas/liquidar
 * Liquidar nómina de un empleado
 * 
 * Body:
 * {
 *   cedula: "12345678",
 *   periodo: "2022-S19",
 *   tipoNomina: "SEMANAL" | "MENSUAL",
 *   novedades: {
 *     diasLaborados: 7,
 *     horasExtraDiurna: 0,
 *     horasExtraNocturna: 0,
 *     bonificacion: 0,
 *     prestamo: 0
 *   }
 * }
 */
router.post('/liquidar', asyncHandler(async (req, res) => {
    const { cedula, periodo, tipoNomina = 'SEMANAL', novedades, guardar = true } = req.body;

    // Validar datos requeridos
    if (!cedula) {
        throw createError('VALIDATION_ERROR', 'La cédula es requerida');
    }

    if (!periodo) {
        throw createError('VALIDATION_ERROR', 'El período es requerido');
    }

    // Cargar datos
    const { empleados } = await leerEmpleados();
    const config = await leerConfig();

    // Buscar empleado
    const empleado = empleados.find(e => e.cedula === cedula);
    if (!empleado) {
        throw createError('EMP_NOT_FOUND', `Empleado con cédula ${cedula} no encontrado`);
    }

    // Calcular nómina
    const calcular = tipoNomina === 'MENSUAL' ? calcularNominaMensual : calcularNominaSemanal;
    const liquidacion = calcular(empleado, novedades || {}, config);
    liquidacion.periodo = periodo;
    liquidacion.tipoNomina = tipoNomina;
    liquidacion.liquidadoAt = new Date().toISOString();

    // Guardar en el período si se solicita
    if (guardar) {
        let nomina = await leerNomina(periodo);

        if (!nomina) {
            // Crear nuevo período
            nomina = {
                periodo,
                tipoNomina,
                estado: 'borrador',
                fechaInicio: null,
                fechaFin: null,
                liquidaciones: [],
                totales: {
                    totalNomina: 0,
                    totalConsignado: 0
                },
                creadoAt: new Date().toISOString()
            };
        }

        // Actualizar o agregar liquidación
        const existeIndex = nomina.liquidaciones.findIndex(l => l.cedula === cedula);
        if (existeIndex >= 0) {
            nomina.liquidaciones[existeIndex] = liquidacion;
        } else {
            nomina.liquidaciones.push(liquidacion);
        }

        // Recalcular totales
        nomina.totales = {
            totalNomina: nomina.liquidaciones.reduce((sum, l) => sum + l.totalNomina, 0),
            totalConsignado: nomina.liquidaciones.reduce((sum, l) => sum + l.totalConsignado, 0)
        };
        nomina.procesadoAt = new Date().toISOString();

        await guardarNomina(periodo, nomina);

        console.log(`[INFO] Liquidación guardada: ${cedula} - ${periodo}`);
    }

    res.json({
        success: true,
        message: guardar ? 'Liquidación calculada y guardada' : 'Liquidación calculada (sin guardar)',
        data: liquidacion
    });
}));

/**
 * POST /api/nominas/liquidar-all
 * Liquidar nómina de todos los empleados activos
 * 
 * Body:
 * {
 *   periodo: "2022-S19",
 *   tipoNomina: "SEMANAL" | "MENSUAL",
 *   fechaInicio: "2022-05-02",
 *   fechaFin: "2022-05-08",
 *   novedadesDefault: {
 *     diasLaborados: 7
 *   },
 *   novedadesPorEmpleado: {
 *     "12345678": { bonificacion: 50000 }
 *   }
 * }
 */
router.post('/liquidar-all', asyncHandler(async (req, res) => {
    const {
        periodo,
        tipoNomina = 'SEMANAL',
        fechaInicio,
        fechaFin,
        novedadesDefault = {},
        novedadesPorEmpleado = {}
    } = req.body;

    if (!periodo) {
        throw createError('VALIDATION_ERROR', 'El período es requerido');
    }

    // Cargar datos
    const { empleados } = await leerEmpleados();
    const config = await leerConfig();

    // Filtrar empleados activos
    const empleadosActivos = empleados.filter(e => e.activo);

    if (empleadosActivos.length === 0) {
        throw createError('VALIDATION_ERROR', 'No hay empleados activos para liquidar');
    }

    // Calcular liquidaciones
    const calcular = tipoNomina === 'MENSUAL' ? calcularNominaMensual : calcularNominaSemanal;
    const liquidaciones = [];
    const errores = [];

    for (const empleado of empleadosActivos) {
        try {
            const novedades = {
                ...novedadesDefault,
                ...(novedadesPorEmpleado[empleado.cedula] || {})
            };

            const liquidacion = calcular(empleado, novedades, config);
            liquidacion.periodo = periodo;
            liquidacion.tipoNomina = tipoNomina;
            liquidacion.liquidadoAt = new Date().toISOString();

            liquidaciones.push(liquidacion);
        } catch (error) {
            errores.push({
                cedula: empleado.cedula,
                nombres: empleado.nombres,
                error: error.message
            });
        }
    }

    // Crear nómina del período
    const nomina = {
        periodo,
        tipoNomina,
        estado: 'borrador',
        fechaInicio: fechaInicio || null,
        fechaFin: fechaFin || null,
        liquidaciones,
        totales: {
            totalNomina: liquidaciones.reduce((sum, l) => sum + l.totalNomina, 0),
            totalConsignado: liquidaciones.reduce((sum, l) => sum + l.totalConsignado, 0)
        },
        errores: errores.length > 0 ? errores : undefined,
        creadoAt: new Date().toISOString(),
        procesadoAt: new Date().toISOString()
    };

    await guardarNomina(periodo, nomina);

    console.log(`[INFO] Nómina ${periodo} liquidada: ${liquidaciones.length} empleados, ${errores.length} errores`);

    res.json({
        success: true,
        message: `Nómina liquidada para ${liquidaciones.length} empleados`,
        data: {
            periodo,
            empleadosLiquidados: liquidaciones.length,
            empleadosConError: errores.length,
            totales: nomina.totales,
            errores: errores.length > 0 ? errores : undefined
        }
    });
}));

/**
 * PUT /api/nominas/:periodo/aprobar
 * Aprobar y cerrar un período de nómina
 */
router.put('/:periodo/aprobar', asyncHandler(async (req, res) => {
    const { periodo } = req.params;

    const nomina = await leerNomina(periodo);
    if (!nomina) {
        throw createError('NOMINA_NOT_FOUND', `Período ${periodo} no encontrado`);
    }

    if (nomina.estado === 'aprobada') {
        throw createError('NOMINA_ALREADY_CLOSED', 'Este período ya está aprobado');
    }

    nomina.estado = 'aprobada';
    nomina.aprobadoAt = new Date().toISOString();

    await guardarNomina(periodo, nomina);

    console.log(`[INFO] Nómina ${periodo} aprobada`);

    res.json({
        success: true,
        message: 'Nómina aprobada exitosamente',
        data: {
            periodo,
            estado: nomina.estado,
            totales: nomina.totales
        }
    });
}));

module.exports = router;
