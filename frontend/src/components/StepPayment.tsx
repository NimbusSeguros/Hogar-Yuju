import React, { useState } from 'react';
import { AlignJustify, CreditCard, Landmark, Loader2 } from 'lucide-react';
import axios from 'axios';

interface Props {
  orderVentaId: string | null;
  onNext: () => void;
}

export const StepPayment: React.FC<Props> = ({ orderVentaId, onNext }) => {
  const [selectedMethod, setSelectedMethod] = useState<'TARJETA_CREDITO' | 'DEBITO_AUTOMATICO'>('TARJETA_CREDITO');
  const [formData, setFormData] = useState({
    marcaTarjeta: 'VISA',
    numeroTarjeta: '',
    cbu: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!orderVentaId) {
      setError('No hay una orden activa.');
      return;
    }

    if (selectedMethod === 'TARJETA_CREDITO' && !formData.numeroTarjeta) {
      setError('Por favor ingresá el número de tarjeta.');
      return;
    }

    if (selectedMethod === 'DEBITO_AUTOMATICO' && !formData.cbu) {
      setError('Por favor ingresá el CBU.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // 1. Submit Payment Info
      const paymentInfo: any = {
        medioPago: selectedMethod
      };

      if (selectedMethod === 'TARJETA_CREDITO') {
        paymentInfo.numeroTarjeta = formData.numeroTarjeta.replace(/\s/g, '');
        paymentInfo.marcaTarjeta = formData.marcaTarjeta;
      } else {
        paymentInfo.CBU = formData.cbu.replace(/\s/g, '');
      }

      await axios.post(`http://localhost:3000/api/insurance/home/orders/${orderVentaId}/infopago`, {
        paymentInfo
      });

      // 2. Confirm Order (Final Emission)
      await axios.post(`http://localhost:3000/api/insurance/home/orders/${orderVentaId}/confirm`);

      onNext();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al procesar el pago. Verificá los datos e intentá nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="step-title" style={{ marginBottom: 0 }}>Método de pago</h1>
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

      {/* Tarjeta de Crédito */}
      <div
        className={`card ${selectedMethod === 'TARJETA_CREDITO' ? 'selected' : ''}`}
        onClick={() => setSelectedMethod('TARJETA_CREDITO')}
        style={{ padding: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        <div style={{ padding: '20px 24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{
            height: '24px', width: '24px', borderRadius: '50%',
            border: `2px solid ${selectedMethod === 'TARJETA_CREDITO' ? '#3369FF' : '#E2E8F0'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            {selectedMethod === 'TARJETA_CREDITO' && <div style={{ height: '12px', width: '12px', borderRadius: '50%', backgroundColor: '#3369FF' }} />}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <CreditCard size={20} color={selectedMethod === 'TARJETA_CREDITO' ? '#3369FF' : '#64748B'} />
            <span style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A' }}>Tarjeta de crédito</span>
          </div>
        </div>

        {selectedMethod === 'TARJETA_CREDITO' && (
          <div style={{ padding: '0 24px 24px 24px', borderTop: '1px solid #E2E8F0', backgroundColor: '#FAFCFF' }}>
            <div className="form-group" style={{ marginTop: '20px' }}>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', top: '10px', left: '16px', color: '#64748B', fontSize: '11px', fontWeight: 600 }}>Marca de la tarjeta</span>
                <select 
                  name="marcaTarjeta"
                  className="form-input" 
                  style={{ paddingTop: '28px', backgroundColor: 'transparent', appearance: 'none' }}
                  value={formData.marcaTarjeta}
                  onChange={handleChange}
                >
                  <option value="VISA">Visa</option>
                  <option value="MASTERCARD">MasterCard</option>
                  <option value="AMERICAN_EXPRESS">American Express</option>
                  <option value="CABAL">Cabal</option>
                </select>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', top: '10px', left: '16px', color: '#64748B', fontSize: '11px', fontWeight: 600 }}>Número de tarjeta</span>
                <input 
                  type="text" 
                  name="numeroTarjeta"
                  className="form-input" 
                  style={{ paddingTop: '28px' }} 
                  placeholder="0000 0000 0000 0000" 
                  value={formData.numeroTarjeta}
                  onChange={handleChange}
                  autoComplete="cc-number"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Débito Automático (CBU) */}
      <div
        className={`card ${selectedMethod === 'DEBITO_AUTOMATICO' ? 'selected' : ''}`}
        onClick={() => setSelectedMethod('DEBITO_AUTOMATICO')}
        style={{ padding: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        <div style={{ padding: '20px 24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{
            height: '24px', width: '24px', borderRadius: '50%', flexShrink: 0,
            border: `2px solid ${selectedMethod === 'DEBITO_AUTOMATICO' ? '#3369FF' : '#E2E8F0'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {selectedMethod === 'DEBITO_AUTOMATICO' && <div style={{ height: '12px', width: '12px', borderRadius: '50%', backgroundColor: '#3369FF' }} />}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <Landmark size={20} color={selectedMethod === 'DEBITO_AUTOMATICO' ? '#3369FF' : '#64748B'} />
            <div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A' }}>Débito automático</div>
              <div style={{ fontSize: '12px', color: '#64748B' }}>CBU bancarizado</div>
            </div>
          </div>
        </div>

        {selectedMethod === 'DEBITO_AUTOMATICO' && (
          <div style={{ padding: '0 24px 24px 24px', borderTop: '1px solid #E2E8F0', backgroundColor: '#FAFCFF' }}>
            <div className="form-group" style={{ marginTop: '20px', marginBottom: 0 }}>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', top: '10px', left: '16px', color: '#64748B', fontSize: '11px', fontWeight: 600 }}>CBU (22 dígitos)</span>
                <input 
                  type="text" 
                  name="cbu"
                  className="form-input" 
                  style={{ paddingTop: '28px' }} 
                  placeholder="0000000000000000000000" 
                  value={formData.cbu}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <button 
        className="btn-primary" 
        style={{ width: '100%', marginTop: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            Procesando venta...
          </>
        ) : 'Finalizar contratación →'}
      </button>

      <p style={{ textAlign: 'center', fontSize: '12px', color: '#94A3B8', marginTop: '16px' }}>
        Al hacer clic en finalizar, aceptás los términos y condiciones del servicio.
      </p>
    </div>
  );
};
