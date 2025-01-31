document.addEventListener("DOMContentLoaded", function () {
    console.debug("[Popup] Loading assignments...");

    const assignmentsDiv = document.getElementById("assignments");
    const refreshButton = document.getElementById("refresh");
    const dashboardButton = document.getElementById("dashboard");

    // Display assignments
    function displayAssignments(assignments, container) {
        container.innerHTML = ""; // Clear everything
        if (!assignments || assignments.length === 0) {
            container.innerHTML = "<p>No assignments found.</p>";
            return;
        }

		// Generate each assignment
		assignments.forEach((assignment) => {
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

    // Load all assignments (sorted)
    browser.storage.local.get("allAssignments").then((data) => {
        displayAssignments(data.allAssignments, assignmentsDiv);
    }).catch((err) => {
        console.warn("[Popup] Error loading all assignments:", err);
    });

    // Refresh assignments
	refreshButton.addEventListener("click", async () => {
		browser.runtime.sendMessage({ action: "refreshAssignments" });
	});

	// Go to dashboard
    dashboardButton.addEventListener("click", function () {
		const url = browser.runtime.getURL("dashboard.html");
		browser.tabs.create({ url });
    });

	// Update the assignments if the extension storage changes
	browser.storage.onChanged.addListener((changes, areaName) => {
		if (areaName === 'local') {
			// Check if assignments were updated
			if (changes.allAssignments) {
				displayAssignments(changes.allAssignments.newValue, assignmentsDiv);
			}
		}
	});
});
