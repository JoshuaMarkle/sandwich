async function fetchAssignments() {
    console.log("[Gradescope Extension] Fetching assignments...");

	// General variables
	const gradescopeLink = "https://www.gradescope.com";
	const courseIds = [940274, 952770, 947696, 947989, 940276];

    try {
        let response = await fetch(gradescopeLink, {
            credentials: "include"
        });

        if (!response.ok) {
            console.error("[Gradescope Extension] Failed to fetch dashboard.");
            return;
        }

        let text = await response.text();
        let parser = new DOMParser();
        let doc = parser.parseFromString(text, "text/html");

        let courses = doc.querySelectorAll("a.courseBox");
        let assignments = [];

		console.log("[Gradescope Extension] Successfully authenticated");
		console.log("[Gradescope Extension] Searching: ", courses);

        for (let course of courses) {
            let courseName = course.querySelector("h3.courseBox--shortname").innerText.trim();
            let courseLink = gradescopeLink + course.getAttribute("href");
			let courseId = parseInt(course.getAttribute("href").replace("/courses/", "").trim());

			let checkForAssignments = false;
			for (let courseNumber of courseIds) {
				if (courseNumber === courseId) {
					checkForAssignments = true;
					break;
				}
			}
			if (!checkForAssignments) {
				console.log("skipping ", courseId);
				continue;
			}
			console.log("not skipping ", courseId);

			console.log("[Gradescope Extension] Found course: ", courseName);
			console.log("[Gradescope Extension] Found link: ", courseLink);

            let courseRes = await fetch(courseLink, { credentials: "include" });
            let courseText = await courseRes.text();
            let courseDoc = parser.parseFromString(courseText, "text/html");

            let rows = courseDoc.querySelectorAll("tbody tr[role=row]");

			console.log("[Gradescope Extension] Found Assignments: ", rows);

            for (let row of rows) {
                let titleElement = row.querySelector("th a, th button, th");
                let dueDateElement = row.querySelector("time.submissionTimeChart--dueDate");
                let statusElement = row.querySelector("div.submissionStatus--text, div.submissionStatus--score");
                let linkElement = row.querySelector("th.table--primaryLink a");

                let title = titleElement ? titleElement.innerText.trim() : "Unknown";
                let dueDate = dueDateElement ? dueDateElement.innerText.trim() : "No Due Date";
                let complete = statusElement && statusElement.innerText.trim() !== "No Submission";
                let link = linkElement ? linkElement.href : courseLink;

                assignments.push({
                    name: title,
                    class: courseName,
                    due_date: dueDate,
                    complete: complete,
                    link: link
                });
            }
        }

        chrome.storage.local.set({ "gradescopeAssignments": assignments }, () => {
            console.log("[Gradescope Extension] Assignments saved.");
        });

    } catch (error) {
        console.error("[Gradescope Extension] Error:", error);
    }
}

// Fetch assignments when the extension starts
fetchAssignments();

// Refresh assignments every 10 minutes
chrome.alarms.create("refreshGradescope", { periodInMinutes: 10 });

// Set up alarm listener to fetch assignments periodically
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "refreshGradescope") {
        fetchAssignments();
    }
});

