import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase URL or Key missing in environment variables');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

export class SupabaseProvider {
  /**
   * Saves or updates a home insurance prospect/order
   */
  static async saveHogarOrder(data: any) {
    const { id, ...updateData } = data;

    try {
      if (id) {
        const { data: result, error } = await supabase
          .from('hogar')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw error;
        return result;
      } else {
        const { data: result, error } = await supabase
          .from('hogar')
          .insert([updateData])
          .select()
          .single();
        
        if (error) throw error;
        return result;
      }
    } catch (error: any) {
      console.error('Error saving Hogar order in Supabase:', error.message);
      throw error;
    }
  }

  /**
   * Retrieves an order by its RUS order ID
   */
  static async getOrderByRusId(orderIdRus: string) {
    try {
      const { data, error } = await supabase
        .from('hogar')
        .select('*')
        .eq('order_id_rus', orderIdRus)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching Hogar order from Supabase:', error.message);
      throw error;
    }
  }
}
