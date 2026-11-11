// Registro e consulta de resultados dos jogos.
// Depende de supabaseClient.js (variável global supabaseClient).

/* ---------------------------------------------------------------
   Jogos de pontuação: caça-palavras, adivinhação, quiz, coleta seletiva e caminhão
   --------------------------------------------------------------- */

// Envia o resultado de uma partida. O servidor (função registrar_resultado)
// valida os limites, atualiza o recorde e soma a pontuação ecológica total.
// "concluiu" marca que a pessoa zerou o jogo (usado no Eco Caminhão: conta uma conclusão).
async function registrarResultado(jogo, pontos, tempoSegundos = null, concluiu = false) {
    const { error } = await supabaseClient.rpc('registrar_resultado', {
        p_jogo: jogo,
        p_pontos: pontos,
        p_tempo: tempoSegundos,
        p_concluiu: !!concluiu
    });
    if (error) console.error('Erro ao registrar resultado:', error);
    return !error;
}

// Retorna os recordes do jogador logado, indexados pelo nome do jogo.
async function carregarMelhoresResultados() {
    const { data, error } = await supabaseClient
        .from('melhores_resultados')
        .select('jogo, melhor_pontuacao, melhor_tempo_segundos, conclusoes');
    if (error) { console.error(error); return {}; }
    const mapa = {};
    data.forEach(r => { mapa[r.jogo] = r; });
    return mapa;
}

/* ---------------------------------------------------------------
   Eco Reflorestar: progresso por fase (menor número de jogadas)
   --------------------------------------------------------------- */

// Jogadas mínimas de cada uma das 50 fases (a fase 1 é o primeiro item).
// Ao criar novas fases, acrescente aqui, no jogo (NIVEIS) e na função registrar_reflorestar do banco.
const REFLORESTAR_OTIMOS = [5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 9, 21, 23, 18, 22, 14, 14, 23, 18, 25, 7, 19, 10, 11, 17, 8, 6, 15, 12, 24, 20, 7, 13, 11, 6, 20, 9, 8, 15, 22, 17, 16, 18, 12, 16, 19, 13, 13, 10, 15];

// 3 árvores = jogadas mínimas; 2 = até 50% acima do mínimo; 1 = fase concluída
function estrelasReflorestar(jogadas, otimo) {
    if (jogadas <= otimo) return 3;
    if (jogadas <= Math.ceil(otimo * 1.5)) return 2;
    return 1;
}

// Envia a conclusão de uma fase. Devolve quantos pontos ecológicos foram ganhos
// (só ganha pontos quando melhora o número de árvores daquela fase).
// O tempo (em segundos) só conta em fases perfeitas e serve de desempate no ranking.
// Se a pessoa usou a dica nessa fase, a conclusão vale no máximo 1 árvore (usouDica = true).
async function registrarReflorestar(nivel, jogadas, tempoSegundos = null, usouDica = false) {
    const { data, error } = await supabaseClient.rpc('registrar_reflorestar', {
        p_nivel: nivel,
        p_jogadas: jogadas,
        p_tempo: tempoSegundos,
        p_dica: !!usouDica
    });
    if (error) { console.error('Erro ao registrar fase:', error); return 0; }
    return Number(data) || 0;
}

// Progresso do jogador logado: { [fase]: { melhor: jogadas sem dica (ou null), estrelas: 1 a 3 } }
async function carregarProgressoReflorestar() {
    const { data, error } = await supabaseClient
        .from('progresso_reflorestar')
        .select('nivel, melhor_jogadas, estrelas');
    if (error) { console.error(error); return {}; }
    const mapa = {};
    data.forEach(r => { mapa[r.nivel] = { melhor: r.melhor_jogadas, estrelas: r.estrelas }; });
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

// Ranking geral de pontuação ecológica (menu principal): [{ posicao, nome_usuario, pontuacao, eh_voce }]
async function carregarRankingGeral(limite = 10) {
    const { data, error } = await supabaseClient.rpc('ranking_geral', { p_limite: limite });
    if (error) { console.error('Erro ao carregar ranking geral:', error); return null; }
    return data;
}

/* ---------------------------------------------------------------
   Caixinha de sugestões e painel do administrador
   --------------------------------------------------------------- */

// Envia uma sugestão. Devolve { ok: true } ou { ok: false, limite: true/false }.
async function enviarSugestao(categoria, mensagem, jogo = null) {
    const { error } = await supabaseClient.rpc('enviar_sugestao', {
        p_categoria: categoria,
        p_mensagem: mensagem,
        p_jogo: jogo
    });
    if (error) {
        console.error('Erro ao enviar sugestão:', error);
        return { ok: false, limite: /limite/i.test(error.message || '') };
    }
    return { ok: true };
}

// As sugestões que a própria pessoa já enviou (a mais recente primeiro).
async function carregarMinhasSugestoes(limite = 10) {
    const { data, error } = await supabaseClient
        .from('sugestoes')
        .select('id, categoria, jogo, mensagem, lida, criado_em')
        .order('criado_em', { ascending: false })
        .limit(limite);
    if (error) { console.error(error); return null; }
    return data;
}

// A pessoa logada é administradora?
async function ehAdmin() {
    const { data, error } = await supabaseClient.rpc('eh_admin');
    if (error) { console.error(error); return false; }
    return data === true;
}

// ADMIN: todas as sugestões, com nome e e-mail. Devolve null se não for possível carregar.
async function listarSugestoesAdmin(apenasNaoLidas = false) {
    const { data, error } = await supabaseClient.rpc('listar_sugestoes_admin', {
        p_apenas_nao_lidas: apenasNaoLidas,
        p_limite: 300
    });
    if (error) { console.error(error); return null; }
    return data;
}
async function marcarSugestao(id, lida) {
    const { error } = await supabaseClient.rpc('marcar_sugestao', { p_id: id, p_lida: lida });
    if (error) console.error(error);
    return !error;
}
async function apagarSugestao(id) {
    const { error } = await supabaseClient.rpc('apagar_sugestao', { p_id: id });
    if (error) console.error(error);
    return !error;
}

