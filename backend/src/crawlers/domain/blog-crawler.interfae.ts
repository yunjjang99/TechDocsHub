// src/crawlers/domain/blog-crawler.interface.ts
import { BlogPost } from "@/types/interfaces";

export interface BlogCrawler {
  crawl(): Promise<BlogPost[]>;
}
