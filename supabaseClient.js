// Supabase > Project Settings > API: copie a "Project URL" e a chave "anon public".
// A chave anon pode ficar no front-end; quem protege os dados é o RLS.
// NUNCA coloque aqui a chave "service_role".
const SUPABASE_URL = 'https://fqsptknbkrnkzuvwatdr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxc3B0a25ia3Jua3p1dndhdGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzNzc2ODcsImV4cCI6MjEwNzk1MzY4N30.25561kIMQ1WWIPnS9SY88EHquzSlocmURg2x8MTHtFU';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// O Supabase Auth exige e-mail; o usuário continua digitando só o "usuário".
const DOMINIO_FAKE = '@ecoaventuras.app';
function usuarioParaEmail(usuario) {
    return usuario.trim().toLowerCase() + DOMINIO_FAKE;
}

// Soma pontos à pontuação ecológica do jogador logado (usado pelos jogos).
async function salvarPontos(pontos) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;
    const id = session.user.id;
    const { data, error } = await supabaseClient
        .from('perfis_jogadores').select('pontuacao_ecologica').eq('id', id).single();
    if (error) { console.error(error); return; }
    const { error: erroUpdate } = await supabaseClient
        .from('perfis_jogadores')
        .update({ pontuacao_ecologica: data.pontuacao_ecologica + pontos })
        .eq('id', id);
    if (erroUpdate) console.error(erroUpdate);
}
// Chame no início de cada jogo: sem sessão, volta para a tela de login.
async function exigirLogin() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) window.location.href = 'menu.html';
}
