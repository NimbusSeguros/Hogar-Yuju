const fs = require('fs');

try {
    const data = fs.readFileSync('c:/Users/schut/Hogar-Yuju/emission_form_discovery.json', 'utf16le');
    const cleanJson = data.substring(data.indexOf('{'));
    const json = JSON.parse(cleanJson);
    console.log('--- Questions with Options ---');
    const questions = json.formularioDTO ? json.formularioDTO.preguntas : [];
    
    questions.forEach(p => {
        if (['matconst', 'tipoo', 'VIVIENDA_COMBINADOFAMILIAR_PREGUNTATIPOVIVIENDA_PACK'].includes(p.codigo)) {
            console.log(`\n[${p.codigo}] ${p.texto}`);
            p.opciones.forEach(o => {
                console.log(`  - ${o.codigo}: ${o.texto}`);
            });
        }
        if (['PISO_CF', 'DPTO_CF'].includes(p.codigo)) {
            console.log(`\n[${p.codigo}] ${p.texto} (Type: ${p.tipoRespuesta})`);
        }
    });
} catch (e) {
    console.error(e.message);
}
