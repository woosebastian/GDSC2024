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
