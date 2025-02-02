// background.js
// Runs background tasks for the dashboard extension

import { cleanDate } from './date.js';

const canvasLink = "https://canvas.its.virginia.edu";

async function fetchCanvasAssignments() {
    console.debug("[Background] Fetching Canvas assignments...");
	browser.runtime.sendMessage({ action: "updateCanvasStatus", status: "Fetching" })
		.catch((error) => {});

	// Update last fetch
	const now = new Date().toISOString();
	updateCanvasMetadata({ lastFetch: now });

    // Retrieve the Canvas API key from extension storage.
    const { canvasAccessToken } = await browser.storage.local.get("canvasAccessToken");
    if (!canvasAccessToken) {
        console.warn("[Background] No Canvas API key found! Stopping fetch");
		browser.runtime.sendMessage({ action: "updateCanvasStatus", status: "No API Key" })
			.catch((error) => {});
        return;
    }

	// Get the canvas ids
    let courseIds = [];
	getStoredCourseIDs().then(ids => {
		courseIds = ids.canvas;
	});

    const headers = {
        "Authorization": `Bearer ${canvasAccessToken}`,
        "Content-Type": "application/json"
    };

    let assignments = [];

    try {
        for (let courseId of courseIds) {
            let response = await fetch(`${canvasLink}/api/v1/courses/${courseId}/assignments`, {
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
                    class: assignment.course_id,
                    due_date: assignment.due_at ? cleanDate(assignment.due_at) : "No Due Date",
                    complete: assignment.has_submitted_submissions,
                    link: assignment.html_url,
					source: "Canvas"
                });
            });
        }

        console.debug("[Background] Canvas assignments fetched successfully.");
		browser.runtime.sendMessage({ action: "updateCanvasStatus", status: "Updated" })
			.catch((error) => {});

		// If processing is complete, update the data
		updateCanvasMetadata({
			lastSuccessfulFetch: now, 
			assignments: assignments 
		});

    } catch (error) {
        console.warn("[Background] Error fetching Canvas assignments:", error);
		browser.runtime.sendMessage({ action: "updateCanvasStatus", status: "Error" })
			.catch((error) => {});
    }
}

// Update a certain field of the canvas assignments
function updateCanvasMetadata(updates) {
	return browser.storage.local.get("canvasAssignments").then((result) => {
		const data = result.canvasAssignments || {};
		Object.assign(data, updates);
		return browser.storage.local.set({ "canvasAssignments": data });
	});
}

async function fetchGradescopeAssignments() {
    console.debug("[Background] Fetching Gradescope assignments...");
	browser.runtime.sendMessage({ action: "updateGradescopeStatus", status: "Fetching" })
		.catch((error) => {});

    const gradescopeLink = "https://www.gradescope.com";

	// Get the canvas ids
    let courseIds = [];
	getStoredCourseIDs().then(ids => {
		courseIds = ids.gradescope;
	});

	const now = new Date().toISOString();

	// Update last fetch
	updateGradescopeMetadata({ lastFetch: now });

    try {
        let response = await fetch(gradescopeLink, { credentials: "include" });

		// Check for response
        if (!response.ok) {
            console.error("[Background] Failed to fetch Gradescope dashboard.");
            return;
        }

        let text = await response.text();
        let parser = new DOMParser();
        let doc = parser.parseFromString(text, "text/html");

		// Check if correctly authenticated
		if (doc.title === "Gradescope") {
			console.warn("[Background] Gradescope is not authenticated");
			browser.runtime.sendMessage({ action: "updateGradescopeStatus", status: "Not authenticated" })
				.catch((error) => {});
			return;
		}

		// Loop through the courses + build assignment array
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
                    link: link,
					source: "Gradescope"
                });
            }
        }

		console.debug("[Background] Gradescope assignments fetched successfully");
		browser.runtime.sendMessage({ action: "updateGradescopeStatus", status: "Updated" })
			.catch((error) => {});

		// If processing is complete, update the data
		updateGradescopeMetadata({
			lastSuccessfulFetch: now, 
			assignments: assignments 
		});

	} catch (error) {
		console.warn("[Background] Error fetching Gradescope assignments:", error);
		browser.runtime.sendMessage({ action: "updateGradescopeStatus", status: "Error" })
			.catch((error) => {});
	}
}

// Update a certain field of the gradescope assignments
function updateGradescopeMetadata(updates) {
	return browser.storage.local.get("gradescopeAssignments")
		.then((result) => {
			const data = result.gradescopeAssignments || {};
			Object.assign(data, updates);
			return browser.storage.local.set({ "gradescopeAssignments": data });
		});
}

// Order assignments by due date.
function orderAssignments(assignments) {
    return assignments.sort((a, b) => {
        let timeA = new Date(a.due_date).getTime();
        let timeB = new Date(b.due_date).getTime();

        // If the date is invalid, treat it as Infinity.
        if (isNaN(timeA)) timeA = Infinity;
        if (isNaN(timeB)) timeB = Infinity;

        return timeA - timeB;
    });
}

/**
 * Group the assignments first by day and then by class.
 * Formats to this:
 * [
 *   {
 *     "date": "YYYY-MM-DD",
 *     "groups": [
 *       {
 *         "class": "CLASS NAME",
 *         "assignments": [ ... ]
 *       },
 *       ...
 *     ]
 *   },
 *   ...
 * ]
 */
function groupAssignments(allAssignments) {
    const dayGroups = {};

    allAssignments.forEach(assignment => {
        // Normalize the due_date to midnight and format as "YYYY-MM-DD"
        let d = new Date(assignment.due_date);
        // If the date is invalid, you can decide to skip or assign a placeholder.
        if (isNaN(d.getTime())) return;
        d.setHours(0, 0, 0, 0);
        let dateKey = d.toISOString().split("T")[0];

        if (!dayGroups[dateKey]) {
            dayGroups[dateKey] = { date: dateKey, groups: {} };
        }

        // Use the assignment's class property to group by class.
        let className = assignment.class;
        if (!dayGroups[dateKey].groups[className]) {
            dayGroups[dateKey].groups[className] = [];
        }

        // Push a minimal version of the assignment (only the fields needed).
        dayGroups[dateKey].groups[className].push({
            name: assignment.name,
			due_date: assignment.due_date,
            complete: assignment.complete,
            link: assignment.link,
            source: assignment.source
        });
    });

    // Convert the dayGroups object into a sorted array.
    const groupedArray = [];
    Object.keys(dayGroups)
        .sort((a, b) => new Date(a) - new Date(b))
        .forEach(dateKey => {
            const groupsObj = dayGroups[dateKey].groups;
            const groupsArr = [];
            Object.keys(groupsObj).forEach(className => {
                groupsArr.push({
                    "class": className,
                    assignments: groupsObj[className]
                });
            });
            groupedArray.push({
                date: dayGroups[dateKey].date,
                groups: groupsArr
            });
        });

    return groupedArray;
}

// Generate a new, full grouped array from all sources.
async function appendAssignments() {
    let result = await browser.storage.local.get(["gradescopeAssignments", "canvasAssignments"]);
    let gradescopeAssignments = [];
    let canvasAssignments = [];

    if (result.gradescopeAssignments && result.gradescopeAssignments.assignments)
        gradescopeAssignments = result.gradescopeAssignments.assignments;
    if (result.canvasAssignments && result.canvasAssignments.assignments)
        canvasAssignments = result.canvasAssignments.assignments;

    let allAssignments = gradescopeAssignments.concat(canvasAssignments);

    // Order + group the assignments
    allAssignments = orderAssignments(allAssignments);
    let grouped = groupAssignments(allAssignments);

    // Save the grouped assignments to storage.
    await browser.storage.local.set({ "allAssignments": grouped });
}

// Return the stored class ids
async function getStoredCourseIDs() {
	// Retrieve the "classes" from storage.
	const result = await browser.storage.local.get("classes");
	let classes = result.classes || [];

	// Check if exists
	if (typeof classes === "string") {
		try {
			classes = JSON.parse(classes);
		} catch (e) {
			console.error("Error parsing classes JSON:", e);
			return { canvas: [], gradescope: [] };
		}
	}

	const canvasIDs = [];
	const gradescopeIDs = [];

	// Loop over each class; find ids
	classes.forEach(course => {
		if (course.canvasId && course.canvasId.trim() !== "") {
			canvasIDs.push(Number(course.canvasId));
		}
		if (course.gradescopeId && course.gradescopeId.trim() !== "") {
			gradescopeIDs.push(Number(course.gradescopeId));
		}
	});

	return { canvas: canvasIDs, gradescope: gradescopeIDs };
}

// Create a new function that waits for both fetches to complete.
async function refreshAllAssignments() {
    await Promise.all([
        fetchGradescopeAssignments(),
        fetchCanvasAssignments()
    ]);
    await appendAssignments();
}

// Messaging system
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "refreshAssignments") {
        console.debug("[Dashboard Extension] Refreshing assignments...");
        refreshAllAssignments();
    }
});

// Initial call: wait for both fetches to finish, then append.
refreshAllAssignments();
