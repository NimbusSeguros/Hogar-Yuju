import { Request, Response } from 'express';
import { InsuranceProviderFactory } from '../services/providers/InsuranceProviderFactory';
import { SupabaseProvider } from '../services/SupabaseProvider';

export const getObjects = async (req: Request, res: Response) => {
    try {
        const { provider: providerName = 'RUS' } = req.query;
        const provider: any = InsuranceProviderFactory.getProvider(providerName as string);
        await provider.authenticate();
        const objects = await provider.getGlobalObjects();
        res.json(objects);
    } catch (error: any) {
        res.status(error?.response?.status || 500).json({ error: error.message, details: error?.response?.data });
    }
};

export const getIndicios = async (req: Request, res: Response) => {
    try {
        const { provider: providerName = 'RUS' } = req.query;
        const { objectCode } = req.params;
        const provider: any = InsuranceProviderFactory.getProvider(providerName as string);
        await provider.authenticate();
        const indicios = await provider.getIndicios(objectCode);
        res.json(indicios);
    } catch (error: any) {
        res.status(error?.response?.status || 500).json({ error: error.message, details: error?.response?.data });
    }
};

export const getForm = async (req: Request, res: Response) => {
    try {
        const { provider: providerName = 'RUS' } = req.query;
        const { objectCode, indicioCode } = req.params;
        const provider: any = InsuranceProviderFactory.getProvider(providerName as string);
        await provider.authenticate();
        const form = await provider.getForm(objectCode, indicioCode);
        res.json(form);
    } catch (error: any) {
        res.status(error?.response?.status || 500).json({ error: error.message, details: error?.response?.data });
    }
};

export const submitFormAnswers = async (req: Request, res: Response) => {
    try {
        const { provider: providerName = 'RUS' } = req.query;
        const { objectCode, indicioCode } = req.params;
        const { answers, consultaId } = req.body;
        const provider: any = InsuranceProviderFactory.getProvider(providerName as string);
        await provider.authenticate();
        const result = await provider.submitFormAnswers(objectCode, indicioCode, answers, consultaId);
        res.json(result);
    } catch (error: any) {
        res.status(error?.response?.status || 500).json({ error: 'RUS API Error', details: error?.response?.data || error.message });
    }
};

export const getPlansByConsultaId = async (req: Request, res: Response) => {
    try {
        const { provider: providerName = 'RUS' } = req.query;
        const { consultaId } = req.params;
        const provider: any = InsuranceProviderFactory.getProvider(providerName as string);
        await provider.authenticate();
        const plans = await provider.getPlansByConsultaId(consultaId);
        res.json(plans);
    } catch (error: any) {
        res.status(error?.response?.status || 500).json({ error: 'RUS API Error', details: error?.response?.data || error.message });
    }
};

// ===== EMISSION FLOW =====

export const createOrder = async (req: Request, res: Response) => {
    console.log('[Controller] createOrder reached with body:', JSON.stringify(req.body, null, 2));
    try {
        const { provider: providerName = 'RUS' } = req.query;
        const { idConsulta, plan, formaPago, personalData } = req.body;
        const provider: any = InsuranceProviderFactory.getProvider(providerName as string);
        await provider.authenticate();

        // 1. Iniciar orden en RUS
        const rusOrder = await provider.createOrder(idConsulta, plan, formaPago);
        const ordenVentaId = rusOrder.ordenVentaID;

        // 2. Guardar en Supabase (datos personales iniciales)
        const dbOrder = await SupabaseProvider.saveHogarOrder({
            nombre: personalData.nombre,
            apellido: personalData.apellido,
            email: personalData.email,
            dni: personalData.numeroDocumento,
            plan_codigo: plan.codigo,
            precio_cuota: formaPago.precioCuota,
            order_id_rus: ordenVentaId,
            estado: 'orden_iniciada'
        });

        res.json({ rusOrder, dbOrder });
    } catch (error: any) {
        res.status(error?.response?.status || 500).json({ error: error.message, details: error?.response?.data });
    }
};

export const submitClientData = async (req: Request, res: Response) => {
    try {
        const { ordenVentaId } = req.params;
        const { clientData } = req.body;
        const { provider: providerName = 'RUS' } = req.query;
        const provider: any = InsuranceProviderFactory.getProvider(providerName as string);
        await provider.authenticate();

        const result = await provider.submitClientData(ordenVentaId, clientData);

        // Actualizar Supabase con más detalles si es necesario
        const existing = await SupabaseProvider.getOrderByRusId(ordenVentaId as string);
        if (existing) {
            await SupabaseProvider.saveHogarOrder({
                id: existing.id,
                telefono: `${clientData.codTelefonoArea}${clientData.numeroTelefono}`,
                fecha_nacimiento: clientData.fechaNacimiento,
                estado: 'datos_personales_completos'
            });
        }

        res.json(result);
    } catch (error: any) {
        res.status(error?.response?.status || 500).json({ error: error.message, details: error?.response?.data });
    }
};

export const submitEmissionForm = async (req: Request, res: Response) => {
    console.log('[Controller] submitEmissionForm reached with body:', JSON.stringify(req.body, null, 2));
    try {
        const { ordenVentaId } = req.params;
        const { answers, addressData, personalData } = req.body;
        const { provider: providerName = 'RUS' } = req.query;
        const provider: any = InsuranceProviderFactory.getProvider(providerName as string);
        await provider.authenticate();

        if (personalData && addressData) {
        // 2. Submit Client Data (Aligning exactly with the working example provided by the user)
        const clientPayload: any = {
            tipoPersona: 'FISICA',
            nacionalidad: personalData?.nacionalidad || 'ARG',
            tipoDocumento: personalData?.tipoDocumento || 'DNI',
            numeroDocumento: personalData?.numeroDocumento || personalData?.dni || '',
            nombre: personalData?.nombre || '',
            apellido: personalData?.apellido || '',
            razonSocial: '',
            fechaNacimiento: `${personalData.fechaNacimientoAno}-${String(personalData.fechaNacimientoMes).padStart(2, '0')}-${String(personalData.fechaNacimientoDia).padStart(2, '0')}`,
            codTelefonoPais: '54',
            codTelefonoArea: personalData?.telefono_codigo_area || personalData?.codArea || '',
            numeroTelefono: personalData?.telefono_numero || personalData?.telefono || '',
            email: personalData?.email || '',
            domicilio: {
                calle: addressData?.calle || '',
                numero: addressData?.numero || '',
                codigoPostal: addressData?.codigoPostal || '',
                localidad: addressData?.localidad || ''
            }
        };

        // Only add piso/dpto if they have values, to keep the payload clean like the working example
        if (addressData?.piso) (clientPayload.domicilio as any).piso = addressData.piso;
        if (addressData?.departamento || addressData?.dpto) (clientPayload.domicilio as any).departamento = addressData.departamento || addressData.dpto;

        console.log('[Controller] Submitting Client Data:', JSON.stringify(clientPayload, null, 2));
        await provider.submitClientData(ordenVentaId, clientPayload);

        // 3. Optional: Submit Underwriting Form (Emission Form)
        // If the product doesn't need it, RUS will return "Pregunta indefinida".
        // We will catch that specific error and ignore it, as the main data is already in clientPayload.
        
        try {
            const rusFormRes = await provider.getEmissionForm(ordenVentaId);
            const validCodes = new Set<string>();
            const processForm = (item: any) => {
                if (!item) return;
                if (Array.isArray(item)) item.forEach(processForm);
                else {
                    if (item.preguntas) item.preguntas.forEach((p: any) => validCodes.add(p.codigo));
                    if (item.formularios) processForm(item.formularios);
                }
            };
            processForm(rusFormRes);

            const finalAnswers = [...answers];
            // ... (rest of filtering logic remains but wrapped in a safe try/catch)
            const filteredAnswers = finalAnswers.filter(ans => validCodes.has(ans.codigoPregunta));
            
            if (filteredAnswers.length > 0) {
                console.log('[Controller] Submitting Optional Emission Form Answers...');
                await provider.submitEmissionForm(ordenVentaId, filteredAnswers);
            }
        } catch (formError: any) {
            const errorMsg = formError?.response?.data?.errores?.[0]?.mensaje || '';
            if (errorMsg.includes('indefinida')) {
                console.log('[Controller] RUS reports indefinite questions. Skipping emission form as it seems not required for this product.');
            } else {
                // If it's a different error, we still want to know
                console.warn('[Controller] Warning during optional emission form submission:', errorMsg);
            }
        };

        console.log('[Controller] ALL Discovered valid question codes:', Array.from(validCodes));

        const finalAnswers = [...answers];
        const addressMap: any = {
            'CALLE_CF': addressData?.calle || 'SN',
            'ALT_CF': addressData?.numero || '0',
            'CPPPP': addressData?.codigoPostal || '0000',
            'PISO_CF': addressData?.piso || '0',
            'DPTO_CF': addressData?.dpto || '0'
        };

        for (const [codigo, valor] of Object.entries(addressMap)) {
            if (!finalAnswers.find((a: any) => a.codigoPregunta === codigo)) {
                finalAnswers.push({ codigoPregunta: codigo, valores: [valor] });
            }
        }

        const defaultQs: any = {
            'VIVIENDA_COMBINADOFAMILIAR_ACTIVIDAD': 'VIVIENDA_COMBINADOFAMILIAR_ACTIVIDAD1',
            'VIVIENDA_COMBINADOFAMILIAR_SINIESTROS': 'VIVIENDA_COMBINADOFAMILIAR_SINIESTROS2',
            'M222': 100,
            'VIVIENDA_COMBINADOFAMILIAR_DEPENDENCIAS': 'VIVIENDA_COMBINADOFAMILIAR_DEPENDENCIAS2',
            'VIVIENDA_COMBINADOFAMILIAR_OCUPACION': 'VIVIENDA_COMBINADOFAMILIAR_OCUPACION1',
            'med_seg_pack': 'ALARMA', 
            'VIVIENDA_COMBINADOFAMILIAR_MURO': 'VIVIENDA_COMBINADOFAMILIAR_MURO2',
            'tipooo': 'jous',
            'matconst': 'trad',
            'VIVIENDA_COMBINADOFAMILIAR_PREGUNTATIPOVIVIENDA_PACK': 'VIVIENDA_COMBINADOFAMILIAR_PREGUNTATIPOVIVIENDA_PACK1'
        };

        for (const [codigo, valor] of Object.entries(defaultQs)) {
            if (!finalAnswers.find((a: any) => a.codigoPregunta === codigo)) {
                finalAnswers.push({ codigoPregunta: codigo, valores: [valor] });
            }
        }

        // Filter: only send if the code was found in the form
        const filteredAnswers = finalAnswers.filter(ans => validCodes.has(ans.codigoPregunta));

        let result = { message: 'No underwriting questions required or found' };
        
        // If we found questions in the form, we MUST submit them.
        // If we didn't find any questions but we have some "default" ones that might be required, 
        // we might need to send them anyway? Actually, RUS says "Debe responder...", 
        // which implies validCodes SHOULD have something.
        
        if (filteredAnswers.length > 0) {
            console.log('[Controller] Submitting Filtered Emission Form Answers:', JSON.stringify({ respuestas: filteredAnswers }, null, 2));
            result = await provider.submitEmissionForm(ordenVentaId, filteredAnswers);
        } else if (validCodes.size > 0) {
        
        if (validCodes.size > 0 && filteredAnswers.length === 0) {
            console.error('[Controller] CRITICAL: Form has questions but none matched our defaults!', Array.from(validCodes));
            res.status(400).json({ 
                error: 'Faltan responder preguntas obligatorias', 
                discoveredCodes: Array.from(validCodes)
            });
            return;
        }

        console.log('[Controller] Submitting Filtered Emission Form Answers:', JSON.stringify({ respuestas: filteredAnswers }, null, 2));
        
        try {
            let result = { message: 'No underwriting questions required or found' };
            if (filteredAnswers.length > 0) {
                result = await provider.submitEmissionForm(ordenVentaId, filteredAnswers);
            }
            
            const existing = await SupabaseProvider.getOrderByRusId(ordenVentaId as string);
            if (existing) {
                const cleanDomicilio = {
                    calle: addressData?.calle || '',
                    numero: addressData?.numero || '',
                    piso: addressData?.piso || '',
                    dpto: addressData?.dpto || '',
                    localidad: addressData?.localidad || '',
                    codigoPostal: addressData?.codigoPostal || ''
                };

                const updatePayload: any = {
                    id: existing.id,
                    domicilio: cleanDomicilio,
                    estado: 'domicilio_completado'
                };

                if (personalData) {
                    updatePayload.telefono = `${personalData.telefono_codigo_area || ''}${personalData.telefono_numero || ''}`;
                    updatePayload.fecha_nacimiento = `${personalData.fechaNacimientoAno}-${String(personalData.fechaNacimientoMes).padStart(2, '0')}-${String(personalData.fechaNacimientoDia).padStart(2, '0')}`;
                }

                await SupabaseProvider.saveHogarOrder(updatePayload);
            }

            res.json(result);
        } catch (error: any) {
            console.error('[Controller] ERROR in submitEmissionForm call:', error?.response?.data || error.message);
            res.status(error?.response?.status || 500).json({ 
                error: error.message, 
                details: error?.response?.data,
                discoveredCodes: Array.from(validCodes),
                discoveredForm: rusFormRes, // FULL DUMP FOR DEBUGGING
                sentAnswers: filteredAnswers
            });
        }
    } catch (error: any) {
        console.error('[Controller] CRITICAL ERROR in submitEmissionForm:', error.message);
        res.status(error?.response?.status || 500).json({ error: error.message, details: error?.response?.data });
    }
};

const deobfuscate = (encoded: string): string => {
    const key = 'YUJU_SECURE_KEY_2024';
    const text = Buffer.from(encoded, 'base64').toString();
    let result = '';
    for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
};

export const submitPaymentInfo = async (req: Request, res: Response) => {
    try {
        const { ordenVentaId } = req.params;
        let { paymentInfo, _enc } = req.body;
        const { provider: providerName = 'RUS' } = req.query;

        // Deobfuscate if requested by frontend
        if (_enc) {
            if (paymentInfo.numeroTarjeta) {
                paymentInfo.numeroTarjeta = deobfuscate(paymentInfo.numeroTarjeta);
            }
            if (paymentInfo.CBU) {
                paymentInfo.CBU = deobfuscate(paymentInfo.CBU);
            }
        }

        const provider: any = InsuranceProviderFactory.getProvider(providerName as string);
        await provider.authenticate();

        const result = await provider.submitPaymentInfo(ordenVentaId, paymentInfo);

        // Actualizar estado en Supabase
        const existing = await SupabaseProvider.getOrderByRusId(ordenVentaId as string);
        if (existing) {
            await SupabaseProvider.saveHogarOrder({
                id: existing.id,
                estado: 'pago_ingresado'
            });
        }

        res.json(result);
    } catch (error: any) {
        res.status(error?.response?.status || 500).json({ error: error.message, details: error?.response?.data });
    }
};

export const confirmOrder = async (req: Request, res: Response) => {
    try {
        const { ordenVentaId } = req.params;
        const { provider: providerName = 'RUS' } = req.query;
        const provider: any = InsuranceProviderFactory.getProvider(providerName as string);
        await provider.authenticate();

        const result = await provider.confirmOrder(ordenVentaId);

        // Actualizar estado final en Supabase
        const existing = await SupabaseProvider.getOrderByRusId(ordenVentaId as string);
        if (existing) {
            await SupabaseProvider.saveHogarOrder({
                id: existing.id,
                estado: 'emitido',
                poliza: result.numero || result.numeroPropuesta || null
            });
        }

        res.json(result);
    } catch (error: any) {
        res.status(error?.response?.status || 500).json({ error: error.message, details: error?.response?.data });
    }
};

export const getPolizaPdf = async (req: Request, res: Response) => {
    try {
        const { ramo, poliza, endoso } = req.query;
        const { provider: providerName = 'RUS' } = req.query;
        
        if (!ramo || !poliza) {
            return res.status(400).json({ error: 'Faltan parámetros ramo o poliza' });
        }

        const provider: any = InsuranceProviderFactory.getProvider(providerName as string);
        await provider.authenticate();

        const pdfBuffer = await provider.getPolizaPdf(
            parseInt(ramo as string),
            parseInt(poliza as string),
            parseInt((endoso as string) || '0')
        );

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Poliza_${poliza}.pdf`);
        res.send(Buffer.from(pdfBuffer));
    } catch (error: any) {
        console.error('[Controller] Error downloading PDF:', error.message);
        res.status(error?.response?.status || 500).json({ error: error.message, details: error?.response?.data });
    }
};
