import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get request parameters
    const { format = 'json', filter = 'all' } = await req.json().catch(() => ({}));

    console.log(`🔍 Exporting schema - Format: ${format}, Filter: ${filter}`);

    // Query database schema information
    const schemaQueries = {
      // Tables with columns
      tables: `
        SELECT 
          t.table_name,
          t.table_type,
          array_agg(
            json_build_object(
              'column_name', c.column_name,
              'data_type', c.data_type,
              'is_nullable', c.is_nullable,
              'column_default', c.column_default,
              'character_maximum_length', c.character_maximum_length
            ) ORDER BY c.ordinal_position
          ) as columns
        FROM information_schema.tables t
        LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
        WHERE t.table_schema = 'public' 
        GROUP BY t.table_name, t.table_type
        ORDER BY t.table_name
      `,
      
      // RLS Policies
      policies: `
        SELECT 
          schemaname,
          tablename,
          policyname,
          permissive,
          roles,
          cmd,
          qual,
          with_check
        FROM pg_policies 
        WHERE schemaname = 'public'
        ORDER BY tablename, policyname
      `,
      
      // Functions
      functions: `
        SELECT 
          p.proname as function_name,
          n.nspname as schema_name,
          pg_get_function_result(p.oid) as return_type,
          pg_get_function_arguments(p.oid) as arguments,
          l.lanname as language,
          CASE p.prosecdef WHEN true THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END as security_type,
          p.proisstrict as is_strict,
          obj_description(p.oid) as description
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        JOIN pg_language l ON p.prolang = l.oid
        WHERE n.nspname = 'public'
          AND p.prokind = 'f'
        ORDER BY p.proname
      `,
      
      // Triggers
      triggers: `
        SELECT 
          t.trigger_name,
          t.event_manipulation as event,
          t.event_object_table as table_name,
          t.action_timing,
          t.action_statement,
          t.action_orientation
        FROM information_schema.triggers t
        WHERE t.trigger_schema = 'public'
        ORDER BY t.event_object_table, t.trigger_name
      `,
      
      // Indexes
      indexes: `
        SELECT 
          schemaname,
          tablename,
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE schemaname = 'public'
        ORDER BY tablename, indexname
      `,
      
      // Storage Buckets
      buckets: `
        SELECT 
          id,
          name,
          public,
          created_at,
          updated_at
        FROM storage.buckets
        ORDER BY name
      `,
      
      // Storage Policies
      storage_policies: `
        SELECT 
          policyname,
          cmd,
          qual,
          with_check
        FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects'
        ORDER BY policyname
      `
    };

    const results: any = {};

    // Execute queries based on filter
    const queriesToRun = filter === 'all' ? Object.keys(schemaQueries) : [filter];

    for (const queryKey of queriesToRun) {
      if (schemaQueries[queryKey as keyof typeof schemaQueries]) {
        try {
          const { data, error } = await supabase.rpc('execute_sql', { 
            query: schemaQueries[queryKey as keyof typeof schemaQueries] 
          }).single();
          
          if (error) {
            console.error(`❌ Error executing ${queryKey} query:`, error);
            // Try direct query for some cases
            const directResult = await supabase.from('information_schema.tables').select('*').limit(1);
            console.log('Direct query test:', directResult);
            results[queryKey] = [];
          } else {
            results[queryKey] = data || [];
          }
        } catch (err) {
          console.error(`❌ Error with ${queryKey}:`, err);
          results[queryKey] = [];
        }
      }
    }

    // Generate statistics
    const stats = {
      total_tables: results.tables?.length || 0,
      total_policies: results.policies?.length || 0,
      total_functions: results.functions?.length || 0,
      total_triggers: results.triggers?.length || 0,
      total_indexes: results.indexes?.length || 0,
      total_buckets: results.buckets?.length || 0,
      tables_with_rls: results.tables?.filter((t: any) => 
        results.policies?.some((p: any) => p.tablename === t.table_name)
      ).length || 0,
      export_timestamp: new Date().toISOString()
    };

    const response = {
      metadata: {
        project_ref: 'warbeochfoabfptvvtpu',
        export_format: format,
        filter_applied: filter,
        generated_at: new Date().toISOString()
      },
      statistics: stats,
      schema: results
    };

    console.log(`✅ Schema export completed - Tables: ${stats.total_tables}, Policies: ${stats.total_policies}`);

    // Return based on format
    if (format === 'csv') {
      // Simple CSV export for tables
      const csvRows = ['Table Name,Type,Columns Count,Has RLS'];
      results.tables?.forEach((table: any) => {
        const hasRLS = results.policies?.some((p: any) => p.tablename === table.table_name);
        csvRows.push(`${table.table_name},${table.table_type},${table.columns?.length || 0},${hasRLS ? 'Yes' : 'No'}`);
      });
      
      return new Response(csvRows.join('\n'), {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename=schema-export.csv'
        },
      });
    }

    return new Response(JSON.stringify(response, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in export-schema function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Schema export failed' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});