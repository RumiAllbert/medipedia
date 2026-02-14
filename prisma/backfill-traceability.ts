import "dotenv/config";

import { differenceInDays } from "date-fns";

import { prisma } from "../src/lib/prisma";

async function main() {
  const dryRun = process.env.DRY_RUN === "1";

  const articles = await prisma.article.findMany({
    select: {
      id: true,
      title: true,
      citations: {
        select: {
          id: true,
          url: true,
          publishedAt: true,
          freshnessDays: true,
        },
      },
      claims: {
        select: {
          id: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  let freshnessUpdates = 0;
  let claimBackfills = 0;

  for (const article of articles) {
    const staleFreshnessCitations = article.citations.filter(
      (citation) => citation.publishedAt && citation.freshnessDays == null,
    );

    if (!dryRun) {
      for (const citation of staleFreshnessCitations) {
        await prisma.citation.update({
          where: { id: citation.id },
          data: {
            freshnessDays: differenceInDays(new Date(), citation.publishedAt as Date),
          },
        });
      }
    }
    freshnessUpdates += staleFreshnessCitations.length;

    const needsClaimBackfill = article.claims.length === 0 && article.citations.length > 0;
    if (needsClaimBackfill) {
      if (!dryRun) {
        const firstCitation = article.citations[0];
        const claim = await prisma.articleClaim.create({
          data: {
            articleId: article.id,
            sectionHeading: "Overview",
            claimText: `${article.title} content requires claim-to-citation review backfill from legacy generation records.`,
            confidence: 60,
            orderIndex: 0,
          },
        });

        await prisma.claimCitation.create({
          data: {
            claimId: claim.id,
            citationId: firstCitation.id,
            supportType: "supports",
          },
        });
      }

      claimBackfills += 1;
    }
  }

  console.log(`Traceability backfill complete (${dryRun ? "dry-run" : "write"})`);
  console.log(`- Citations freshness updated: ${freshnessUpdates}`);
  console.log(`- Articles claim-backfilled: ${claimBackfills}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
