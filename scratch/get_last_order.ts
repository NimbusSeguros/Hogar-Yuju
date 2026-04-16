import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

async function getLastOrder() {
    try {
        console.log('Fetching last Hogar order directly from Supabase REST API...');
        const response = await axios.get(`${supabaseUrl}/rest/v1/hogar_orders?select=*&order=created_at.desc&limit=1`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            }
        });

        if (response.data && response.data.length > 0) {
            console.log('Last Order:', JSON.stringify(response.data[0], null, 2));
        } else {
            console.log('No orders found.');
        }
    } catch (error: any) {
        console.error('Error:', error.response?.data || error.message);
    }
}

getLastOrder();
