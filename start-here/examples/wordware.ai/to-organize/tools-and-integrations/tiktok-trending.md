Scraper we used can be found here - [link](https://rapidapi.com/SocialScrapper/api/tiktok-scrapper-videos-music-challenges-downloader)

```js
const url = 'https://tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com/trending/US';
const options = {
	method: 'GET',
	headers: {
		'x-rapidapi-key': '46f98799b7mshd071ca36a5e5440p12322bjsnbea781639e7f',
		'x-rapidapi-host': 'tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com'
	}
};

try {
	const response = await fetch(url, options);
	const result = await response.text();
	console.log(result);
    return result;
} catch (error) {
	console.error(error);
}
```