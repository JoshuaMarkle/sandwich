document.addEventListener("DOMContentLoaded", function () {
    console.debug("[Popup] Loading assignments...");

    const assignmentsDiv = document.getElementById("assignments");
    const refreshButton = document.getElementById("refresh");
    const dashboardButton = document.getElementById("dashboard");

    // Display assignments (only those with a due date after now)
    function displayAssignments(assignments, container) {
        container.innerHTML = ""; // Clear everything

        if (!assignments || assignments.length === 0) {
            container.innerHTML = "<p>No assignments found.</p>";
            return;
        }

        // Filter assignments to only those with a due date after today
        const now = new Date();
        const upcoming = assignments.filter(assignment => {
            if (assignment.due_date === "No Due Date") {
                return false;
            }
            // Create a Date object from the assignment's due date string.
            const dueDate = new Date(assignment.due_date);
            // Only keep assignments where the due date is in the future.
            return dueDate > now;
        });

        if (upcoming.length === 0) {
            container.innerHTML = "<p>No upcoming assignments found.</p>";
            return;
        }

        // Generate each assignment element
        upcoming.forEach((assignment) => {
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

    // Load all assignments (sorted) from extension storage.
    browser.storage.local.get("allAssignments").then((data) => {
        displayAssignments(data.allAssignments, assignmentsDiv);
    }).catch((err) => {
        console.warn("[Popup] Error loading all assignments:", err);
    });

    // Refresh assignments on click.
    refreshButton.addEventListener("click", async () => {
        browser.runtime.sendMessage({ action: "refreshAssignments" });
    });

    // Open the dashboard in a new tab.
    dashboardButton.addEventListener("click", function () {
        const url = browser.runtime.getURL("dashboard.html");
        browser.tabs.create({ url });
    });

    // Update the assignments if the extension storage changes.
    browser.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'local' && changes.allAssignments) {
            displayAssignments(changes.allAssignments.newValue, assignmentsDiv);
        }
    });
});
