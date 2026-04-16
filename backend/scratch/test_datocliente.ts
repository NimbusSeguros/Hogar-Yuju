import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const authUrl = process.env.RUS_API_AUTH_URL;
const username = process.env.RUS_USERNAME;
const password = process.env.RUS_PASSWORD;
const baseUrl = process.env.RUS_API_BASE_URL;

async function testDatoCliente() {
    try {
        const authRes = await axios.post(`${authUrl}/login`, { username, password });
        const token = authRes.data.access_token;
        
        // 1. Get consulta
        const submitRes = await axios.post(`${baseUrl}/objetos/VIVIENDA/indicios/CF_PACK_FREESTYLE/formulario/respuestas`, 
            { respuestas: [{ codigoPregunta: 'MET2', valores: ['100_150'] }] },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        const consultaId = submitRes.data.consultaId;

        // Fetch plans to get a valid plan code
        const plansRes = await axios.get(`${baseUrl}/consultas/${consultaId}/planes`, { headers: { Authorization: `Bearer ${token}` } });
        const validPlan = plansRes.data[0];
        console.log('Valid Plan:', JSON.stringify(validPlan, null, 2));

        if (!validPlan) throw new Error('No plans found');

        // 2. Create order
        const orderRes = await axios.post(`${baseUrl}/ordenventa`, {
            "consultaID": consultaId, 
            "codigoPlan": validPlan.codigo,
            "cantidadCuotas": validPlan.formasPagos[0].cantidadCuotas,
            "precioCuota": validPlan.formasPagos[0].precioCuota,
            "codigoISOMoneda": "ARS",
            "medioPago": "TARJETA_CREDITO",
            "inicioVigencia": new Date().toISOString().split('T')[0],
            "finVigencia": (() => {
                const d = new Date();
                d.setMonth(d.getMonth() + 6);
                return d.toISOString().split('T')[0];
            })(),
            "cantidadObjetos": 1,
            "codigoProductor": "9254"
        }, { headers: { Authorization: `Bearer ${token}` } });
        
        const orderId = orderRes.data.ordenVentaID;

        // 3. Test datocliente exact payload
        const clientPayload = {
            "nombre": "Valentin",
            "apellido": "Schutt",
            "tipoDocumento": "DNI",
            "numeroDocumento": "40408344",
            "nacionalidad": "ARG",
            "fechaNacimiento": "1994-08-10",
            "email": "schuttvalentin@gmail.com",
            "telefonos": [
                {
                    "tipoTelefono": "CELULAR",
                    "codigoPais": "54",
                    "codigoArea": "03442",
                    "numeroTelefono": "530788"
                }
            ],
            "tipoPersona": "FISICA",
            "condicionIVA": "CONSUMIDOR_FINAL",
            "condicionIIBB": "NO_INSCRIPTO",
            "domicilio": {
                "calle": "Ricardo Balbin 1824",
                "numero": "6",
                "localidad": "CONCEPCION DEL URUGUAY",
                "codigoPostal": "3260",
                "pais": "ARGENTINA",
                "provincia": "ENTRE_RIOS"
            }
        };

        try {
            await axios.post(`${baseUrl}/ordenventas/${orderId}/datocliente`, clientPayload, { headers: { Authorization: `Bearer ${token}` } });
            console.log('✅ submitClientData SUCCESS!');
        } catch (e: any) {
            console.log('❌ submitClientData FAILED:', JSON.stringify(e.response?.data, null, 2));
        }

    } catch (e: any) {
         console.log('Fatal Failed:', e.response?.data || e);
    }
}
testDatoCliente();
