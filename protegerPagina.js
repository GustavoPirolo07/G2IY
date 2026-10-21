// Proteção das telas dos jogos (RF05).
// O CSS da página deixa o <body> oculto; ele só é exibido depois que o
// Supabase confirma uma sessão válida. Sem sessão (ou com logout em outra
// aba), o usuário é enviado de volta para o login.
(async function protegerPagina() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) {
            window.location.replace('menu.html');
            return;
        }
        document.body.style.visibility = 'visible';
        supabaseClient.auth.onAuthStateChange((evento, sessao) => {
            if (!sessao || evento === 'SIGNED_OUT') {
                window.location.replace('menu.html');
            }
        });
    } catch (e) {
        window.location.replace('menu.html');
    }
})();
