import urllib.request
import json
url = "https://api.pdok.nl/cbs/wijken-en-buurten-2023/ogc/v1/collections/buurten/items?limit=1"
response = urllib.request.urlopen(url)
data = json.loads(response.read())
print(json.dumps(data["features"][0]["properties"], indent=2))
