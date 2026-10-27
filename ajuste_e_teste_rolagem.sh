cd /mnt/user-data/outputs && cp ecoReflorestar.html /tmp/backup_standalone/ecoReflorestar_antes_rolagem.html && python3 - << 'PYEOF'
def rep(s,old,new,count=1):
    assert old in s, "NÃO ENCONTRADO: "+old[:80]
    return s.replace(old,new,count)
p='ecoReflorestar.html'
s=open(p,encoding='utf-8').read()

# 1) CSS: sem rolagem da página na tela do jogo
s = rep(s, "        .so-toque { display: none; }", """        /* na tela do jogo a página não rola: o gesto de deslizar é só do jogo */
        html.sem-rolagem, html.sem-rolagem body { overflow: hidden; overscroll-behavior: none; }
        html.sem-rolagem #tela-jogo { touch-action: none; }
        .so-toque { display: none; }""")
s = rep(s, ".zona-livre { flex: 1 1 auto; min-height: 110px;", ".zona-livre { flex: 1 1 auto; min-height: 0;")

# 2) liga/desliga a trava ao trocar de tela
s = rep(s, """    el('tela-catalogo').hidden = nome !== 'catalogo';
    el('tela-jogo').hidden = nome !== 'jogo';""", """    el('tela-catalogo').hidden = nome !== 'catalogo';
    el('tela-jogo').hidden = nome !== 'jogo';
    document.documentElement.classList.toggle('sem-rolagem', nome === 'jogo');""")

# 3) deslizar vale em qualquer ponto da tela do jogo (exceto em cima de botões e links)
s = rep(s, """const iniciarToque = e => { toque = { x: e.clientX, y: e.clientY }; };
el('area').addEventListener('pointerdown', iniciarToque);
el('zona-livre').addEventListener('pointerdown', iniciarToque);""", """el('tela-jogo').addEventListener('pointerdown', e => {
    if (e.target.closest('button, a')) return;   // botões continuam sendo só toques
    toque = { x: e.clientX, y: e.clientY };
});""")
open(p,'w',encoding='utf-8').write(s)
print('ok')
PYEOF
python3 - << 'EOF'
import re, subprocess
s=open('/mnt/user-data/outputs/ecoReflorestar.html',encoding='utf-8').read()
sc=re.findall(r'<script>(.*?)</script>', s, re.S)
open('/tmp/c.js','w',encoding='utf-8').write(sc[-1])
r=subprocess.run(['node','--check','/tmp/c.js'],capture_output=True,text=True)
print('sintaxe', 'OK' if r.returncode==0 else r.stderr)
EOF
cd /tmp/it && cat > teste_rolagem.py << 'EOF'
import asyncio
from playwright.async_api import async_playwright
BASE='file:///mnt/user-data/outputs/'
MOCK=open('/tmp/it/mock_supabase.js').read()
async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch()
        problemas=[]
        for (w,h) in [(320,568),(360,640),(375,667),(390,760),(412,915),(430,932)]:
            ctx = await b.new_context(viewport={'width':w,'height':h}, has_touch=True, is_mobile=True)
            await ctx.route('**/supabase.min.js', lambda r: r.fulfill(body=MOCK, content_type='application/javascript'))
            pg = await ctx.new_page(); errs=[]
            pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(BASE+'ecoReflorestar.html'); await pg.wait_for_timeout(600)
            cat = await pg.evaluate("({overflow:getComputedStyle(document.documentElement).overflowY, rola: document.documentElement.scrollHeight > innerHeight})")
            piores=[]
            for i in [0,3,6,9]:
                await pg.locator('.card-nivel').nth(i).click(); await pg.wait_for_timeout(350)
                m = await pg.evaluate("""(()=>{ const ult=document.querySelector('.instrucao').getBoundingClientRect(); const ctl=document.querySelector('.controles').getBoundingClientRect();
                    window.scrollTo(0,200);
                    return {fim:Math.round(ult.bottom), controles:Math.round(ctl.bottom), tela:innerHeight, scrollY:window.scrollY,
                            overflow:getComputedStyle(document.documentElement).overflowY, overscroll:getComputedStyle(document.body).overscrollBehaviorY,
                            touch:getComputedStyle(document.getElementById('tela-jogo')).touchAction, tile:Math.round(document.querySelector('.tile').getBoundingClientRect().width)}; })()""")
                piores.append(m)
                await pg.keyboard.press('Escape'); await pg.wait_for_timeout(200)
            cab = all(m['fim'] <= m['tela'] for m in piores)
            print(f'{w}x{h}: catálogo overflow={cat["overflow"]} rola={cat["rola"]} | jogo: overflow={piores[0]["overflow"]} overscroll={piores[0]["overscroll"]} touch={piores[0]["touch"]} scrollY após scrollTo={[m["scrollY"] for m in piores]} | tudo dentro da tela: {cab} (fim do texto: {[m["fim"] for m in piores]}, casa: {[m["tile"] for m in piores]}px)')
            if not cab: problemas.append((w,h))
            await ctx.close()
        print('tamanhos com conteúdo cortado:', problemas)
        await b.close()
asyncio.run(main())
EOF
python3 teste_rolagem.py 2>&1 | tail -10
