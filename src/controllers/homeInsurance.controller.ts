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
    console.log('[Controller] Bypassing RUS createOrder. Creating complete lead in Supabase.');
    try {
        const { plan, formaPago, personalData, addressData, paymentData } = req.body;

        const localOrderId = `YJ-HOG-${Date.now()}`;

        // Guardar en Supabase (todos los datos recolectados)
        const dbOrder = await SupabaseProvider.saveHogarOrder({
            nombre: personalData.nombre,
            apellido: personalData.apellido,
            email: personalData.email,
            dni: personalData.numeroDocumento,
            telefono: `${personalData.telefono_codigo_area || ''}${personalData.telefono_numero || ''}`,
            fecha_nacimiento: `${personalData.fechaNacimientoAno || ''}-${String(personalData.fechaNacimientoMes || '').padStart(2, '0')}-${String(personalData.fechaNacimientoDia || '').padStart(2, '0')}`,
            domicilio: addressData,
            metodo_pago: paymentData?.method || null,
            marca_tarjeta: paymentData?.marcaTarjeta || null,
            plan_codigo: plan?.codigo,
            precio_cuota: formaPago?.precioCuota,
            order_id_rus: localOrderId,
            estado: 'esperando_asesor'
        });

        res.json({ 
            rusOrder: { ordenVentaID: localOrderId },
            dbOrder 
        });
    } catch (error: any) {
        console.error('[Controller] Error in unified createOrder:', error.message);
        res.status(500).json({ error: error.message });
    }
};

export const submitClientData = async (req: Request, res: Response) => {
    console.log('[Controller] Bypassing RUS submitClientData. Updating lead in Supabase.');
    try {
        const { ordenVentaId } = req.params;
        const { clientData } = req.body;

        // Actualizar Supabase con más detalles
        const existing = await SupabaseProvider.getOrderByRusId(ordenVentaId as string);
        if (existing) {
            await SupabaseProvider.saveHogarOrder({
                id: existing.id,
                telefono: `${clientData.codTelefonoArea || ''}${clientData.numeroTelefono || ''}`,
                fecha_nacimiento: clientData.fechaNacimiento,
                estado: 'datos_personales_completos'
            });
        }

        res.json({ message: 'Datos personales guardados localmente', status: 'OK' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const submitEmissionForm = async (req: Request, res: Response) => {
    console.log('[Controller] Bypassing RUS submitEmissionForm. Updating lead in Supabase.');
    try {
        const { ordenVentaId } = req.params;
        const { personalData: bodyPersonalData, addressData: bodyAddressData } = req.body;

        const personalData = bodyPersonalData || {};
        const addressData = bodyAddressData || {};

        // Actualizar Supabase con domicilio y datos extendidos
        const existing = await SupabaseProvider.getOrderByRusId(ordenVentaId as string);
        if (existing) {
            await SupabaseProvider.saveHogarOrder({
                id: existing.id,
                domicilio: addressData,
                telefono: `${personalData.telefono_codigo_area || ''}${personalData.telefono_numero || ''}`,
                fecha_nacimiento: `${personalData.fechaNacimientoAno || ''}-${String(personalData.fechaNacimientoMes || '').padStart(2, '0')}-${String(personalData.fechaNacimientoDia || '').padStart(2, '0')}`,
                estado: 'domicilio_completado'
            });
        }

        res.json({ message: 'Datos de ubicación guardados localmente', status: 'OK' });
    } catch (error: any) {
        console.error('[Controller] ERROR in submitEmissionForm:', error.message);
        res.status(500).json({ error: error.message });
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
