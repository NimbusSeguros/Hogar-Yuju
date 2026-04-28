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
    console.log('[Controller] submitEmissionForm reached.');
    try {
        const { ordenVentaId } = req.params;
        const { answers, personalData: bodyPersonalData, addressData: bodyAddressData } = req.body;
        const { provider: providerName = 'RUS' } = req.query;
        const provider: any = InsuranceProviderFactory.getProvider(providerName as string);
        await provider.authenticate();

        // Use data from body or fallback to hardcoded ONLY if missing (for legacy support during transition)
        const personalData = bodyPersonalData || {
            nombre: "Valentin",
            apellido: "Schutt",
            email: "schuttvalentin@gmail.com",
            numeroDocumento: "44224244",
            telefono_codigo_area: "3442",
            telefono_numero: "445522",
            fechaNacimientoAno: "1999",
            fechaNacimientoMes: "04",
            fechaNacimientoDia: "10",
            nacionalidad: "ARG",
            tipoDocumento: "DNI"
        };

        const addressData = bodyAddressData || {
            calle: "Ricardo Balbin 1824",
            numero: "6",
            codigoPostal: "3260",
            localidad: "concepcion del uruguay",
            piso: "",
            dpto: ""
        };

        // 1. Build Client Payload (Tomador)
        const clientPayload: any = {
            tipoPersona: 'FISICA',
            nacionalidad: personalData.nacionalidad || 'ARG',
            tipoDocumento: personalData.tipoDocumento || 'DNI',
            numeroDocumento: personalData.numeroDocumento || personalData.dni || '',
            nombre: personalData.nombre || '',
            apellido: personalData.apellido || '',
            razonSocial: '',
            fechaNacimiento: `${personalData.fechaNacimientoAno}-${String(personalData.fechaNacimientoMes).padStart(2, '0')}-${String(personalData.fechaNacimientoDia).padStart(2, '0')}`,
            codTelefonoPais: '54',
            codTelefonoArea: personalData.telefono_codigo_area || '',
            numeroTelefono: personalData.telefono_numero || '',
            email: personalData.email || '',
            domicilio: {
                calle: addressData.calle || '',
                numero: addressData.numero || '',
                codigoPostal: addressData.codigoPostal || '',
                localidad: addressData.localidad || ''
            }
        };

        if (addressData.piso) (clientPayload.domicilio as any).piso = addressData.piso;
        if (addressData.dpto || addressData.departamento) (clientPayload.domicilio as any).departamento = addressData.dpto || addressData.departamento;

        console.log('[Controller] Submitting Client Data (Tomador)...');
        try {
            await provider.submitClientData(ordenVentaId, clientPayload);
            console.log('[Controller] Client Data submitted successfully.');
        } catch (clientError: any) {
            const errorMsg = clientError?.response?.data?.errores?.[0]?.mensaje || clientError.message;
            if (errorMsg.includes('ya tiene asociado un contacto tomador')) {
                console.log('[Controller] Client Data already associated, skipping as requested.');
            } else {
                console.error('[Controller] Error submitting client data:', errorMsg);
                throw clientError; // Re-throw if it's a real error
            }
        }

        // 2. Discover Emission Form (Underwriting questions)
        let rusFormRes: any;
        const validCodes = new Set<string>();
        try {
            rusFormRes = await provider.getEmissionForm(ordenVentaId);
            const processForm = (item: any) => {
                if (!item || typeof item !== 'object') return;
                
                if (Array.isArray(item)) {
                    item.forEach(processForm);
                } else {
                    // Check for questions in different possible locations
                    if (item.preguntas && Array.isArray(item.preguntas)) {
                        item.preguntas.forEach((p: any) => {
                            if (p.codigo) validCodes.add(p.codigo);
                        });
                    }
                    if (item.codigosPreguntas && Array.isArray(item.codigosPreguntas)) {
                        item.codigosPreguntas.forEach((c: any) => {
                            if (typeof c === 'string') validCodes.add(c);
                        });
                    }
                    
                    // Recurse into all object properties
                    for (const key in item) {
                        if (item[key] && typeof item[key] === 'object' && key !== 'preguntas' && key !== 'codigosPreguntas') {
                            processForm(item[key]);
                        }
                    }
                }
            };
            processForm(rusFormRes);
            console.log('[Controller] Discovered Mandatory Questions:', Array.from(validCodes));
            console.log('[Controller] Discovered valid question codes:', Array.from(validCodes));
        } catch (formError: any) {
            console.warn('[Controller] Could not fetch emission form. RUS might not require questions for this product.');
        }

        // 3. Prepare Answers
        const finalAnswers = [...(answers || [])];
        
        // Add address answers if not present
        const addressMap: any = {
            'CALLE_CF': addressData.calle,
            'ALT_CF': addressData.numero,
            'CPPPP': addressData.codigoPostal,
            'PISO_CF': addressData.piso || '0',
            'DPTO_CF': addressData.dpto || '0'
        };

        for (const [codigo, valor] of Object.entries(addressMap)) {
            if (!finalAnswers.find((a: any) => a.codigoPregunta === codigo)) {
                finalAnswers.push({ codigoPregunta: codigo, valores: [valor] });
            }
        }

        // Add default product answers if not present
        const defaultQs: any = {
            'VIVIENDA_COMBINADOFAMILIAR_ACTIVIDAD': 'VIVIENDA_COMBINADOFAMILIAR_ACTIVIDAD2',
            'VIVIENDA_COMBINADOFAMILIAR_SINIESTROS': 'VIVIENDA_COMBINADOFAMILIAR_SINIESTROS2',
            'M222': '100',
            'VIVIENDA_COMBINADOFAMILIAR_DEPENDENCIAS': 'VIVIENDA_COMBINADOFAMILIAR_DEPENDENCIAS2',
            'VIVIENDA_COMBINADOFAMILIAR_OCUPACION': 'VIVIENDA_COMBINADOFAMILIAR_OCUPACION1',
            'med_seg_pack': 'ALARMA', 
            'VIVIENDA_COMBINADOFAMILIAR_MURO': 'VIVIENDA_COMBINADOFAMILIAR_MURO2',
            'tipooo': 'jous',
            'matconst': 'trad',
            'LOTE': '0',
            'VIVIENDA_COMBINADOFAMILIAR_PREGUNTATIPOVIVIENDA_PACK': 'VIVIENDA_COMBINADOFAMILIAR_PREGUNTATIPOVIVIENDA_PACK1'
        };

        for (const [codigo, valor] of Object.entries(defaultQs)) {
            if (!finalAnswers.find((a: any) => a.codigoPregunta === codigo)) {
                finalAnswers.push({ codigoPregunta: codigo, valores: [valor] });
            }
        }

        // 4. Filter and Submit
        // IMPORTANT: RUS API requires all values to be STRINGS, even for NUMBER types.
        const filteredAnswers = finalAnswers
            .filter(ans => validCodes.has(ans.codigoPregunta))
            .map(ans => ({
                ...ans,
                valores: ans.valores.map((v: any) => String(v))
            }));
        
        let result = { message: 'No underwriting questions required' };
        if (filteredAnswers.length > 0) {
            console.log('[Controller] Submitting Filtered Emission Form Answers (as strings):', JSON.stringify(filteredAnswers, null, 2));
            result = await provider.submitEmissionForm(ordenVentaId, filteredAnswers);
        } else if (validCodes.size > 0) {
            console.error('[Controller] CRITICAL: Form has questions but none matched our defaults!', Array.from(validCodes));
            return res.status(400).json({ 
                error: 'Faltan responder preguntas obligatorias', 
                discoveredCodes: Array.from(validCodes)
            });
        }

        // 5. Update Supabase
        try {
            const existing = await SupabaseProvider.getOrderByRusId(ordenVentaId as string);
            if (existing) {
                await SupabaseProvider.saveHogarOrder({
                    id: existing.id,
                    domicilio: addressData,
                    telefono: `${personalData.telefono_codigo_area}${personalData.telefono_numero}`,
                    fecha_nacimiento: `${personalData.fechaNacimientoAno}-${String(personalData.fechaNacimientoMes).padStart(2, '0')}-${String(personalData.fechaNacimientoDia).padStart(2, '0')}`,
                    estado: 'domicilio_completado'
                });
            }
        } catch (dbError: any) {
            console.warn('[Controller] Supabase update failed (non-critical):', dbError.message);
        }

        res.json(result);

    } catch (error: any) {
        console.error('[Controller] ERROR in submitEmissionForm:', error?.response?.data || error.message);
        res.status(error?.response?.status || 500).json({ 
            error: error.message, 
            details: error?.response?.data,
            sentPayload: error?.config?.data ? JSON.parse(error.config.data) : null
        });
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
        const { paymentInfo } = req.body;

        console.log('[Controller] Bypassing RUS payment submission. Saving choice to Supabase.');

        // Actualizar estado en Supabase
        const existing = await SupabaseProvider.getOrderByRusId(ordenVentaId as string);
        if (existing) {
            await SupabaseProvider.saveHogarOrder({
                id: existing.id,
                estado: 'esperando_asesor',
                metodo_pago: paymentInfo?.medioPago || paymentInfo?.method,
                marca_tarjeta: paymentInfo?.marcaTarjeta || null
            });
        }

        res.json({ message: 'Selección de pago guardada. Un asesor lo contactará.', status: 'OK' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const confirmOrder = async (req: Request, res: Response) => {
    try {
        const { ordenVentaId } = req.params;
        console.log('[Controller] Bypassing RUS confirmOrder. Marking as pending advisor.');

        // Actualizar estado final en Supabase
        const existing = await SupabaseProvider.getOrderByRusId(ordenVentaId as string);
        if (existing) {
            await SupabaseProvider.saveHogarOrder({
                id: existing.id,
                estado: 'esperando_asesor_final'
            });
        }

        res.json({ message: 'Solicitud enviada correctamente', status: 'OK' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
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
