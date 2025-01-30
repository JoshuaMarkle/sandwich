import json
import os
import time
from datetime import datetime
from flask import Flask, jsonify
from flask_cors import CORS
from canvasapi import Canvas
from canvasapi.exceptions import Unauthorized, Forbidden

app = Flask(__name__)
CORS(app)  # Allow frontend to access API

# ✅ Read API credentials securely
with open("hidden/token", "r") as token_file:
    API_TOKEN = token_file.read().strip()

with open("hidden/url", "r") as url_file:
    CANVAS_URL = url_file.read().strip()

# ✅ Define allowed course IDs
ALLOWED_COURSE_IDS = {131158, 132893, 129569, 131132, 131142, 131827}

def fetch_assignments():
    """Fetch assignments and save them as JSON with last updated timestamp."""
    canvas = Canvas(CANVAS_URL, API_TOKEN)
    assignments_data = []

    courses = canvas.get_courses()
    for course in courses:
        if course.id not in ALLOWED_COURSE_IDS:
            print(f"Skipping [{course.id}] {course.name}")
            continue

        print(f"Fetching assignments for [{course.id}] {course.name}...")

        try:
            assignments = course.get_assignments()
            for assignment in assignments:
                due_date = assignment.due_at if assignment.due_at else "No Due Date"
                parsed_due_date = datetime.strptime(due_date, "%Y-%m-%dT%H:%M:%SZ") if "No Due Date" not in due_date else None
                
                assignment_info = {
                    "Name": assignment.name,
                    "Due Date": due_date,
                    "Class": course.name,
                    "Complete": assignment.has_submitted_submissions,
                    "Link": assignment.html_url
                }
                assignments_data.append(assignment_info)
        
        except Unauthorized:
            print(f"Skipping {course.name} - Unauthorized access.")
        except Forbidden:
            print(f"Skipping {course.name} - Permission issues.")
        except Exception as e:
            print(f"Unexpected error for {course.name}: {e}")

    # ✅ Sort assignments by due date
    assignments_data.sort(key=lambda x: (x["Due Date"] == "No Due Date", x["Due Date"]))

    # ✅ Include last updated timestamp inside `assignments.json`
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
    output_data = {
        "last_updated": timestamp,
        "assignments": assignments_data
    }

    os.makedirs("output", exist_ok=True)
    with open("output/assignments.json", "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=4)

    print(f"✅ Assignments updated! Last Updated: {timestamp}")
    return {"status": "success", "message": "Assignments updated!", "last_updated": timestamp}

@app.route('/update', methods=['POST'])
def update_assignments():
    """Trigger assignment update when requested from frontend."""
    result = fetch_assignments()
    return jsonify(result)

@app.route('/assignments', methods=['GET'])
def get_assignments():
    """Serve the assignments.json file."""
    try:
        with open("output/assignments.json", "r", encoding="utf-8") as f:
            assignments = json.load(f)
        return jsonify(assignments)
    except FileNotFoundError:
        return jsonify({"error": "Assignments not found"}), 404

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)
