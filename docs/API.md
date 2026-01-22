# API Reference - Nómina BJ Pro 4.0

Base URL: `http://localhost:3000/api`

---

## Health Check

### GET /health
Verifica el estado del servidor.

**Response:**
```json
{
  "success": true,
  "message": "Nómina BJ Pro 4.0 - API funcionando",
  "version": "4.0.0",
  "environment": "development",
  "timestamp": "2026-01-22T02:49:02.025Z"
}
```

---

## Empleados

### GET /empleados
Listar todos los empleados.

**Query Parameters:**
- `activo` (boolean) - Filtrar por estado
- `tipoCuenta` (string) - Filtrar por tipo: AHORROS, NEQUI, EFECTIVO

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "cedula": "43677978",
      "nombres": "DORA JANETH JIMENEZ DAVILA",
      "cuenta": "00647134998",
      "tipoCuenta": "AHORROS",
      "salarioBase": 1000000,
      "auxTransporte": 117172,
      "activo": true
    }
  ],
  "total": 26
}
```

### GET /empleados/:cedula
Obtener empleado por cédula.

### POST /empleados
Crear nuevo empleado.

**Body:**
```json
{
  "cedula": "12345678",
  "nombres": "NOMBRE COMPLETO",
  "cuenta": "123456789",
  "tipoCuenta": "AHORROS",
  "salarioBase": 1000000,
  "auxTransporte": 117172
}
```

### PUT /empleados/:cedula
Actualizar empleado.

### DELETE /empleados/:cedula
Desactivar empleado (soft delete).

**Query Parameters:**
- `hardDelete=true` - Eliminar permanentemente

---

## Configuración

### GET /config
Obtener configuración actual del sistema.

**Response:**
```json
{
  "success": true,
  "data": {
    "smmlv": 1000000,
    "auxTransporte": 117172,
    "saludPct": 4,
    "pensionPct": 4,
    "horaDivisor": 240,
    "factores": {
      "horaExtraDiurna": 1.25,
      "horaExtraNocturna": 1.75,
      "recargoNocturno": 1.35,
      "horaExtraDomDiurna": 2.00,
      "horaExtraDomNocturna": 2.50,
      "dominicalSinComp": 1.75,
      "dominicalConComp": 0.75
    },
    "year": 2022
  }
}
```

### PUT /config
Actualizar configuración.

### GET /config/formulas
Obtener fórmulas de cálculo con valores calculados.

---

## Nóminas

### GET /nominas
Listar todos los períodos de nómina.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "periodo": "2022-S19",
      "estado": "aprobada",
      "fechaInicio": "2022-05-02",
      "fechaFin": "2022-05-08",
      "totalEmpleados": 26,
      "totalNomina": 7036404.93,
      "totalConsignado": 5406156.40
    }
  ],
  "total": 1
}
```

### GET /nominas/:periodo
Obtener detalle de un período de nómina.

### POST /nominas/liquidar
Liquidar nómina de un empleado.

**Body:**
```json
{
  "cedula": "43677978",
  "periodo": "2022-S19",
  "tipoNomina": "SEMANAL",
  "novedades": {
    "diasLaborados": 7,
    "horasExtraDiurna": 0,
    "horasExtraNocturna": 0,
    "bonificacion": 206459.87,
    "prestamo": 0
  },
  "guardar": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Liquidación calculada y guardada",
  "data": {
    "cedula": "43677978",
    "nombres": "DORA JANETH JIMENEZ DAVILA",
    "diasLaborados": 7,
    "salarioDevengado": 233333.33,
    "auxDevengado": 27340.13,
    "deduccionSalud": 9333.33,
    "deduccionPension": 9333.33,
    "bonificacion": 206459.87,
    "valorNominaSemanal": 242006.80,
    "valorBoniSemanal": 206459.87,
    "totalNomina": 448466.67,
    "totalConsignado": 242006.80
  }
}
```

### POST /nominas/liquidar-all
Liquidar nómina de todos los empleados activos.

**Body:**
```json
{
  "periodo": "2022-S19",
  "tipoNomina": "SEMANAL",
  "fechaInicio": "2022-05-02",
  "fechaFin": "2022-05-08",
  "novedadesDefault": {
    "diasLaborados": 7
  },
  "novedadesPorEmpleado": {
    "43677978": { "bonificacion": 206459.87 }
  }
}
```

### PUT /nominas/:periodo/aprobar
Aprobar y cerrar un período de nómina.

---

## Códigos de Error

| Código | HTTP | Descripción |
|--------|------|-------------|
| `EMP_NOT_FOUND` | 404 | Empleado no encontrado |
| `EMP_DUPLICATE` | 409 | Cédula duplicada |
| `EMP_INVALID_DATA` | 400 | Datos del empleado inválidos |
| `CALC_INVALID_DAYS` | 400 | Días laborados fuera de rango (0-30) |
| `CALC_NEGATIVE_RESULT` | 400 | Resultado de cálculo negativo |
| `NOMINA_NOT_FOUND` | 404 | Período de nómina no encontrado |
| `NOMINA_ALREADY_CLOSED` | 400 | Período ya cerrado |
| `VALIDATION_ERROR` | 400 | Error de validación general |
| `FILE_READ_ERROR` | 500 | Error leyendo archivo de datos |
| `FILE_WRITE_ERROR` | 500 | Error guardando archivo de datos |

**Formato de Error:**
```json
{
  "success": false,
  "error": {
    "code": "EMP_NOT_FOUND",
    "message": "Empleado con cédula 12345678 no encontrado"
  }
}
```
