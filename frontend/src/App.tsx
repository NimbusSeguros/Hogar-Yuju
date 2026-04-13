import { useState } from 'react';
import './index.css';
import { Stepper } from './components/Stepper';
import { StepPlans } from './components/StepPlans';
import { StepPersonal } from './components/StepPersonal';
import { StepAddress } from './components/StepAddress';
import { StepPayment } from './components/StepPayment';
import { CheckCircle } from 'lucide-react';

const steps = [
  'Datos personales', // Wait, the UI starts with PACKs, but the stepper has: Datos personales, Datos del domicilio, Métodos de pago, Datos del producto. 
  // Let's use the actual stepper layout from the images: 
  'Datos personales',
  'Datos del domicilio',
  'Métodos de pago',
  'Datos del producto'
];

// Let's adjust to model the screenshots. 
// Step 0: Plan selection (Packs). The stepper isn't visible, or it says "Hogar Familiar" at the top.
// Step 1: Datos Personales
// Step 2: Datos del domicilio
// Step 3: Métodos de pago

function App() {
  const [currentStep, setCurrentStep] = useState(0); // 0 = Packs (or Datos Personales)
  
  // Shared state for the application flow
  const [selection, setSelection] = useState<any>(null); // { consultaId, plan, formaPago }
  const [orderVentaId, setOrderVentaId] = useState<string | null>(null);
  const [personalData, setPersonalData] = useState<any>(null);
  const [addressData, setAddressData] = useState<any>(null);

  const handlePlanSelection = (data: any) => {
    setSelection(data);
    setCurrentStep(1);
  };

  const handleOrderCreated = (id: string, data: any) => {
    setOrderVentaId(id);
    setPersonalData(data);
    setCurrentStep(2);
  };

  const handleAddressSubmitted = (data: any) => {
    setAddressData(data);
    setCurrentStep(3);
  };

  const handlePaymentSubmitted = () => {
    setCurrentStep(4);
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  return (
    <div className="app-container">
      <main className="stepper-container">
        {currentStep > 0 && currentStep <= 4 && (
          <Stepper steps={steps} currentStep={currentStep - 1} />
        )}

        <div className="form-content">
          {currentStep === 0 && <StepPlans onNext={handlePlanSelection} />}
          {currentStep === 1 && (
            <StepPersonal 
              selection={selection} 
              onNext={handleOrderCreated} 
            />
          )}
          {currentStep === 2 && (
            <StepAddress 
              orderVentaId={orderVentaId} 
              onNext={handleAddressSubmitted} 
            />
          )}
          {currentStep === 3 && (
            <StepPayment 
              orderVentaId={orderVentaId} 
              onNext={handlePaymentSubmitted} 
            />
          )}
          {currentStep === 4 && (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <CheckCircle size={64} color="#31EEC3" style={{ margin: '0 auto 20px' }} />
              <h1 className="step-title">¡Cotización finalizada!</h1>
              <p style={{ color: '#64748B' }}>Gracias por confiar en Rio Uruguay Seguros.</p>
            </div>
          )}
        </div>

        {currentStep > 0 && currentStep < 4 && (
          <div className="actions">
            {currentStep > 0 && (
              <button className="btn-secondary" onClick={handleBack}>
                <span style={{ marginRight: '8px' }}>‹</span> Atrás
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
