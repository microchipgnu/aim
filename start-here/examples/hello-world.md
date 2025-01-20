```js {% #wikipedia_search %}

async function getWikipediaSearch(term: string) {
  const input = term.trim().replace(/^"+|"+$/g, '');
  console.log("Searching for the term", input);

  // Query Wikipedia for relevant pages
  const maxResults = 3;
  const searchTerm = encodeURIComponent(input.trim());
  const url = "https://en.wikipedia.org/w/api.php?format=json&action=query&list=search&srsearch=" + searchTerm + "&srlimit=" + maxResults + "&utf8=&origin=*";
  const response = await fetch(url);
  const data = await response.json();

  const fetchExtract = async (title) => {
    console.log("Retrieving", title);
    const extractUrl = "https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro&explaintext&titles=" + encodeURIComponent(title) + "&redirects=1&origin=*";
    const extractResponse = await fetch(extractUrl);
    const extractData = await extractResponse.json();
    const pageId = Object.keys(extractData.query.pages)[0];
    const extract = extractData.query.pages[pageId].extract;
    return [title, extract];
  }

  if (data.query.search.length > 0) {
    console.log("Got some results extracting top", data.query.search.length);
    const extracts = await Promise.all(data.query.search.map(result => fetchExtract(result.title)));
    return extracts.map(([title, extract]) => `${title} \n${extract}`).join("\n\n");
  } else {
    return "No results found.";
  }
}

export default await getWikipediaSearch("natural language programming");

```

{% $wikipedia_search.result %}

Summarise the results in a few sentences.

{% ai #aiSummary model="openai/gpt-4o" /%}

{% $aiSummary.result %}