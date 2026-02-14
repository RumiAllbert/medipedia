"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bold,
  Italic,
  Heading2,
  Link2,
  List,
  Code,
  Save,
  Eye,
  Edit,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

type Citation = {
  title: string;
  url: string;
};

type EditorProps = {
  initialTitle?: string;
  initialSummary?: string;
  initialBody?: string;
  initialCitations?: Citation[];
  slug?: string;
  mode: "create" | "edit";
};

export function MarkdownEditor({
  initialTitle = "",
  initialSummary = "",
  initialBody = "",
  initialCitations = [],
  slug,
  mode,
}: EditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [summary, setSummary] = useState(initialSummary);
  const [body, setBody] = useState(initialBody);
  const [citations, setCitations] = useState<Citation[]>(initialCitations);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const insertText = useCallback((prefix: string, suffix = "") => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = body.slice(start, end);
    const newText = `${body.slice(0, start)}${prefix}${selected}${suffix}${body.slice(end)}`;
    setBody(newText);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    });
  }, [body]);

  const toolbar = [
    { icon: Bold, label: "Bold", action: () => insertText("**", "**") },
    { icon: Italic, label: "Italic", action: () => insertText("*", "*") },
    { icon: Heading2, label: "Heading", action: () => insertText("## ") },
    { icon: Link2, label: "Link", action: () => insertText("[", "](url)") },
    { icon: List, label: "List", action: () => insertText("- ") },
    { icon: Code, label: "Code", action: () => insertText("`", "`") },
  ];

  const autoSave = useCallback(
    (newBody: string) => {
      if (mode !== "edit" || !slug) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        try {
          await fetch(`/api/articles/${slug}`, {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ title, summary, bodyMarkdown: newBody }),
          });
        } catch {
          // auto-save failed silently
        }
      }, 3000);
    },
    [mode, slug, title, summary]
  );

  const handleBodyChange = useCallback(
    (value: string) => {
      setBody(value);
      autoSave(value);
    },
    [autoSave]
  );

  const handleSave = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Title and body are required");
      return;
    }
    setIsSaving(true);
    try {
      const url = mode === "create" ? "/api/articles" : `/api/articles/${slug}`;
      const method = mode === "create" ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title,
          summary,
          bodyMarkdown: body,
          citations,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        const msg =
          typeof err.error === "string"
            ? err.error
            : "Validation failed. Title (8+ chars), summary (20+ chars), and body (120+ chars) are required.";
        toast.error(msg);
        return;
      }
      const data = await res.json();
      toast.success(mode === "create" ? "Article created" : "Article saved");
      if (mode === "create" && data.data?.slug) {
        router.push(`/dashboard/editor/${data.data.slug}`);
      }
    } catch {
      toast.error("Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const addCitation = () => {
    setCitations([...citations, { title: "", url: "" }]);
  };

  const updateCitation = (index: number, field: keyof Citation, value: string) => {
    const updated = [...citations];
    updated[index] = { ...updated[index], [field]: value };
    setCitations(updated);
  };

  const removeCitation = (index: number) => {
    setCitations(citations.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Title & Summary */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Article title"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="summary">Summary</Label>
          <Textarea
            id="summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Brief summary of the article"
            className="mt-1.5"
            rows={2}
          />
        </div>
      </div>

      <Separator />

      {/* Editor with toolbar */}
      <div>
        <div className="flex flex-wrap items-center gap-1 rounded-t-lg border bg-muted/50 p-2">
          {toolbar.map((item) => (
            <Button
              key={item.label}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={item.action}
              title={item.label}
              type="button"
            >
              <item.icon className="h-4 w-4" />
            </Button>
          ))}
        </div>

        <Tabs defaultValue="edit" className="mt-0">
          <TabsList className="rounded-none border-x bg-transparent">
            <TabsTrigger value="edit" className="gap-2">
              <Edit className="h-3.5 w-3.5" />
              Edit
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="h-3.5 w-3.5" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="mt-0">
            <Textarea
              ref={textareaRef}
              value={body}
              onChange={(e) => handleBodyChange(e.target.value)}
              placeholder="Write your article in Markdown..."
              className="min-h-[400px] rounded-t-none border-t-0 font-mono text-sm"
            />
          </TabsContent>

          <TabsContent value="preview" className="mt-0">
            <div className="min-h-[400px] rounded-b-lg border border-t-0 p-6">
              {body ? (
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h2: ({ children }) => (
                      <h2 className="mt-6 text-2xl font-semibold tracking-tight">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="mt-4 text-xl font-semibold">{children}</h3>
                    ),
                    p: ({ children }) => (
                      <p className="mt-3 leading-7 text-muted-foreground">{children}</p>
                    ),
                    li: ({ children }) => (
                      <li className="ml-5 list-disc text-muted-foreground">{children}</li>
                    ),
                  }}
                >
                  {body}
                </Markdown>
              ) : (
                <p className="text-sm text-muted-foreground">Nothing to preview yet.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Separator />

      {/* Citations */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Citations</CardTitle>
            <Button variant="outline" size="sm" onClick={addCitation} type="button">
              <Plus className="mr-2 h-3.5 w-3.5" />
              Add citation
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {citations.length === 0 && (
            <p className="text-sm text-muted-foreground">No citations added yet.</p>
          )}
          {citations.map((citation, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="flex-1 space-y-2">
                <Input
                  placeholder="Citation title"
                  value={citation.title}
                  onChange={(e) => updateCitation(i, "title", e.target.value)}
                />
                <Input
                  placeholder="https://..."
                  value={citation.url}
                  onChange={(e) => updateCitation(i, "url", e.target.value)}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeCitation(i)}
                type="button"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Save draft"}
        </Button>
      </div>
    </div>
  );
}
