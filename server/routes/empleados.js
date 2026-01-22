/**
 * Rutas de Empleados - API REST
 * 
 * Endpoints:
 * GET    /api/empleados          - Listar todos los empleados
 * GET    /api/empleados/:cedula  - Obtener empleado por cédula
 * POST   /api/empleados          - Crear nuevo empleado
 * PUT    /api/empleados/:cedula  - Actualizar empleado
 * DELETE /api/empleados/:cedula  - Eliminar empleado
 */

const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { asyncHandler, createError } = require('../middleware/errorHandler');

const DATA_PATH = path.join(__dirname, '../data/empleados.json');

/**
 * Lee los empleados del archivo JSON
 */
async function leerEmpleados() {
    try {
        const data = await fs.readFile(DATA_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            // Si no existe el archivo, crear uno vacío
            await fs.writeFile(DATA_PATH, JSON.stringify({ empleados: [] }, null, 2));
            return { empleados: [] };
        }
        throw createError('FILE_READ_ERROR', `Error leyendo empleados: ${error.message}`);
    }
}

/**
 * Guarda los empleados en el archivo JSON
 */
async function guardarEmpleados(data) {
    try {
        await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
        throw createError('FILE_WRITE_ERROR', `Error guardando empleados: ${error.message}`);
    }
}

/**
 * GET /api/empleados
 * Listar todos los empleados
 */
router.get('/', asyncHandler(async (req, res) => {
    const data = await leerEmpleados();

    // Filtrar por activos si se especifica
    let empleados = data.empleados;
    if (req.query.activo !== undefined) {
        const activo = req.query.activo === 'true';
        empleados = empleados.filter(e => e.activo === activo);
    }

    // Filtrar por tipo de cuenta
    if (req.query.tipoCuenta) {
        empleados = empleados.filter(e => e.tipoCuenta === req.query.tipoCuenta.toUpperCase());
    }

    res.json({
        success: true,
        data: empleados,
        total: empleados.length
    });
}));

/**
 * GET /api/empleados/:cedula
 * Obtener empleado por cédula
 */
router.get('/:cedula', asyncHandler(async (req, res) => {
    const { cedula } = req.params;
    const data = await leerEmpleados();

    const empleado = data.empleados.find(e => e.cedula === cedula);

    if (!empleado) {
        throw createError('EMP_NOT_FOUND', `Empleado con cédula ${cedula} no encontrado`);
    }

    res.json({
        success: true,
        data: empleado
    });
}));

/**
 * POST /api/empleados
 * Crear nuevo empleado
 */
router.post('/', asyncHandler(async (req, res) => {
    const { cedula, nombres, cuenta, tipoCuenta, salarioBase, auxTransporte } = req.body;

    // Validaciones
    if (!cedula || !nombres) {
        throw createError('EMP_INVALID_DATA', 'Cédula y nombres son requeridos');
    }

    const data = await leerEmpleados();

    // Verificar duplicados
    if (data.empleados.some(e => e.cedula === cedula)) {
        throw createError('EMP_DUPLICATE', `Ya existe un empleado con cédula ${cedula}`);
    }

    const nuevoEmpleado = {
        cedula: String(cedula),
        nombres: nombres.toUpperCase().trim(),
        cuenta: cuenta || '',
        tipoCuenta: (tipoCuenta || 'AHORROS').toUpperCase(),
        salarioBase: Number(salarioBase) || 1000000,
        auxTransporte: Number(auxTransporte) || 117172,
        activo: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    data.empleados.push(nuevoEmpleado);
    await guardarEmpleados(data);

    console.log(`[INFO] Empleado creado: ${cedula} - ${nombres}`);

    res.status(201).json({
        success: true,
        message: 'Empleado creado exitosamente',
        data: nuevoEmpleado
    });
}));

/**
 * PUT /api/empleados/:cedula
 * Actualizar empleado
 */
router.put('/:cedula', asyncHandler(async (req, res) => {
    const { cedula } = req.params;
    const updates = req.body;

    const data = await leerEmpleados();
    const index = data.empleados.findIndex(e => e.cedula === cedula);

    if (index === -1) {
        throw createError('EMP_NOT_FOUND', `Empleado con cédula ${cedula} no encontrado`);
    }

    // No permitir cambiar la cédula
    delete updates.cedula;
    delete updates.createdAt;

    // Actualizar campos
    data.empleados[index] = {
        ...data.empleados[index],
        ...updates,
        updatedAt: new Date().toISOString()
    };

    // Normalizar datos
    if (updates.nombres) {
        data.empleados[index].nombres = updates.nombres.toUpperCase().trim();
    }
    if (updates.tipoCuenta) {
        data.empleados[index].tipoCuenta = updates.tipoCuenta.toUpperCase();
    }

    await guardarEmpleados(data);

    console.log(`[INFO] Empleado actualizado: ${cedula}`);

    res.json({
        success: true,
        message: 'Empleado actualizado exitosamente',
        data: data.empleados[index]
    });
}));

/**
 * DELETE /api/empleados/:cedula
 * Eliminar empleado (soft delete - marcar como inactivo)
 */
router.delete('/:cedula', asyncHandler(async (req, res) => {
    const { cedula } = req.params;
    const { hardDelete } = req.query; // ?hardDelete=true para eliminar permanentemente

    const data = await leerEmpleados();
    const index = data.empleados.findIndex(e => e.cedula === cedula);

    if (index === -1) {
        throw createError('EMP_NOT_FOUND', `Empleado con cédula ${cedula} no encontrado`);
    }

    if (hardDelete === 'true') {
        // Eliminar permanentemente
        const [eliminado] = data.empleados.splice(index, 1);
        console.log(`[WARN] Empleado eliminado permanentemente: ${cedula}`);

        await guardarEmpleados(data);

        res.json({
            success: true,
            message: 'Empleado eliminado permanentemente',
            data: eliminado
        });
    } else {
        // Soft delete - marcar como inactivo
        data.empleados[index].activo = false;
        data.empleados[index].updatedAt = new Date().toISOString();

        await guardarEmpleados(data);

        console.log(`[INFO] Empleado desactivado: ${cedula}`);

        res.json({
            success: true,
            message: 'Empleado desactivado exitosamente',
            data: data.empleados[index]
        });
    }
}));

/**
 * POST /api/empleados/actualizar-minimo
 * Actualizar salario base de empleados que ganan menos del nuevo mínimo
 */
router.post('/actualizar-minimo', asyncHandler(async (req, res) => {
    const { nuevoSalarioMinimo } = req.body;
    const minimo = Number(nuevoSalarioMinimo);

    if (!minimo || minimo <= 0) {
        throw createError('VALIDATION_ERROR', 'El nuevo salario mínimo debe ser un número positivo');
    }

    const data = await leerEmpleados();
    let contador = 0;

    // Actualizar empleados activos que ganen menos del nuevo mínimo
    data.empleados = data.empleados.map(emp => {
        if (emp.activo !== false && emp.salarioBase < minimo) {
            contador++;
            return {
                ...emp,
                salarioBase: minimo,
                updatedAt: new Date().toISOString()
            };
        }
        return emp;
    });

    if (contador > 0) {
        await guardarEmpleados(data);
        console.log(`[INFO] Se actualizaron ${contador} empleados al nuevo mínimo: ${minimo}`);
    }

    res.json({
        success: true,
        message: `Se actualizaron ${contador} empleados al nuevo salario mínimo.`,
        data: {
            empleadosActualizados: contador,
            nuevoMinimo: minimo
        }
    });
}));

module.exports = router;
