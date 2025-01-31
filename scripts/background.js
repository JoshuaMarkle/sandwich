// background.js
// Runs background tasks for the dashboard extension

import { cleanDate } from './date.js';

async function fetchCanvasAssignments() {
    console.debug("[Background] Fetching Canvas assignments...");

    // Retrieve the Canvas API key from extension storage.
    const { canvasApiKey } = await browser.storage.local.get("canvasApiKey");
    if (!canvasApiKey) {
        console.warn("[Background] No Canvas API key found!");
        return;
    }

    const allowedCourseIds = [131158, 132893, 129569, 131132, 131142, 131827];
    const headers = {
        "Authorization": `Bearer ${canvasApiKey}`,
        "Content-Type": "application/json"
    };

    let assignments = [];

    try {
        for (let courseId of allowedCourseIds) {
            console.debug(`[Background] Fetching assignments for course ${courseId}...`);
            let response = await fetch(`https://canvas.its.virginia.edu/api/v1/courses/${courseId}/assignments`, {
                method: "GET",
                headers
            });

            if (!response.ok) {
                console.warn(`[Background] Skipping course ${courseId}, API response: ${response.status}`);
                continue;
            }

            let courseAssignments = await response.json();
            courseAssignments.forEach(assignment => {
                assignments.push({
                    name: assignment.name,
                    class: `Canvas: ${assignment.course_id}`,
					due_date: assignment.due_at ? cleanDate(assignment.due_at) : "No Due Date",
                    complete: assignment.has_submitted_submissions,
                    link: assignment.html_url
                });
            });
        }

        console.debug("[Background] Canvas assignments fetched successfully.");

        // Save the canvas assignments to extension storage
        await browser.storage.local.set({ "canvasAssignments": assignments });

    } catch (error) {
        console.warn("[Background] Error fetching Canvas assignments:", error);
    }
}

async function fetchGradescopeAssignments() {
    console.debug("[Background] Fetching Gradescope assignments...");

    const gradescopeLink = "https://www.gradescope.com";
    const courseIds = [940274, 952770, 947696, 947989, 940276];

    try {
        let response = await fetch(gradescopeLink, { credentials: "include" });

        if (!response.ok) {
            console.error("[Background] Failed to fetch Gradescope dashboard.");
            return;
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
				let rawDueDate = dueDateElement ? dueDateElement.innerText.trim() : "No Due Date";
				let dueDate = rawDueDate !== "No Due Date" ? cleanDate(rawDueDate) : "No Due Date";
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
        await browser.storage.local.set({ "gradescopeAssignments": assignments });

    } catch (error) {
        console.warn("[Background] Error fetching Gradescope assignments:", error);
    }
}

// Given an array of assignments, order them by date
function orderAssignments(assignments) {
    return assignments.sort((a, b) => {
        let timeA = new Date(a.due_date).getTime();
        let timeB = new Date(b.due_date).getTime();

        // If the date is invalid, treat it as Infinity (i.e. sort it to the end).
        if (isNaN(timeA)) timeA = Infinity;
        if (isNaN(timeB)) timeB = Infinity;

        return timeA - timeB;
    });
}

// Generate a new, full array from all sources
async function appendAssignments() {
    let result = await browser.storage.local.get(["gradescopeAssignments", "canvasAssignments"]);
    let gradescopeAssignments = result.gradescopeAssignments || [];
    let canvasAssignments = result.canvasAssignments || [];
    let allAssignments = gradescopeAssignments.concat(canvasAssignments);

    // Order the assignments by due date.
    allAssignments = orderAssignments(allAssignments);

    // Save the new, sorted array to storage.
    await browser.storage.local.set({ "allAssignments": allAssignments });
}

// Messaging system
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.action === "refreshAssignments") {
		console.debug("[Dashboard Extension] Refreshing assignments...");
		fetchGradescopeAssignments();
		fetchCanvasAssignments();
		appendAssignments();
	}
});

fetchGradescopeAssignments();
fetchCanvasAssignments();
appendAssignments();
