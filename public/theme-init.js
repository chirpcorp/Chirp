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
    
    // Apply theme class to body when it's available
    if (document.body) {
      document.body.className = document.body.className.replace(/theme-\w+/g, '') + ` theme-${systemTheme}`;
    } else {
      // If body isn't ready yet, wait for it
      document.addEventListener('DOMContentLoaded', function() {
        if (document.body) {
          document.body.className = document.body.className.replace(/theme-\w+/g, '') + ` theme-${systemTheme}`;
        }
      });
    }
  } catch (error) {
    console.error("Error in theme initialization script:", error);
    // Fallback to dark theme
    if (document.documentElement) {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }
})();