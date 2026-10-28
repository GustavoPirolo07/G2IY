// Registro e consulta de resultados dos jogos.
// Depende de supabaseClient.js (variável global supabaseClient).

/* ---------------------------------------------------------------
   Jogos de pontuação: caça-palavras, adivinhação, quiz, coleta seletiva e caminhão
   --------------------------------------------------------------- */

// Envia o resultado de uma partida. O servidor (função registrar_resultado)
// valida os limites, atualiza o recorde e soma a pontuação ecológica total.
async function registrarResultado(jogo, pontos, tempoSegundos = null) {
    const { error } = await supabaseClient.rpc('registrar_resultado', {
        p_jogo: jogo,
        p_pontos: pontos,
        p_tempo: tempoSegundos
    });
    if (error) console.error('Erro ao registrar resultado:', error);
    return !error;
}

// Retorna os recordes do jogador logado, indexados pelo nome do jogo.
async function carregarMelhoresResultados() {
    const { data, error } = await supabaseClient
        .from('melhores_resultados')
        .select('jogo, melhor_pontuacao, melhor_tempo_segundos');
    if (error) { console.error(error); return {}; }
    const mapa = {};
    data.forEach(r => { mapa[r.jogo] = r; });
    return mapa;
}

/* ---------------------------------------------------------------
   Eco Reflorestar: progresso por fase (menor número de jogadas)
   --------------------------------------------------------------- */

// Jogadas mínimas de cada fase (a fase 1 é o primeiro item).
// Ao criar novas fases, acrescente aqui, no jogo (NIVEIS) e na função registrar_reflorestar do banco.
const REFLORESTAR_OTIMOS = [5, 7, 9, 11, 13, 15, 17, 19, 21, 23];

// 3 árvores = jogadas mínimas; 2 = até 50% acima do mínimo; 1 = fase concluída
function estrelasReflorestar(jogadas, otimo) {
    if (jogadas <= otimo) return 3;
    if (jogadas <= Math.ceil(otimo * 1.5)) return 2;
    return 1;
}

// Envia a conclusão de uma fase. Devolve quantos pontos ecológicos foram ganhos
// (só ganha pontos quando melhora o número de árvores daquela fase).
// O tempo (em segundos) só conta em fases perfeitas e serve de desempate no ranking.
async function registrarReflorestar(nivel, jogadas, tempoSegundos = null) {
    const { data, error } = await supabaseClient.rpc('registrar_reflorestar', {
        p_nivel: nivel,
        p_jogadas: jogadas,
        p_tempo: tempoSegundos
    });
    if (error) { console.error('Erro ao registrar fase:', error); return 0; }
    return Number(data) || 0;
}

// Progresso do jogador logado: { [fase]: { melhor: jogadas } }
async function carregarProgressoReflorestar() {
    const { data, error } = await supabaseClient
        .from('progresso_reflorestar')
        .select('nivel, melhor_jogadas');
    if (error) { console.error(error); return {}; }
    const mapa = {};
    data.forEach(r => { mapa[r.nivel] = { melhor: r.melhor_jogadas }; });
    return mapa;
}

/* ---------------------------------------------------------------
   Rankings (tela de pré-jogo)
   --------------------------------------------------------------- */

// Melhores jogadores de um jogo de pontuação.
// Devolve [{ posicao, nome_usuario, melhor_pontuacao, melhor_tempo_segundos, eh_voce }]
// (os primeiros colocados e, se estiver fora deles, a linha do próprio jogador).
// Devolve null se não for possível carregar.
async function carregarRanking(jogo, limite = 10) {
    const { data, error } = await supabaseClient.rpc('ranking_jogo', { p_jogo: jogo, p_limite: limite });
    if (error) { console.error('Erro ao carregar ranking:', error); return null; }
    return data;
}

// Ranking do Eco Reflorestar: [{ posicao, nome_usuario, arvores, tempo_total, eh_voce }]
async function carregarRankingReflorestar(limite = 10) {
    const { data, error } = await supabaseClient.rpc('ranking_reflorestar', { p_limite: limite });
    if (error) { console.error('Erro ao carregar ranking:', error); return null; }
    return data;
}
