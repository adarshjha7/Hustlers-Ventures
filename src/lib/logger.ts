// src/lib/logger.ts
import { supabase } from "./supabaseClient"; 

type LogLevel = 'INFO' | 'WARN' | 'ERROR';

export const logEvent = async (level: LogLevel, message: string, metadata?: any) => {
  // Always log to the server console for local debugging
  if (level === 'ERROR') {
    console.error(`[${level}] ${message}`, metadata);
  } else {
    console.log(`[${level}] ${message}`, metadata);
  }

  try {
    // Insert the log into Supabase
    const { error } = await supabase.from('system_logs').insert([{
      level,
      message,
      metadata: metadata ? metadata : null
    }]);

    if (error) {
      console.error("Failed to write to system_logs:", error);
    }
  } catch (err) {
    console.error("Unexpected error writing to system_logs:", err);
  }
};