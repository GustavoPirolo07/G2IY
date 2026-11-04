// Criptografia do EcoAventuras - versão do site (JavaScript)
// Grupo G2IY
//
// É a mesma cifra dos programas em Python (criptografar.py e descriptografar.py),
// só que escrita em JavaScript pra funcionar no navegador. Como o jeito de
// calcular é igual, um arquivo gerado aqui no site abre no Python, e o contrário
// também. Não usamos biblioteca, só o que o navegador já tem.
//
// Como a cifra funciona:
//   - cada letra do texto vira um número
//   - a gente soma esse número com um número da chave
//     (se a chave acabar, ela volta pro começo)
//   - o resultado é escrito em hexadecimal
//
// Exemplo com o texto "ana" e a chave "eco":
//   a (97)  + e (101) = 198, que em hexadecimal é c6
//   n (110) + c (99)  = 209, que em hexadecimal é d1
//   a (97)  + o (111) = 208, que em hexadecimal é d0
//   resultado: c6d1d0
//
// Pra descriptografar é o contrário: em vez de somar, subtrai o número da chave.
// É simétrica porque a mesma chave tranca e destranca.

// essa palavra vai criptografada no começo do arquivo.
// Depois ela é usada pra conferir se a chave digitada tá certa
const PALAVRA_TESTE = 'ECO';

function cifrar(texto, chave) {
    // transforma o texto e a chave em listas de números
    const numerosTexto = new TextEncoder().encode(texto);
    const numerosChave = new TextEncoder().encode(chave);
    let resultado = '';
    for (let posicao = 0; posicao < numerosTexto.length; posicao++) {
        // pega o número da chave que combina com essa letra
        // (o % faz a chave repetir quando ela é menor que o texto)
        const deslocamento = numerosChave[posicao % numerosChave.length];
        // soma os dois. O % 256 é pra não passar de 255 (se passar, volta pro 0)
        const novoNumero = (numerosTexto[posicao] + deslocamento) % 256;
        // escreve em hexadecimal, sempre com 2 dígitos
        resultado += novoNumero.toString(16).padStart(2, '0');
    }
    return resultado;
}

function decifrar(textoHexa, chave) {
    const numerosChave = new TextEncoder().encode(chave);
    const originais = [];
    // lê o hexadecimal de 2 em 2 dígitos e desfaz a soma da chave
    for (let inicio = 0; inicio < textoHexa.length; inicio += 2) {
        const posicao = inicio / 2;
        const cifrado = parseInt(textoHexa.slice(inicio, inicio + 2), 16);
        const deslocamento = numerosChave[posicao % numerosChave.length];
        // o + 256 é porque em JavaScript o resto de um número negativo sai negativo
        originais.push(((cifrado - deslocamento) % 256 + 256) % 256);
    }
    try {
        return new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(originais));
    } catch (e) {
        // com a chave errada quase sempre sai um texto sem sentido e cai aqui
        return null;
    }
}
