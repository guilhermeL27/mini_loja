const app = document.getElementById('app');
const API = 'https://fakestoreapi.com/products?limit=3';
const imagensLocais = {
  1: 'imagens/mochila.jpg',
  2: 'imagens/camisa.jpg',
  3: 'imagens/jaqueta.jpg'
};
const reserva = [
  { id: 1, title: 'Mochila casual', price: 109.95, image: imagensLocais[1] },
  { id: 2, title: 'Camiseta masculina', price: 22.30, image: imagensLocais[2] },
  { id: 3, title: 'Jaqueta masculina', price: 55.99, image: imagensLocais[3] }
];
const titulos = { 1: 'Mochila casual', 2: 'Camiseta masculina', 3: 'Jaqueta masculina' };
let produtos = [];
let carrinho = lerDados('miniloja-carrinho', []);
let carregando = false;
let origem = '';
const moeda = valor => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function lerDados(chave, padrao) {
  try { const dados = JSON.parse(localStorage.getItem(chave)); return Array.isArray(dados) ? dados : padrao; }
  catch { return padrao; }
}
function salvarDados(chave, dados) {
  try { localStorage.setItem(chave, JSON.stringify(dados)); }
  catch { document.getElementById('mensagem').textContent = 'O navegador não permitiu salvar os dados.'; }
}
// Escapa textos antes de montar o HTML.
function escapar(texto) {
  return String(texto).replace(/[&<>"']/g, letra => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[letra]);
}

async function carregarProdutos(metodo = 'fetch') {
  carregando = true;
  renderizar();
  try {
    let dados;
    if (metodo === 'axios') {
      const resposta = await axios.get(API, { timeout: 8000 });
      dados = resposta.data;
    } else {
      const controle = new AbortController();
      const tempo = setTimeout(() => controle.abort(), 8000);
      try {
        const resposta = await fetch(API, { signal: controle.signal });
        if (!resposta.ok) throw new Error('Falha na API');
        dados = await resposta.json();
      } finally { clearTimeout(tempo); }
    }
    if (!Array.isArray(dados) || !dados.length || !dados.every(p => Number.isInteger(p.id) && typeof p.title === 'string' && Number.isFinite(p.price) && p.price >= 0)) {
      throw new Error('Dados inválidos');
    }
    produtos = dados.map(p => ({
      id: p.id, title: titulos[p.id] || p.title, price: p.price,
      image: imagensLocais[p.id] || 'imagens/produto.svg'
    }));
    salvarDados('miniloja-produtos', produtos);
    origem = `Produtos carregados com ${metodo === 'axios' ? 'Axios' : 'Fetch'}.`;
  } catch (erro) {
    const salvos = lerDados('miniloja-produtos', []);
    produtos = (salvos.length ? salvos : reserva).map(p => ({
      ...p, image: imagensLocais[p.id] || 'imagens/produto.svg'
    }));
    origem = salvos.length ? 'API indisponível. Exibindo o último catálogo salvo.' : 'API indisponível. Exibindo produtos de demonstração.';
    console.warn('Não foi possível consultar a API:', erro.message);
  }
  carregando = false;
  renderizar();
}

function atualizarBadge() {
  const quantidade = carrinho.reduce((soma, item) => soma + item.quantidade, 0);
  const badge = document.getElementById('badge');
  badge.textContent = quantidade;
  badge.classList.toggle('d-none', quantidade === 0);
}
function adicionarAoCarrinho(id) {
  const produto = produtos.find(p => p.id === id);
  if (!produto) return;
  const item = carrinho.find(p => p.id === id);
  if (item) item.quantidade++;
  else carrinho.push({ ...produto, quantidade: 1 });
  salvarDados('miniloja-carrinho', carrinho);
  atualizarBadge();
  document.getElementById('mensagem').textContent = `${produto.title} adicionado ao carrinho.`;
}
function alterarQuantidade(id, diferenca) {
  const item = carrinho.find(p => p.id === id);
  if (!item) return;
  item.quantidade += diferenca;
  carrinho = carrinho.filter(p => p.quantidade > 0);
  salvarDados('miniloja-carrinho', carrinho);
  renderizar();
}
function remover(id) {
  carrinho = carrinho.filter(p => p.id !== id);
  salvarDados('miniloja-carrinho', carrinho);
  renderizar();
}
function mostrarCatalogo() {
  app.innerHTML = `<h1 class="h3">Nossos produtos</h1>
    <p class="text-secondary">Loja de demonstração. Valores em reais apenas para simulação, sem conversão cambial.</p>
    <div class="d-flex gap-2 mb-3"><button data-metodo="fetch" class="btn btn-sm btn-outline-primary" ${carregando ? 'disabled' : ''}>Carregar com Fetch</button>
    <button data-metodo="axios" class="btn btn-sm btn-outline-primary" ${carregando ? 'disabled' : ''}>Carregar com Axios</button></div>
    ${carregando ? '<p role="status">Carregando produtos...</p>' : `<p class="small text-secondary" role="status">${escapar(origem)}</p>
    <div class="row">${produtos.map(p => `<div class="col-12 col-md-4 mb-4"><article class="card h-100 shadow-sm">
    <img src="${escapar(p.image)}" class="card-img-top produto" alt="${escapar(p.title)}">
    <div class="card-body d-flex flex-column"><h2 class="h6">${escapar(p.title)}</h2><p class="fw-bold text-success">${moeda(p.price)}</p>
    <button class="btn btn-primary mt-auto" data-adicionar="${p.id}">Adicionar ao carrinho</button></div></article></div>`).join('')}</div>`}`;
  app.querySelectorAll('img').forEach(img => img.addEventListener('error', () => { img.src = 'imagens/produto.svg'; }, { once: true }));
}
function mostrarCarrinho() {
  const total = carrinho.reduce((soma, p) => soma + p.price * p.quantidade, 0);
  app.innerHTML = `<h1 class="h3 mb-4">Meu carrinho</h1>${carrinho.length ? `
    <div class="list-group mb-3">${carrinho.map(p => `<div class="list-group-item d-flex flex-wrap gap-3 align-items-center justify-content-between">
      <div><h2 class="h6">${escapar(p.title)}</h2><span>${moeda(p.price)} por unidade</span></div>
      <div class="d-flex align-items-center gap-2"><button class="btn btn-outline-secondary" data-menos="${p.id}" aria-label="Diminuir ${escapar(p.title)}">−</button>
      <span>${p.quantidade}</span><button class="btn btn-outline-secondary" data-mais="${p.id}" aria-label="Aumentar ${escapar(p.title)}">+</button>
      <button class="btn btn-outline-danger" data-remover="${p.id}">Remover</button></div><strong>${moeda(p.price * p.quantidade)}</strong></div>`).join('')}</div>
    <p class="fs-5 fw-bold">Total: ${moeda(total)}</p><p class="text-secondary">Demonstração acadêmica: não realiza pedidos nem pagamentos.</p>` : '<p>Seu carrinho está vazio.</p>'}
    <a href="#/" class="btn btn-primary">Continuar comprando</a>`;
}
function renderizar() {
  atualizarBadge();
  if (location.hash === '#/carrinho') mostrarCarrinho();
  else mostrarCatalogo();
}
// Troca somente o conteúdo de main, sem abrir outra página.
window.addEventListener('hashchange', () => {
  document.getElementById('mensagem').textContent = '';
  renderizar();
});
app.addEventListener('click', evento => {
  const botao = evento.target.closest('button');
  if (!botao) return;
  if (botao.dataset.metodo) carregarProdutos(botao.dataset.metodo);
  if (botao.dataset.adicionar) adicionarAoCarrinho(Number(botao.dataset.adicionar));
  if (botao.dataset.mais) alterarQuantidade(Number(botao.dataset.mais), 1);
  if (botao.dataset.menos) alterarQuantidade(Number(botao.dataset.menos), -1);
  if (botao.dataset.remover) remover(Number(botao.dataset.remover));
});
if ('serviceWorker' in navigator && window.isSecureContext) {
  navigator.serviceWorker.register('./sw.js').catch(erro => console.warn('Service Worker:', erro));
}
carregarProdutos();
