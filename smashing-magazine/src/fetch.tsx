import { showToast, ToastStyle } from "@raycast/api";
import Parser from "rss-parser";
import { Category } from "./categories";
import { Article } from "./article";

// Create an instance of the RSS Parser.
const parser = new Parser();

/**
 * Fetch the feed for the specified category.
 *
 * @param category Category to fetch.
 *
 * @returns Promise of articles
 */
export async function fetchArticles(category: Category): Promise<Article[]> {
  // Determine the url pathname.
  let pathname = "/feed/"

  if (category !== Category.All) {
      pathname = `/categories/${category}/index.xml`
  }

  try {
    const feed = await parser.parseURL(`https://www.smashingmagazine.com${pathname}`);
    const records: Article[] = [];

    for (const [index, item] of Object.entries(feed.items)) {
      records.push({
        id: (parseInt(index) + 1).toString(),
        title: item.title ?? "No Title",
        description: item.description,
        url: item.link ?? "https://www.smashingmagazine.com",
        date_published: item.pubDate ?? "No Date",
        author: item.author?.split("(", 2)[1].replace(")", "")
      });
    }

    return records;
  } catch (error) {
    console.error(error);
    showToast(ToastStyle.Failure, "Could not load articles");

    return Promise.resolve([]);
  }
}
