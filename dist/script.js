// Add the official WhatsApp or Telegram invite URL here when it is available.
const GROUP_LINK = "";

const products = [
  { name: "BPC-157", strength: "5 mg", category: "recovery", code: "BPC", subtitle: "Research peptide" },
  { name: "TB-500", strength: "5 mg", category: "recovery", code: "TB", subtitle: "Research peptide" },
  { name: "GHK-Cu", strength: "50 mg", category: "cellular", code: "GHK", subtitle: "Copper peptide" },
  { name: "Ipamorelin", strength: "10 mg", category: "recovery", code: "IPA", subtitle: "Research peptide" },
  { name: "CJC-1295", strength: "10 mg", category: "recovery", code: "CJC", subtitle: "Research peptide" },
  { name: "MOTS-c", strength: "10 mg", category: "cellular", code: "MTS", subtitle: "Mitochondrial peptide" }
];

const grid = document.querySelector("#product-grid");
const search = document.querySelector("#search");
const filters = [...document.querySelectorAll(".filter")];
let activeFilter = "all";

function card(product, index) {
  const name = product.name.replaceAll("&", "&amp;").replaceAll("<", "&lt;");
  return `<article class="product-card" style="--card-index:${index}">
    <div class="product-visual" aria-hidden="true"><span class="visual-orbit orbit-one"></span><span class="visual-orbit orbit-two"></span><span class="compound-code">${product.code}</span><span class="visual-corner">QL / ${String(index + 1).padStart(2, "0")}</span></div>
    <div class="product-meta"><span>${product.subtitle}</span><span>Sample listing</span></div>
    <div class="product-title"><h3>${name}</h3><span>${product.strength}</span></div>
    <button class="product-action" type="button" data-enquire="${name}">Enquire to purchase <span aria-hidden="true">↗</span></button>
  </article>`;
}

function render() {
  const query = search.value.trim().toLowerCase();
  const visible = products.filter(p => (activeFilter === "all" || p.category === activeFilter) && `${p.name} ${p.subtitle} ${p.strength}`.toLowerCase().includes(query));
  grid.innerHTML = visible.map(card).join("");
  document.querySelector("#empty-state").hidden = visible.length > 0;
}

filters.forEach(button => button.addEventListener("click", () => {
  activeFilter = button.dataset.filter;
  filters.forEach(item => { item.classList.toggle("active", item === button); item.setAttribute("aria-pressed", String(item === button)); });
  render();
}));
search.addEventListener("input", render);

function openGroup(productName) {
  if (GROUP_LINK) {
    const url = new URL(GROUP_LINK);
    if (["https:", "http:"].includes(url.protocol)) window.open(url.href, "_blank", "noopener,noreferrer");
  } else {
    document.querySelector("#connect").scrollIntoView({ behavior: "smooth" });
  }
}
grid.addEventListener("click", event => {
  const button = event.target.closest("[data-enquire]");
  if (button) openGroup(button.dataset.enquire);
});
const groupButton = document.querySelector("[data-group-link]");
if (GROUP_LINK) { groupButton.href = GROUP_LINK; groupButton.target = "_blank"; groupButton.rel = "noopener noreferrer"; groupButton.innerHTML = 'Join the official group <span aria-hidden="true">↗</span>'; document.querySelector(".connect-section > p:not(.eyebrow)").textContent = "Join our official community channel to ask about products and ordering."; }
document.querySelector("#year").textContent = new Date().getFullYear();
const menu = document.querySelector(".menu-button");
menu.addEventListener("click", () => { const open = menu.getAttribute("aria-expanded") !== "true"; menu.setAttribute("aria-expanded", String(open)); document.querySelector("#nav").classList.toggle("open", open); });
document.querySelectorAll("#nav a").forEach(link => link.addEventListener("click", () => { menu.setAttribute("aria-expanded", "false"); document.querySelector("#nav").classList.remove("open"); }));
render();
window.setTimeout(() => {
  if (!document.documentElement.classList.contains('has-webgl')) document.querySelector('#helix-stage')?.classList.add('helix-fallback');
}, 3500);
