
const { createClient } = require('@supabase/supabase-js');

// Configuración desde .env (Hardcoded para el script temporal)
const SUPABASE_URL = "https://sablusillttmocotroxx.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhYmx1c2lsbHR0bW9jb3Ryb3h4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzM5NTI0MiwiZXhwIjoyMDc4OTcxMjQyfQ.wsABSR9pxgesZB5Tkwj-_x0mzokONSIaavHIO-9QADE";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verifyAuditLogs() {
  console.log("🔍 Verificando logs de auditoría para 'documentos_clinicos'...");

  const { data, error } = await supabase
    .from('auditoria_cambios')
    .select('*')
    .eq('tabla_afectada', 'documentos_clinicos')
    .order('fecha_hora', { ascending: false })
    .limit(5);

  if (error) {
    console.error("❌ Error al consultar auditoría:", error.message);
    return;
  }

  if (data && data.length > 0) {
    console.log(`✅ ¡ÉXITO! Se encontraron ${data.length} registros recientes en auditoría.`);
    data.forEach((log, index) => {
      console.log(`\n--- Log #${index + 1} ---`);
      console.log(`🆔 ID: ${log.id}`);
      console.log(`📅 Fecha: ${log.fecha_hora}`);
      console.log(`👤 Usuario: ${log.usuario_id || 'Sistema'}`);
      console.log(`operation: ${log.operacion}`);
      console.log(`📋 Datos Nuevos (Resumen):`, JSON.stringify(log.datos_nuevos).substring(0, 100) + "...");
    });
  } else {
    console.log("⚠️ No se encontraron registros de auditoría reciente para 'documentos_clinicos'.");
    console.log("Posibles causas:");
    console.log("1. No se han subido documentos recientemente.");
    console.log("2. El trigger de base de datos no está configurado para esta tabla.");
  }
}

verifyAuditLogs();
