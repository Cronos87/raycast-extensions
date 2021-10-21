import { ActionPanel, CopyToClipboardAction, List, OpenInBrowserAction, showToast, ToastStyle } from "@raycast/api";
import { useState, useEffect } from "react";
import Parser from "rss-parser";

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = "0";

// Create an instance of the RSS Parser.
const parser = new Parser();

// Front page news type.
type FrontPageNews = {
  id: string;
  title: string;
  description: string;
  url: string;
  date_published: string;
};

export default function FrontPageNewsList() {
  const [state, setState] = useState<{ news: FrontPageNews[] }>({ news: [] });

  useEffect(() => {
    async function fetch() {
      const news = await fetchFrontPageNews();
      setState(() => ({ news }));
    }

    fetch();
  }, []);

  return (
    <List isLoading={state.news.length === 0} searchBarPlaceholder="Filter news...">
      {state.news.map((article) => (
        <FrontPageNewsListItem key={article.id} article={article} />
      ))}
    </List>
  );
}

function FrontPageNewsListItem(props: { article: FrontPageNews }) {
  const article = props.article;

  return (
    <List.Item
      id={article.id}
      key={article.id}
      title={article.title}
      icon="list-icon.png"
      accessoryTitle={new Date(article.date_published).toLocaleDateString()}
      actions={
        <ActionPanel>
          <OpenInBrowserAction url={article.url} />
          <CopyToClipboardAction title="Copy URL" content={article.url} />
        </ActionPanel>
      }
    />
  );
}

async function fetchFrontPageNews(): Promise<FrontPageNews[]> {
  try {
    const feed = await parser.parseURL("https://www.gamekyo.com/news.xml");
    const records: FrontPageNews[] = [];

    for (const [index, item] of Object.entries(feed.items)) {
      records.push({
        id: (parseInt(index) + 1).toString(),
        title: item.title ?? "No Title",
        description: item.description,
        url: item.link ?? "https://www.gamekyo.com",
        date_published: item.pubDate ?? "No Date"
      });
    }

    return records;
  } catch (error) {
    console.error(error);
    showToast(ToastStyle.Failure, "Could not load front page news");

    return Promise.resolve([]);
  }
}
