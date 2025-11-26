const state = {
  products: [],
  query: "",
  category: "todos",
  sort: "relevance"
};

const elements = {
  searchInput: document.getElementById("searchInput"),
  categorySelect: document.getElementById("categorySelect"),
  sortSelect: document.getElementById("sortSelect"),
  results: document.getElementById("results"),
  resultsCount: document.getElementById("resultsCount"),
  lastUpdated: document.getElementById("lastUpdated")
};

init();

async function init() {
  try {
    const res = await fetch("data/products.json");
    const json = await res.json();
    state.products = json.products || [];
    elements.lastUpdated.textContent = json.lastUpdated ? `Atualizado: ${formatDate(json.lastUpdated)}` : "";
    bindEvents();
    render();
  } catch (e) {
    elements.results.innerHTML = `<p>Não foi possível carregar as ofertas agora.</p>`;
  }
}

function bindEvents() {
  elements.searchInput.addEventListener("input", (e) => {
    state.query = e.target.value.trim().toLowerCase();
    render();
  });
  elements.categorySelect.addEventListener("change", (e) => {
    state.category = e.target.value;
    render();
  });
  elements.sortSelect.addEventListener("change", (e) => {
    state.sort = e.target.value;
    render();
  });
}

function render() {
  const filtered = filterProducts(state.products, state.query, state.category);
  const sorted = sortProducts(filtered, state.sort);
  elements.resultsCount.textContent = `${sorted.length} oferta(s) encontrada(s)`;
  elements.results.innerHTML = sorted.map(cardHTML).join("");
}

function filterProducts(products, query, category) {
  return products.filter(p => {
    const matchesQuery =
      !query ||
      p.title.toLowerCase().includes(query) ||
      (p.tags || []).some(t => t.toLowerCase().includes(query));
    const matchesCategory = category === "todos" || p.category === category;
    return matchesQuery && matchesCategory;
  });
}

function sortProducts(products, sort) {
  const copy = [...products];
  switch (sort) {
    case "price_asc": return copy.sort((a,b) => a.price - b.price);
    case "price_desc": return copy.sort((a,b) => b.price - a.price);
    case "discount_desc": return copy.sort((a,b) => (b.discount || 0) - (a.discount || 0));
    default: return copy; // relevance = original order
  }
}

function cardHTML(p) {
  const priceBRL = formatBRL(p.price);
  const originalBRL = p.originalPrice ? formatBRL(p.originalPrice) : null;
  const discount = p.discount ? `<span class="discount">-${p.discount}%</span>` : "";
  const tags = (p.tags || []).map(t => `<span class="tag">${t}</span>`).join("");
  const seller = p.seller ? p.seller : "Loja";

  // Link de afiliado já com parâmetros. Substitua pela sua tag/ID real.
  const affiliateLink = buildAffiliateLink(p);

  return `
    <article class="card">
      <img src="${p.image}" alt="${escapeHTML(p.title)}" loading="lazy" />
      <div class="content">
        <h2 class="title">${escapeHTML(p.title)}</h2>
        <div class="seller">${seller}</div>
        <div class="price-row">
          <div class="price">${priceBRL}</div>
          ${originalBRL ? `<div class="original">${originalBRL}</div>` : ""}
          ${discount}
        </div>
        <div class="tags">${tags}</div>
        <div class="actions">
          <a class="button primary" href="${affiliateLink}" target="_blank" rel="nofollow sponsored noopener">Ver oferta</a>
          <span class="badge">Frete: ${p.shipping || "variável"}</span>
        </div>
      </div>
    </article>
  `;
}

function buildAffiliateLink(p) {
  // Exemplos — substitua com seus vínculos oficiais:
  // Amazon: https://www.amazon.com.br/dp/ASIN?tag=SEU_TAG
  // Shopee: use o link de afiliado do Shopee Partners (variável por campanha)
  // Genérico: p.affiliateUrl já deve vir pronto do JSON
  if (p.affiliateUrl) return p.affiliateUrl;
  if (p.seller && p.seller.toLowerCase().includes("amazon") && p.asin) {
    return `https://www.amazon.com.br/dp/${p.asin}?tag=SEU_TAG_AQUI`;
  }
  if (p.seller && p.seller.toLowerCase().includes("shopee") && p.productPath) {
    return `https://shopee.com.br/${p.productPath}?affiliate_tag=SUA_TAG_AQUI`;
  }
  return p.url || "#";
}

function formatBRL(n) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function formatDate(str) {
  const d = new Date(str);
  return d.toLocaleString("pt-BR");
}
function escapeHTML(s) {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}
