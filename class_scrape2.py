import requests
from bs4 import BeautifulSoup
import time
import class_scrape as cs

response_sub = requests.get(cs.correct_href)
soup_sub = BeautifulSoup(response_sub.text, "html.parser")
time.sleep(30)

# Print the entire HTML content of soup_sub
print(soup_sub.prettify())

# Find the <div> tag with class "extraFields"
extra_fields_div = soup_sub.find("div", class_="extraFields")
# If extra_fields_div is not None, extract <a> tags within it
if extra_fields_div:
    a_tags_sub = extra_fields_div.find_all("a", class_="sc-courselink")

    # Print the text content of each <a> tag within the "extraFields" div
    for a_tag_sub in a_tags_sub:
        print("Sub-course name:", a_tag_sub.text.strip())
else:
    print("No prerequisite information found")
