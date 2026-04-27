import dotenv from 'dotenv';
import path from 'path';
import { InsuranceProviderFactory } from './src/services/providers/InsuranceProviderFactory';

dotenv.config({ path: path.resolve(__dirname, '.env') });

async function checkEmissionForm() {
    try {
        const provider: any = InsuranceProviderFactory.getProvider('RUS');
        await provider.authenticate();

        // 1. Get objects
        const objects = await provider.getGlobalObjects();
        const objCode = objects.find((o: any) => o.codigo.includes('VIVIENDA') || o.codigo.includes('COMBINADO'))?.codigo || objects[0].codigo;

        // 2. Get indicios
        const indicios = await provider.getIndicios(objCode);
        const indicioCode = indicios[0].codigo;

        // 3. submit quote form to get consulta ID
        // The quote form only requires MET2 according to earlier checks
        const quoteAnswers = { 'MET2': '100y125' }; 
        const consulta = await provider.submitFormAnswers(objCode, indicioCode, quoteAnswers);
        const consultaId = consulta.consultaId || consulta.idConsulta || consulta.id;

        // 4. get plans
        const planes = await provider.getPlansByConsultaId(consultaId);
        const plan = planes[0];
        
        // 5. create order
        const formaPago = plan.formasPago ? plan.formasPago[0] : { cantidadCuotas: 1, precioCuota: 1000, mediosPago: ['TARJETA_CREDITO'] };
        const order = await provider.createOrder(consultaId, plan, formaPago);
        const ordenVentaId = order.ordenVentaID;
        console.log("Created order: ", ordenVentaId);

        // 6. get emission form!
        const emissionFormResp = await provider.apiClient.get('/ordenventas/' + ordenVentaId + '/formularios');
        const emissionForm = emissionFormResp.data;

        // find tipooo
        let tipoooOption = null;
        for (const f of emissionForm) {
            for (const q of f.preguntas || []) {
                if (q.codigo === 'tipooo') {
                    tipoooOption = q.opciones;
                    console.log("TIPO OOO OPTIONS:", JSON.stringify(q.opciones, null, 2));
                }
            }
        }
        if (!tipoooOption) console.log("Not found tipooo in emission form?");
    } catch (err: any) {
        console.error("ERROR", err?.response?.data || err.message);
    }
}

checkEmissionForm();
