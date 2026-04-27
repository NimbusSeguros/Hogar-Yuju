import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { InsuranceProviderFactory } from './src/services/providers/InsuranceProviderFactory';

dotenv.config({ path: path.resolve(__dirname, '.env') });

async function run() {
    try {
        console.log("Connecting to Supabase...");
        const supabase = createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_KEY!
        );
        
        const { data, error } = await supabase.from('hogar').select('order_id_rus, id').order('created_at', { ascending: false }).limit(3);
        if (error) throw error;
        
        console.log("Recent Orders:", data);
        
        if (!data || data.length === 0) return;
        
        const ordenVentaId = data[0].order_id_rus;
        console.log("Using order:", ordenVentaId);
        
        const provider: any = InsuranceProviderFactory.getProvider('RUS');
        await provider.authenticate();
        
        console.log("Fetching emission forms...");
        const resp = await provider.apiClient.get(`/ordenventas/${ordenVentaId}/formularios`);
        
        require('fs').writeFileSync('recent_emission_form.json', JSON.stringify(resp.data, null, 2));
        console.log("Saved to recent_emission_form.json");
    } catch (e: any) {
        console.error(e?.response?.data || e.message);
    }
}
run();
