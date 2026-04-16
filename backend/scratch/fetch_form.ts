import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const authUrl = process.env.RUS_API_AUTH_URL;
const username = process.env.RUS_USERNAME;
const password = process.env.RUS_PASSWORD;
const baseUrl = process.env.RUS_API_BASE_URL;

const ordenVentaId = process.argv[2];

if (!ordenVentaId) {
    console.error('Please provide an ordenVentaId as an argument.');
    process.exit(1);
}

async function fetchForm() {
    try {
        console.log('Authenticating...');
        const authRes = await axios.post(`${authUrl}/login`, { username, password });
        const token = authRes.data.access_token;
        console.log('Authenticated.');

        console.log(`Fetching form for order ${ordenVentaId}...`);
        const formRes = await axios.get(`${baseUrl}/ordenventas/${ordenVentaId}/formularios`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('Emission Form Data:');
        console.log(JSON.stringify(formRes.data, null, 2));

    } catch (error: any) {
        console.error('Error:', error.response?.data || error.message);
    }
}

fetchForm();
