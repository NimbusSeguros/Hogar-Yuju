import React, { useState } from 'react';
import { AlignJustify } from 'lucide-react';
import axios from 'axios';

interface Props {
  selection: any;
  initialData?: any;
  onNext: (orderVentaId: string, personalData: any) => void;
}

export const StepPersonal: React.FC<Props> = ({ selection, initialData, onNext }) => {
  const [formData, setFormData] = useState({
    nombre: initialData?.nombre || '',
    apellido: initialData?.apellido || '',
    email: initialData?.email || '',
    telefono_codigo_area: initialData?.telefono_codigo_area || '',
    telefono_numero: initialData?.telefono_numero || '',
    fechaNacimientoDia: initialData?.fechaNacimientoDia || '',
    fechaNacimientoMes: initialData?.fechaNacimientoMes || '',
    fechaNacimientoAno: initialData?.fechaNacimientoAno || '',
    tipoDocumento: initialData?.tipoDocumento || 'DNI',
    numeroDocumento: initialData?.numeroDocumento || '',
    nacionalidad: initialData?.nacionalidad || 'ARG'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!formData.nombre || !formData.apellido || !formData.email || !formData.numeroDocumento || !formData.telefono_codigo_area || !formData.telefono_numero || !formData.fechaNacimientoDia || !formData.fechaNacimientoMes || !formData.fechaNacimientoAno) {
      setError('Por favor completa todos los campos obligatorios.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Step 1: Create Order in RUS and Save to Supabase
      const response = await axios.post('http://localhost:3000/api/insurance/home/orders/create', {
        idConsulta: selection.consultaId,
        plan: selection.plan,
        formaPago: selection.formaPago,
        personalData: {
          nombre: formData.nombre,
          apellido: formData.apellido,
          email: formData.email,
          numeroDocumento: formData.numeroDocumento
        }
      });

      const { rusOrder } = response.data;
      onNext(rusOrder.ordenVentaID, formData);
    } catch (err: any) {
      console.error(err);
      let errMsg = 'Error al procesar los datos. Reintentá en unos momentos.';
      if (err.response?.data?.details) {
          errMsg = typeof err.response.data.details === 'string' 
            ? err.response.data.details 
            : JSON.stringify(err.response.data.details, null, 2);
      } else if (err.response?.data?.error) {
          errMsg = err.response.data.error;
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="step-title" style={{ marginBottom: 0 }}>Datos personales</h1>
        <div style={{ display: 'flex', alignItems: 'center', color: '#64748B', cursor: 'pointer' }}>
          <AlignJustify size={16} color="#FF6B00" style={{ marginRight: '8px' }} />
          <span>Resumen</span>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px', backgroundColor: '#FEE2E2', color: '#B91C1C', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', overflowX: 'auto' }}>
          <pre style={{ margin: 0, fontFamily: 'inherit', whiteSpace: 'pre-wrap' }}>{error}</pre>
        </div>
      )}

      <div className="form-group">
        <label className="form-label" style={{ display: 'none' }}>Nombre</label>
        <input 
          type="text" 
          name="nombre"
          className="form-input" 
          placeholder="Nombre" 
          value={formData.nombre}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label className="form-label" style={{ display: 'none' }}>Apellido</label>
        <input 
          type="text" 
          name="apellido"
          className="form-input" 
          placeholder="Apellido" 
          value={formData.apellido}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Número de Whatsapp</label>
        <div className="form-row">
          <div className="form-col-small" style={{ display: 'flex' }}>
            <span style={{ padding: '12px', border: '1px solid #E2E8F0', borderRight: 'none', borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px', backgroundColor: '#f8fafc', color: '#64748B' }}>0</span>
            <input 
              type="text" 
              name="telefono_codigo_area"
              className="form-input" 
              placeholder="Cod. área" 
              style={{ flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }} 
              value={formData.telefono_codigo_area}
              onChange={handleChange}
            />
          </div>
          <div className="form-col-small" style={{ display: 'flex' }}>
            <span style={{ padding: '12px 16px', border: '1px solid #E2E8F0', borderRight: 'none', borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px', backgroundColor: '#f8fafc', color: '#64748B' }}>15</span>
            <input 
              type="text" 
              name="telefono_numero"
              className="form-input" 
              placeholder="Nro. telefónico" 
              style={{ flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }} 
              value={formData.telefono_numero}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      <div className="form-group">
        <input 
          type="email" 
          name="email"
          className="form-input" 
          placeholder="Email" 
          value={formData.email}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Fecha de nacimiento</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input 
            type="text" 
            name="fechaNacimientoDia"
            className="form-input" 
            placeholder="Día" 
            style={{ flex: 1 }} 
            value={formData.fechaNacimientoDia}
            onChange={handleChange}
          />
          <span style={{ color: '#94A3B8' }}>/</span>
          <input 
            type="text" 
            name="fechaNacimientoMes"
            className="form-input" 
            placeholder="Mes" 
            style={{ flex: 1 }} 
            value={formData.fechaNacimientoMes}
            onChange={handleChange}
          />
          <span style={{ color: '#94A3B8' }}>/</span>
          <input 
            type="text" 
            name="fechaNacimientoAno"
            className="form-input" 
            placeholder="Año" 
            style={{ flex: 1 }} 
            value={formData.fechaNacimientoAno}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="form-group">
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', top: '10px', left: '16px', color: '#64748B', fontSize: '12px' }}>Tipo de documento</span>
          <select 
            name="tipoDocumento"
            className="form-input" 
            style={{ paddingTop: '28px', appearance: 'none', backgroundColor: 'transparent' }} 
            value={formData.tipoDocumento}
            onChange={(e: any) => handleChange(e)}
          >
            <option value="DNI">DNI</option>
            <option value="CUIT">CUIT</option>
            <option value="CUIL">CUIL</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <input 
          type="text" 
          name="numeroDocumento"
          className="form-input" 
          placeholder="Número de documento" 
          value={formData.numeroDocumento}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', top: '10px', left: '16px', color: '#64748B', fontSize: '12px' }}>Nacionalidad</span>
          <select 
            name="nacionalidad"
            className="form-input" 
            style={{ paddingTop: '28px', appearance: 'none', backgroundColor: 'transparent' }} 
            value={formData.nacionalidad}
            onChange={(e: any) => handleChange(e)}
          >
            <option value="ARG">Argentina</option>
            <option value="BRA">Brasil</option>
            <option value="CHL">Chile</option>
            <option value="URY">Uruguay</option>
            <option value="PRY">Paraguay</option>
            <option value="BOL">Bolivia</option>
          </select>
        </div>
      </div>



      <button 
        className="btn-primary" 
        style={{ width: '100%', marginTop: '20px' }}
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? 'Procesando...' : 'Siguiente'}
      </button>
    </div>
  );
};
