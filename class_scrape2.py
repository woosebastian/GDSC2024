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
                # Extract <a> tags within the "extraFields" div
                a_tags_sub = extra_fields_div.find_all("a", class_="sc-courselink")
                child_links = [a_tag.get("href") for a_tag in a_tags_sub]
                # Extract the last portion of the link (after the last '/')
                class_name = link.rsplit("/", 1)[-1]

                # Skip adding if the length of the class name is greater than 10 characters
                if (
                    len(class_name) <= 10
                    and has_numbers(class_name)
                    and "narrative" not in link
                ):
                    # Capitalize each word in the class name and remove dashes
                    class_name = class_name.replace("-", " ").upper()

                    # Format child links similarly
                    formatted_child_links = []
                    for child_link in child_links:
                        child_class_name = child_link.rsplit("/", 1)[-1]
                        child_class_name = child_class_name.replace("-", " ").upper()
                        if len(child_class_name) <= 10 and has_numbers(
                            child_class_name
                        ):
                            formatted_child_links.append(child_class_name)

                    parent_child_links[class_name] = formatted_child_links
            else:
                parent_child_links[link] = []

        except requests.RequestException as e:
            print("Error fetching or parsing HTML for link:", link)
            parent_child_links[link] = []

    return parent_child_links


# Example usage:
parent_child_links = scrape_links(links)
print(parent_child_links)


CLASSES = {
    "CSE 30": ["CSE 20", "BME 160", "MATH 3", "MATH 11A", "MATH 19A", "AM 3", "AM 11A"],
    "CSE 13S": ["CSE 12", "BME 160"],
    "CSE 12": ["CSE 5J", "CSE 20", "CSE 30", "BME 160"],
    "CSE 16": ["MATH 19A", "MATH 19B", "MATH 11B", "AM 11B"],
    "MATH 19A": ["MATH 3"],
    "MATH 20A": [],
    "MATH 19B": ["MATH 19A", "MATH 20A"],
    "MATH 20B": ["MATH 20A"],
    "MATH 21": ["MATH 11A", "MATH 19A", "MATH 20A", "AM 11A"],
    "AM 10": ["MATH 3"],
    "MATH 23A": ["MATH 19B", "MATH 20B"],
    "AM 30": ["AM 10", "MATH 19B", "MATH 20B"],
    "CSE 20": [],
    "ECE 30": ["MATH 19B"],
    "CSE 101": [
        "CSE 12",
        "BME 160",
        "ECE 13",
        "CSE 13S",
        "CSE 16",
        "CSE 30",
        "MATH 11B",
        "MATH 19B",
        "MATH 20B",
        "AM 11B",
    ],
    "CSE 102": ["CSE 101"],
    "CSE 103": ["CSE 101"],
    "CSE 120": ["CSE 12", "CSE 13S", "ECE 13", "CSE 16"],
    "CSE 130": ["CSE 12", "CSE 101"],
    "CSE 112": ["CSE 101"],
    "CSE 114A": ["CSE 101"],
    "STAT 131": ["AM 11B", "MATH 11B", "MATH 19B", "MATH 20B"],
    "CSE 107": ["CSE 16", "AM 30", "MATH 22", "MATH 23A"],
    "PHYS 6A": ["MATH 11A", "MATH 19A", "MATH 20A", "PHYS 6L"],
    "PHYS 6C": [
        "PHYS 5A",
        "PHYS 5L",
        "PHYS 6A",
        "PHYS 6L",
        "MATH 11B",
        "MATH 19B",
        "MATH 20B",
    ],
    "PHYS 6B": [
        "PHYS 5A",
        "PHYS 5L",
        "PHYS 6A",
        "PHYS 6L",
        "MATH 11B",
        "MATH 19B",
        "MATH 20B",
    ],
    "PHYS 5A": ["MATH 19A", "MATH 20A", "PHYS 5L"],
    "PHYS 5C": ["PHYS 5A", "PHYS 5L", "MATH 19B", "MATH 20B", "PHYS 5N"],
    "PHYS 5B": [
        "PHYS 5A",
        "PHYS 5L",
        "MATH 19A",
        "MATH 20A",
        "PHYS 5M",
        "MATH 19B",
        "MATH 20B",
    ],
    "CSE 115A": ["CSE 101", "CSE 130"],
    "CSE 185E": ["CSE 12", "CSE 30", "BME 160"],
    "AM 114": ["AM 20", "MATH 21", "MATH 24", "PHYS 116A"],
    "AM 147": ["AM 10", "MATH 21", "AM 20", "MATH 24"],
    "CMPM 120": [
        "CMPM 80K",
        "FILM 80V",
        "CSE 30",
        "CMPM 35",
        "ARTG 80G",
        "ARTG 80H",
        "ARTG 80I",
        "ARTG 120",
    ],
    "CMPM 131": [],
    "CMPM 146": ["CSE 101"],
    "CMPM 163": ["CMPM 120"],
    "CMPM 164": ["CSE 160", "CMPM 164L"],
    "CMPM 164L": ["CSE 160", "CMPM 164"],
    "CMPM 171": ["CMPM 170", "CMPM 176"],
    "CMPM 172": ["CMPM 171"],
    "CSE 195": [],
    "MATH 110": ["MATH 100", "CSE 101"],
    "MATH 115": ["MATH 21", "AM 10", "MATH 100", "CSE 101"],
    "MATH 116": ["MATH 100", "CSE 101"],
    "MATH 117": ["MATH 21", "AM 10", "MATH 100", "CSE 101"],
    "MATH 118": ["MATH 110", "MATH 111A"],
    "MATH 134": ["MATH 100", "CSE 101", "MATH 110"],
    "MATH 145": ["MATH 22", "MATH 23A", "MATH 21", "MATH 100", "CSE 101", "MATH 145L"],
    "MATH 145L": ["MATH 145"],
    "MATH 148": [
        "MATH 22",
        "MATH 23A",
        "MATH 21",
        "AM 10",
        "MATH 24",
        "AM 20",
        "MATH 105A",
        "MATH 152",
        "CSE 101",
        "MATH 148L",
    ],
    "MATH 160": ["MATH 100", "CSE 101"],
    "MATH 161": ["MATH 100"],
    "STAT 132": ["STAT 131", "CSE 107"],
    "CSE 110B": ["CSE 110A"],
    "CSE 115C": ["CSE 115B"],
    "CSE 115D": ["CSE 115A"],
    "CSE 121": [
        "CSE 12",
        "CSE 100",
        "CSE 100L",
        "CSE 13S",
        "ECE 13",
        "ECE 101",
        "ECE 101L",
        "PHYS 5C",
        "PHYS 5N",
    ],
    "CSE 134": ["CSE 120", "CSE 130"],
    "CSE 138": ["CSE 130"],
    "CSE 140": ["CSE 101"],
    "CSE 143": ["CSE 101", "CSE 107", "STAT 131", "CSE 30"],
    "CSE 144": ["CSE 101"],
    "CSE 145": [
        "CSE 30",
        "CSE 13S",
        "AM 30",
        "MATH 22",
        "MATH 23A",
        "STAT 5",
        "CSE 107",
        "STAT 131",
        "AM 10",
        "MATH 21",
        "CSE 16",
        "ECON 113",
    ],
    "CSE 156": ["CSE 150", "CSE 101", "CSE 156L"],
    "CSE 156L": ["CSE 150", "CSE 101", "CSE 156"],
    "CSE 157": ["CSE 121", "CSE 150"],
    "CSE 160": ["CSE 101", "MATH 21", "AM 10"],
    "CSE 161": ["CSE 160", "CSE 161L"],
    "CSE 161L": ["CSE 161"],
    "CSE 162": ["CSE 160", "CSE 162L"],
    "CSE 162L": ["CSE 162"],
    "CSE 163": ["CSE 101"],
    "CSE 168": [],
    "CSE 181": ["CSE 180"],
    "CSE 183": ["CMPM 35", "CSE 101"],
    "CSE 184": ["CSE 101"],
    "MATH 3": ["MATH 2", "MATH 3", "AM 11A", "MATH 11A", "MATH 19A", "MATH 20A"],
}
