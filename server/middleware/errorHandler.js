/**
 * Middleware de Gestión de Errores para Nómina BJ Pro
 * 
 * Proporciona:
 * - Clase AppError para errores operacionales
 * - Middleware de captura de errores
 * - Logging estructurado
 */

/**
 * Clase de Error personalizado para errores de la aplicación
 */
class AppError extends Error {
    /**
     * @param {string} message - Mensaje descriptivo del error
     * @param {number} statusCode - Código HTTP (400, 404, 500, etc.)
     * @param {string} code - Código interno del error (ej: EMP_NOT_FOUND)
     */
    constructor(message, statusCode, code) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Códigos de error predefinidos
 */
const ErrorCodes = {
    // Empleados
    EMP_NOT_FOUND: { code: 'EMP_NOT_FOUND', status: 404, message: 'Empleado no encontrado' },
    EMP_DUPLICATE: { code: 'EMP_DUPLICATE', status: 409, message: 'La cédula ya está registrada' },
    EMP_INVALID_DATA: { code: 'EMP_INVALID_DATA', status: 400, message: 'Datos del empleado inválidos' },

    // Cálculos
    CALC_INVALID_DAYS: { code: 'CALC_INVALID_DAYS', status: 400, message: 'Días laborados debe estar entre 0 y 30' },
    CALC_NEGATIVE_RESULT: { code: 'CALC_NEGATIVE_RESULT', status: 400, message: 'El resultado del cálculo es negativo' },
    CALC_MISSING_CONFIG: { code: 'CALC_MISSING_CONFIG', status: 500, message: 'Configuración del sistema no disponible' },

    // Archivos
    FILE_READ_ERROR: { code: 'FILE_READ_ERROR', status: 500, message: 'Error leyendo archivo de datos' },
    FILE_WRITE_ERROR: { code: 'FILE_WRITE_ERROR', status: 500, message: 'Error guardando archivo de datos' },

    // Nóminas
    NOMINA_NOT_FOUND: { code: 'NOMINA_NOT_FOUND', status: 404, message: 'Período de nómina no encontrado' },
    NOMINA_ALREADY_CLOSED: { code: 'NOMINA_ALREADY_CLOSED', status: 400, message: 'El período de nómina ya está cerrado' },

    // General
    VALIDATION_ERROR: { code: 'VALIDATION_ERROR', status: 400, message: 'Error de validación' },
    INTERNAL_ERROR: { code: 'INTERNAL_ERROR', status: 500, message: 'Error interno del servidor' }
};

/**
 * Función helper para crear errores con códigos predefinidos
 * @param {string} errorKey - Clave del error en ErrorCodes
 * @param {string} customMessage - Mensaje personalizado (opcional)
 */
function createError(errorKey, customMessage = null) {
    const errorDef = ErrorCodes[errorKey] || ErrorCodes.INTERNAL_ERROR;
    return new AppError(
        customMessage || errorDef.message,
        errorDef.status,
        errorDef.code
    );
}

/**
 * Middleware de captura y formato de errores
 */
function errorHandler(err, req, res, next) {
    // Determinar si es un error operacional o de programación
    const isOperational = err.isOperational || false;

    // Log del error
    const timestamp = new Date().toISOString();
    const logLevel = isOperational ? 'WARN' : 'ERROR';

    console.log(`[${timestamp}] [${logLevel}] ${err.code || 'UNKNOWN'}: ${err.message}`);

    if (!isOperational) {
        console.error('Stack trace:', err.stack);
    }

    // Preparar respuesta
    const statusCode = err.statusCode || 500;
    const response = {
        success: false,
        error: {
            code: err.code || 'INTERNAL_ERROR',
            message: isOperational ? err.message : 'Ha ocurrido un error en el servidor'
        }
    };

    // En desarrollo, incluir stack trace
    if (process.env.NODE_ENV === 'development') {
        response.error.stack = err.stack;
        response.error.details = err.details || null;
    }

    res.status(statusCode).json(response);
}

/**
 * Middleware para rutas no encontradas
 */
function notFoundHandler(req, res, next) {
    const error = new AppError(
        `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
        404,
        'ROUTE_NOT_FOUND'
    );
    next(error);
}

/**
 * Wrapper para funciones async (evita try-catch repetitivo)
 * @param {Function} fn - Función async del controlador
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

module.exports = {
    AppError,
    ErrorCodes,
    createError,
    errorHandler,
    notFoundHandler,
    asyncHandler
};
