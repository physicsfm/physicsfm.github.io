// ============================================================
// D.CRITICK 24/7 — подключение к Supabase
// ============================================================
// 1. Откройте в Supabase: Project Settings → API
// 2. Скопируйте "Project URL" (уже вставлен ниже) и "anon public" ключ
// 3. Вставьте ключ вместо PASTE_ANON_KEY_HERE
//
// Публичный (anon) ключ безопасно хранить прямо в этом файле —
// он для этого и предназначен. Доступ к данным ограничивают
// правила RLS в базе (см. supabase-setup.sql), а не секретность ключа.
// НИКОГДА не вставляйте сюда "service_role" ключ — он даёт полный
// доступ в обход всех правил.
// ============================================================

const SUPABASE_URL = 'https://eaycpuwtcnpvyfatotky.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_sV7_QQzSyguhWyz2eQbbfA_6RRuIOWC';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
