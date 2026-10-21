// Registro e consulta de resultados dos jogos (melhor pontuação e menor tempo).
// Depende de supabaseClient.js (variável global supabaseClient).

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
