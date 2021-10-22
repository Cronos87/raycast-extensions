import { List, showToast, ToastStyle } from "@raycast/api";
import { useState, useEffect } from "react";
import Parser from "rss-parser";
import { Category } from "./categories";
import { Article } from "./article";
import ArticleListItem from "./components/ArticleListItem";

// Create an instance of the RSS Parser.
const parser = new Parser();

/**
 * Show the articles of the specified category.
 *
 * @param category
 *
 * @returns List of articles.
 */
export function showArticles(category: Category) {
  const [state, setState] = useState<{ articles: Article[] }>({ articles: [] });

  useEffect(() => {
    async function fetch() {
      const articles = await fetchArticles(category);
      setState(() => ({ articles }));
    }

    fetch();
  }, []);

  return (
    <List isLoading={state.articles.length === 0} searchBarPlaceholder="Filter articles...">
      {state.articles.map((article) => (
        <ArticleListItem key={article.id} article={article} category={category} />
      ))}
    </List>
  );
}

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
      pathname = `/category/${category}/index.xml`
  }

  try {
    const feed = await parser.parseURL(`https://www.smashingmagazine.com${pathname}`);
    const records: Article[] = [];

    for (const [index, item] of Object.entries(feed.items)) {
      // Find the author's name
      const author = item.author.includes("(") ? item.author?.split("(", 2)[1].replace(")", "") : item.author

      records.push({
        id: (parseInt(index) + 1).toString(),
        title: item.title ?? "No Title",
        description: item.description,
        url: item.link ?? "https://www.smashingmagazine.com",
        date_published: item.pubDate ?? "No Date",
        author
      });
    }

    return records;
  } catch (error) {
    console.error(error);
    showToast(ToastStyle.Failure, "Could not load articles");

    return Promise.resolve([]);
  }
}
