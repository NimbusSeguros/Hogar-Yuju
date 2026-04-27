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
            // Transform frontend personalData into RUS exact schema, combining with the collected address
            const clientPayload = {
                nombre: personalData.nombre,
                apellido: personalData.apellido,
                tipoDocumento: personalData.tipoDocumento || 'DNI',
                numeroDocumento: personalData.numeroDocumento,
                nacionalidad: personalData.nacionalidad || 'ARG',
                fechaNacimiento: `${personalData.fechaNacimientoAno}-${personalData.fechaNacimientoMes.padStart(2, '0')}-${personalData.fechaNacimientoDia.padStart(2, '0')}`,
                email: personalData.email,
                // SIAPI Kontakt/Contacto expects flat fields for phone, NOT a telefonos array
                codTelefonoPais: "54", 
                codTelefonoArea: personalData.telefono_codigo_area,
                numeroTelefono: personalData.telefono_numero,
                tipoPersona: "FISICA",
                condicionIVA: "CONSUMIDOR_FINAL",
                condicionIIBB: "NO_INSCRIPTO",
                domicilio: {
                    calle: addressData.calle,
                    numero: addressData.numero,
                    localidad: addressData.localidad,
                    codigoPostal: addressData.codigoPostal,
                    pais: 'ARGENTINA',
                    provincia: addressData.provincia || 'ENTRE_RIOS' 
                }
            };

            console.log('[Controller] Submitting Client Data:', JSON.stringify(clientPayload, null, 2));
            await provider.submitClientData(ordenVentaId, clientPayload);
        }

        // Fetch the actual emission form to know which questions are valid for this specific order
        const rusFormRes = await provider.getEmissionForm(ordenVentaId);
        // The response might be an array of forms or a single object with a 'preguntas' array
        const forms = Array.isArray(rusFormRes) ? rusFormRes : [rusFormRes];
        const validCodes = new Set<string>();
        forms.forEach((f: any) => {
            if (f.preguntas) {
                f.preguntas.forEach((p: any) => validCodes.add(p.codigo));
            }
        });

        console.log('[Controller] Valid question codes for this form:', Array.from(validCodes));

        // Add mandatory underwiting answers for RUS CF Freestyle
        // 3. Submit the emission form answers (The actual underwriting questions)
        const finalAnswers = [...answers];

        // Ensure address questions use the specific CF codes
        const addressMap: any = {
            'CALLE_CF': addressData?.calle || 'SN',
            'ALT_CF': addressData?.numero || '0',
            'CPPPP': addressData?.codigoPostal || '0000',
        };

        for (const [codigo, valor] of Object.entries(addressMap)) {
            if (!finalAnswers.find((a: any) => a.codigoPregunta === codigo)) {
                finalAnswers.push({ codigoPregunta: codigo, valores: [valor] });
            }
        }

        // Add hidden mandatory answers with discovered internal IDs
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

        // --- DYNAMIC FILTERING ---
        // Only keep answers whose code exists in the current RUS form
        const filteredAnswers = finalAnswers.filter(ans => {
            const isValid = validCodes.has(ans.codigoPregunta);
            if (!isValid) {
                console.warn(`[Controller] Removing invalid question code for this form: ${ans.codigoPregunta}`);
            }
            return isValid;
        });

        let result = { message: 'No underwriting questions required for this product' };
        
        // ONLY call RUS if there are actually questions to answer in this form
        if (validCodes.size > 0) {
            console.log('[Controller] Submitting Filtered Emission Form Answers:', JSON.stringify({ respuestas: filteredAnswers }, null, 2));
            result = await provider.submitEmissionForm(ordenVentaId, filteredAnswers);
        } else {
            console.log('[Controller] Skipping submitEmissionForm because the form has no questions. Proceeding to next step.');
        }

        // Guardar en Supabase - Guardamos telefono, nacimiento y limpiamos el json de domicilio
        const existing = await SupabaseProvider.getOrderByRusId(ordenVentaId as string);
        if (existing) {
            // Extraer solo lo más importante del domicilio
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

            // Asegurar que guardamos telefono y fecha de nacimiento si vienen en personalData
            if (personalData) {
                updatePayload.telefono = `${personalData.telefono_codigo_area || ''}${personalData.telefono_numero || ''}`;
                updatePayload.fecha_nacimiento = `${personalData.fechaNacimientoAno}-${String(personalData.fechaNacimientoMes).padStart(2, '0')}-${String(personalData.fechaNacimientoDia).padStart(2, '0')}`;
            }

            await SupabaseProvider.saveHogarOrder(updatePayload);
        }

        res.json(result);
    } catch (error: any) {
        console.error('[Controller] ERROR in submitEmissionForm:', JSON.stringify(error?.response?.data || error.message, null, 2));
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
