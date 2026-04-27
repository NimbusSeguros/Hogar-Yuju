import dotenv from 'dotenv';
import path from 'path';
import { InsuranceProviderFactory } from './src/services/providers/InsuranceProviderFactory';

dotenv.config({ path: path.resolve(__dirname, '.env') });

async function getForm() {
    try {
        const provider = InsuranceProviderFactory.getProvider('RUS');
        await (provider as any).authenticate();
        
        const objects = await (provider as any).getGlobalObjects();
        console.log("Objects:", objects.map((o: any) => o.codigo));
        
        // Grab the first object and its indicios
        const objCode = objects.find((o: any) => o.codigo.includes('VIVIENDA') || o.codigo.includes('COMBINADO'))?.codigo || objects[0].codigo;
        console.log("Using Object:", objCode);

        const indicios = await (provider as any).getIndicios(objCode);
        console.log("Indicio:", indicios[0].codigo);
        
        const form = await (provider as any).getForm(objCode, indicios[0].codigo);
        
        const tipooo = form.preguntas.find((p: any) => p.codigo === 'tipooo');
        console.log("TIPOOO question:");
        console.log(JSON.stringify(tipooo, null, 2));

        const tipoo = form.preguntas.find((p: any) => p.codigo === 'tipoo');
        console.log("TIPOO question:");
        console.log(JSON.stringify(tipoo, null, 2));
    } catch (err: any) {
        console.error("ERROR", err?.response?.data || err.message);
    }
}
getForm();
