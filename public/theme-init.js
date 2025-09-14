// Theme initialization script that runs before React hydration
// This prevents flash of unstyled content (FOUC)
(function() {
try {
// Always use system theme
const systemTheme = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
console.log("Theme init script - Applying system theme:", systemTheme);

// Apply theme immediately to prevent FOUC
if (document.documentElement) {
document.documentElement.setAttribute("data-theme", systemTheme);
}

// Function to apply theme and make body visible
function applyThemeAndShow() {
  if (document.body) {
    document.body.className = document.body.className.replace(/theme-\w+/g, '') + ` theme-${systemTheme}`;
    // Make body visible after theme is applied
    document.body.style.visibility = 'visible';
  }
}

// Apply theme class to body when it's available
if (document.body) {
  applyThemeAndShow();
} else {
  // If body isn't ready yet, wait for it
  document.addEventListener('DOMContentLoaded', applyThemeAndShow);
}

} catch (error) {
console.error("Error in theme initialization script:", error);
// Fallback to dark theme and make visible
if (document.documentElement) {
document.documentElement.setAttribute("data-theme", "dark");
}
if (document.body) {
  document.body.style.visibility = 'visible';
}
}
})();