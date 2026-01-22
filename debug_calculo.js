const { calcularNominaSemanal } = require('./server/services/calculoNomina');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('./server/data/config.json', 'utf8'));
const empleados = JSON.parse(fs.readFileSync('./server/data/empleados.json', 'utf8')).empleados;

// Maria Camila
const empleado = empleados.find(e => e.cedula === '1216727372');
if (!empleado) {
    console.log('Empleado no encontrado');
    process.exit(1);
}

const novedades = {
    diasLaborados: 7,
    bonificacion: empleado.bonificacionHabitual
};

console.log('---- CONFIG DATA ----');
console.log('Aux. Transporte Config:', config.auxTransporte);
console.log('SMMLV Config:', config.smmlv);

console.log('---- EMPLEADO DATA ----');
console.log('Nombres:', empleado.nombres);
console.log('Salario Base:', empleado.salarioBase);

const resultado = calcularNominaSemanal(empleado, novedades, config);

console.log('---- RESULTADO CÁLCULO ----');
console.log('Salario Devengado:', resultado.salarioDevengado);
console.log('Aux Devengado:', resultado.auxDevengado);
console.log('Total Nómina:', resultado.totalNomina);
