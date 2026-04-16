import React, { useState } from 'react';
import { AlignJustify } from 'lucide-react';
import axios from 'axios';

interface Props {
  orderVentaId: string | null;
  personalData: any;
  initialData?: any;
  onNext: (data: any) => void;
}

export const StepAddress: React.FC<Props> = ({ orderVentaId, personalData, initialData, onNext }) => {
  const [formData, setFormData] = useState({
    calle: initialData?.calle || '',
    numero: initialData?.numero || '',
    localidad: initialData?.localidad || '',
    codigoPostal: initialData?.codigoPostal || '',
    tipoVivienda: initialData?.tipoVivienda || 'casss',
    piso: initialData?.piso || '',
    dpto: initialData?.dpto || '',
    muros: initialData?.muros || 'trad',
    caracter: initialData?.caracter || 'VIVIENDA_COMBINADOFAMILIAR_CARACTER1'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!orderVentaId) {
      setError('No hay una orden activa. Por favor volvé al paso anterior.');
      return;
    }

    if (!formData.calle || !formData.numero || !formData.localidad || !formData.codigoPostal) {
      setError('Por favor completa los campos de dirección.');
      return;
    }

    // Validation for Department
    if (formData.tipoVivienda === 'dptoopo' && (!formData.piso || !formData.dpto)) {
      setError('Para departamentos es obligatorio completar Piso y Departamento.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Final verified Map for EMISION
      const answers: any[] = [
        { codigoPregunta: 'CALLE_CF', valores: [formData.calle] },
        { codigoPregunta: 'ALT_CF', valores: [formData.numero] },
        { codigoPregunta: 'CPPPP', valores: [formData.codigoPostal] },
        { codigoPregunta: 'tipoo', valores: [formData.tipoVivienda] },
        { codigoPregunta: 'matconst', valores: [formData.muros] },
        { codigoPregunta: 'VIVIENDA_COMBINADOFAMILIAR_CARACTER', valores: [formData.caracter] },
        { codigoPregunta: 'VIVIENDA_COMBINADOFAMILIAR_PREGUNTATIPOVIVIENDA_PACK', valores: ['VIVIENDA_COMBINADOFAMILIAR_PREGUNTATIPOVIVIENDA_PACK1'] }
      ];

      // Add conditional Depto questions
      if (formData.tipoVivienda === 'dptoopo') {
        answers.push({ codigoPregunta: 'PISO_CF', valores: [formData.piso] });
        answers.push({ codigoPregunta: 'DPTO_CF', valores: [formData.dpto] });
      }

      await axios.post(`http://localhost:3000/api/insurance/home/orders/${orderVentaId}/form/submit`, {
        answers,
        addressData: formData,
        personalData 
      });

      onNext(formData);
    } catch (err: any) {
      console.error(err);
      let errMsg = 'Error al guardar los datos de la vivienda. Verificá la información.';
      if (err.response?.data?.details?.errores?.[0]?.mensaje) {
          errMsg = err.response.data.details.errores[0].mensaje;
      } else if (err.response?.data?.details) {
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
        <h1 className="step-title" style={{ marginBottom: 0 }}>Datos de la vivienda</h1>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="form-group">
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', top: '10px', left: '16px', color: '#64748B', fontSize: '11px', fontWeight: 600 }}>Calle</span>
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
            <span style={{ position: 'absolute', top: '10px', left: '16px', color: '#64748B', fontSize: '11px', fontWeight: 600 }}>Número</span>
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
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="form-group">
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', top: '10px', left: '16px', color: '#64748B', fontSize: '11px', fontWeight: 600 }}>Localidad</span>
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
            <span style={{ position: 'absolute', top: '10px', left: '16px', color: '#64748B', fontSize: '11px', fontWeight: 600 }}>Código Postal</span>
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
      </div>

      <div className="form-group">
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', top: '10px', left: '16px', color: '#64748B', fontSize: '11px', fontWeight: 600 }}>Su vivienda es</span>
          <select
            name="tipoVivienda"
            className="form-input"
            style={{ paddingTop: '28px' }}
            value={formData.tipoVivienda}
            onChange={handleChange}
          >
            <option value="casss">Casa</option>
            <option value="dptoopo">Departamento</option>
          </select>
        </div>
      </div>

      {formData.tipoVivienda === 'dptoopo' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', top: '10px', left: '16px', color: '#64748B', fontSize: '11px', fontWeight: 600 }}>Piso</span>
              <input
                type="text"
                name="piso"
                className="form-input"
                style={{ paddingTop: '28px' }}
                value={formData.piso}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', top: '10px', left: '16px', color: '#64748B', fontSize: '11px', fontWeight: 600 }}>Dpto (Nro)</span>
              <input
                type="text"
                name="dpto"
                className="form-input"
                style={{ paddingTop: '28px' }}
                value={formData.dpto}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>
      )}

      <div className="form-group">
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', top: '10px', left: '16px', color: '#64748B', fontSize: '11px', fontWeight: 600 }}>Muros</span>
          <select
            name="muros"
            className="form-input"
            style={{ paddingTop: '28px' }}
            value={formData.muros}
            onChange={handleChange}
          >
            <option value="trad">Ladrillo / Hormigón</option>
            <option value="mad">Madera / Otros</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', top: '10px', left: '16px', color: '#64748B', fontSize: '11px', fontWeight: 600 }}>Carácter</span>
          <select
            name="caracter"
            className="form-input"
            style={{ paddingTop: '28px' }}
            value={formData.caracter}
            onChange={handleChange}
          >
            <option value="VIVIENDA_COMBINADOFAMILIAR_CARACTER1">Propietario</option>
            <option value="VIVIENDA_COMBINADOFAMILIAR_CARACTER2">Inquilino</option>
          </select>
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
