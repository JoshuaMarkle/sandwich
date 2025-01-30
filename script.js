document.addEventListener("DOMContentLoaded", function () {
    loadAssignments();
});

function loadAssignments() {
    fetch("http://localhost:5000/assignments")
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById("assignments-container");
            const lastUpdatedDiv = document.getElementById("last-updated");

            container.innerHTML = "";  // Clear previous assignments

            // ✅ Update the last updated timestamp
            lastUpdatedDiv.textContent = `Last Updated: ${data.last_updated}`;

            data.assignments.forEach(assignment => {
                const assignmentDiv = document.createElement("div");
                assignmentDiv.className = "assignment";

                assignmentDiv.innerHTML = `
                    <a href="${assignment.Link}" target="_blank" class="title">${assignment.Name}</a>
                    <div class="meta">📚 ${assignment.Class} | 📅 ${assignment["Due Date"]}</div>
                    <div class="${assignment.Complete ? 'complete' : 'incomplete'}">
                        ${assignment.Complete ? '✅ Complete' : '❌ Incomplete'}
                    </div>
                `;

                container.appendChild(assignmentDiv);
            });
        })
        .catch(error => console.error("Error loading assignments:", error));
}

// ✅ Ensure `refreshAssignments()` is globally accessible
window.refreshAssignments = function () {
    const lastUpdatedDiv = document.getElementById("last-updated");
    lastUpdatedDiv.textContent = "Updating...";

    fetch("http://localhost:5000/update", { method: "POST" })
        .then(response => response.json())
        .then(data => {
            console.log("Reload response:", data);
            loadAssignments();  // Refresh assignments
        })
        .catch(error => {
            console.error("Error updating assignments:", error);
            lastUpdatedDiv.textContent = "Update failed!";
        });
};
