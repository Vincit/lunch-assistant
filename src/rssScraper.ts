import axios from 'axios';
import * as xml2js from 'xml2js';
import * as he from 'he';

const HTML_TAG_REGEX = /<\/?[^>]+(>|$)/g;
/**
 * Decodes HTML entities and removes unnecessary characters.
 * @param text - The text to be processed.
 * @returns - Processed text.
 */
function processText(text: string) {
    let processed = he.decode(text);
    processed = processed.replace(HTML_TAG_REGEX, "").trim();
    return processed;
}
/**
 * Extracts the date from the title string.
 * @param title - The title string.
 * @returns - Date string.
 */
function extractDateFromTitle(title: string) {
    const dateMatch = title.match(/\d{2}-\d{2}-\d{4}/);
    return dateMatch ? dateMatch[0] : '';
}
/**
 * Extracts individual dishes from a description string.
 * @param description - The description containing dishes.
 * @returns - Array of dishes.
 */
function extractDishes(description: string) {
    const dishComponents = description.split('<p>').slice(1);
    return dishComponents.map(dish => processText(dish.split('</p>')[0])).filter(dish => dish !== '');
}
/**
 * Extracts the weekday from a title string.
 *
 * Given a title in the format "Weekday, DD-MM-YYYY", this function will
 * return the "Weekday" portion of the string.
 *
 * @param title - The title string containing the weekday.
 * @returns - The extracted weekday.
 */
function extractWeekdayFromTitle(title: string) {
    return title.split(',')[0].trim();
}
/**
 * Scrapes and processes an RSS feed from a given URL.
 * @param url - The URL of the RSS feed.
 * @returns - A list of lunch items or null in case of an error.
 */
export const scrapeRssFeed = async(url: string) => {
    try {
        const response = await axios.get(url);
        const xml = response.data;
        const parser = new xml2js.Parser({ explicitArray: false });
        const result = await parser.parseStringPromise(xml);
        if (!result.rss || !result.rss.channel || !result.rss.channel.item) {
            throw new Error("Unexpected RSS format");
        }
        const items = Array.isArray(result.rss.channel.item) ? result.rss.channel.item : [result.rss.channel.item];
        const lunchList = [];
        for (const item of items) {
            const title = processText(item.title);
            const date = extractDateFromTitle(title);
            const weekday = extractWeekdayFromTitle(title); // New line for weekday extraction
            const dishes = extractDishes(item.description);
            const link = item.guid._;
            lunchList.push({
                title,
                date,
                weekday,
                dishes,
                link
            });
        }
        // Remove the last two days if more than 5 days available
        if (lunchList.length > 5) {
            lunchList.splice(lunchList.length - 2, 2);
        }
        console.log(lunchList);
        return lunchList;
    }
    catch (error: unknown) {
        console.error("Error fetching or parsing RSS feed:");
        console.error(error);
        return null;
    }
}
