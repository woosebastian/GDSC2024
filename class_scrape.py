import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

import cs_22_23 as cs

# Initialize Firebase
cred = credentials.Certificate(
    "year-planner-a2b3a-firebase-adminsdk-c9kdw-51fc301598.json"
)
firebase_admin.initialize_app(cred)
db = firestore.client()


# Function to retrieve existing course names from Firebase
def get_existing_courses():
    doc_ref = db.collection("electives").document("iZqg4fylTd8gB4nZenRT")
    doc = doc_ref.get()
    if doc.exists:
        return doc.to_dict().get("classRequirements", {})
    else:
        return {}


# Function to add course names to Firebase
def add_course_names(course_names):
    existing_courses = get_existing_courses()

    # Add each course name as an array with an empty string
    for course in course_names:
        if course not in existing_courses:
            existing_courses[course] = [
                ""
            ]  # Add each course name as an array with an empty string

    # Update Firebase document
    doc_ref = db.collection("electives").document("iZqg4fylTd8gB4nZenRT")
    doc_ref.set({"classRequirements": existing_courses})


# Provided list of course names
course_names_text = cs.course_names_text

# Parse course names from the provided text
course_names = [
    line.split(":")[1].strip()
    for line in course_names_text.split("\n")
    if line.startswith("Course Name")
]

# Add course names to Firebase
add_course_names(course_names)
