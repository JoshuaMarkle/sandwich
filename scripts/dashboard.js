document.addEventListener("DOMContentLoaded", function () {
    console.debug("[Dashboard] Loading assignments...");

    const assignmentsDiv = document.getElementById("assignments");
    const refreshButton = document.getElementById("refresh");
    const dashboardButton = document.getElementById("dashboard");
	let oldAssignmentCount = 0;

    // Display assignments as a list
    function displayAssignments(assignments, container) {
        container.innerHTML = ""; // Clear all assignments
        if (!assignments || assignments.length === 0) {
            container.innerHTML = "<p>No assignments found.</p>";
            return;
        }

		// Remember which due date last processed.
		let lastGroupDate = null;
		let passedToday = false;

		// Get today + tmr; set the time to midnight
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		// Generate a list of assignments
		assignments.forEach((assignment) => {
			// Create the assignment element.
			let a = document.createElement("a");
			a.href = assignment.link;
			a.target = "_blank";
			a.classList.add("assignment");

			// Process valid due dates
			if (assignment.due_date !== "No Due Date") {
				let dueDate = new Date(assignment.due_date);
				dueDate.setHours(0, 0, 0, 0);

				// Check if the assignment is from a past day
				let oldAssignment = dueDate < today
				if (oldAssignment) {
					a.classList.add("old-assignment");
					oldAssignmentCount += 1;
				}

				// If this assignment's due date group differs from the previous one,
				// then create a header before adding the assignment.
				if (!lastGroupDate || dueDate.getTime() !== lastGroupDate.getTime()) {
					lastGroupDate = dueDate; // update the tracker
					let header = null;
					if (dueDate.getTime() === today.getTime()) {
						header = document.createElement("h2");
						header.textContent = "Today, " + dueDate.toLocaleDateString();
						passedToday = true;
					} else if (dueDate.getTime() === tomorrow.getTime()) {
						header = document.createElement("h3");
						header.textContent = "Tomorrow, " + dueDate.toLocaleDateString();
					} else {
						// Show the weekday and date
						header = document.createElement("h3");
						header.textContent = dueDate.toLocaleDateString(undefined, { weekday: 'long' }) + ", " + dueDate.toLocaleDateString();
					}
					
					// Hide the header if the assignment is old
					if (oldAssignment) {
						header.classList.add("old-assignment")
					}

					// Generate the today header if not generated and nothing due
					if (!passedToday && dueDate.getTime() > today.getTime()) {
						let todayHeader = document.createElement("h2");
						todayHeader.textContent = "Today, " + today.toLocaleDateString();
						container.appendChild(todayHeader);
						let breakline = document.createElement("div");
						breakline.classList.add("breakline");
						container.appendChild(breakline);
						let nothingDue = document.createElement("button");
						nothingDue.classList.add("assignment-button");
						nothingDue.textContent = `Nothing due today`;
						container.appendChild(nothingDue);
						passedToday = true;
					}

					container.appendChild(header);
				}
			}

			// Populate the assignment element's inner HTML.
			a.innerHTML = `
				<strong>${assignment.complete ? "✅ " : "❌ "}${assignment.name}</strong><br>
				<br>Due: ${assignment.due_date}<br>
			`;

			// Append the assignment element to the container.
			container.appendChild(a);
		});

		// Add a view old assignments button
		if (oldAssignmentCount > 0) {
			// Create the button element.
			const viewButton = document.createElement("button");
			viewButton.id = "view-old-assignments";
			viewButton.classList.add("assignment-button");
			viewButton.textContent = `view ${oldAssignmentCount} past assignments`;

			// View old assignments on button press
			viewButton.addEventListener("click", function() {
				const oldAssignments = document.querySelectorAll(".old-assignment");
				oldAssignments.forEach(assignment => {
					assignment.style.display = "flex";
				});
				viewButton.remove();
			});

			// Insert the button at the top of the container.
			container.insertBefore(viewButton, container.firstChild);
		}
    }

    // Load all assignments from extension storage
    browser.storage.local.get("allAssignments").then((data) => {
        displayAssignments(data.allAssignments, assignmentsDiv);
    }).catch((err) => {
        console.warn("[Dashboard] Error loading all assignments:", err);
    });

    // Refresh assignments on button click.
    // This sends a message to your background script to trigger a refresh.
    refreshButton.addEventListener("click", () => {
        browser.runtime.sendMessage({ action: "refreshAssignments" });
    });

    // Update the UI if there is a change to the extension storage
    browser.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'local') {
            if (changes.allAssignments) {
                displayAssignments(changes.allAssignments.newValue, assignmentsDiv);
            }
        }
    });
});
