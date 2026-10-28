// Proteção das telas dos jogos (RF05).
// O CSS da página deixa o <body> oculto; ele só é exibido depois que o
// Supabase confirma uma sessão válida. Sem sessão (ou com logout em outra
// aba), o usuário é enviado de volta para o login.
// Além disso, cada jogo só abre vindo da tela de pré-jogo (?partida=1):
// abrindo o endereço direto, a pessoa é levada para as instruções e o ranking.
// window.paginaLiberada resolve com true quando a página foi liberada
// (os jogos usam isso para, por exemplo, focar o campo de digitação).
const JOGOS_POR_ARQUIVO = {
    cacaPalavras: 'caca_palavras',
    ecoAdivinhacao: 'adivinhacao',
    quiz: 'quiz',
    ecoReflorestar: 'reflorestar',
    ecoColetaSeletiva: 'coleta_seletiva',
    ecoCaminhao: 'caminhao'
};
window.paginaLiberada = (async function protegerPagina() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) {
            window.location.replace('menu.html');
            return false;
        }
        if (!window.PRE_JOGO) {
            const arquivo = window.location.pathname.split('/').pop().replace(/\.html$/, '');
            const jogo = JOGOS_POR_ARQUIVO[arquivo];
            if (jogo && new URLSearchParams(window.location.search).get('partida') !== '1') {
                window.location.replace('prejogo.html?jogo=' + jogo);
                return false;
            }
        }
        document.body.style.visibility = 'visible';
        supabaseClient.auth.onAuthStateChange((evento, sessao) => {
            if (!sessao || evento === 'SIGNED_OUT') {
                window.location.replace('menu.html');
            }
        });
        return true;
    } catch (e) {
        window.location.replace('menu.html');
        return false;
    }
})();
