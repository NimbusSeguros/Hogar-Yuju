import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const authUrl = process.env.RUS_API_AUTH_URL;
const username = process.env.RUS_USERNAME;
const password = process.env.RUS_PASSWORD;
const baseUrl = process.env.RUS_API_BASE_URL;

async function fetchFullForm() {
    try {
        console.log('Authenticating...');
        const authRes = await axios.post(`${authUrl}/login`, { username, password });
        const token = authRes.data.access_token;
        console.log('Authenticated.');

        console.log('Fetching form for CF_PACK_FREESTYLE...');
        const res = await axios.get(`${baseUrl}/objetos/VIVIENDA/indicios/CF_PACK_FREESTYLE/formulario`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('Full Form with Options:');
        console.log(JSON.stringify(res.data, null, 2));

    } catch (error: any) {
        console.error('Error:', error.response?.data || error.message);
    }
}

fetchFullForm();
