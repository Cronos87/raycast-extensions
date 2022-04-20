import { ActionPanel, Action, List, showToast, Toast, useNavigation } from "@raycast/api";
import { useState, useEffect, useRef, useCallback } from "react";
import fetch, { AbortError } from "node-fetch";
import { parse } from "node-html-parser";

interface SearchState {
  sentences: Sentence[];
  isLoading: boolean;
}

interface SearchListItemProps {
  sentence: Sentence;
  showDetails?: boolean;
}

interface DropdownDetailsProps {
  languages: string[];
  onChange: (value: string) => void;
}

interface Sentence {
  id: number;
  text: string;
  username: string;
  lang: string;
  langName: string;
  langTag: string;
  directSentences?: Sentence[];
  indirectSentences?: Sentence[];
}

export default function Command() {
  const { state, search } = useSearch();

  return (
    <List
      isLoading={state.isLoading}
      onSearchTextChange={search}
      searchBarPlaceholder="Search a word or a sentence..."
      throttle
    >
      <List.Section title="Results" subtitle={state.sentences.length.toString()}>
        {state.sentences.map((sentence) => (
          <SearchListItem key={sentence.id} sentence={sentence} />
        ))}
      </List.Section>
    </List>
  );
}

/**
 * Component to display after a search.
 *
 * @param {Sentence} sentence
 *
 * @returns {JSX.Element}
 */
function SearchListItem({ sentence, showDetails = true }: SearchListItemProps): JSX.Element {
  const { push } = useNavigation();

  return (
    <List.Item
      title={sentence.text}
      icon={{ value: `https://tatoeba.org/img/flags/${sentence.lang}.svg`, tooltip: sentence.langName }}
      accessoryTitle={sentence.username}
      actions={
        <ActionPanel>
          {showDetails && (
            <ActionPanel.Section>
              <Action title="Details" onAction={() => push(<Details sentence={sentence} />)} />
            </ActionPanel.Section>
          )}
          <ActionPanel.Section>
            <Action.OpenInBrowser title="Open in Browser" url={`https://tatoeba.org/sentences/show/${sentence.id}`} />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}

function Details({ sentence }: { sentence: Sentence }) {
  const [directSentences, setDirectSentences] = useState<Sentence[] | undefined>(sentence.directSentences);
  const [indirectSentences, setIndirectSentences] = useState<Sentence[] | undefined>(sentence.indirectSentences);

  // Find all languages to populate the filter dropdown.
  const languages: string[] = [];

  if (sentence.directSentences) {
    for (const directSentence of sentence.directSentences) {
      if (!languages.includes(directSentence.langName)) {
        languages.push(directSentence.langName);
      }
    }
  }

  if (sentence.indirectSentences) {
    for (const directSentence of sentence.indirectSentences) {
      if (!languages.includes(directSentence.langName)) {
        languages.push(directSentence.langName);
      }
    }
  }

  languages.sort();

  const onFilterChange = useCallback((value: string) => {
    let { directSentences, indirectSentences } = sentence;

    if (value !== "") {
      directSentences = sentence.directSentences?.filter((sentence: Sentence) => sentence.langName === value);
      indirectSentences = sentence.indirectSentences?.filter((sentence: Sentence) => sentence.langName === value);
    }

    setDirectSentences(directSentences);
    setIndirectSentences(indirectSentences);
  }, []);

  return (
    <List
      navigationTitle={sentence.text}
      searchBarAccessory={<DropdownDetails languages={languages} onChange={onFilterChange} />}
    >
      <SearchListItem key={sentence.id} sentence={sentence} showDetails={false} />
      {!!directSentences?.length && (
        <List.Section title="Translations" subtitle={directSentences.length.toString()}>
          {directSentences.map((sentence) => (
            <SearchListItem key={sentence.id} sentence={sentence} showDetails={false} />
          ))}
        </List.Section>
      )}
      {!!indirectSentences?.length && (
        <List.Section title="Translations of translations" subtitle={indirectSentences.length.toString()}>
          {indirectSentences.map((sentence) => (
            <SearchListItem key={sentence.id} sentence={sentence} showDetails={false} />
          ))}
        </List.Section>
      )}
    </List>
  );
}

function DropdownDetails({ languages, onChange }: DropdownDetailsProps) {
  return (
    <List.Dropdown tooltip="Select Language" onChange={onChange}>
      <List.Dropdown.Item title="All" value="" />
      {languages.map((language) => (
        <List.Dropdown.Item key={language} title={language} value={language} />
      ))}
    </List.Dropdown>
  );
}

function useSearch() {
  const [state, setState] = useState<SearchState>({ sentences: [], isLoading: true });
  const cancelRef = useRef<AbortController | null>(null);

  const search = useCallback(
    async function search(searchText: string) {
      const search = searchText.trim();

      cancelRef.current?.abort();

      if (search === "") {
        setState({
          sentences: [],
          isLoading: false,
        });

        return;
      }

      cancelRef.current = new AbortController();

      setState((oldState) => ({
        ...oldState,
        isLoading: true,
      }));

      try {
        const sentences = await performSearch(searchText, cancelRef.current.signal);

        setState({
          sentences,
          isLoading: false,
        });
      } catch (error) {
        setState((oldState) => ({
          ...oldState,
          isLoading: false,
        }));

        if (error instanceof AbortError) {
          return;
        }

        console.error("search error", error);
        showToast({ style: Toast.Style.Failure, title: "Could not perform search", message: String(error) });
      }
    },
    [cancelRef, setState]
  );

  useEffect(() => {
    search("");

    return () => {
      cancelRef.current?.abort();
    };
  }, []);

  return {
    state: state,
    search: search,
  };
}

/**
 * Perform a search on the Tatoeba page.
 *
 * @param search Content to search.
 * @param signal Signal used by the fetch method.
 *
 * @returns A list of sentences.
 */
async function performSearch(search: string, signal: AbortSignal): Promise<Sentence[]> {
  const response = await fetch(`https://tatoeba.org/en/sentences/search?query=${search.replaceAll(" ", "+")}`, {
    signal,
  });

  const document = parse(await response.text());
  const sentencesDetails = document.querySelectorAll(".sentence-and-translations");

  const sentences: Sentence[] = [];

  for (const sentence of sentencesDetails) {
    let content = sentence.getAttribute("ng-init") || "";

    content = content.replace("vm.init([],", "");
    content = content.replace(", '')", "");
    content = `[${content}]`;

    const data = JSON.parse(content)[0];

    const directSentences: Sentence[] = data.translations[0].map((translation: any) => ({
      id: translation.id,
      text: translation.text,
      username: translation.user?.username,
      lang: translation.lang,
      langName: translation.lang_name,
      langTag: translation.lang_tag,
    }));

    const indirectSentences: Sentence[] = data.translations[1].map((translation: any) => ({
      id: translation.id,
      text: translation.text,
      username: translation.user?.username,
      lang: translation.lang,
      langName: translation.lang_name,
      langTag: translation.lang_tag,
    }));

    sentences.push({
      id: data.id,
      text: data.text,
      username: data.user?.username,
      lang: data.lang,
      langName: data.lang_name,
      langTag: data.lang_tag,
      directSentences,
      indirectSentences,
    });
  }

  return sentences;
}
