import dotenv from 'dotenv';
import path from 'path';
import { InsuranceProviderFactory } from './src/services/providers/InsuranceProviderFactory';

dotenv.config({ path: path.resolve(__dirname, '.env') });

async function run() {
    try {
        const provider: any = InsuranceProviderFactory.getProvider('RUS');
        await provider.authenticate();

        const ordenVentaId = '104890a5-5163-43f9-b0e5-898db3c5bfeb'; // from scratch5
        
        const finalAnswers = [
            { codigoPregunta: 'CALLE_CF', valores: ['SN'] },
            { codigoPregunta: 'ALT_CF', valores: ['0'] },
            { codigoPregunta: 'CPPPP', valores: ['1000'] },
            { codigoPregunta: 'tipooo', valores: ['jous'] },
            { codigoPregunta: 'matconst', valores: ['trad'] },
            { codigoPregunta: 'VIVIENDA_COMBINADOFAMILIAR_CARACTER', valores: ['VIVIENDA_COMBINADOFAMILIAR_CARACTER1'] },
            { codigoPregunta: 'VIVIENDA_COMBINADOFAMILIAR_PREGUNTATIPOVIVIENDA_PACK', valores: ['VIVIENDA_COMBINADOFAMILIAR_PREGUNTATIPOVIVIENDA_PACK1'] },
            { codigoPregunta: 'VIVIENDA_COMBINADOFAMILIAR_ACTIVIDAD', valores: ['VIVIENDA_COMBINADOFAMILIAR_ACTIVIDAD1'] },
            { codigoPregunta: 'VIVIENDA_COMBINADOFAMILIAR_SINIESTROS', valores: ['VIVIENDA_COMBINADOFAMILIAR_SINIESTROS2'] },
            { codigoPregunta: 'M222', valores: [100] },
            { codigoPregunta: 'VIVIENDA_COMBINADOFAMILIAR_DEPENDENCIAS', valores: ['VIVIENDA_COMBINADOFAMILIAR_DEPENDENCIAS2'] },
            { codigoPregunta: 'VIVIENDA_COMBINADOFAMILIAR_OCUPACION', valores: ['VIVIENDA_COMBINADOFAMILIAR_OCUPACION1'] },
            { codigoPregunta: 'med_seg_pack', valores: ['ALARMA'] },
            { codigoPregunta: 'VIVIENDA_COMBINADOFAMILIAR_MURO', valores: ['VIVIENDA_COMBINADOFAMILIAR_MURO2'] }
        ];

        const body = { respuestas: finalAnswers };
        try {
            await provider.apiClient.post('/ordenventas/' + ordenVentaId + '/formularios/respuesta', body);
            console.log('OK! Form accepted.');
        } catch (e: any) {
            console.log(e.response ? JSON.stringify(e.response.data.errores, null, 2) : e.message);
        }
    } catch (e: any) {
        console.error(e.message);
    }
}
run();
