import { useState, useEffect, useMemo } from 'react';
import './App.css';

// ========================
// CONFIGURACIÓN API
// ========================
const API_BASE = 'http://localhost:3000/api';

// ========================
// UTILIDADES
// ========================
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

// Hook para llamadas a la API
function useApi(endpoint) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}${endpoint}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error?.message || 'Error desconocido');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [endpoint]);

  return { data, loading, error, refetch: fetchData };
}

// ========================
// APLICACIÓN PRINCIPAL
// ========================
export default function App() {
  const [activeTab, setActiveTab] = useState('liquidacion');

  return (
    <div className="app-container">
      {/* HEADER */}
      <header className="app-header">
        <div className="header-content">
          <div className="header-brand">
            <span className="header-icon">🧾</span>
            <h1>Nómina Pro <span className="accent">4.0</span></h1>
          </div>
          <div className="header-badge">
            Normativa Colombia 2026
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="main-content">
        {/* NAVEGACIÓN */}
        <nav className="side-nav">
          <NavButton
            active={activeTab === 'liquidacion'}
            onClick={() => setActiveTab('liquidacion')}
            icon="💵"
            label="Liquidación"
          />
          <NavButton
            active={activeTab === 'empleados'}
            onClick={() => setActiveTab('empleados')}
            icon="👥"
            label="Empleados"
          />
          <NavButton
            active={activeTab === 'historial'}
            onClick={() => setActiveTab('historial')}
            icon="📋"
            label="Historial"
          />
          <NavButton
            active={activeTab === 'configuracion'}
            onClick={() => setActiveTab('configuracion')}
            icon="⚙️"
            label="Configuración"
          />
        </nav>

        {/* PANELES */}
        <div className="content-panel">
          {activeTab === 'empleados' && <EmpleadosPanel />}
          {activeTab === 'configuracion' && <ConfigPanel />}
          {activeTab === 'liquidacion' && <LiquidacionPanel />}
          {activeTab === 'historial' && <HistorialPanel />}
        </div>
      </main>
    </div>
  );
}

// ========================
// BOTÓN DE NAVEGACIÓN
// ========================
function NavButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`nav-button ${active ? 'active' : ''}`}
    >
      <span className="nav-icon">{icon}</span>
      <span className="nav-label">{label}</span>
    </button>
  );
}

// ========================
// PANEL DE EMPLEADOS
// ========================
function EmpleadosPanel() {
  const { data: empleados, loading, error, refetch } = useApi('/empleados');
  const [formData, setFormData] = useState({
    cedula: '', nombres: '', cuenta: '', tipoCuenta: 'AHORROS', salarioBase: 1000000
  });
  const [isEditing, setIsEditing] = useState(false);
  const [formError, setFormError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    try {
      const url = isEditing
        ? `${API_BASE}/empleados/${formData.cedula}`
        : `${API_BASE}/empleados`;

      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const json = await res.json();

      if (json.success) {
        setFormData({ cedula: '', nombres: '', cuenta: '', tipoCuenta: 'AHORROS', salarioBase: 1000000 });
        setIsEditing(false);
        refetch();
      } else {
        setFormError(json.error?.message || 'Error al guardar');
      }
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleEdit = (emp) => {
    setFormData(emp);
    setIsEditing(true);
  };

  const handleDelete = async (cedula) => {
    if (!confirm('¿Desactivar este empleado?')) return;

    try {
      await fetch(`${API_BASE}/empleados/${cedula}`, { method: 'DELETE' });
      refetch();
    } catch (err) {
      setFormError(err.message);
    }
  };

  if (loading) return <div className="loading">Cargando empleados...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;

  return (
    <div className="panel empleados-panel">
      <h2>👥 Gestión de Personal</h2>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="form-grid">
        <div className="form-group">
          <label>Cédula</label>
          <input
            required
            type="text"
            placeholder="102030..."
            value={formData.cedula}
            onChange={e => setFormData({ ...formData, cedula: e.target.value })}
            disabled={isEditing}
          />
        </div>
        <div className="form-group span-2">
          <label>Nombre Completo</label>
          <input
            required
            type="text"
            placeholder="NOMBRE APELLIDO"
            value={formData.nombres}
            onChange={e => setFormData({ ...formData, nombres: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Salario Base</label>
          <input
            required
            type="number"
            placeholder="1000000"
            value={formData.salarioBase}
            onChange={e => setFormData({ ...formData, salarioBase: Number(e.target.value) })}
          />
        </div>
        <div className="form-group">
          <label>Tipo Cuenta</label>
          <select
            value={formData.tipoCuenta}
            onChange={e => setFormData({ ...formData, tipoCuenta: e.target.value })}
          >
            <option value="AHORROS">Ahorros</option>
            <option value="NEQUI">Nequi</option>
            <option value="EFECTIVO">Efectivo</option>
          </select>
        </div>
        <div className="form-group">
          <label>Cuenta</label>
          <input
            type="text"
            placeholder="Número de cuenta"
            value={formData.cuenta}
            onChange={e => setFormData({ ...formData, cuenta: e.target.value })}
          />
        </div>
        <div className="form-group form-actions">
          <button type="submit" className="btn btn-primary">
            {isEditing ? '💾 Actualizar' : '➕ Crear'}
          </button>
          {isEditing && (
            <button type="button" className="btn btn-secondary" onClick={() => {
              setFormData({ cedula: '', nombres: '', cuenta: '', tipoCuenta: 'AHORROS', salarioBase: 1000000 });
              setIsEditing(false);
            }}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      {formError && <div className="error-message">{formError}</div>}

      {/* Tabla */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Cédula</th>
              <th>Nombre</th>
              <th>Salario</th>
              <th>Cuenta</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {empleados?.map(emp => (
              <tr key={emp.cedula} className={!emp.activo ? 'inactive' : ''}>
                <td className="mono">{emp.cedula}</td>
                <td>{emp.nombres}</td>
                <td className="money">{formatCurrency(emp.salarioBase)}</td>
                <td className="mono">{emp.cuenta || '-'}</td>
                <td><span className={`badge badge-${emp.tipoCuenta?.toLowerCase()}`}>{emp.tipoCuenta}</span></td>
                <td><span className={`badge ${emp.activo ? 'badge-success' : 'badge-danger'}`}>{emp.activo ? 'Activo' : 'Inactivo'}</span></td>
                <td className="actions">
                  <button onClick={() => handleEdit(emp)} className="btn-icon" title="Editar">✏️</button>
                  <button onClick={() => handleDelete(emp.cedula)} className="btn-icon danger" title="Desactivar">🗑️</button>
                </td>
              </tr>
            ))}
            {(!empleados || empleados.length === 0) && (
              <tr><td colSpan="7" className="empty">No hay empleados registrados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ========================
// PANEL DE CONFIGURACIÓN
// ========================
function ConfigPanel() {
  const { data: config, loading, error, refetch } = useApi('/config');
  const [formData, setFormData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (config) setFormData(config);
  }, [config]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`${API_BASE}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const json = await res.json();

      if (json.success) {
        setMessage({ type: 'success', text: 'Configuración guardada exitosamente' });
        refetch();
      } else {
        setMessage({ type: 'error', text: json.error?.message || 'Error al guardar' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Cargando configuración...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;
  if (!formData) return null;

  return (
    <div className="panel config-panel">
      <h2>⚙️ Variables Legales (2022)</h2>

      <div className="info-box">
        <span className="info-icon">ℹ️</span>
        <p>Estos valores afectan todos los cálculos de nómina. Asegúrese de actualizarlos conforme a los decretos oficiales.</p>
      </div>

      <div className="config-grid">
        <div className="form-group">
          <label>Salario Mínimo (SMMLV)</label>
          <div className="input-prefix">
            <span>$</span>
            <input
              type="number"
              value={formData.smmlv}
              onChange={e => setFormData({ ...formData, smmlv: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Auxilio de Transporte</label>
          <div className="input-prefix">
            <span>$</span>
            <input
              type="number"
              value={formData.auxTransporte}
              onChange={e => setFormData({ ...formData, auxTransporte: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Divisor Hora Mensual</label>
          <input
            type="number"
            value={formData.horaDivisor}
            onChange={e => setFormData({ ...formData, horaDivisor: Number(e.target.value) })}
          />
          <small>Actual: 240 | Ley 2101: 224 (julio 2026)</small>
        </div>

        <div className="form-group">
          <label>% Salud (Empleado)</label>
          <input
            type="number"
            step="0.1"
            value={formData.saludPct}
            onChange={e => setFormData({ ...formData, saludPct: Number(e.target.value) })}
          />
        </div>

        <div className="form-group">
          <label>% Pensión (Empleado)</label>
          <input
            type="number"
            step="0.1"
            value={formData.pensionPct}
            onChange={e => setFormData({ ...formData, pensionPct: Number(e.target.value) })}
          />
        </div>
      </div>

      {message && (
        <div className={`message ${message.type}`}>{message.text}</div>
      )}

      <button onClick={handleSave} disabled={saving} className="btn btn-primary">
        {saving ? '⏳ Guardando...' : '💾 Guardar Parámetros'}
      </button>
    </div>
  );
}

// ========================
// PANEL DE LIQUIDACIÓN
// ========================
function LiquidacionPanel() {
  const { data: empleados, loading: loadingEmp } = useApi('/empleados?activo=true');
  const { data: config, loading: loadingConfig } = useApi('/config');

  const [selectedCedula, setSelectedCedula] = useState('');
  const [periodo, setPeriodo] = useState('2022-S19');
  const [novedades, setNovedades] = useState({
    diasLaborados: 7,
    horasExtraDiurna: 0,
    horasExtraNocturna: 0,
    bonificacion: 0,
    prestamo: 0
  });

  const [resultado, setResultado] = useState(null);
  const [calculando, setCalculando] = useState(false);
  const [error, setError] = useState(null);

  // Cargar bonificación habitual cuando cambia el empleado
  useEffect(() => {
    if (selectedCedula && empleados) {
      const emp = empleados.find(e => e.cedula === selectedCedula);
      if (emp && emp.bonificacionHabitual) {
        setNovedades(prev => ({
          ...prev,
          bonificacion: emp.bonificacionHabitual
        }));
      } else {
        setNovedades(prev => ({
          ...prev,
          bonificacion: 0
        }));
      }
    }
  }, [selectedCedula, empleados]);

  // Calcular automáticamente cuando cambian los datos
  useEffect(() => {
    if (!selectedCedula || !config) {
      setResultado(null);
      return;
    }

    const calcular = async () => {
      setCalculando(true);
      setError(null);

      try {
        const res = await fetch(`${API_BASE}/nominas/liquidar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cedula: selectedCedula,
            periodo,
            tipoNomina: 'SEMANAL',
            novedades,
            guardar: false // Solo calcular, no guardar
          })
        });

        const json = await res.json();

        if (json.success) {
          setResultado(json.data);
        } else {
          setError(json.error?.message || 'Error en el cálculo');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setCalculando(false);
      }
    };

    const timer = setTimeout(calcular, 300); // Debounce
    return () => clearTimeout(timer);
  }, [selectedCedula, periodo, novedades, config]);

  const handleGuardar = async () => {
    if (!resultado) return;

    try {
      const res = await fetch(`${API_BASE}/nominas/liquidar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cedula: selectedCedula,
          periodo,
          tipoNomina: 'SEMANAL',
          novedades,
          guardar: true
        })
      });

      const json = await res.json();

      if (json.success) {
        alert('✅ Liquidación guardada exitosamente');
      } else {
        alert('❌ Error: ' + (json.error?.message || 'Error desconocido'));
      }
    } catch (err) {
      alert('❌ Error: ' + err.message);
    }
  };

  if (loadingEmp || loadingConfig) return <div className="loading">Cargando...</div>;

  return (
    <div className="panel liquidacion-panel">
      <div className="liquidacion-grid">
        {/* Columna Izquierda: Entradas */}
        <div className="novedades-section">
          <h2>📝 Registrar Novedades</h2>

          <div className="form-group">
            <label>Período</label>
            <select value={periodo} onChange={e => setPeriodo(e.target.value)}>
              <option value="2022-S19">Semana 19 (May 2-8)</option>
              <option value="2022-S20">Semana 20 (May 9-15)</option>
              <option value="2022-S21">Semana 21 (May 16-22)</option>
              <option value="2022-S22">Semana 22 (May 23-29)</option>
            </select>
          </div>

          <div className="form-group">
            <label>🔍 Seleccionar Empleado</label>
            <select
              className="select-empleado"
              value={selectedCedula}
              onChange={e => setSelectedCedula(e.target.value)}
            >
              <option value="">-- Buscar Empleado --</option>
              {empleados?.map(e => (
                <option key={e.cedula} value={e.cedula}>{e.nombres} - {e.cedula}</option>
              ))}
            </select>
          </div>

          {selectedCedula && (
            <div className="novedades-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Días Trabajados</label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={novedades.diasLaborados}
                    onChange={e => setNovedades({ ...novedades, diasLaborados: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Bonificación</label>
                  <input
                    type="number"
                    value={novedades.bonificacion}
                    onChange={e => setNovedades({ ...novedades, bonificacion: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>⏰ Horas Extras y Recargos</h3>
                <div className="form-row-3">
                  <div className="form-group">
                    <label>H.E. Diurnas</label>
                    <input
                      type="number"
                      min="0"
                      value={novedades.horasExtraDiurna}
                      onChange={e => setNovedades({ ...novedades, horasExtraDiurna: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label>H.E. Nocturnas</label>
                    <input
                      type="number"
                      min="0"
                      value={novedades.horasExtraNocturna}
                      onChange={e => setNovedades({ ...novedades, horasExtraNocturna: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Préstamo</label>
                    <input
                      type="number"
                      min="0"
                      className="input-danger"
                      value={novedades.prestamo}
                      onChange={e => setNovedades({ ...novedades, prestamo: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Columna Derecha: Desprendible */}
        <div className="desprendible-section">
          <h2>📄 Desprendible Proyectado</h2>

          {error && <div className="error-message">{error}</div>}

          {resultado ? (
            <div className="desprendible">
              <div className="desprendible-header">
                <span>Empleado:</span>
                <span className="nombre">{resultado.nombres}</span>
              </div>

              <div className="desprendible-section devengados">
                <div className="line">
                  <span>+ Básico ({resultado.diasLaborados} días)</span>
                  <span>{formatCurrency(resultado.salarioDevengado)}</span>
                </div>
                {resultado.auxDevengado > 0 && (
                  <div className="line">
                    <span>+ Aux. Transporte</span>
                    <span>{formatCurrency(resultado.auxDevengado)}</span>
                  </div>
                )}
                {resultado.totalExtras > 0 && (
                  <div className="line">
                    <span>+ Extras y Recargos</span>
                    <span>{formatCurrency(resultado.totalExtras)}</span>
                  </div>
                )}
                {resultado.bonificacion > 0 && (
                  <div className="line">
                    <span>+ Bonificación</span>
                    <span>{formatCurrency(resultado.bonificacion)}</span>
                  </div>
                )}
              </div>

              <div className="desprendible-section deducciones">
                <div className="line">
                  <span>- Salud (4%)</span>
                  <span>({formatCurrency(resultado.deduccionSalud)})</span>
                </div>
                <div className="line">
                  <span>- Pensión (4%)</span>
                  <span>({formatCurrency(resultado.deduccionPension)})</span>
                </div>
                {resultado.deduccionPrestamo > 0 && (
                  <div className="line">
                    <span>- Préstamos</span>
                    <span>({formatCurrency(resultado.deduccionPrestamo)})</span>
                  </div>
                )}
              </div>

              <div className="desprendible-total">
                <span>NETO A PAGAR</span>
                <span className="total-amount">{formatCurrency(resultado.totalNomina)}</span>
              </div>

              <div className="desprendible-detail">
                <div className="line">
                  <span>Total Consignado Banco:</span>
                  <span>{formatCurrency(resultado.totalConsignado)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="desprendible-empty">
              {calculando ? '⏳ Calculando...' : 'Selecciona un empleado para ver la simulación'}
            </div>
          )}

          <button
            onClick={handleGuardar}
            disabled={!resultado || calculando}
            className="btn btn-success btn-large"
          >
            ✅ APROBAR Y GUARDAR
          </button>
        </div>
      </div>
    </div>
  );
}

// ========================
// PANEL DE HISTORIAL
// ========================
function HistorialPanel() {
  const { data: nominas, loading, error, refetch } = useApi('/nominas');
  const [selectedPeriodo, setSelectedPeriodo] = useState(null);
  const [detalleNomina, setDetalleNomina] = useState(null);

  const verDetalle = async (periodo) => {
    try {
      const res = await fetch(`${API_BASE}/nominas/${periodo}`);
      const json = await res.json();
      if (json.success) {
        setSelectedPeriodo(periodo);
        setDetalleNomina(json.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="loading">Cargando historial...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;

  return (
    <div className="panel historial-panel">
      <h2>📋 Historial de Nóminas</h2>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Período</th>
              <th>Estado</th>
              <th>Empleados</th>
              <th>Total Nómina</th>
              <th>Total Consignado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {nominas?.map(nomina => (
              <tr key={nomina.periodo}>
                <td className="mono">{nomina.periodo}</td>
                <td>
                  <span className={`badge badge-${nomina.estado}`}>
                    {nomina.estado}
                  </span>
                </td>
                <td>{nomina.totalEmpleados}</td>
                <td className="money">{formatCurrency(nomina.totalNomina)}</td>
                <td className="money">{formatCurrency(nomina.totalConsignado)}</td>
                <td>
                  <button
                    onClick={() => verDetalle(nomina.periodo)}
                    className="btn btn-secondary btn-small"
                  >
                    👁️ Ver
                  </button>
                </td>
              </tr>
            ))}
            {(!nominas || nominas.length === 0) && (
              <tr><td colSpan="6" className="empty">No hay nóminas registradas.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de detalle */}
      {detalleNomina && (
        <div className="modal-overlay" onClick={() => setDetalleNomina(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detalle Período {selectedPeriodo}</h3>
              <button onClick={() => setDetalleNomina(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Cédula</th>
                      <th>Nombre</th>
                      <th>Días</th>
                      <th>Devengado</th>
                      <th>Deducciones</th>
                      <th>Neto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalleNomina.liquidaciones?.map(liq => (
                      <tr key={liq.cedula}>
                        <td className="mono">{liq.cedula}</td>
                        <td>{liq.nombres}</td>
                        <td>{liq.diasLaborados}</td>
                        <td className="money">{formatCurrency(liq.totalDevengado)}</td>
                        <td className="money danger">-{formatCurrency(liq.totalDeducciones)}</td>
                        <td className="money success">{formatCurrency(liq.totalNomina)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="3"><strong>TOTALES</strong></td>
                      <td></td>
                      <td></td>
                      <td className="money success"><strong>{formatCurrency(detalleNomina.totales?.totalNomina)}</strong></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
