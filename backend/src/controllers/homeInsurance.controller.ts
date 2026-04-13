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
        res.status(500).json({ error: error.message, details: error?.response?.data });
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
        res.status(500).json({ error: error.message, details: error?.response?.data });
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
        res.status(500).json({ error: error.message, details: error?.response?.data });
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
        res.status(500).json({ error: error.message, details: error?.response?.data });
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
        res.status(500).json({ error: error.message, details: error?.response?.data });
    }
};

export const submitEmissionForm = async (req: Request, res: Response) => {
    try {
        const { ordenVentaId } = req.params;
        const { answers, addressData } = req.body;
        const { provider: providerName = 'RUS' } = req.query;
        const provider: any = InsuranceProviderFactory.getProvider(providerName as string);
        await provider.authenticate();

        const result = await provider.submitEmissionForm(ordenVentaId, answers);

        // Guardar domicilio en Supabase
        const existing = await SupabaseProvider.getOrderByRusId(ordenVentaId as string);
        if (existing) {
            await SupabaseProvider.saveHogarOrder({
                id: existing.id,
                domicilio: addressData,
                estado: 'domicilio_completado'
            });
        }

        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message, details: error?.response?.data });
    }
};

export const submitPaymentInfo = async (req: Request, res: Response) => {
    try {
        const { ordenVentaId } = req.params;
        const { paymentInfo } = req.body;
        const { provider: providerName = 'RUS' } = req.query;
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
        res.status(500).json({ error: error.message, details: error?.response?.data });
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
                estado: 'emitido'
            });
        }

        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message, details: error?.response?.data });
    }
};

