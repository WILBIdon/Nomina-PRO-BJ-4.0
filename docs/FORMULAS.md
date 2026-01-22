# Fórmulas de Cálculo - Nómina BJ Pro 4.0

> Basado en el archivo Excel "NOMINA NUEVA.xlsx" y normativa laboral colombiana 2022

---

## 1. Constantes Base

| Variable | Valor 2022 | Fórmula |
|----------|------------|---------|
| SMMLV | $1,000,000 | Decreto anual |
| Auxilio Transporte | $117,172 | Decreto anual |
| Divisor Hora | 240 | *224 desde jul 2026 (Ley 2101)* |
| % Salud Empleado | 4% | Ley 100 |
| % Pensión Empleado | 4% | Ley 100 |

---

## 2. Valores Diarios

### Valor Día Salario
```
VR. DÍA = salarioBase / 30
```
**Ejemplo:** $1,000,000 / 30 = **$33,333.33**

### Valor Día Auxilio Transporte
```
VR. AUX DÍA = auxTransporte / 30
```
**Ejemplo:** $117,172 / 30 = **$3,905.73**

### Deducción Salud por Día
```
DEDUCCION SALUD DÍA = (salarioBase × 4%) / 30
```
**Ejemplo:** ($1,000,000 × 0.04) / 30 = **$1,333.33**

### Deducción Pensión por Día
```
DEDUCCION PENSION DÍA = (salarioBase × 4%) / 30
```
**Ejemplo:** ($1,000,000 × 0.04) / 30 = **$1,333.33**

---

## 3. Valores por Hora

### Hora Ordinaria
```
HORA ORDINARIA = salarioBase / horaDivisor
```
**Ejemplo:** $1,000,000 / 240 = **$4,166.67**

### Hora Extra Diurna (25% adicional)
```
H.E. DIURNA = horaOrdinaria × 1.25
```
**Ejemplo:** $4,166.67 × 1.25 = **$5,208.33**

### Hora Extra Nocturna (75% adicional)
```
H.E. NOCTURNA = horaOrdinaria × 1.75
```
**Ejemplo:** $4,166.67 × 1.75 = **$7,291.67**

### Recargo Nocturno (35% adicional)
```
RECARGO NOCTURNO = horaOrdinaria × 1.35
```
**Ejemplo:** $4,166.67 × 1.35 = **$5,625.00**

### Hora Extra Dominical/Festivo Diurna (100% adicional)
```
H.E. DOM DIURNA = horaOrdinaria × 2.00
```
**Ejemplo:** $4,166.67 × 2.00 = **$8,333.33**

### Hora Extra Dominical/Festivo Nocturna (150% adicional)
```
H.E. DOM NOCTURNA = horaOrdinaria × 2.50
```
**Ejemplo:** $4,166.67 × 2.50 = **$10,416.67**

---

## 4. Dominicales

### Dominical Sin Descanso Compensatorio (75% adicional)
```
DOMINICAL SIN COMP = (salarioBase / 30) × 1.75
```
**Ejemplo:** ($1,000,000 / 30) × 1.75 = **$58,333.33**

### Dominical Con Descanso Compensatorio (solo recargo 75%)
```
DOMINICAL CON COMP = (salarioBase / 30) × 0.75
```
**Ejemplo:** ($1,000,000 / 30) × 0.75 = **$25,000.00**

---

## 5. Cálculo de Nómina Semanal

### Paso 1: Devengados
```javascript
salarioDevengado = (salarioBase / 30) × diasLaborados
auxDevengado = (auxTransporte / 30) × diasLaborados  // Si salario <= 2 SMMLV
```

**Ejemplo (7 días):**
- Salario: $1,000,000 / 30 × 7 = **$233,333.33**
- Auxilio: $117,172 / 30 × 7 = **$27,340.13**

### Paso 2: Horas Extras
```javascript
totalExtras = (horasExtraDiurna × valorHoraDiurna) +
              (horasExtraNocturna × valorHoraNocturna) +
              (horasRecargoNocturno × valorRecargoNocturno)
```

### Paso 3: Deducciones
```javascript
deduccionSalud = (salarioBase × 4% / 30) × diasLaborados
deduccionPension = (salarioBase × 4% / 30) × diasLaborados
totalDeducciones = deduccionSalud + deduccionPension + prestamos
```

**Ejemplo (7 días):**
- Salud: ($1,000,000 × 0.04 / 30) × 7 = **$9,333.33**
- Pensión: ($1,000,000 × 0.04 / 30) × 7 = **$9,333.33**

### Paso 4: Neto a Pagar
```javascript
valorNominaSemanal = salarioDevengado + auxDevengado - deduccionSalud - deduccionPension
valorBoniSemanal = bonificacion - prestamo
totalNomina = valorNominaSemanal + valorBoniSemanal
totalConsignado = valorNominaSemanal  // Sin bonificación (se paga aparte)
```

**Ejemplo completo:**
```
Salario Devengado:    $233,333.33
+ Aux. Transporte:    $ 27,340.13
- Salud:              $  9,333.33
- Pensión:            $  9,333.33
= Valor Nómina:       $242,006.80  ✓ (coincide con Excel)

+ Bonificación:       $206,459.87
= Total Nómina:       $448,466.67  ✓ (coincide con Excel)

Total Consignado:     $242,006.80  ✓ (coincide con Excel)
```

---

## 6. Notas Importantes

### Auxilio de Transporte
- Solo aplica si el salario es **menor o igual a 2 SMMLV**
- En 2022: $1,000,000 × 2 = $2,000,000

### Bonificación No Constitutiva
- Se paga separadamente como incentivo
- **No afecta la base de cálculo** de salud, pensión o prestaciones
- Puede descontarse préstamos de esta bonificación

### Ley 2101 de 2021 (Reducción Jornada)
| Fecha | Jornada Semanal | Divisor Hora |
|-------|-----------------|--------------|
| Hasta jul 2023 | 48 horas | 240 |
| Jul 2023 - Jul 2024 | 47 horas | 235 |
| Jul 2024 - Jul 2025 | 46 horas | 230 |
| Jul 2025 - Jul 2026 | 44 horas | 220 |
| Desde jul 2026 | 42 horas | 210 |

---

## 7. Referencia Excel

Columnas del archivo NOMINA NUEVA.xlsx:

| Col | Nombre | Descripción |
|-----|--------|-------------|
| 0 | CEDULA | Identificación |
| 1 | NOMBRES | Nombre completo |
| 2 | CUENTA | Número de cuenta |
| 3 | TIPO CUENTA | AHORROS, NEQUI, EFECTIVO |
| 4 | SALARIO | Salario mensual base |
| 5 | AUXILIO DE TRANSPORTE | Auxilio mensual |
| 19 | DIAS LABORADOS SEMANA | Días trabajados |
| 20 | SALARIO DEVENGADO | Salario proporcional |
| 21 | AUX. TRANSP DEVENGADO | Auxilio proporcional |
| 22 | DEDUCCION SALUD | 4% del devengado |
| 23 | DEDUCCION PENSION | 4% del devengado |
| 25 | BONIFICACION | Bonificación semanal |
| 27 | VALOR A PAGAR NOMINA SEMANAL | Neto sin bono |
| 29 | TOTAL NOMINA | Neto total |
| 30 | TOTAL CONSIGNADO BANCO | Valor a consignar |
