function extractDomain(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export type RecipeSearchResult = {
  title: string;
  url: string;
  sourceDomain: string;
};

function titleFromSlug(slug: string) {
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

async function fetchText(url: string) {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}`);
    }
    return await response.text();
  } catch {
    return await fetchTextViaHttps(url);
  }
}

function fetchTextViaHttps(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      new URL(url),
      {
        method: "GET",
        rejectUnauthorized: false,
      },
      (res) => {
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
            return;
          }
          reject(new Error(`Failed to fetch ${url}`));
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

function extractLocs(xml: string) {
  const matches = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g));
  return matches.map((match) => match[1]);
}

async function searchFromSitemaps(options: {
  query: string;
  limit: number;
  indexUrl: string;
  includeFilter: (loc: string) => boolean;
  maxSitemaps?: number;
}) {
  const normalizedQuery = options.query.trim().toLowerCase();
  if (!normalizedQuery) {
    return [];
  }

  const sitemapIndex = await fetchText(options.indexUrl);
  const sitemapUrls = extractLocs(sitemapIndex)
    .filter(options.includeFilter)
    .slice(0, options.maxSitemaps ?? 1);

  const results: RecipeSearchResult[] = [];
  for (const sitemapUrl of sitemapUrls) {
    if (results.length >= options.limit) {
      break;
    }
    const sitemapXml = await fetchText(sitemapUrl);
    const locs = extractLocs(sitemapXml);
    for (const loc of locs) {
      if (results.length >= options.limit) {
        break;
      }
      const url = loc.trim();
      const domain = extractDomain(url);
      if (!domain) {
        continue;
      }
      const slug = url.split("/").filter(Boolean).pop() ?? "";
      if (!slug) {
        continue;
      }
      const decodedSlug = decodeURIComponent(slug).toLowerCase();
      if (!decodedSlug.includes(normalizedQuery)) {
        continue;
      }
      results.push({
        url,
        sourceDomain: domain,
        title: titleFromSlug(slug),
      });
    }
  }

  return results;
}

export async function searchMadbanditten(query: string, limit = 20): Promise<RecipeSearchResult[]> {
  return await searchFromSitemaps({
    query,
    limit,
    indexUrl: "https://www.madbanditten.dk/sitemap_index.xml",
    includeFilter: (loc) => loc.includes("post-sitemap"),
    maxSitemaps: 1,
  });
}

export async function searchValdemarsro(query: string, limit = 20): Promise<RecipeSearchResult[]> {
  return await searchFromSitemaps({
    query,
    limit,
    indexUrl: "https://www.valdemarsro.dk/sitemap_index.xml",
    includeFilter: (loc) => loc.includes("post-sitemap"),
    maxSitemaps: 1,
  });
}

export async function searchArla(query: string, limit = 20): Promise<RecipeSearchResult[]> {
  return await searchFromSitemaps({
    query,
    limit,
    indexUrl: "https://www.arla.dk/sitemap.index.xml",
    includeFilter: (loc) => loc.includes("RecipeSitemapUrlWriter"),
    maxSitemaps: 1,
  });
}
import https from "https";
