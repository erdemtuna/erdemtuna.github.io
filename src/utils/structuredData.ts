interface ArticleMetadata {
  title: string;
  description?: string;
  url: string;
  image: string;
  author: string;
  profile?: string;
  siteAuthor: string;
  published?: Date;
  modified?: Date | null;
}

export function articleStructuredData(article: ArticleMetadata) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.description,
    url: article.url,
    mainEntityOfPage: { "@type": "WebPage", "@id": article.url },
    image: article.image,
    ...(article.published && {
      datePublished: article.published.toISOString(),
    }),
    ...((article.modified ?? article.published) && {
      dateModified: (article.modified ?? article.published)!.toISOString(),
    }),
    author: {
      "@type": "Person",
      name: article.author,
      ...(article.author === article.siteAuthor &&
        article.profile && { url: article.profile }),
    },
  };
}

export function jsonForHtml(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
