import { ActionPanel, Action, List, showToast, Toast, Icon, useNavigation, Detail } from "@raycast/api";
import { useState, useEffect, useCallback } from "react";
import Parser, { Enclosure, Item } from "rss-parser";

export const websiteUrl = "https://www.gamekult.com";

interface NewsState {
  items: Item[];
  isLoading: boolean;
}

interface NewsDetailsProps {
  title: string;
  content: string;
  link: string;
  creator?: string;
  enclosure?: Enclosure;
}

export default function Command() {
  const [state, setState] = useState<NewsState>({ items: [], isLoading: true });

  // Create the function to parse news.
  const parseNews = useCallback(
    async function parseNews() {
      // Instanciate the parse.
      const parser = new Parser();

      try {
        const result = await parser.parseURL(`${websiteUrl}/feed.xml`);

        setState((oldState) => ({
          ...oldState,
          items: result.items,
          isLoading: false,
        }));
      } catch (error) {
        setState((oldState) => ({
          ...oldState,
          isLoading: false,
        }));

        showToast({ style: Toast.Style.Failure, title: "Could not parse news", message: String(error) });
      }
    },
    [setState]
  );

  useEffect(() => {
    parseNews();
  }, []);

  return (
    <List isLoading={state.isLoading} searchBarPlaceholder="Filter Gamekult news...">
      {state.items.map((item) => (
        <SearchListItem key={item.guid} item={item} />
      ))}
    </List>
  );
}

function SearchListItem({ item }: { item: Item }) {
  const { push } = useNavigation();

  const title = item.title?.trim() || "No Title...";
  const link = item.link || websiteUrl;

  // Format the date.
  const date = new Date(item.isoDate || "");
  const day = ("0" + date.getDate()).slice(-2);
  const month = ("0" + (date.getMonth() + 1)).slice(-2);
  const formattedDate = `${month}/${day}/${date.getUTCFullYear()}`;

  return (
    <List.Item
      title={title}
      accessoryTitle={formattedDate}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action
              title="Show Details"
              icon={Icon.Sidebar}
              onAction={() => push(<Details title={title} content={item.content || ""} link={link} {...item} />)}
            />
          </ActionPanel.Section>
          <ActionPanel.Section>
            <Action.OpenInBrowser title="Open in Browser" url={link} shortcut={{ modifiers: ["cmd"], key: "enter" }} />
            <Action.CopyToClipboard title="Copy Link" content={link} shortcut={{ modifiers: ["cmd"], key: "." }} />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}

function Details({ title, content, link, creator, enclosure }: NewsDetailsProps) {
  const markdown = `
# ${title}
${content}

${creator !== "" ? `Auteur : **${creator}**` : ""}

${enclosure ? `<img src="${enclosure.url}" />` : ""}
  `;

  return (
    <Detail
      navigationTitle={title}
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action.OpenInBrowser title="Open in Browser" url={link} />
          <Action.CopyToClipboard title="Copy Link" content={link} />
        </ActionPanel>
      }
    />
  );
}
