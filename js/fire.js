// Fire page JS (starter file)

document.addEventListener("DOMContentLoaded", () => {
  console.log("Fire page loaded");

  checkBanner();
});

// Simple check to make sure the banner SVG is loading
function checkBanner() {
  const banner = document.getElementById("fireBannerImg");

  if (!banner) {
    console.warn("Fire banner image element not found.");
    return;
  }

  banner.addEventListener("error", () => {
    console.warn("Fire banner SVG not found at:", banner.src);
  });
}