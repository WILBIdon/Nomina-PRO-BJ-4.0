/**
 * Motor de Cálculo de Nómina - Nómina BJ Pro 4.0
 * 
 * Implementa las fórmulas exactas del Excel "NOMINA NUEVA.xlsx"
 * Basado en la normativa laboral colombiana 2022
 * 
 * REFERENCIA DE FÓRMULAS:
 * - VR. DÍA = salario / 30
 * - VR. SEMANAL = salario / 30 * diasLaborados
 * - AUX. TRANSPORTE = 117172 (constante legal)
 * - DEDUCCION SALUD DÍA = (salario * 4%) / 30
 * - DEDUCCION PENSION DÍA = (salario * 4%) / 30
 * - HORA ORDINARIA = salario / 240
 * - HORA EXTRA DIURNA = horaOrdinaria * 1.25
 * - HORA EXTRA NOCTURNA = horaOrdinaria * 1.75
 * - RECARGO NOCTURNO = horaOrdinaria * 1.35
 * - HORA EXTRA DOM/FEST DIURNA = horaOrdinaria * 2.00
 * - HORA EXTRA DOM/FEST NOCTURNA = horaOrdinaria * 2.50
 * - DOMINICAL SIN COMP = (salario/30) * 1.75
 * - DOMINICAL CON COMP = (salario/30) * 0.75
 */

const { createError } = require('../middleware/errorHandler');

/**
 * Valida los datos de entrada para el cálculo
 * @param {Object} empleado - Datos del empleado
 * @param {Object} novedades - Novedades del período
 * @param {Object} config - Configuración del sistema
 * @returns {Array} Lista de errores encontrados
 */
function validarDatos(empleado, novedades, config) {
    const errores = [];

    // Validar empleado
    if (!empleado || !empleado.salarioBase) {
        errores.push({ campo: 'empleado', mensaje: 'Empleado no válido o sin salario base' });
    }

    // Validar novedades
    if (!novedades) {
        errores.push({ campo: 'novedades', mensaje: 'Novedades no proporcionadas' });
        return errores;
    }

    const { diasLaborados, horasExtraDiurna, horasExtraNocturna, prestamo, bonificacion } = novedades;

    if (diasLaborados === undefined || diasLaborados < 0 || diasLaborados > 30) {
        errores.push({ campo: 'diasLaborados', mensaje: 'Debe estar entre 0 y 30' });
    }

    if (horasExtraDiurna !== undefined && horasExtraDiurna < 0) {
        errores.push({ campo: 'horasExtraDiurna', mensaje: 'No puede ser negativo' });
    }

    if (horasExtraNocturna !== undefined && horasExtraNocturna < 0) {
        errores.push({ campo: 'horasExtraNocturna', mensaje: 'No puede ser negativo' });
    }

    if (prestamo !== undefined && prestamo < 0) {
        errores.push({ campo: 'prestamo', mensaje: 'No puede ser negativo' });
    }

    if (bonificacion !== undefined && bonificacion < 0) {
        errores.push({ campo: 'bonificacion', mensaje: 'No puede ser negativo' });
    }

    // Validar config
    if (!config || !config.smmlv) {
        errores.push({ campo: 'config', mensaje: 'Configuración del sistema no disponible' });
    }

    return errores;
}

/**
 * Calcula los valores base por día y hora
 * @param {number} salarioBase - Salario mensual base
 * @param {Object} config - Configuración del sistema
 * @returns {Object} Valores base calculados
 */
function calcularValoresBase(salarioBase, config) {
    const horaDivisor = config.horaDivisor || 240;

    return {
        // Valores diarios
        valorDia: salarioBase / 30,
        auxDia: config.auxTransporte / 30,
        saludDia: (salarioBase * (config.saludPct / 100)) / 30,
        pensionDia: (salarioBase * (config.pensionPct / 100)) / 30,

        // Valores por hora
        horaOrdinaria: salarioBase / horaDivisor,
        horaExtraDiurna: (salarioBase / horaDivisor) * config.factores.horaExtraDiurna,
        horaExtraNocturna: (salarioBase / horaDivisor) * config.factores.horaExtraNocturna,
        recargoNocturno: (salarioBase / horaDivisor) * config.factores.recargoNocturno,
        horaExtraDomDiurna: (salarioBase / horaDivisor) * config.factores.horaExtraDomDiurna,
        horaExtraDomNocturna: (salarioBase / horaDivisor) * config.factores.horaExtraDomNocturna,

        // Dominicales
        dominicalSinComp: (salarioBase / 30) * config.factores.dominicalSinComp,
        dominicalConComp: (salarioBase / 30) * config.factores.dominicalConComp
    };
}

/**
 * Calcula la nómina semanal de un empleado
 * @param {Object} empleado - Datos del empleado
 * @param {Object} novedades - Novedades del período
 * @param {Object} config - Configuración del sistema
 * @returns {Object} Resultado del cálculo
 */
function calcularNominaSemanal(empleado, novedades, config) {
    // Validar datos de entrada
    const errores = validarDatos(empleado, novedades, config);
    if (errores.length > 0) {
        const error = createError('VALIDATION_ERROR', 'Error en los datos de entrada');
        error.details = errores;
        throw error;
    }

    // LÓGICA DE SALARIO MÍNIMO AUTOMÁTICO
    // Si el empleado tiene marcado "esSalarioMinimo", ignoramos su salarioBase almacenado
    // y usamos el de la configuración global.
    let salarioBaseReal = empleado.salarioBase;
    if (empleado.esSalarioMinimo) {
        salarioBaseReal = config.smmlv;
    }

    const { auxTransporte, nombres, cedula } = empleado;
    const {
        diasLaborados = 7,
        horasExtraDiurna = 0,
        horasExtraNocturna = 0,
        horasRecargoNocturno = 0,
        horasExtraDomDiurna = 0,
        horasExtraDomNocturna = 0,
        dominicalSinComp = 0,
        dominicalConComp = 0,
        bonificacion = 0,
        prestamo = 0
    } = novedades;

    // Calcular valores base con el salario real
    const base = calcularValoresBase(salarioBaseReal, config);

    // 1. DEVENGADOS
    // Salario proporcional a días trabajados
    const salarioDevengado = base.valorDia * diasLaborados;

    // Auxilio de transporte (solo si gana <= 2 SMMLV)
    const tieneAuxilio = salarioBase <= (config.smmlv * 2);
    const auxDevengado = tieneAuxilio ? base.auxDia * diasLaborados : 0;

    // Horas extras y recargos
    const valorHorasExtraDiurna = horasExtraDiurna * base.horaExtraDiurna;
    const valorHorasExtraNocturna = horasExtraNocturna * base.horaExtraNocturna;
    const valorRecargoNocturno = horasRecargoNocturno * base.recargoNocturno;
    const valorHorasExtraDomDiurna = horasExtraDomDiurna * base.horaExtraDomDiurna;
    const valorHorasExtraDomNocturna = horasExtraDomNocturna * base.horaExtraDomNocturna;
    const valorDominicalSinComp = dominicalSinComp * base.dominicalSinComp;
    const valorDominicalConComp = dominicalConComp * base.dominicalConComp;

    const totalExtras = valorHorasExtraDiurna + valorHorasExtraNocturna + valorRecargoNocturno +
        valorHorasExtraDomDiurna + valorHorasExtraDomNocturna +
        valorDominicalSinComp + valorDominicalConComp;

    // Total devengado (salarial, sin bonificación)
    const totalDevengadoSalarial = salarioDevengado + totalExtras;

    // 2. DEDUCCIONES
    // Salud y pensión (sobre el devengado salarial, sin auxilio)
    const deduccionSalud = base.saludDia * diasLaborados;
    const deduccionPension = base.pensionDia * diasLaborados;
    const deduccionPrestamo = prestamo;

    const totalDeducciones = deduccionSalud + deduccionPension + deduccionPrestamo;

    // 3. NETO A PAGAR
    // Valor nómina semanal (sin bonificación)
    const valorNominaSemanal = totalDevengadoSalarial + auxDevengado - deduccionSalud - deduccionPension;

    // Bonificación no constitutiva de salario (se paga aparte, sin deducciones)
    const valorBoniSemanal = bonificacion - deduccionPrestamo;

    // Total nómina (nómina + bonificación)
    const totalNomina = valorNominaSemanal + valorBoniSemanal;

    // Total consignado banco (solo nómina, sin bonificación)
    const totalConsignado = valorNominaSemanal;

    // Verificar que el neto no sea negativo
    if (totalNomina < 0) {
        console.warn(`[WARN] Nómina negativa para ${cedula}: ${totalNomina}`);
    }

    // Resultado final
    return {
        // Identificación
        cedula,
        nombres,

        // Parámetros
        diasLaborados,
        salarioBase,
        auxTransporte: tieneAuxilio ? auxTransporte : 0,

        // Devengados
        salarioDevengado: redondear(salarioDevengado),
        auxDevengado: redondear(auxDevengado),
        totalExtras: redondear(totalExtras),
        detalleExtras: {
            horasExtraDiurna: { cantidad: horasExtraDiurna, valor: redondear(valorHorasExtraDiurna) },
            horasExtraNocturna: { cantidad: horasExtraNocturna, valor: redondear(valorHorasExtraNocturna) },
            recargoNocturno: { cantidad: horasRecargoNocturno, valor: redondear(valorRecargoNocturno) },
            horasExtraDomDiurna: { cantidad: horasExtraDomDiurna, valor: redondear(valorHorasExtraDomDiurna) },
            horasExtraDomNocturna: { cantidad: horasExtraDomNocturna, valor: redondear(valorHorasExtraDomNocturna) },
            dominicalSinComp: { cantidad: dominicalSinComp, valor: redondear(valorDominicalSinComp) },
            dominicalConComp: { cantidad: dominicalConComp, valor: redondear(valorDominicalConComp) }
        },
        bonificacion: redondear(bonificacion),
        totalDevengado: redondear(totalDevengadoSalarial + auxDevengado + bonificacion),

        // Deducciones
        deduccionSalud: redondear(deduccionSalud),
        deduccionPension: redondear(deduccionPension),
        deduccionPrestamo: redondear(deduccionPrestamo),
        totalDeducciones: redondear(totalDeducciones),

        // Netos
        valorNominaSemanal: redondear(valorNominaSemanal),
        valorBoniSemanal: redondear(valorBoniSemanal),
        totalNomina: redondear(totalNomina),
        totalConsignado: redondear(totalConsignado),

        // Metadata
        valoresBase: {
            valorDia: redondear(base.valorDia),
            auxDia: redondear(base.auxDia),
            horaOrdinaria: redondear(base.horaOrdinaria),
            saludDia: redondear(base.saludDia),
            pensionDia: redondear(base.pensionDia)
        }
    };
}

/**
 * Calcula la nómina mensual de un empleado
 * @param {Object} empleado - Datos del empleado
 * @param {Object} novedades - Novedades del período
 * @param {Object} config - Configuración del sistema
 * @returns {Object} Resultado del cálculo
 */
function calcularNominaMensual(empleado, novedades, config) {
    // Para mensual, ajustamos días laborados a 30 por defecto
    const novedadesMensual = {
        ...novedades,
        diasLaborados: novedades.diasLaborados || 30
    };

    const resultado = calcularNominaSemanal(empleado, novedadesMensual, config);
    resultado.tipoNomina = 'MENSUAL';

    return resultado;
}

/**
 * Redondea a 2 decimales
 * @param {number} valor - Valor a redondear
 * @returns {number} Valor redondeado
 */
function redondear(valor) {
    return Math.round(valor * 100) / 100;
}

/**
 * Formatea un valor como moneda colombiana
 * @param {number} valor - Valor a formatear
 * @returns {string} Valor formateado
 */
function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(valor);
}

module.exports = {
    validarDatos,
    calcularValoresBase,
    calcularNominaSemanal,
    calcularNominaMensual,
    redondear,
    formatearMoneda
};
