// Strip common markdown / special-char formatting that the app cannot render.
// The AI is instructed not to use markdown, but this is a safety net.
export function stripMarkdown(text: string): string {
  return (text || "")
    .replace(/\*\*(.*?)\*\*/g, "$1") // **bold**
    .replace(/\*(.*?)\*/g, "$1") // *italic*
    .replace(/^#{1,6}\s+/gm, "") // # headings
    .replace(/^[-*+]\s+/gm, "") // bullet points at line start
    .replace(/^>\s?/gm, "") // blockquotes
    .replace(/`([^`]*)`/g, "$1") // inline code
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1") // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links
    .replace(/[`*_#>~]/g, "$1") // stray markdown chars
    .replace(/\s+/g, " ")
    .trim();
}

// Like stripMarkdown but preserves paragraph breaks (for multi-line prose).
export function stripMarkdownMultiline(text: string): string {
  return (text || "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[`*_#>~]/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}
