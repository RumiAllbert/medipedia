import { MarkdownEditor } from "@/components/markdown-editor";

export default function NewArticlePage() {
  return (
    <div className="mt-6">
      <h1 className="text-3xl font-semibold tracking-tight">New Article</h1>
      <p className="mt-1 text-muted-foreground">
        Write your article in Markdown with live preview.
      </p>
      <div className="mt-6">
        <MarkdownEditor mode="create" />
      </div>
    </div>
  );
}
