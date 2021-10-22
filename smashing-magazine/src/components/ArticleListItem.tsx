import { ActionPanel, CopyToClipboardAction, List, OpenInBrowserAction } from "@raycast/api";
import { Article } from "../article";
import { Category } from "../categories";

export default function ArticleListItem(props: { article: Article, category: Category }) {
  const article = props.article;
  const icon = props.category === Category.All ? "icon-smashing-magazine.png" : `icon-${props.category}.png`;

  return (
    <List.Item
      id={article.id}
      key={article.id}
      title={article.title}
      subtitle={article.author}
      icon={icon}
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
