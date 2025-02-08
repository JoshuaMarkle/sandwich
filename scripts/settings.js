document.addEventListener("DOMContentLoaded", () => {
	// Tab System
	const tabClasses = document.getElementById("tab-classes");
	const tabIntegration = document.getElementById("tab-integration");
	const classesContent = document.getElementById("classes");
	const integrationsContent = document.getElementById("integrations");
	tabClasses.addEventListener("click", function () { showTab("classes"); });
	tabIntegration.addEventListener("click", function () { showTab("integrations"); });
    showTab("integrations");

	// Show a tab
	function showTab(tab) {
		if (tab === "classes") {
			classesContent.style.display = "block";
			integrationsContent.style.display = "none";
			tabClasses.classList.add("active");
			tabIntegration.classList.remove("active");
		} else {
			classesContent.style.display = "none";
			integrationsContent.style.display = "block";
			tabClasses.classList.remove("active");
			tabIntegration.classList.add("active");
		}
	}

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

	function createClassBlock(cls) {
		const div = document.createElement("div");
		div.classList.add("class");
		div.id = `class-${cls.id}`;
		div.dataset.classId = cls.id;

		const deleteBtn = document.createElement("button");
		deleteBtn.classList.add("delete");
		deleteBtn.innerHTML = '<i class="fa fa-times"></i>';
		deleteBtn.addEventListener("click", () => deleteClass(cls.id));
		div.appendChild(deleteBtn);

		const contentDiv = document.createElement("div");
		contentDiv.classList.add("class-content");

		const h3 = document.createElement("h3");
		h3.id = `class-short-name-${cls.id}`;
		h3.textContent = cls.nickname || cls.name.substring(0, 3).toUpperCase();

		const p = document.createElement("p");
		p.id = `class-full-name-${cls.id}`;
		p.textContent = cls.name;

		contentDiv.appendChild(h3);
		contentDiv.appendChild(p);

		const rowDiv = document.createElement("div");
		rowDiv.classList.add("row");

		const leftColumn = document.createElement("div");
		leftColumn.style.flex = "1";

		const rightColumn = document.createElement("div");
		rightColumn.style.flex = "1";

		// Left Column Inputs
		leftColumn.appendChild(createInputField("Name", `name-${cls.id}`, cls.name, cls.id, "name"));
		leftColumn.appendChild(createInputField("Canvas", `canvas-id-${cls.id}`, cls.canvasId, cls.id, "canvasId"));

		const colorLabel = document.createElement("h4");
		colorLabel.textContent = "Class Color";
		leftColumn.appendChild(colorLabel);

		const colorRow = document.createElement("div");
		colorRow.classList.add("row");
		colorRow.style.gap = "5px";

		const colorBox = document.createElement("div");
		colorBox.classList.add("color-box");

		const colorPreview = document.createElement("div");
		colorPreview.style.background = cls.color || "var(--blue)";
		colorBox.appendChild(colorPreview);

		const colorInput = document.createElement("input");
		colorInput.type = "text";
		colorInput.id = `color-${cls.id}`;
		colorInput.placeholder = "#00AAFF";
		colorInput.value = cls.color || "";

		// Function to handle color validation and live update
		colorInput.addEventListener("input", () => {
			const colorValue = colorInput.value.trim();

			if (isValidHex(colorValue)) {
				colorPreview.style.backgroundColor = colorValue;
				colorRemoveError(colorPreview);
			} else {
				colorShowError(colorPreview);
			}

			saveClassesBtn.removeAttribute("disabled");
		});

		colorRow.appendChild(colorBox);
		colorRow.appendChild(colorInput);
		leftColumn.appendChild(colorRow);

		// Right Column Inputs
		rightColumn.appendChild(createInputField("Nickname", `nickname-${cls.id}`, cls.nickname, cls.id, "nickname"));
		rightColumn.appendChild(createInputField("Gradescope", `gradescope-id-${cls.id}`, cls.gradescopeId, cls.id, "gradescopeId"));

		rowDiv.appendChild(leftColumn);
		rowDiv.appendChild(rightColumn);
		contentDiv.appendChild(rowDiv);
		div.appendChild(contentDiv);

		return div;
	}

	// Helper function to create input fields with labels
	function createInputField(labelText, inputId, inputValue, classId, field) {
		const wrapper = document.createElement("div");

		const label = document.createElement("h4");
		label.textContent = labelText;
		wrapper.appendChild(label);

		const input = document.createElement("input");
		input.type = "text";
		input.id = inputId;
		input.value = inputValue || "";
		input.dataset.classId = classId;
		input.classList.add("class-edit");
		input.placeholder = labelText;
		input.addEventListener("input", (e) => {
			saveClassesBtn.removeAttribute("disabled");
		});

		wrapper.appendChild(input);
		return wrapper;
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
			gradescopeId: "",
			color: "#00acff"
		};

		browser.storage.local.get("classes").then((result) => {
			const classes = result.classes || [];
			classes.push(newClass);
			return browser.storage.local.set({ classes });
		}).then(() => {
				nameInput.value = "";
				nicknameInput.value = "";
			}).catch((err) => {
				console.error("Error saving class:", err);
			});
	});

	// Save classes button
	const saveClassesBtn = document.getElementById("update-classes");
	saveClassesBtn.addEventListener("click", () => {
		browser.storage.local.get("classes").then((result) => {
			const classes = result.classes || [];

			// Update each class from the current input values
			classes.forEach((cls) => {
				cls.name = document.getElementById(`name-${cls.id}`).value;
				cls.nickname = document.getElementById(`nickname-${cls.id}`).value;
				cls.canvasId = document.getElementById(`canvas-id-${cls.id}`).value;
				cls.gradescopeId = document.getElementById(`gradescope-id-${cls.id}`).value;
				cls.color = document.getElementById(`color-${cls.id}`).value;
			});

			// Save the updated classes
			return browser.storage.local.set({ classes });
		}).then(() => {
				saveClassesBtn.setAttribute("disabled", true);
				alert("Classes saved successfully!");
			}).catch(console.error);
	});


	// Initial Render
	renderClasses();

	// HEX checker
	function isValidHex(color) {
		return /^#([0-9A-Fa-f]{3}){1,2}$/.test(color);
	}

	// Function to show an error message if the input is invalid
	function colorShowError(inputElement) {
		colorRemoveError(inputElement);

		inputElement.style.display = "none";
		const errorMsg = document.createElement("i");
		errorMsg.style.color = "var(--red)";
		errorMsg.style.alignContent = "center";
		errorMsg.style.textAlign = "center";
		errorMsg.classList.add("color-error");
		errorMsg.classList.add("fa-solid");
		errorMsg.classList.add("fa-triangle-exclamation");

		inputElement.parentElement.appendChild(errorMsg);
	}

	// Function to remove existing error messages
	function colorRemoveError(inputElement) {
		inputElement.style.display = "block";
		const existingError = inputElement.parentElement.querySelector(".color-error");
		if (existingError) {
			existingError.remove();
		}
	}

	// Initial check for the canvas access token in storage
	// browser.storage.local.get("canvasAccessToken")
	// 	.then((result) => {
	// 		if (result.canvasAccessToken) {
	// 			document.getElementById("canvas-access-token-indicator").textContent = result.canvasAccessToken;
	// 		}
	// 	})

	// Update Canvas Access Token
	// const updateTokenBtn = document.getElementById("update-access-token");
	// updateTokenBtn.addEventListener("click", () => {
	// 	const tokenInput = document.getElementById("input-canvas");
	// 	const linkInput = document.getElementById("input-canvas");
	// 	const token = tokenInput.value.trim();
	// 	if (!token) {
	// 		alert("Please enter an access token");
	// 		return;
	// 	}
	// 	// Save the token and update the indicator.
	// 	browser.storage.local
	// 		.set({ canvasAccessToken: token })
	// 		.then(() => {
	// 			// Update the indicator and last update time.
	// 			document.getElementById("canvas-access-token-indicator").textContent = "Found";
	// 			const now = new Date().toLocaleDateString();
	// 			document.getElementById("canvas-last-update").textContent = now;
	// 			return
	// 		})
	// 		.catch(console.error);
	// });

	// Export buttons + function
	const exportBtn = document.getElementById("export-classes");
	if (exportBtn) { exportBtn.addEventListener("click", exportClasses); }
	function exportClasses() {
		browser.storage.local.get("classes").then(result => {
			const classesData = result.classes || [];
			const dataStr = JSON.stringify(classesData, null, 2); // Pretty print
			const blob = new Blob([dataStr], { type: "application/json" });
			const url = URL.createObjectURL(blob);

			// Create a temporary anchor element to trigger the download.
			const a = document.createElement("a");
			a.href = url;
			a.download = "classes_export.json";
			document.body.appendChild(a);
			a.click();

			// Clean up.
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		}).catch(err => {
				console.error("Error exporting classes:", err);
			});
	}

	// Import box (drag and drop + browse)
	const importBox = document.getElementById("import-box");
	const importInput = document.getElementById("import-file");
	if (importBox) {
		importBox.addEventListener("dragover", (event) => {
			event.preventDefault();
			importBox.style.borderColor = "var(--blue)";
		});

		importBox.addEventListener("dragleave", () => {
			importBox.style.borderColor = "var(--border)";
		});

		importBox.addEventListener("drop", (event) => {
			event.preventDefault();
			importBox.style.borderColor = "var(--border)";

			const file = event.dataTransfer.files[0];
			if (file && file.type === "application/json") {
				importClasses(file);
			} else {
				alert("Please drop a valid JSON file.");
			}
		});

		importBox.addEventListener("click", () => {
			importInput.click();
		});

		if (importInput) {
			importInput.addEventListener("change", (event) => {
				const file = event.target.files[0];
				if (file) {
					importClasses(file);
				}
			});
		}
	}

	// Import classes function
	function importClasses(file) {
		const reader = new FileReader();
		reader.onload = event => {
			try {
				const importedClasses = JSON.parse(event.target.result);
				// Save the imported classes to storage.
				browser.storage.local.set({ classes: importedClasses }).then(() => {
					alert("Classes imported successfully!");
					// Optionally, refresh the UI or update internal state.
				}).catch(err => {
						console.error("Error saving imported classes:", err);
						alert("Failed to save imported classes.");
					});
			} catch (error) {
				console.error("Error parsing JSON:", error);
				alert("Error parsing imported file: " + error);
			}
		};
		reader.readAsText(file);
	}

	// Listen for storage changes
	browser.storage.onChanged.addListener((changes, area) => {
		if (area === "local") {
			// Render classes
			if (changes.classes) {
				renderClasses();
			}

			// Update last gradescope update time
			if (changes.gradescopeLastUpdate) {
				document.getElementById("gradescope-last-update").textContent =
					changes.gradescopeLastUpdate.newValue;
			}
		}
	});
});
