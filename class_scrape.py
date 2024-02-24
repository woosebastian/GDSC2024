import requests
from bs4 import BeautifulSoup
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

from cs_22_23 import course_names_text

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
            existing_courses[course] = [""]

    # Update Firebase document
    doc_ref = db.collection("electives").document("iZqg4fylTd8gB4nZenRT")
    doc_ref.set({"classRequirements": existing_courses})


# Function to scrape links from the provided URL
def get_links_from_url(url):
    try:
        response = requests.get(url)
        response.raise_for_status()  # Raise an exception for 4xx or 5xx status codes
        soup = BeautifulSoup(response.content, "html.parser")
        links = []

        # Find all <a> tags with class "sc-courselink"
        a_tags = soup.find_all("a", class_="sc-courselink")

        # Extract href attribute from each <a> tag and add it to links list
        for a_tag in a_tags:
            link = a_tag.get("href")
            if link:
                class_url = f"https://catalog.ucsc.edu{link}".lower()
                links.append(class_url)

        return links

    except requests.RequestException as e:
        print("Error fetching or parsing HTML:", e)
        return []


# Provided list of course names
course_names_text = course_names_text

# Parse course names from the provided text
course_names = [
    line.split(":")[1].strip()
    for line in course_names_text.split("\n")
    if line.startswith("Course Name")
]

# Add course names to Firebase
add_course_names(course_names)

url = "https://catalog.ucsc.edu/2022-2023/general-catalog/academic-units/baskin-engineering/computer-science-and-engineering/computer-science-bs/"
links = get_links_from_url(url)
