export interface BlogPost {
  companyName: string;
  baseBlogUrl: string;
  blogPostUrl: string;
  title: string;
  postPublishedAt: Date;
  crawledAt: Date;
  absolutePath: string;
  relativePath: string;
  status: string;
  description: string;
  tags: string[];
  retryCount: number;
  language: string;
}
