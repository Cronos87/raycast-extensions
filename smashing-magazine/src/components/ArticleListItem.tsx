import { ActionPanel, CopyToClipboardAction, List, OpenInBrowserAction } from "@raycast/api";
import { Article } from "../article";

export default function ArticleListItem(props: { article: Article }) {
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
