async function fetchCanvasAssignments() {
    console.debug("[Background Script] Fetching Canvas assignments...");

    // Retrieve the Canvas API key from extension storage.
    // (You may need to provide a UI to let the user store this key.)
    const { canvasApiKey } = await browser.storage.local.get("canvasApiKey");
    if (!canvasApiKey) {
        console.warn("[Background Script] No Canvas API key found!");
        return [];
    }

    const allowedCourseIds = [131158, 132893, 129569, 131132, 131142, 131827];
    const headers = {
        "Authorization": `Bearer ${canvasApiKey}`,
        "Content-Type": "application/json"
    };

    let assignments = [];

    try {
        for (let courseId of allowedCourseIds) {
            console.debug(`[Background Script] Fetching assignments for course ${courseId}...`);
            let response = await fetch(`https://canvas.its.virginia.edu/api/v1/courses/${courseId}/assignments`, {
                method: "GET",
                headers
            });

            if (!response.ok) {
                console.warn(`[Background Script] Skipping course ${courseId}, API response: ${response.status}`);
                continue;
            }

            let courseAssignments = await response.json();
            courseAssignments.forEach(assignment => {
                assignments.push({
                    name: assignment.name,
                    class: `Canvas: ${assignment.course_id}`,
                    due_date: assignment.due_at ? new Date(assignment.due_at).toLocaleString() : "No Due Date",
                    complete: assignment.has_submitted_submissions,
                    link: assignment.html_url
                });
            });
        }

        console.debug("[Background Script] Canvas assignments fetched successfully.");
        // Save the fetched assignments to extension storage.
        await browser.storage.local.set({ "canvasAssignments": assignments });
        return assignments;
    } catch (error) {
        console.warn("[Background Script] Error fetching Canvas assignments:", error);
        return [];
    }
}

async function fetchGradescopeAssignments() {
    console.debug("[Background Script] Fetching Gradescope assignments...");

    const gradescopeLink = "https://www.gradescope.com";
    const courseIds = [940274, 952770, 947696, 947989, 940276];

    try {
        let response = await fetch(gradescopeLink, { credentials: "include" });

        if (!response.ok) {
            console.error("[Background Script] Failed to fetch Gradescope dashboard.");
            return [];
        }

        let text = await response.text();
        let parser = new DOMParser();
        let doc = parser.parseFromString(text, "text/html");

        let courses = doc.querySelectorAll("a.courseBox");
        let assignments = [];

        for (let course of courses) {
            let courseName = course.querySelector("h3.courseBox--shortname").innerText.trim();
            let courseLink = gradescopeLink + course.getAttribute("href");
            let courseId = parseInt(course.getAttribute("href").replace("/courses/", "").trim());

            if (!courseIds.includes(courseId)) {
                continue;
            }

            let courseRes = await fetch(courseLink, { credentials: "include" });
            let courseText = await courseRes.text();
            let courseDoc = parser.parseFromString(courseText, "text/html");

            let rows = courseDoc.querySelectorAll("tbody tr[role=row]");

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

		// Save gradescope assignments to extension storage
		browser.storage.local.set({ "gradescopeAssignments": assignments }, () => {
			console.debug("[Background Script] Update gradescope assignments");
		});

		return

    } catch (error) {
        console.warn("[Background Script] Error fetching Gradescope assignments:", error);
        return [];
    }
}

fetchGradescopeAssignments();
fetchCanvasAssignments();

// Refresh assignments every 10 minutes
browser.alarms.create("refreshAssignments", { periodInMinutes: 10 });
browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "refreshAssignments") {
        fetchGradescopeAssignments();
		fetchCanvasAssignments();
    }
});
