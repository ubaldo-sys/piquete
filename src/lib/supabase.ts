import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const getCleanUrl = (url: string | undefined): string => {
  if (!url || typeof url !== 'string') return 'https://placeholder.supabase.co';
  
  let clean = url.trim();
  
  // Se não começar com http, tenta adicionar https://
  if (!clean.startsWith('http')) {
    clean = `https://${clean}`;
  }

  try {
    const parsed = new URL(clean);
    // Remove caminhos extras como /rest/v1 que o Supabase JS já adiciona automaticamente
    return `${parsed.protocol}//${parsed.host}`;
  } catch (e) {
    console.error('URL do Supabase inválida:', url);
    return 'https://placeholder.supabase.co';
  }
};

const finalUrl = getCleanUrl(supabaseUrl);
const finalKey = (supabaseAnonKey || 'placeholder').trim();

export const supabase = createClient(finalUrl, finalKey);

if (!supabaseUrl || !supabaseAnonKey || finalUrl.includes('placeholder')) {
  console.warn('Configuração do Supabase pendente ou inválida em Settings -> Secrets.');
}

