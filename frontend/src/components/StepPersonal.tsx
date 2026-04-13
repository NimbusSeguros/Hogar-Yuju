import React, { useState } from 'react';
import { AlignJustify } from 'lucide-react';
import axios from 'axios';

interface Props {
  selection: any;
  onNext: (orderVentaId: string, personalData: any) => void;
}

export const StepPersonal: React.FC<Props> = ({ selection, onNext }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    dni: '',
    codPais: '54',
    codArea: '',
    telefono: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!formData.nombre || !formData.apellido || !formData.email || !formData.dni) {
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
          numeroDocumento: formData.dni
        }
      });

      const { rusOrder } = response.data;
      onNext(rusOrder.ordenVentaID, formData);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al procesar los datos. Reintentá en unos momentos.');
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
        <div style={{ padding: '12px', backgroundColor: '#FEE2E2', color: '#B91C1C', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
          {error}
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
        <label className="form-label" style={{ display: 'none' }}>DNI</label>
        <input 
          type="text" 
          name="dni"
          className="form-input" 
          placeholder="Número de documento (DNI)" 
          value={formData.dni}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Número de Whatsapp</label>
        <div className="form-row">
          <div className="form-col-small" style={{ display: 'flex' }}>
            <input 
              type="text" 
              name="codPais"
              className="form-input" 
              placeholder="54" 
              style={{ width: '50px', padding: '12px', borderRight: 'none', borderTopRightRadius: 0, borderBottomRightRadius: 0, outline: 'none' }} 
              value={formData.codPais}
              onChange={handleChange}
            />
            <input 
              type="text" 
              name="codArea"
              className="form-input" 
              placeholder="Cod. área" 
              style={{ flex: 1, borderLeft: 'none', borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }} 
              value={formData.codArea}
              onChange={handleChange}
            />
          </div>
          <div className="form-col-small" style={{ display: 'flex' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="15" 
              disabled
              style={{ width: '50px', padding: '12px', borderRight: 'none', borderTopRightRadius: 0, borderBottomRightRadius: 0, outline: 'none', backgroundColor: '#f8fafc' }} 
            />
            <input 
              type="text" 
              name="telefono"
              className="form-input" 
              placeholder="Nro. telefónico" 
              style={{ flex: 1, borderLeft: 'none', borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }} 
              value={formData.telefono}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" style={{ display: 'none' }}>Email</label>
        <input 
          type="email" 
          name="email"
          className="form-input" 
          placeholder="Email" 
          value={formData.email}
          onChange={handleChange}
        />
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
