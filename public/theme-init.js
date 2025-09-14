// Simplified theme initialization
(function() {
  try {
    const systemTheme = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    
    if (document.documentElement) {
      document.documentElement.setAttribute("data-theme", systemTheme);
    }
    
    function applyTheme() {
      if (document.body) {
        document.body.className = document.body.className.replace(/theme-\w+/g, '') + ` theme-${systemTheme}`;
      }
    }
    
    if (document.body) {
      applyTheme();
    } else {
      document.addEventListener('DOMContentLoaded', applyTheme);
    }
    
  } catch (error) {
    console.error("Theme init error:", error);
  }
})();