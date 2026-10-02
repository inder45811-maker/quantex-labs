if (!document.querySelector("#product-grid")) {
  document.querySelector("#year").textContent = new Date().getFullYear();
  const menu = document.querySelector(".menu-button");
  menu.addEventListener("click", () => { const open = menu.getAttribute("aria-expanded") !== "true"; menu.setAttribute("aria-expanded", String(open)); document.querySelector("#nav").classList.toggle("open", open); });
  document.querySelectorAll("#nav a").forEach(link => link.addEventListener("click", () => { menu.setAttribute("aria-expanded", "false"); document.querySelector("#nav").classList.remove("open"); }));
}
const group = document.querySelector("[data-group-link]") || document.querySelector(".detail-text .button");
if (group && window.QUANTEX_GROUP_LINK) { group.href = window.QUANTEX_GROUP_LINK; group.target = "_blank"; group.rel = "noopener noreferrer"; group.innerHTML = 'Join the official group <span aria-hidden="true">↗</span>'; }
