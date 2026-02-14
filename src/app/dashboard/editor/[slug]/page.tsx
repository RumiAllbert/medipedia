import { notFound } from "next/navigation";
import { Role } from "@prisma/client";

import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/auth/roles";
import { getArticleBySlug } from "@/lib/services/articles";
import { MarkdownEditor } from "@/components/markdown-editor";

type EditArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export default async function EditArticlePage({ params }: EditArticlePageProps) {
  const { slug } = await params;
  const session = await auth();
  const user = session?.user;

  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const isAuthor = article.createdById === user?.id;
  const isAdmin = hasRole(user?.role, Role.ADMIN);
  if (!isAuthor && !isAdmin) notFound();

  return (
    <div className="mt-6">
      <h1 className="text-3xl font-semibold tracking-tight">Edit Article</h1>
      <p className="mt-1 text-muted-foreground">
        Editing &ldquo;{article.title}&rdquo;
      </p>
      <div className="mt-6">
        <MarkdownEditor
          mode="edit"
          slug={article.slug}
          initialTitle={article.title}
          initialSummary={article.summary}
          initialBody={article.bodyMarkdown}
          initialCitations={article.citations.map((c) => ({
            title: c.title,
            url: c.url,
          }))}
        />
      </div>
    </div>
  );
}
