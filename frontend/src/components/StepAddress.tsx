import React, { useState } from 'react';
import { AlignJustify } from 'lucide-react';
import axios from 'axios';

interface Props {
  orderVentaId: string | null;
  onNext: (addressData: any) => void;
}

export const StepAddress: React.FC<Props> = ({ orderVentaId, onNext }) => {
  const [formData, setFormData] = useState({
    calle: 'Avenida Pellegrini',
    numero: '1510',
    piso: '',
    departamento: '',
    localidad: 'Rosario',
    codigoPostal: '2000'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!orderVentaId) {
      setError('No hay una orden activa. Por favor volvé al paso anterior.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Map frontend fields to RUS Emission Form question codes
      // Note: These codes should ideally come from fetching the emission form, 
      // but we use standard codes for Hogar emission.
      const answers = [
        { codigoPregunta: 'DOMICILIO_CALLE', valores: [formData.calle] },
        { codigoPregunta: 'DOMICILIO_NUMERO', valores: [formData.numero] },
        { codigoPregunta: 'DOMICILIO_LOCALIDAD', valores: [formData.localidad] },
        { codigoPregunta: 'DOMICILIO_CODIGO_POSTAL', valores: [formData.codigoPostal] }
      ];

      if (formData.piso) answers.push({ codigoPregunta: 'DOMICILIO_PISO', valores: [formData.piso] });
      if (formData.departamento) answers.push({ codigoPregunta: 'DOMICILIO_DEPTO', valores: [formData.departamento] });

      await axios.post(`http://localhost:3000/api/insurance/home/orders/${orderVentaId}/form/submit`, {
        answers,
        addressData: formData
      });

      onNext(formData);
    } catch (err: any) {
      console.error(err);
      setError('Error al guardar el domicilio. Verificá los datos e intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="step-title" style={{ marginBottom: 0 }}>Datos del domicilio</h1>
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
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', top: '10px', left: '16px', color: '#64748B', fontSize: '12px' }}>Calle</span>
          <input 
            type="text" 
            name="calle"
            className="form-input" 
            style={{ paddingTop: '28px' }} 
            value={formData.calle}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="form-group">
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', top: '10px', left: '16px', color: '#64748B', fontSize: '12px' }}>Número</span>
          <input 
            type="text" 
            name="numero"
            className="form-input" 
            style={{ paddingTop: '28px' }} 
            value={formData.numero}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="form-row" style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <span style={{ position: 'absolute', top: '10px', left: '16px', color: '#64748B', fontSize: '12px' }}>Piso (Opcional)</span>
          <input 
            type="text" 
            name="piso"
            className="form-input" 
            style={{ paddingTop: '28px' }} 
            value={formData.piso}
            onChange={handleChange}
          />
        </div>
        <div style={{ flex: 1, position: 'relative' }}>
          <span style={{ position: 'absolute', top: '10px', left: '16px', color: '#64748B', fontSize: '12px' }}>Depto (Opcional)</span>
          <input 
            type="text" 
            name="departamento"
            className="form-input" 
            style={{ paddingTop: '28px' }} 
            value={formData.departamento}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="form-group">
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', top: '10px', left: '16px', color: '#64748B', fontSize: '12px' }}>Localidad</span>
          <input 
            type="text" 
            name="localidad"
            className="form-input" 
            style={{ paddingTop: '28px' }} 
            value={formData.localidad}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="form-group">
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', top: '10px', left: '16px', color: '#64748B', fontSize: '12px' }}>Código Postal</span>
          <input 
            type="text" 
            name="codigoPostal"
            className="form-input" 
            style={{ paddingTop: '28px' }} 
            value={formData.codigoPostal}
            onChange={handleChange}
          />
        </div>
      </div>

      <button 
        className="btn-primary" 
        style={{ width: '100%', marginTop: '20px' }}
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? 'Guardando...' : 'Siguiente'}
      </button>
    </div>
  );
};
