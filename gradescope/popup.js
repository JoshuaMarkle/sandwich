document.addEventListener("DOMContentLoaded", function () {
    browser.storage.local.get("canvasAssignments", function (data) {
        let assignments = data.canvasAssignments || [];
        let list = document.getElementById("assignmentList");

        if (assignments.length === 0) {
            list.innerHTML = "<li>No assignments found.</li>";
            return;
        }

        assignments.forEach(assignment => {
            let li = document.createElement("li");
            li.innerHTML = `<strong>${assignment.name}</strong> (${assignment.class}) - Due: ${assignment.due_date}`;
            list.appendChild(li);
        });
    });

    document.getElementById("exportJson").addEventListener("click", function () {
        browser.storage.local.get("canvasAssignments", function (data) {
            let json = JSON.stringify(data.canvasAssignments, null, 4);
            let blob = new Blob([json], { type: "application/json" });
            let url = URL.createObjectURL(blob);

            let a = document.createElement("a");
            a.href = url;
            a.download = "canvas_assignments.json";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    });
});

