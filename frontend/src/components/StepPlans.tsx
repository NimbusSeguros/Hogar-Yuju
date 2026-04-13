import React, { useState, useEffect } from 'react';
import { Home, ChevronDown, ChevronUp, CheckCircle, Info } from 'lucide-react';
import axios from 'axios';

const API = 'http://localhost:3000/api/insurance/home';
const OBJECT = 'VIVIENDA';
const INDICIO = 'CF_PACK_FREESTYLE';

interface Opcion { codigo: string; texto: string; }
interface Pregunta { codigo: string; texto: string; significado?: string; tipoRespuesta: string; opciones?: Opcion[]; }
interface Cobertura { codigo: string; descripcion: string; informacionAdicional?: string; sumaAsegurada?: { monto: number; codigoISOMoneda: string }; }
interface FormaPago { precioCuota: number; cantidadCuotas: number; mediosPago: string[]; }
interface Plan {
    codigo: string;
    descripcion: string;
    informacionAdicional?: string;
    linkCondiciones?: string;
    formasPagos?: FormaPago[];
    coberturas?: Cobertura[];
    beneficios?: Array<{ descripcion: string }>;
    incluye?: Array<{ codigo: string; descripcion: string; informacionAdicional?: string }>;
    noIncluye?: Array<{ codigo: string; descripcion: string }>;
}

type StepState = 'form' | 'plans';

interface Props { onNext?: (planCode: string) => void; }

export const StepPlans: React.FC<Props> = ({ onNext }) => {
    const [stepState, setStepState] = useState<StepState>('form');
    const [formPreguntas, setFormPreguntas] = useState<Pregunta[]>([]);
    const [respuestas, setRespuestas] = useState<Record<string, string>>({});
    const [plans, setPlans] = useState<Plan[]>([]);
    const [selectedPlan, setSelectedPlan] = useState('');
    const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [apiError, setApiError] = useState<any>(null);

    const [consultaId, setConsultaId] = useState<string | null>(null);

    useEffect(() => {
        axios.get(`${API}/objects/${OBJECT}/indicios/${INDICIO}/form`)
            .then(res => { setFormPreguntas(res.data.preguntas || []); setApiError(null); })
            .catch(err => setApiError(err.response?.data || err.message))
            .finally(() => setLoading(false));
    }, []);

    const handleSubmitForm = async () => {
        setSubmitting(true);
        setApiError(null);
        try {
            const submitRes = await axios.post(`${API}/objects/${OBJECT}/indicios/${INDICIO}/form/submit`, { answers: respuestas });
            const cId = submitRes.data?.consultaId;
            if (!cId) { setApiError({ message: 'No se recibió consultaId.', data: submitRes.data }); return; }
            setConsultaId(cId);
            const plansRes = await axios.get(`${API}/consultas/${cId}/planes`);
            setPlans(plansRes.data);
            if (plansRes.data.length > 0) setSelectedPlan(plansRes.data[0].codigo);
            setStepState('plans');
        } catch (err: any) {
            setApiError(err.response?.data || err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const allAnswered = formPreguntas.length > 0 && formPreguntas.every(p => respuestas[p.codigo]);

    const formatMoney = (monto: number) => `$ ${monto.toLocaleString('es-AR')}`;

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '60px 0' }}>
                <div style={{ width: '36px', height: '36px', border: '3px solid #E2E8F0', borderTopColor: '#3369FF', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <p style={{ color: '#64748B' }}>Cargando formulario...</p>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #3369FF, #31EEC3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Home size={20} color="white" />
                </div>
                <h1 className="step-title" style={{ marginBottom: 0 }}>Hogar Familiar</h1>
            </div>
            <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '32px' }}>
                {stepState === 'form'
                    ? 'Respondé esta pregunta y te mostraremos los planes de cobertura disponibles para tu hogar.'
                    : `Planes disponibles según tus respuestas. Seleccioná el que mejor se adapte a vos.`}
            </p>

            {apiError && (
                <div style={{ padding: '16px', backgroundColor: '#FEE2E2', color: '#B91C1C', borderRadius: '8px', marginBottom: '24px' }}>
                    <strong>Error:</strong>
                    <pre style={{ marginTop: '8px', fontSize: '12px', overflowX: 'auto' }}>{JSON.stringify(apiError, null, 2)}</pre>
                </div>
            )}

            {/* ── FORM STEP ── */}
            {stepState === 'form' && (
                <div>
                    {/* Info callout */}
                    <div style={{ display: 'flex', gap: '12px', backgroundColor: '#EFF6FF', borderRadius: '10px', padding: '16px', marginBottom: '24px', border: '1px solid #BFDBFE' }}>
                        <Info size={20} color="#3369FF" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <p style={{ color: '#1E40AF', fontSize: '14px', lineHeight: '1.5' }}>
                            El tamaño de tu vivienda determina las sumas aseguradas de cada cobertura. Elegí el rango que mejor describe tus metros cuadrados totales.
                        </p>
                    </div>

                    {formPreguntas.map(pregunta => (
                        <div key={pregunta.codigo} style={{ marginBottom: '24px' }}>
                            <p style={{ fontWeight: 700, fontSize: '18px', marginBottom: '4px', color: '#0F172A' }}>{pregunta.texto}</p>
                            {pregunta.significado && <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px' }}>{pregunta.significado}</p>}
                            <div style={{ display: 'grid', gap: '10px' }}>
                                {pregunta.opciones?.map(op => {
                                    const selected = respuestas[pregunta.codigo] === op.codigo;
                                    return (
                                        <div
                                            key={op.codigo}
                                            className={`card ${selected ? 'selected' : ''}`}
                                            onClick={() => setRespuestas(prev => ({ ...prev, [pregunta.codigo]: op.codigo }))}
                                            style={{ padding: '16px 20px', marginBottom: 0, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '10px', transition: 'all 0.2s' }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: selected ? '#EFF6FF' : '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🏠</div>
                                                <span style={{ fontWeight: selected ? 600 : 400 }}>{op.texto}</span>
                                            </div>
                                            <div style={{ height: '20px', width: '20px', borderRadius: '50%', border: `2px solid ${selected ? '#3369FF' : '#E2E8F0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                                                {selected && <div style={{ height: '10px', width: '10px', borderRadius: '50%', backgroundColor: '#3369FF' }} />}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    <button
                        className="btn-primary"
                        onClick={handleSubmitForm}
                        disabled={!allAnswered || submitting}
                        style={{ opacity: allAnswered && !submitting ? 1 : 0.5, width: '100%', borderRadius: '10px', padding: '14px', fontSize: '16px', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                        {submitting ? 'Buscando coberturas...' : 'Ver planes disponibles →'}
                    </button>
                </div>
            )}

            {/* ── PLANS STEP ── */}
            {stepState === 'plans' && (
                <div>
                    {plans.length === 0 && (
                        <p style={{ textAlign: 'center', color: '#64748B' }}>No hay planes disponibles para esta selección.</p>
                    )}
                    {plans.map(plan => {
                        const bestPrecio = plan.formasPagos?.[0]?.precioCuota;
                        const cuotas = plan.formasPagos?.[0]?.cantidadCuotas;
                        const isSelected = selectedPlan === plan.codigo;
                        const isExpanded = expandedPlan === plan.codigo;

                        return (
                            <div
                                key={plan.codigo}
                                style={{
                                    background: '#fff',
                                    border: `2px solid ${isSelected ? '#3369FF' : '#E2E8F0'}`,
                                    borderRadius: '12px',
                                    marginBottom: '16px',
                                    overflow: 'hidden',
                                    transition: 'all 0.2s',
                                    boxShadow: isSelected ? '0 4px 16px rgba(51,105,255,0.12)' : '0 2px 4px rgba(0,0,0,0.02)'
                                }}
                                onClick={() => setSelectedPlan(plan.codigo)}
                            >
                                {/* Plan header */}
                                <div style={{ padding: '20px 24px', cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                                                {isSelected && <CheckCircle size={18} color="#3369FF" />}
                                                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>{plan.descripcion}</h3>
                                            </div>
                                            {bestPrecio && (
                                                <p style={{ color: '#64748B', fontSize: '14px' }}>
                                                    Desde <strong style={{ color: '#3369FF', fontSize: '26px', fontWeight: 700 }}>{formatMoney(bestPrecio)}</strong> /mes
                                                    {cuotas && <span style={{ marginLeft: '6px', color: '#94A3B8' }}>· {cuotas} cuotas</span>}
                                                </p>
                                            )}
                                            {plan.informacionAdicional && (
                                                <p style={{ fontSize: '13px', color: '#64748B', marginTop: '6px', lineHeight: '1.5' }}>{plan.informacionAdicional}</p>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                                            <div style={{ height: '22px', width: '22px', borderRadius: '50%', border: `2px solid ${isSelected ? '#3369FF' : '#E2E8F0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                {isSelected && <div style={{ height: '11px', width: '11px', borderRadius: '50%', backgroundColor: '#3369FF' }} />}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick coverage chips */}
                                    {plan.coberturas && plan.coberturas.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
                                            {plan.coberturas.slice(0, 4).map((c, i) => (
                                                <span key={i} style={{ backgroundColor: '#F0F4FF', color: '#3369FF', fontSize: '12px', fontWeight: 500, padding: '4px 10px', borderRadius: '20px' }}>
                                                    ✓ {c.descripcion}
                                                </span>
                                            ))}
                                            {plan.coberturas.length > 4 && (
                                                <span style={{ backgroundColor: '#F8FAFC', color: '#94A3B8', fontSize: '12px', padding: '4px 10px', borderRadius: '20px' }}>
                                                    +{plan.coberturas.length - 4} más
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Expand/Collapse */}
                                <div
                                    style={{ borderTop: '1px solid #E2E8F0', padding: '10px 24px', display: 'flex', justifyContent: 'center', cursor: 'pointer', backgroundColor: '#FAFAFA' }}
                                    onClick={(e) => { e.stopPropagation(); setExpandedPlan(isExpanded ? null : plan.codigo); }}
                                >
                                    <span style={{ fontSize: '13px', color: '#3369FF', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        {isExpanded ? <><ChevronUp size={16} /> Ocultar detalles</> : <><ChevronDown size={16} /> Ver coberturas completas</>}
                                    </span>
                                </div>

                                {/* Expanded detail */}
                                {isExpanded && (
                                    <div style={{ padding: '20px 24px', borderTop: '1px solid #E2E8F0', backgroundColor: '#FAFCFF' }}>

                                        {/* All coverages */}
                                        {plan.coberturas && plan.coberturas.length > 0 && (
                                            <div style={{ marginBottom: '20px' }}>
                                                <h4 style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Coberturas incluidas</h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                    {plan.coberturas.map((c, i) => (
                                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '10px', borderBottom: i < plan.coberturas!.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                                                            <div>
                                                                <p style={{ fontWeight: 600, fontSize: '14px', color: '#0F172A' }}>✓ {c.descripcion}</p>
                                                                {c.informacionAdicional && <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px', lineHeight: 1.4 }}>{c.informacionAdicional}</p>}
                                                            </div>
                                                            {c.sumaAsegurada && (
                                                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#3369FF', marginLeft: '16px', flexShrink: 0 }}>
                                                                    hasta {formatMoney(c.sumaAsegurada.monto)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Beneficios */}
                                        {plan.beneficios && plan.beneficios.length > 0 && (
                                            <div style={{ marginBottom: '20px' }}>
                                                <h4 style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Beneficios adicionales</h4>
                                                <ul style={{ listStyle: 'none', paddingLeft: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    {plan.beneficios.map((b, i) => (
                                                        <li key={i} style={{ display: 'flex', gap: '8px', fontSize: '13px', color: '#334155' }}>
                                                            <span style={{ color: '#31EEC3', fontWeight: 700 }}>★</span> {b.descripcion}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Formas de pago */}
                                        {plan.formasPagos && plan.formasPagos.length > 1 && (
                                            <div>
                                                <h4 style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Formas de pago</h4>
                                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                                    {plan.formasPagos.map((fp, i) => (
                                                        <div key={i} style={{ backgroundColor: '#F0F4FF', borderRadius: '8px', padding: '10px 14px' }}>
                                                            <p style={{ fontWeight: 700, color: '#3369FF', fontSize: '16px' }}>{formatMoney(fp.precioCuota)}/mes</p>
                                                            <p style={{ fontSize: '12px', color: '#64748B' }}>{fp.cantidadCuotas} cuotas · {fp.mediosPago.join(', ')}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {plan.linkCondiciones && (
                                            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #E2E8F0', textAlign: 'center' }}>
                                                <a href={plan.linkCondiciones} target="_blank" rel="noreferrer" style={{ color: '#3369FF', fontSize: '13px', fontWeight: 500 }}>
                                                    📄 Ver condiciones completas del plan
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Continue button */}
                    {selectedPlan && (
                        <button
                            className="btn-primary"
                            onClick={() => {
                                const fullPlan = plans.find(p => p.codigo === selectedPlan);
                                onNext?.({
                                    consultaId,
                                    plan: fullPlan,
                                    formaPago: fullPlan?.formasPagos?.[0]
                                });
                            }}
                            style={{ width: '100%', borderRadius: '10px', padding: '14px', fontSize: '16px', marginTop: '8px' }}
                        >
                            Continuar con este plan →
                        </button>
                    )}

                    {/* Change answers */}
                    <button
                        onClick={() => { setStepState('form'); setPlans([]); setApiError(null); }}
                        style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', margin: '8px auto 0' }}
                    >
                        ← Cambiar metros cuadrados
                    </button>
                </div>
            )}
        </div>
    );
};
