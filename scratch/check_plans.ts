import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const authUrl = process.env.RUS_API_AUTH_URL;
const username = process.env.RUS_USERNAME;
const password = process.env.RUS_PASSWORD;
const baseUrl = process.env.RUS_API_BASE_URL;

async function check() {
    try {
        console.log('Authenticating...');
        const authRes = await axios.post(`${authUrl}/login`, { username, password });
        const token = authRes.data.access_token;
        console.log('Authenticated.');

        // Get objects to find Hogar
        console.log('Getting objects...');
        const objectsRes = await axios.get(`${baseUrl}/objetos`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Objects:', JSON.stringify(objectsRes.data, null, 2));

        // Let's assume we use 'VIVIENDA' and 'CF_PACK_FREESTYLE' logic from StepPlans.tsx
        // The subagent used some consultaId. Let's just create a new one.
        
        console.log('Fetching form questions...');
        const formRes = await axios.get(`${baseUrl}/objetos/VIVIENDA/indicios/CF_PACK_FREESTYLE/formulario`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Form Questions:', JSON.stringify(formRes.data, null, 2));

        const questionCode = 'MET2'; 
        const optionCode = '100_150'; // Entre 50 y 75
        console.log('Submitting form answers for', questionCode, 'with option', optionCode);

        const submitRes = await axios.post(`${baseUrl}/objetos/VIVIENDA/indicios/CF_PACK_FREESTYLE/formulario/respuestas`, 
            { respuestas: [{ codigoPregunta: questionCode, valores: [optionCode] }] },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        const consultaId = submitRes.data.consultaId;
        console.log('ConsultaId:', consultaId);

        console.log('Getting plans...');
        const plansRes = await axios.get(`${baseUrl}/consultas/${consultaId}/planes`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Plans:', JSON.stringify(plansRes.data, null, 2));

    } catch (error: any) {
        console.error('Error:', error.response?.data || error.message);
    }
}

check();
