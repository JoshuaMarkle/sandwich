document.addEventListener("DOMContentLoaded", function () {
    console.debug("[Dashboard Extension] Loading assignments...");

    const gradescopeDiv = document.getElementById("gradescope-assignments");
    const canvasDiv = document.getElementById("canvas-assignments");
    const refreshButton = document.getElementById("refresh");

    // Function to display assignments
    function displayAssignments(assignments, container) {
        container.innerHTML = ""; // Clear previous content
        if (!assignments || assignments.length === 0) {
            container.innerHTML = "<p>No assignments found.</p>";
            return;
        }

        assignments.forEach((assignment) => {
            let div = document.createElement("div");
            div.classList.add("assignment");
            div.innerHTML = `
                <strong>${assignment.name}</strong><br>
                <span class="${assignment.complete ? "complete" : "incomplete"}">
                    ${assignment.complete ? "✔ Completed" : "❌ Incomplete"}
                </span><br>
                Due: ${assignment.due_date}<br>
                <a href="${assignment.link}" target="_blank">View</a>
            `;
            container.appendChild(div);
        });
    }

    // Load Gradescope assignments
    browser.storage.local.get("gradescopeAssignments").then((data) => {
        displayAssignments(data.gradescopeAssignments, gradescopeDiv);
    }).catch((err) => {
        console.warn("[Dashboard Extension] ❌ Error loading Gradescope assignments:", err);
    });

    // Load Canvas assignments
    browser.storage.local.get("canvasAssignments").then((data) => {
        displayAssignments(data.canvasAssignments, canvasDiv);
    }).catch((err) => {
        console.warn("[Dashboard Extension] ❌ Error loading Canvas assignments:", err);
    });

    // Refresh button to manually fetch assignments
    refreshButton.addEventListener("click", function () {
        console.debug("[Dashboard Extension] Refreshing assignments...");
        browser.runtime.sendMessage({ action: "fetchGradescopeAssignments" });
        browser.runtime.sendMessage({ action: "fetchCanvasAssignments" });

        setTimeout(() => {
            browser.storage.local.get("gradescopeAssignments").then((data) => {
                displayAssignments(data.gradescopeAssignments, gradescopeDiv);
            });
            browser.storage.local.get("canvasAssignments").then((data) => {
                displayAssignments(data.canvasAssignments, canvasDiv);
            });
        }, 3000); // Wait 3 seconds before refreshing UI
    });
});
