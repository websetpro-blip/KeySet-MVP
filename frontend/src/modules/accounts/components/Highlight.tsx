import type { ReactNode } from "react";
import { splitBySearchTerm } from "../utils";

interface HighlightProps {
  text: string;
  term: string;
}

export function Highlight({ text, term }: HighlightProps): ReactNode {
  const chunks = splitBySearchTerm(text, term);

  if (chunks.length === 1) {
    return text;
  }

  return chunks.map((chunk, index) => {
    const isMatch =
      term.trim().length > 0 &&
      chunk.toLowerCase() === term.trim().toLowerCase();

    if (isMatch) {
      return (
        <mark key={`${chunk}-${index}`} className="search-highlight">
          {chunk}
        </mark>
      );
    }

    return <span key={`${chunk}-${index}`}>{chunk}</span>;
  });
}
