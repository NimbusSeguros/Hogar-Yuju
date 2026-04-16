import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const authUrl = process.env.RUS_API_AUTH_URL;
const username = process.env.RUS_USERNAME;
const password = process.env.RUS_PASSWORD;
const baseUrl = process.env.RUS_API_BASE_URL;

async function testDates() {
    try {
        console.log('Authenticating...');
        const authRes = await axios.post(`${authUrl}/login`, { username, password });
        const token = authRes.data.access_token;
        console.log('Authenticated.');

        // Get consultaId
        console.log('Generating Consulta ID...');
        const submitRes = await axios.post(`${baseUrl}/objetos/VIVIENDA/indicios/CF_PACK_FREESTYLE/formulario/respuestas`, 
            { respuestas: [{ codigoPregunta: 'MET2', valores: ['100_150'] }] },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        const consultaId = submitRes.data.consultaId;
        console.log('ConsultaId:', consultaId);

        const offsets = [
            { name: "Exact 6 months", fn: (d: Date) => { d.setMonth(d.getMonth() + 6); return d; } },
            { name: "Exact 6 months - 1 day", fn: (d: Date) => { d.setMonth(d.getMonth() + 6); d.setDate(d.getDate() - 1); return d; } },
            { name: "180 days", fn: (d: Date) => { d.setDate(d.getDate() + 180); return d; } },
            { name: "180 days - 1 day (179)", fn: (d: Date) => { d.setDate(d.getDate() + 179); return d; } },
            { name: "Exact 12 months", fn: (d: Date) => { d.setFullYear(d.getFullYear() + 1); return d; } },
            { name: "Tomorrow to 6 months", fn: (d: Date) => { d.setDate(d.getDate() + 1); d.setMonth(d.getMonth() + 6); return d; }, startTomorrow: true }
        ];

        let orderId = null;
        for (const offset of offsets) {
            const startDate = new Date();
            if (offset.startTomorrow) {
                startDate.setDate(startDate.getDate() + 1);
            }
            const endDate = offset.fn(new Date(startDate.getTime()));
            
            const startStr = startDate.toISOString().split('T')[0];
            const endStr = endDate.toISOString().split('T')[0];

            console.log(`\nTesting: ${offset.name} (${startStr} to ${endStr})`);

            const body = {
                consultaID: consultaId,
                codigoPlan: "CF_PACK5000_FS",
                cantidadCuotas: 6,
                precioCuota: 12100,
                codigoISOMoneda: 'ARS',
                medioPago: "TARJETA_CREDITO",
                inicioVigencia: startStr,
                finVigencia: endStr,
                cantidadObjetos: 1,
                codigoProductor: "9254"
            };

            try {
                const res = await axios.post(`${baseUrl}/ordenventa`, body, { headers: { Authorization: `Bearer ${token}` } });
                console.log('✅ createOrder SUCCESS!', res.data.ordenVentaID);
                orderId = res.data.ordenVentaID;
                break; // Stop on first success
            } catch (e: any) {
                console.log('❌ createOrder FAILED:', e.response?.data?.errores?.[0]?.mensaje || e.message);
            }
        }

        if (!orderId) {
            console.log('Could not create order with any date config.');
            return;
        }

        console.log('\n--- Submitting Client Data ---');
        const clientData = {
          nombre: "Juan",
          apellido: "Perez",
          email: "juanperez@example.com",
          numeroDocumento: "12345678"
        };
        try {
            await axios.post(`${baseUrl}/ordenventas/${orderId}/datocliente`, clientData, { headers: { Authorization: `Bearer ${token}` } });
            console.log('✅ submitClientData SUCCESS!');
        } catch (e: any) {
            console.log('❌ submitClientData FAILED:', JSON.stringify(e.response?.data, null, 2) || e.message);
        }

        console.log('\n--- Submitting Emission Form (Domicilio) ---');
        const answers = [
          { codigoPregunta: 'DOMICILIO_CALLE', valores: ["Avenida Pellegrini"] },
          { codigoPregunta: 'DOMICILIO_NUMERO', valores: ["1510"] },
          { codigoPregunta: 'DOMICILIO_LOCALIDAD', valores: ["Rosario"] },
          { codigoPregunta: 'DOMICILIO_CODIGO_POSTAL', valores: ["2000"] }
        ];
        try {
            await axios.post(`${baseUrl}/ordenventas/${orderId}/formularios/respuesta`, { respuestas: answers }, { headers: { Authorization: `Bearer ${token}` } });
            console.log('✅ submitEmissionForm SUCCESS!');
        } catch (e: any) {
            console.log('❌ submitEmissionForm FAILED:', JSON.stringify(e.response?.data, null, 2) || e.message);
        }

    } catch (error: any) {
        console.error('Fatal Error:', error.response?.data || error.message);
    }
}

testDates();
