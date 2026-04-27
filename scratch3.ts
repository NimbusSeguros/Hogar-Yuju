import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { InsuranceProviderFactory } from './src/services/providers/InsuranceProviderFactory';

dotenv.config({ path: path.resolve(__dirname, '.env') });

async function getForm() {
    try {
        const provider = InsuranceProviderFactory.getProvider('RUS');
        await (provider as any).authenticate();
        
        const objects = await (provider as any).getGlobalObjects();
        const objCode = objects.find((o: any) => o.codigo.includes('VIVIENDA') || o.codigo.includes('COMBINADO'))?.codigo || objects[0].codigo;

        const indicios = await (provider as any).getIndicios(objCode);
        const form = await (provider as any).getForm(objCode, indicios[0].codigo);
        
        fs.writeFileSync('form_dump.json', JSON.stringify(form, null, 2));
        console.log("Form dumped to form_dump.json");
    } catch (err: any) {
        console.error("ERROR", err?.response?.data || err.message);
    }
}
getForm();
