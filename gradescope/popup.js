document.addEventListener("DOMContentLoaded", function () {
    chrome.storage.local.get("gradescopeAssignments", function (data) {
        let assignments = data.gradescopeAssignments || [];
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
        chrome.storage.local.get("gradescopeAssignments", function (data) {
            let json = JSON.stringify(data.gradescopeAssignments, null, 4);
            let blob = new Blob([json], { type: "application/json" });
            let url = URL.createObjectURL(blob);

            let a = document.createElement("a");
            a.href = url;
            a.download = "gradescope_assignments.json";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    });
});

