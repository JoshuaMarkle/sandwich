document.addEventListener("DOMContentLoaded", () => {
	// Dashboard Navigation
	const dashboardBtn = document.getElementById("dashboard");
	dashboardBtn.addEventListener("click", () => {
		browser.tabs.create({ url: browser.runtime.getURL("dashboard.html") });
	});

	// Render Classes
	function renderClasses() {
		const classesList = document.getElementById("classes-list");
		classesList.innerHTML = "";
		browser.storage.local.get("classes").then((result) => {
			const classes = result.classes || [];
			// Sort classes alphabetically
			classes.sort((a, b) => a.name.localeCompare(b.name));

			classes.forEach((cls) => {
				const classBlock = createClassBlock(cls);
				classesList.appendChild(classBlock);
			});
		});
	}

	// Create a Class Block Element
	function createClassBlock(cls) {
		const div = document.createElement("div");
		div.classList.add("class");
		div.id = "class-" + cls.id;
		div.dataset.classId = cls.id;

		// Delete button
		const deleteBtn = document.createElement("button");
		deleteBtn.classList.add("delete");
		deleteBtn.id = "delete-class-" + cls.id;
		deleteBtn.innerHTML = '<i class="fa fa-times"></i>';
		deleteBtn.addEventListener("click", () => deleteClass(cls.id));
		div.appendChild(deleteBtn);

		// Class content
		const contentDiv = document.createElement("div");
		contentDiv.classList.add("class-content");

		// Title section
		const titleDiv = document.createElement("div");
		titleDiv.classList.add("title");
		const h3 = document.createElement("h3");
		h3.id = "class-short-name-" + cls.id;

		// Use the nickname if available; otherwise, derive one from the name.
		h3.textContent = cls.nickname || cls.name.substring(0, 3).toUpperCase();
		const p = document.createElement("p");
		p.id = "class-full-name-" + cls.id;
		p.textContent = cls.name;
		titleDiv.appendChild(h3);
		titleDiv.appendChild(p);
		contentDiv.appendChild(titleDiv);

		// Table for integration IDs
		const table = document.createElement("table");

		// Row for Canvas ID
		const rowCanvas = document.createElement("tr");
		const thCanvasLabel = document.createElement("th");
		thCanvasLabel.textContent = "Canvas";
		const thCanvasInput = document.createElement("th");
		const canvasInput = document.createElement("input");
		canvasInput.type = "text";
		canvasInput.id = "canvas-id-" + cls.id;
		canvasInput.dataset.classId = cls.id;
		canvasInput.classList.add("class-edit");
		canvasInput.placeholder = "Canvas Class ID";
		canvasInput.value = cls.canvasId || "";

		// Update storage when this input changes
		canvasInput.addEventListener("input", (e) =>
			updateClassField(cls.id, "canvasId", e.target.value)
		);
		thCanvasInput.appendChild(canvasInput);
		rowCanvas.appendChild(thCanvasLabel);
		rowCanvas.appendChild(thCanvasInput);
		table.appendChild(rowCanvas);

		// Row for Gradescope ID
		const rowGradescope = document.createElement("tr");
		const thGradescopeLabel = document.createElement("th");
		thGradescopeLabel.textContent = "Gradescope";
		const thGradescopeInput = document.createElement("th");
		const gradescopeInput = document.createElement("input");
		gradescopeInput.type = "text";
		gradescopeInput.id = "gradescope-id-" + cls.id;
		gradescopeInput.dataset.classId = cls.id;
		gradescopeInput.classList.add("class-edit");
		gradescopeInput.placeholder = "Gradescope Class ID";
		gradescopeInput.value = cls.gradescopeId || "";

		// Update storage when this input changes
		gradescopeInput.addEventListener("input", (e) =>
			updateClassField(cls.id, "gradescopeId", e.target.value)
		);
		thGradescopeInput.appendChild(gradescopeInput);
		rowGradescope.appendChild(thGradescopeLabel);
		rowGradescope.appendChild(thGradescopeInput);
		table.appendChild(rowGradescope);

		contentDiv.appendChild(table);
		div.appendChild(contentDiv);
		return div;
	}

	// Delete a Class
	function deleteClass(classId) {
		browser.storage.local.get("classes").then((result) => {
			let classes = result.classes || [];
			classes = classes.filter((cls) => cls.id != classId);
			return browser.storage.local.set({ classes });
		}).then(renderClasses)
			.catch(console.error);
	}

	// Update a Class Field
	function updateClassField(classId, field, newValue) {
		browser.storage.local.get("classes").then((result) => {
			let classes = result.classes || [];
			const index = classes.findIndex((cls) => cls.id == classId);
			if (index > -1) {
				classes[index][field] = newValue;
				return browser.storage.local.set({ classes });
			}
		}).catch(console.error);
	}

	// Add New Class
	const addClassBtn = document.getElementById("add-class");
	addClassBtn.addEventListener("click", () => {
		const nameInput = document.getElementById("new-class-name");
		const nicknameInput = document.getElementById("new-class-nickname");
		const newName = nameInput.value.trim();
		const newNickname = nicknameInput.value.trim();

		if (!newName) {
			alert("Please enter a class name");
			return;
		}

		// Create a new class object.
		const newClass = {
			id: Date.now(), // super awesome unique identifier
			name: newName,
			nickname: newNickname,
			canvasId: "",
			gradescopeId: ""
		};

		browser.storage.local.get("classes").then((result) => {
			const classes = result.classes || [];
			classes.push(newClass);
			return browser.storage.local.set({ classes });
		}).then(() => {
				nameInput.value = "";
				nicknameInput.value = "";
				renderClasses();
			}).catch((err) => {
				console.error("Error saving class:", err);
			});
	});

	// Initial Render
	renderClasses();

	// Initiall check for the canvas access token in storage
	browser.storage.local.get("canvasAccessToken")
		.then((result) => {
			if (result.canvasAccessToken) {
				document.getElementById("canvas-access-token-indicator").textContent = "Found";
			}
		})

	// Update Canvas Access Token
	const updateTokenBtn = document.getElementById("update-access-token");
	updateTokenBtn.addEventListener("click", () => {
		const tokenInput = document.getElementById("input-canvas");
		const token = tokenInput.value.trim();
		if (!token) {
			alert("Please enter an access token");
			return;
		}
		// Save the token and update the indicator.
		browser.storage.local
			.set({ canvasAccessToken: token })
			.then(() => {
				// Update the indicator and last update time.
				document.getElementById("canvas-access-token-indicator").textContent = "Found";
				const now = new Date().toLocaleDateString();
				document.getElementById("canvas-last-update").textContent = now;
				return browser.storage.local.set({ canvasLastUpdate: now });
			})
			.catch(console.error);
	});

	// Listen for storage changes
	browser.storage.onChanged.addListener((changes, area) => {
		if (area === "local") {
			// Render classes
			if (changes.classes) {
				renderClasses();
			}

			// Update last canvas update time
			if (changes.canvasLastUpdate) {
				document.getElementById("canvas-last-update").textContent =
					changes.canvasLastUpdate.newValue;
			}

			// Update last gradescope update time
			if (changes.gradescopeLastUpdate) {
				document.getElementById("gradescope-last-update").textContent =
					changes.gradescopeLastUpdate.newValue;
			}
		}
	});
});
