// Listen for tab updates to detect when Canvas is opened
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tab.url && tab.url.startsWith("https://canvas.its.virginia.edu")) {
        console.log("[Dashboard Extension] Canvas tab detected, requesting assignments...");
        browser.tabs.sendMessage(tabId, { action: "fetchCanvasAssignments" });
    }
});

// Listen for messages from content.js
browser.runtime.onMessage.addListener((message, sender) => {
    if (message.action === "storeCanvasAssignments") {
        console.log("[Dashboard Extension] Storing Canvas assignments...", message.assignments);
        browser.storage.local.set({ "canvasAssignments": message.assignments });
    }
});

async function fetchGradescopeAssignments() {
    console.log("[Dashboard Extension] Fetching Gradescope assignments...");

    const gradescopeLink = "https://www.gradescope.com";
    const courseIds = [940274, 952770, 947696, 947989, 940276];

    try {
        let response = await fetch(gradescopeLink, { credentials: "include" });

        if (!response.ok) {
            console.error("[Dashboard Extension] Failed to fetch Gradescope dashboard.");
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
			console.log("[Dashboard Extension] Update gradescope assignments");
		});

		return

    } catch (error) {
        console.error("[Dashboard Extension] Error fetching Gradescope assignments:", error);
        return [];
    }
}

fetchGradescopeAssignments();

// Refresh assignments every 10 minutes
browser.alarms.create("refreshAssignments", { periodInMinutes: 10 });
browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "refreshAssignments") {
        fetchGradescopeAssignments();
    }
});
