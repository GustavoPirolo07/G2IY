// Popup de fim de jogo no estilo do EcoAventuras (substitui o alert do navegador).
(function () {
    const css = `
    #popup-fim { position: fixed; inset: 0; background: rgba(27, 94, 32, 0.45); display: flex; align-items: center; justify-content: center; padding: 15px; z-index: 9999; animation: pfFade 0.25s ease; }
    #popup-fim .pf-card { background: #fff; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.25); max-width: 400px; width: 100%; padding: 28px 22px; text-align: center; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; color: #2e7d32; animation: pfSobe 0.3s ease; outline: none; }
    #popup-fim .pf-emoji { font-size: 3rem; line-height: 1; }
    #popup-fim .pf-titulo { font-size: 1.6rem; margin: 10px 0 4px; color: #2e7d32; }
    #popup-fim .pf-msg { color: #558b2f; font-size: 0.95rem; line-height: 1.4; margin: 0 0 4px; }
    #popup-fim .pf-pontos { background: #f1f8e9; border: 2px solid #81c784; border-radius: 12px; padding: 12px; margin: 16px 0 10px; }
    #popup-fim .pf-pontos strong { display: block; font-size: 2.1rem; color: #1b5e20; }
    #popup-fim .pf-pontos span { font-size: 0.85rem; color: #558b2f; }
    #popup-fim .pf-detalhes { list-style: none; padding: 0; margin: 0; color: #558b2f; font-size: 0.9rem; line-height: 1.6; }
    #popup-fim .pf-botoes { display: flex; flex-direction: column; gap: 10px; margin-top: 20px; }
    #popup-fim .pf-btn { padding: 13px; font-size: 1.05rem; font-weight: bold; border-radius: 10px; cursor: pointer; transition: 0.2s; }
    #popup-fim .pf-btn.principal { background: #2e7d32; color: #fff; border: 2px solid #2e7d32; }
    #popup-fim .pf-btn.principal:hover { background: #1b5e20; border-color: #1b5e20; }
    #popup-fim .pf-btn.secundario { background: #fff; color: #2e7d32; border: 2px solid #81c784; }
    #popup-fim .pf-btn.secundario:hover { background: #f1f8e9; }
    @keyframes pfFade { from { opacity: 0; } to { opacity: 1; } }
    @keyframes pfSobe { from { opacity: 0; transform: translateY(15px) scale(0.97); } to { opacity: 1; transform: none; } }
    `;
    const estilo = document.createElement('style');
    estilo.textContent = css;
    document.head.appendChild(estilo);
})();

function esperar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// opções: emoji, titulo, mensagem, pontos (número ou null), detalhes (lista de textos),
//         textoJogarNovamente, onJogarNovamente (função chamada ao clicar em "jogar novamente")
function mostrarPopupFim({ emoji = '🌿', titulo, mensagem = '', pontos = null, detalhes = [],
                           textoJogarNovamente = 'Jogar novamente', onJogarNovamente }) {
    const antigo = document.getElementById('popup-fim');
    if (antigo) antigo.remove();

    const criar = (tag, classe, texto) => {
        const el = document.createElement(tag);
        if (classe) el.className = classe;
        if (texto !== undefined) el.textContent = texto;
        return el;
    };

    const overlay = criar('div');
    overlay.id = 'popup-fim';
    const card = criar('div', 'pf-card');
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'true');
    card.tabIndex = -1;

    card.appendChild(criar('div', 'pf-emoji', emoji));
    card.appendChild(criar('h2', 'pf-titulo', titulo));
    if (mensagem) card.appendChild(criar('p', 'pf-msg', mensagem));

    if (pontos !== null) {
        const caixa = criar('div', 'pf-pontos');
        caixa.appendChild(criar('strong', '', pontos > 0 ? `+${pontos}` : '0'));
        caixa.appendChild(criar('span', '', pontos > 0 ? 'pontos ecológicos' : 'pontos nesta rodada'));
        card.appendChild(caixa);
    }

    if (detalhes.length) {
        const lista = criar('ul', 'pf-detalhes');
        detalhes.forEach(d => lista.appendChild(criar('li', '', d)));
        card.appendChild(lista);
    }

    const botoes = criar('div', 'pf-botoes');
    const btnNovo = criar('button', 'pf-btn principal', textoJogarNovamente);
    btnNovo.type = 'button';
    btnNovo.onclick = () => {
        overlay.remove();
        if (onJogarNovamente) onJogarNovamente();
    };
    const btnMenu = criar('button', 'pf-btn secundario', 'Voltar ao Menu');
    btnMenu.type = 'button';
    btnMenu.onclick = () => { window.location.href = 'menu.html'; };
    botoes.appendChild(btnNovo);
    botoes.appendChild(btnMenu);
    card.appendChild(botoes);

    overlay.appendChild(card);
    document.body.appendChild(overlay);
    card.focus(); // foco no cartão, não no botão, para um Enter perdido não reiniciar o jogo
}
