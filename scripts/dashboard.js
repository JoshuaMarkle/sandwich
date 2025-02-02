document.addEventListener("DOMContentLoaded", function () {
    console.debug("[Dashboard] Loading assignments...");

    const assignmentsDiv = document.getElementById("assignments");
    const refreshButton = document.getElementById("refresh");
    const dashboardButton = document.getElementById("dashboard");
	let oldAssignmentCount = 0;

    const canvasStatus = document.getElementById("canvas-status");
    const gradescopeStatus = document.getElementById("gradescope-status");

	// Build the assignments
	function displayAssignments(groupedAssignments, container) {
		container.innerHTML = "";
		if (!groupedAssignments || groupedAssignments.length === 0) {
			container.innerHTML = "<p>No assignments found.</p>";
			return;
		}

		// Normalize today's and tomorrow's date.
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const todayStr = today.toISOString().split("T")[0];

		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);
		const tomorrowStr = tomorrow.toISOString().split("T")[0];

		let oldAssignmentCount = 0;

		// Loop through each day group.
		groupedAssignments.forEach(dayGroup => {
			// Create a Date object from the stored "date" string.
			const dayDate = new Date(dayGroup.date);
			dayDate.setHours(0, 0, 0, 0);

			// Create the day header.
			let dayHeader;
			if (dayGroup.date === todayStr) {
				dayHeader = document.createElement("h2");
				dayHeader.textContent = "Today, " + dayDate.toLocaleDateString();
			} else if (dayGroup.date === tomorrowStr) {
				dayHeader = document.createElement("h3");
				dayHeader.textContent = "Tomorrow, " + dayDate.toLocaleDateString();
			} else {
				dayHeader = document.createElement("h3");
				dayHeader.textContent =
					dayDate.toLocaleDateString(undefined, { weekday: "long" }) +
						", " +
						dayDate.toLocaleDateString();
			}

			// If the day is in the past, add an "old-assignment" class.
			if (dayDate < today) {
				dayHeader.classList.add("old-assignment");
				// Count all assignments in this day group.
				dayGroup.groups.forEach(classGroup => {
					oldAssignmentCount += classGroup.assignments.length;
				});
			}

			container.appendChild(dayHeader);

			// For each class group for this day:
			dayGroup.groups.forEach(classGroup => {
				// Create a container for this class group.
				const assignmentGroupDiv = document.createElement("div");
				assignmentGroupDiv.classList.add("assignment");

				// Check if the assignment group is old
				if (dayDate < today) {
					assignmentGroupDiv.classList.add("old-assignment");
				}

				// Create the "color" header for the class.
				const colorDiv = document.createElement("div");
				colorDiv.classList.add("color");
				const classHeader = document.createElement("h4");
				classHeader.textContent = classGroup["class"];
				colorDiv.appendChild(classHeader);

				// Create the container for the assignment items.
				const groupDiv = document.createElement("div");
				groupDiv.classList.add("group");

				// Loop over assignments in this class group.
				classGroup.assignments.forEach(assignment => {
					const a = document.createElement("a");
					a.classList.add("item");
					a.href = assignment.link;
					a.target = "_blank";
					a.innerHTML = `
						<strong>${
							assignment.complete
							? '<i class="fa fa-check complete"></i> '
							: '<i class="fa fa-times incomplete"></i> '
							}${assignment.name}</strong><br>
						<div class="info">
							<p>Due: ${assignment.due_date}</p>
							<p>${assignment.source || ""}</p>
						</div>
					`;
					groupDiv.appendChild(a);
				});

				// Append the color header and group container to the assignment group.
				assignmentGroupDiv.appendChild(colorDiv);
				assignmentGroupDiv.appendChild(groupDiv);

				container.appendChild(assignmentGroupDiv);
			});
		});

		// Optionally, add a button to reveal past (old) assignments if any exist.
		if (oldAssignmentCount > 0) {
			const viewButton = document.createElement("button");
			viewButton.id = "view-old-assignments";
			viewButton.classList.add("assignment-button");
			viewButton.textContent = `view ${oldAssignmentCount} past assignments`;

			viewButton.addEventListener("click", function () {
				const oldElements = container.querySelectorAll(".old-assignment");
				oldElements.forEach(el => {
					el.style.display = "flex";
				});
				viewButton.remove();
			});

			container.insertBefore(viewButton, container.firstChild);
		}
	}

    // Load all assignments from extension storage
    browser.storage.local.get("allAssignments").then((data) => {
		if (data.allAssignments.length === 0) {
			console.debug("[Dashboard] No assignments to load");
		}
		displayAssignments(data.allAssignments, assignmentsDiv);
    }).catch((err) => {
        console.warn("[Dashboard] Error loading all assignments:", err);
    });

    // Refresh assignments on button click.
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

	browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
		if (message.action === "updateCanvasStatus" && message.status) {
			canvasStatus.textContent = message.status;
		}
		if (message.action === "updateGradescopeStatus" && message.status) {
			gradescopeStatus.textContent = message.status;
		}
	});
});
