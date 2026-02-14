import { ArticleStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { toSlug } from "@/lib/slug";

export const articleInclude = {
  metadata: true,
  citations: true,
  outgoingRelated: {
    orderBy: { score: "desc" as const },
  },
} satisfies Prisma.ArticleInclude;

export async function listPublishedArticles(query?: string) {
  return prisma.article.findMany({
    where: {
      status: ArticleStatus.PUBLISHED,
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { summary: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: articleInclude,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 30,
  });
}

export async function getArticleBySlug(slug: string) {
  return prisma.article.findUnique({
    where: { slug },
    include: articleInclude,
  });
}

export async function getVisibleArticleBySlug(input: {
  slug: string;
  includeDrafts: boolean;
  viewerId?: string;
}) {
  if (input.includeDrafts) {
    return prisma.article.findUnique({
      where: { slug: input.slug },
      include: articleInclude,
    });
  }

  return prisma.article.findFirst({
    where: {
      slug: input.slug,
      OR: [
        { status: ArticleStatus.PUBLISHED },
        ...(input.viewerId
          ? [
              {
                status: ArticleStatus.AI_DRAFT,
                createdById: input.viewerId,
              },
            ]
          : []),
      ],
    },
    include: articleInclude,
  });
}

export type SortOption = "newest" | "trust" | "alphabetical";

export async function listPublishedArticlesPaginated(options: {
  query?: string;
  tag?: string;
  sort?: SortOption;
  cursor?: string;
  limit?: number;
}) {
  const { query, tag, sort = "newest", cursor, limit = 12 } = options;

  const orderBy: Prisma.ArticleOrderByWithRelationInput[] =
    sort === "trust"
      ? [{ trustScore: "desc" }, { createdAt: "desc" }]
      : sort === "alphabetical"
        ? [{ title: "asc" }]
        : [{ publishedAt: "desc" }, { createdAt: "desc" }];

  const where: Prisma.ArticleWhereInput = {
    status: ArticleStatus.PUBLISHED,
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { summary: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(tag
      ? {
          metadata: {
            tags: { array_contains: [tag] },
          },
        }
      : {}),
  };

  const [articles, totalCount] = await Promise.all([
    prisma.article.findMany({
      where,
      include: { ...articleInclude },
      orderBy,
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    }),
    prisma.article.count({ where }),
  ]);

  const hasMore = articles.length > limit;
  const items = hasMore ? articles.slice(0, limit) : articles;
  const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

  return { items, totalCount, nextCursor, hasMore };
}

export async function createEditorialArticle(input: {
  title: string;
  summary: string;
  bodyMarkdown: string;
  createdBy: string;
  createdById?: string;
}) {
  const slug = toSlug(input.title);

  return prisma.article.create({
    data: {
      slug,
      title: input.title,
      summary: input.summary,
      bodyMarkdown: input.bodyMarkdown,
      status: ArticleStatus.DRAFT,
      createdBy: input.createdBy,
      createdById: input.createdById,
      trustScore: 0,
      revisions: {
        create: {
          version: 1,
          contentMarkdown: input.bodyMarkdown,
          status: ArticleStatus.DRAFT,
          createdBy: input.createdBy,
          notes: "Initial draft",
        },
      },
    },
  });
}
