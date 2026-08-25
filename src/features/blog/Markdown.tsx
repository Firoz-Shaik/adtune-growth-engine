import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSanitize]}
      components={{
        a: ({ node: _node, ...props }) => <a {...props} target="_blank" rel="noreferrer noopener" />,
        img: ({ node: _node, ...props }) => <img {...props} loading="lazy" className="rounded-xl" />,
      }}
    >
      {children}
    </ReactMarkdown>
  );
}

export function readTime(content: string) {
  return Math.max(1, Math.ceil(content.trim().split(/\s+/).filter(Boolean).length / 220));
}
