document.addEventListener("DOMContentLoaded", () => {
  const card = document.querySelector(".comingSoonCard");
  if (!card) return;

  card.setAttribute("data-ready", "true");

  // future hook for EMA features
  // (alerts, emergency banners, etc.)
});