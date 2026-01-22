/**
 * Rutas de Configuración - API REST
 * 
 * Endpoints:
 * GET  /api/config         - Obtener configuración actual
 * PUT  /api/config         - Actualizar configuración
 * GET  /api/config/formula - Obtener fórmulas de cálculo
 */

const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { asyncHandler, createError } = require('../middleware/errorHandler');

const CONFIG_PATH = path.join(__dirname, '../data/config.json');

/**
 * Lee la configuración del archivo JSON
 */
async function leerConfig() {
    try {
        const data = await fs.readFile(CONFIG_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            // Configuración por defecto
            const configDefault = {
                smmlv: 1000000,
                auxTransporte: 117172,
                saludPct: 4,
                pensionPct: 4,
                horaDivisor: 240,
                factores: {
                    horaExtraDiurna: 1.25,
                    horaExtraNocturna: 1.75,
                    recargoNocturno: 1.35,
                    horaExtraDomDiurna: 2.00,
                    horaExtraDomNocturna: 2.50,
                    dominicalSinComp: 1.75,
                    dominicalConComp: 0.75
                },
                year: new Date().getFullYear()
            };
            await fs.writeFile(CONFIG_PATH, JSON.stringify(configDefault, null, 2));
            return configDefault;
        }
        throw createError('FILE_READ_ERROR', `Error leyendo configuración: ${error.message}`);
    }
}

/**
 * Guarda la configuración en el archivo JSON
 */
async function guardarConfig(config) {
    try {
        await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
    } catch (error) {
        throw createError('FILE_WRITE_ERROR', `Error guardando configuración: ${error.message}`);
    }
}

/**
 * GET /api/config
 * Obtener configuración actual
 */
router.get('/', asyncHandler(async (req, res) => {
    const config = await leerConfig();

    res.json({
        success: true,
        data: config
    });
}));

/**
 * PUT /api/config
 * Actualizar configuración
 */
router.put('/', asyncHandler(async (req, res) => {
    const updates = req.body;
    const config = await leerConfig();

    // Validar campos numéricos
    const camposNumericos = ['smmlv', 'auxTransporte', 'saludPct', 'pensionPct', 'horaDivisor'];
    for (const campo of camposNumericos) {
        if (updates[campo] !== undefined) {
            const valor = Number(updates[campo]);
            if (isNaN(valor) || valor < 0) {
                throw createError('VALIDATION_ERROR', `${campo} debe ser un número positivo`);
            }
            config[campo] = valor;
        }
    }

    // Actualizar factores si se proporcionan
    if (updates.factores && typeof updates.factores === 'object') {
        config.factores = {
            ...config.factores,
            ...updates.factores
        };
    }

    // Actualizar año
    if (updates.year) {
        config.year = Number(updates.year);
    }

    config.updatedAt = new Date().toISOString();

    await guardarConfig(config);

    console.log(`[INFO] Configuración actualizada`);

    res.json({
        success: true,
        message: 'Configuración actualizada exitosamente',
        data: config
    });
}));

/**
 * GET /api/config/formulas
 * Obtener fórmulas de cálculo con valores actuales
 */
router.get('/formulas', asyncHandler(async (req, res) => {
    const config = await leerConfig();
    const salario = config.smmlv;
    const divisor = config.horaDivisor;

    const formulas = {
        descripcion: 'Fórmulas de cálculo basadas en la configuración actual',
        configuracion: {
            smmlv: config.smmlv,
            auxTransporte: config.auxTransporte,
            horaDivisor: config.horaDivisor,
            saludPct: config.saludPct,
            pensionPct: config.pensionPct
        },
        valoresCalculados: {
            valorDia: {
                formula: 'salario / 30',
                calculo: `${salario} / 30`,
                resultado: Math.round(salario / 30 * 100) / 100
            },
            horaOrdinaria: {
                formula: 'salario / horaDivisor',
                calculo: `${salario} / ${divisor}`,
                resultado: Math.round(salario / divisor * 100) / 100
            },
            horaExtraDiurna: {
                formula: 'horaOrdinaria * 1.25',
                factor: 1.25,
                resultado: Math.round((salario / divisor) * 1.25 * 100) / 100
            },
            horaExtraNocturna: {
                formula: 'horaOrdinaria * 1.75',
                factor: 1.75,
                resultado: Math.round((salario / divisor) * 1.75 * 100) / 100
            },
            recargoNocturno: {
                formula: 'horaOrdinaria * 1.35',
                factor: 1.35,
                resultado: Math.round((salario / divisor) * 1.35 * 100) / 100
            },
            horaExtraDomDiurna: {
                formula: 'horaOrdinaria * 2.00',
                factor: 2.00,
                resultado: Math.round((salario / divisor) * 2.00 * 100) / 100
            },
            horaExtraDomNocturna: {
                formula: 'horaOrdinaria * 2.50',
                factor: 2.50,
                resultado: Math.round((salario / divisor) * 2.50 * 100) / 100
            },
            deduccionSaludDia: {
                formula: '(salario * saludPct%) / 30',
                calculo: `(${salario} * ${config.saludPct}%) / 30`,
                resultado: Math.round((salario * (config.saludPct / 100)) / 30 * 100) / 100
            },
            deduccionPensionDia: {
                formula: '(salario * pensionPct%) / 30',
                calculo: `(${salario} * ${config.pensionPct}%) / 30`,
                resultado: Math.round((salario * (config.pensionPct / 100)) / 30 * 100) / 100
            }
        },
        referencia: 'Normativa laboral colombiana vigente'
    };

    res.json({
        success: true,
        data: formulas
    });
}));

module.exports = router;
