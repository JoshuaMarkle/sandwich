// Load the theme into page instantly
(function() {
    let theme = localStorage.getItem("theme") || "system";
    
    if (theme === "dark") {
        document.documentElement.classList.add("dark-mode");
    } else if (theme === "light") {
        document.documentElement.classList.remove("dark-mode");
    } else {
        // System mode: match OS preference instantly
        if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
            document.documentElement.classList.add("dark-mode");
        }
    }
})();
