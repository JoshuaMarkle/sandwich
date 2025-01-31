console.log("[Dashboard Extension] Injected content script");

async function fetchCanvasAssignments() {
    console.log("[Canvas Script] Fetching assignments inside Canvas page...");

    let apiKey = localStorage.getItem("canvasApiKey");
    if (!apiKey) {
        console.error("[Canvas Script] No Canvas API key found!");
        return;
    }

    const allowedCourseIds = [131158, 132893, 129569, 131132, 131142, 131827];
    let headers = { "Authorization": `Bearer ${apiKey}` };
    let assignments = [];

    try {
        for (let courseId of allowedCourseIds) {
            console.log(`[Canvas Script] Fetching assignments for course ${courseId}...`);

            // let response = await fetch(`https://canvas.its.virginia.edu/api/v1/courses/${courseId}/assignments`, { headers });
			let response = await fetch(`https://canvas.its.virginia.edu/api/v1/courses/${courseId}/assignments`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                console.warn(`[Canvas Script] Skipping course ${courseId}, API response: ${response.status}`);
                continue;
            }

            let courseAssignments = await response.json();
            for (let assignment of courseAssignments) {
                assignments.push({
                    name: assignment.name,
                    class: `Canvas: ${assignment.course_id}`,
                    due_date: assignment.due_at ? new Date(assignment.due_at).toLocaleString() : "No Due Date",
                    complete: assignment.has_submitted_submissions,
                    link: assignment.html_url
                });
            }
        }

        console.log("[Canvas Script] Assignments fetched successfully, sending to background script...");
        browser.runtime.sendMessage({ action: "storeCanvasAssignments", assignments });

    } catch (error) {
        console.error("[Canvas Script] Error fetching Canvas assignments:", error);
    }
}

// Listen for messages from background.js
browser.runtime.onMessage.addListener((message) => {
    if (message.action === "fetchCanvasAssignments") {
        fetchCanvasAssignments();
    }
});

