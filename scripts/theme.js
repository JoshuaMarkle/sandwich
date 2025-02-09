// theme.js

document.addEventListener("DOMContentLoaded", function() {
    const themeSelector = document.getElementById("theme"); // Dropdown on settings page
    const toggleButton = document.getElementById("dark-mode-toggle"); // Optional button
    const root = document.documentElement;
    
    // Function to apply the selected theme
    function applyTheme(mode) {
        if (mode === "dark") {
            root.classList.add("dark-mode");
            localStorage.setItem("theme", "dark");
        } else if (mode === "light") {
            root.classList.remove("dark-mode");
            localStorage.setItem("theme", "light");
        } else {
            // System mode (default)
            localStorage.setItem("theme", "system");
            matchSystemPreference(); // Check system preference
        }
    }

    // Function to match system dark mode setting
    function matchSystemPreference() {
        if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
            root.classList.add("dark-mode");
        } else {
            root.classList.remove("dark-mode");
        }
    }

    // Event listener for dropdown menu (if present)
    if (themeSelector) {
        themeSelector.addEventListener("change", function() {
            applyTheme(themeSelector.value);
        });
    }

    // Event listener for optional toggle button
    if (toggleButton) {
        toggleButton.addEventListener("click", function() {
            const currentTheme = localStorage.getItem("theme") || "system";
            const newTheme = (currentTheme === "dark") ? "light" : "dark";
            applyTheme(newTheme);
        });
    }

    // Listen for system dark mode changes (if system mode is active)
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function() {
        if (localStorage.getItem("theme") === "system") {
            matchSystemPreference();
        }
    });
});
