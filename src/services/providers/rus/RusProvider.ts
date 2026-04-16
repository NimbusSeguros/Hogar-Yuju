import axios, { AxiosInstance } from 'axios';
import { InsuranceProvider } from '../../../interfaces/InsuranceProvider';

export class RusProvider implements InsuranceProvider {
    public apiClient: AxiosInstance;
    private accessToken: string | null = null;
    private refreshToken: string | null = null;

    constructor() {
        const baseURL = process.env.RUS_API_BASE_URL;
        this.apiClient = axios.create({
            baseURL,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Interceptor to add access token to requests
        this.apiClient.interceptors.request.use((config) => {
            if (this.accessToken && config.headers) {
                config.headers.set('Authorization', `Bearer ${this.accessToken}`);
                console.log(`[RusProvider] Injecting token: ${this.accessToken.substring(0, 10)}...`);
            } else {
                console.warn('[RusProvider] No accessToken available for request:', config.url);
            }
            return config;
        }, (error) => {
            return Promise.reject(error);
        });
    }

    async authenticate(): Promise<void> {
        const authUrl = process.env.RUS_API_AUTH_URL;
        const username = process.env.RUS_USERNAME;
        const password = process.env.RUS_PASSWORD;

        if (!authUrl || !username || !password) {
            throw new Error('RUS credentials or auth URL are not configured in environment variables.');
        }

        try {
            const response = await axios.post(`${authUrl}/login`, {
                username,
                password
            });

            this.accessToken = response.data.access_token;
            this.refreshToken = response.data.refresh_token;

            console.log("Successfully authenticated with RUS SIAPI");
        } catch (error: any) {
            console.error('Error authenticating with RUS:', error?.response?.data || error.message);
            throw error;
        }
    }

    // ===== CAMPAIGN-BASED ENDPOINTS (legacy) =====
    async getObjects(campaignCode: string): Promise<any[]> {
        const response = await this.apiClient.get(`/campanias/${campaignCode}/objetos`);
        return response.data;
    }

    // ===== 3-STEP QUOTE FLOW (global, no campaign needed) =====

    /** Get all insurable objects */
    async getGlobalObjects(): Promise<any[]> {
        const response = await this.apiClient.get('/objetos');
        return response.data;
    }

    /** Get indicios (risks) for a specific object */
    async getIndicios(objectCode: string): Promise<any[]> {
        const response = await this.apiClient.get(`/objetos/${objectCode}/indicios`);
        return response.data;
    }

    /** Get the quotation form (questions) for an object + indicio combination */
    async getForm(objectCode: string, indicioCode: string): Promise<any> {
        const response = await this.apiClient.get(`/objetos/${objectCode}/indicios/${indicioCode}/formulario`);
        return response.data;
    }

    /** Submit form answers and get a consultaId back */
    async submitFormAnswers(objectCode: string, indicioCode: string, answers: Record<string, any>, consultaId?: string): Promise<any> {
        // RUS API expects: { respuestas: [{ codigoPregunta: "X", valores: ["Y"] }], consultaId?: "..." }
        const respuestas = Object.entries(answers).map(([codigoPregunta, valor]) => ({
            codigoPregunta,
            valores: Array.isArray(valor) ? valor : [valor]
        }));
        const body: any = { respuestas };
        if (consultaId) body.consultaId = consultaId;
        const response = await this.apiClient.post(`/objetos/${objectCode}/indicios/${indicioCode}/formulario/respuestas`, body);
        return response.data;
    }

    /** Get available plans after form is completed */
    async getPlansByConsultaId(consultaId: string): Promise<any[]> {
        const response = await this.apiClient.get(`/consultas/${consultaId}/planes`);
        return response.data;
    }

    // ===== EMISSION FLOW (ORDEN DE VENTA) =====

    /** STEP 1: Iniciar una orden de venta (punto de inicio de la emisión) */
    async createOrder(idConsulta: string, plan: any, formaPago: any): Promise<any> {
        // According to siapi.yml, /v1/ordenventa accepts OrdenVenta schema
        const body = {
            consultaID: idConsulta,
            codigoPlan: plan.codigo,
            cantidadCuotas: formaPago.cantidadCuotas,
            precioCuota: formaPago.precioCuota,
            codigoISOMoneda: formaPago.codigoISOMoneda || 'ARS',
            medioPago: formaPago.mediosPago[0], // Use first available for start
            inicioVigencia: new Date().toISOString().split('T')[0], // Today
            finVigencia: (() => {
                const d = new Date();
                d.setMonth(d.getMonth() + 6);
                return d.toISOString().split('T')[0];
            })(), // Exactly 6 months later
            cantidadObjetos: 1, // Fixed for Hogar for now
            codigoProductor: process.env.RUS_DEFAULT_PRODUCER_CODE || "" 
        };
        console.log('[RusProvider] Creating order with payload:', JSON.stringify(body, null, 2));
        try {
            const response = await this.apiClient.post('/ordenventa', body);
            return response.data;
        } catch (error: any) {
            console.error('[RusProvider] ERROR creating order:', error?.response?.data || error.message);
            throw error;
        }
    }

    /** STEP 2: Cargar datos personales del tomador */
    async submitClientData(ordenVentaId: string, clientData: any): Promise<any> {
        // clientData follows the 'Contacto' schema in siapi.yml
        const response = await this.apiClient.post(`/ordenventas/${ordenVentaId}/datocliente`, clientData);
        return response.data;
    }

    /** STEP 3: Cargar datos específicos del riesgo (ej. Domicilio) */
    async submitEmissionForm(ordenVentaId: string, answers: any[]): Promise<any> {
        // En emisión, se espera RespuestasEmisionRequest
        const body = { respuestas: answers };
        console.log('[RusProvider] Submitting emission form with payload:', JSON.stringify(body, null, 2));
        try {
            const response = await this.apiClient.post(`/ordenventas/${ordenVentaId}/formularios/respuesta`, body);
            return response.data;
        } catch (error: any) {
            console.error('[RusProvider] ERROR submitting emission form:', error?.response?.data || error.message);
            throw error;
        }
    }

    /** STEP 4: Cargar datos de pago */
    async submitPaymentInfo(ordenVentaId: string, paymentInfo: any): Promise<any> {
        // paymentInfo follows the 'InfoPago' schema in siapi.yml
        const response = await this.apiClient.post(`/ordenventas/${ordenVentaId}/infopago`, paymentInfo);
        return response.data;
    }

    /** STEP 5: Confirmar la orden para disparar la emisión */
    async confirmOrder(ordenVentaId: string): Promise<any> {
        const response = await this.apiClient.post(`/ordenventas/${ordenVentaId}/confirmarorden`);
        return response.data;
    }

    // ===== LEGACY CAMPAIGN ENDPOINTS =====
    async getObject(campaignCode: string, objectCode: string): Promise<any> {
        const response = await this.apiClient.get(`/campanias/${campaignCode}/objetos/${objectCode}`);
        return response.data;
    }

    async startInteractiveForm(campaignCode: string, objectCode: string, symptomCode: string): Promise<any> {
        const url = `/campanias/${campaignCode}/objetos/${objectCode}/indicios/${symptomCode}/formulario/proxima-pregunta`;
        const response = await this.apiClient.post(url, {});
        return response.data;
    }

    async submitAnswer(campaignCode: string, objectCode: string, symptomCode: string, queryId: string, answers: any): Promise<any> {
        const url = `/campanias/${campaignCode}/objetos/${objectCode}/indicios/${symptomCode}/formulario/proxima-pregunta`;
        const body = {
            consultaId: queryId,
            ...answers
        };
        const response = await this.apiClient.post(url, body);
        return response.data;
    }

    async getPlans(campaignCode: string, queryId: string): Promise<any[]> {
        const url = `/campanias/${campaignCode}/consultas/${queryId}/planes`;
        const response = await this.apiClient.get(url);
        return response.data;
    }
}
