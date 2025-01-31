document.addEventListener("DOMContentLoaded", function () {
    console.debug("[Dashboard] Loading assignments...");

    const gradescopeDiv = document.getElementById("gradescope-assignments");
    const canvasDiv = document.getElementById("canvas-assignments");
    const refreshButton = document.getElementById("refresh");
    const dashboardButton = document.getElementById("dashboard");

    // Function to render assignments into a container.
    function displayAssignments(assignments, container) {
        container.innerHTML = ""; // Clear current content
        if (!assignments || assignments.length === 0) {
            container.innerHTML = "<p>No assignments found.</p>";
            return;
        }

        assignments.forEach((assignment) => {
            // Create an anchor element that covers the entire block
            let a = document.createElement("a");
            a.href = assignment.link;
            a.target = "_blank";
            a.classList.add("assignment");
            a.innerHTML = `
                <strong>${assignment.complete ? "✔ " : "❌ "}${assignment.name}</strong><br>
                <br>Due: ${assignment.due_date}<br>
            `;
            container.appendChild(a);
        });
    }

    // Load Gradescope assignments from extension storage
    browser.storage.local.get("gradescopeAssignments").then((data) => {
        displayAssignments(data.gradescopeAssignments, gradescopeDiv);
    }).catch((err) => {
        console.warn("[Dashboard] Error loading Gradescope assignments:", err);
    });

    // Load Canvas assignments from extension storage
    browser.storage.local.get("canvasAssignments").then((data) => {
        displayAssignments(data.canvasAssignments, canvasDiv);
    }).catch((err) => {
        console.warn("[Dashboard] Error loading Canvas assignments:", err);
    });

    // Refresh assignments on button click.
    // This sends a message to your background script to trigger a refresh.
    refreshButton.addEventListener("click", () => {
        browser.runtime.sendMessage({ action: "refreshAssignments" });
    });

    // Since we're already on the dashboard, clicking the Dashboard button could simply reload the page.
    dashboardButton.addEventListener("click", () => {
        location.reload();
    });

    // Listen for changes in extension storage and update the UI accordingly.
    browser.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'local') {
            if (changes.gradescopeAssignments) {
                const newGradescopeAssignments = changes.gradescopeAssignments.newValue;
                displayAssignments(newGradescopeAssignments, gradescopeDiv);
            }
            if (changes.canvasAssignments) {
                const newCanvasAssignments = changes.canvasAssignments.newValue;
                displayAssignments(newCanvasAssignments, canvasDiv);
            }
        }
    });
});
