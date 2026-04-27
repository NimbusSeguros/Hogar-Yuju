import dotenv from 'dotenv';
import path from 'path';
import { InsuranceProviderFactory } from './src/services/providers/InsuranceProviderFactory';

dotenv.config({ path: path.resolve(__dirname, '.env') });

async function getForm() {
    try {
        const provider = InsuranceProviderFactory.getProvider('RUS');
        await (provider as any).authenticate();
        
        // Let's get objects to see what indicio we need to use
        const objects = await (provider as any).getGlobalObjects();
        const combObj = objects.find((o: any) => o.codigo === 'COMBINADO_FAMILIAR');
        
        const indicios = await (provider as any).getIndicios('COMBINADO_FAMILIAR');
        
        const form = await (provider as any).getForm('COMBINADO_FAMILIAR', 'COMBINADOFAMILIAR');
        
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
