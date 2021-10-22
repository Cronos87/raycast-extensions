import { ActionPanel, CopyToClipboardAction, List, OpenInBrowserAction } from "@raycast/api";
import { useState, useEffect } from "react";
import { fetchArticles } from "./fetch";
import { Article } from "./article";
import { Category } from "./categories";

export default function AllLatest() {
  const [state, setState] = useState<{ articles: Article[] }>({ articles: [] });

  useEffect(() => {
    async function fetch() {
      const articles = await fetchArticles(Category.All);
      setState(() => ({ articles }));
    }

    fetch();
  }, []);

  return (
    <List isLoading={state.articles.length === 0} searchBarPlaceholder="Filter articles...">
      {state.articles.map((article) => (
        <ArticleListItem key={article.id} article={article} />
      ))}
    </List>
  );
}

function ArticleListItem(props: { article: Article }) {
  const article = props.article;

  return (
    <List.Item
      id={article.id}
      key={article.id}
      title={article.title}
      subtitle={article.author}
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
