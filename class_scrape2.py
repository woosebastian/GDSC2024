import requests
from bs4 import BeautifulSoup
import time
from class_scrape import links
import requests


import requests
from bs4 import BeautifulSoup


def has_numbers(string):
    # Check if the string contains any digit
    return any(char.isdigit() for char in string)


def scrape_links(links):
    parent_child_links = {}

    for link in links:
        if "or-this-course" in link or "narrative" in link:
            continue

        try:
            response = requests.get(link)
            response.raise_for_status()  # Raise an exception for 4xx or 5xx status codes
            soup = BeautifulSoup(response.content, "html.parser")

            # Find the <div> tag with class "extraFields"
            extra_fields_div = soup.find("div", class_="extraFields")

            if extra_fields_div:
                # Extract the text containing prerequisites
                prerequisite_text = extra_fields_div.find(text="Prerequisite(s):")
                if prerequisite_text:
                    # Extract the prerequisite courses
                    prerequisite_courses = prerequisite_text.find_next_sibling(
                        "p"
                    ).text.strip()

                    # Initialize lists for storing courses based on conditions
                    main_list = []
                    current_list = []

                    # Parse the prerequisite courses
                    for course in prerequisite_courses.split(";"):
                        course = course.strip()
                        if "or" in course:
                            if current_list:
                                main_list.append(current_list)
                            current_list = [course.replace("or", "").strip()]
                        elif "and" in course:
                            if current_list:
                                main_list.append(current_list)
                                current_list = []
                            current_list.extend(
                                course.replace("and", "").strip().split(",")
                            )
                        else:
                            if current_list:
                                main_list.append(current_list)
                                current_list = []
                            current_list.extend(course.strip().split(","))

                    # Append the last list to the main list
                    if current_list:
                        main_list.append(current_list)

                    # Capitalize each course name and remove dashes
                    formatted_main_list = []
                    for sublist in main_list:
                        formatted_sublist = [
                            course.replace("-", " ").strip().upper()
                            for course in sublist
                        ]
                        formatted_main_list.append(formatted_sublist)

                    parent_child_links[link] = formatted_main_list

            else:
                parent_child_links[link] = []

        except requests.RequestException as e:
            print("Error fetching or parsing HTML for link:", link)
            parent_child_links[link] = []

    return parent_child_links


# Example usage:
parent_child_links = scrape_links(
    [
        "https://catalog.ucsc.edu/en/2022-2023/general-catalog/courses/narrative-courses/either-this-course"
    ]
)
print(parent_child_links)
