//     // 크롤링 로직 구현 예정
//     //1.스케쥴링된 스크래핑 로직을 Cron으로 주기적으로 실행됨 주기는 1일에 1번이되도록
//     //2.이전에 가져온 목록과 현재 스크래핑으로 HTML을 가져온 href를 비교하여 블로그글들을 비교함
//     //3.현재 추가되어있는 링크들을 바탕으로 블로그글의 HTML 을 Parse 이미지는 로컬에 저장(글을 아카이빙하기에는 MD와 HTML과 이미지파일을 로컬에 저장 혹은 S3에 저장)
//     //4.parse된 글을 md로 반환 후 번역 (정리 및 번역부분은 AI를 이용?)
//     //스케쥴링은 1분에 1개의 웹사이트를 방문함을 보장 -> 이 경우에는 60개의 웹사이트를 1시간에 처리 그러면 새벽 2시에 Cron을 돌리는것으로하자
//     //스크래핑 로직은 가장최근의 블로그글만 가져오면되기때문에 (하루에 2개이상 올라오지않는다는 기준으로) / 만약 하루에 2개이상올라온다면?  스크롤이나 첫BASE URL로접근한  HTML에
//     //최신의 모든 블로그글이 없다면? 적응형 스크래핑이 필요함
//     //

import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Crawler } from "./entities/crawlers.entity";
import { BlogPost } from "@/types/interfaces";
import NetflixBlogCrawler from "./domain/netflix/netflix-blog-crawler";
import { Cron } from "@nestjs/schedule";

@Injectable()
export class CrawlersService implements OnModuleInit {
  constructor(
    @InjectRepository(Crawler)
    private readonly crawlerRepository: Repository<Crawler>,
    private readonly netflixBlogCrawler: NetflixBlogCrawler
  ) {}

  async onModuleInit() {
    console.log("🚀 Application started - Executing initial crawl...");
    await this.netflixBlogCrawler.netflixCrawl();
  }

  @Cron("0 1 * * *") //1AM 스크래핑
  handleCron() {
    setTimeout(async () => {
      await this.netflixBlogCrawler.netflixCrawl();
    }, 1000);
  }

  async saveCrawlerData(blogPost: BlogPost): Promise<void> {
    const crawler = new Crawler();
    crawler.companyName = blogPost.companyName;
    crawler.baseBlogUrl = blogPost.baseBlogUrl;
    crawler.blogPostUrl = blogPost.blogPostUrl;
    crawler.title = blogPost.title;
    crawler.postPublishedAt = blogPost.postPublishedAt;
    crawler.crawledAt = blogPost.crawledAt;
    crawler.absolutePath = blogPost.absolutePath;
    crawler.relativePath = blogPost.relativePath;
    crawler.status = blogPost.status;
    crawler.description = blogPost.description;
    crawler.tags = blogPost.tags;
    crawler.retryCount = blogPost.retryCount;
    crawler.language = blogPost.language;

    await this.crawlerRepository.save(crawler);
    console.log(`블로그 데이터가 성공적으로 저장되었습니다: ${blogPost.title}`);
  }

  async getScrapedUrls(companyName): Promise<string[]> {
    const crawledData = await this.crawlerRepository.find({
      where: { companyName },
      select: ["blogPostUrl"],
    });
    return crawledData.map((data) => data.blogPostUrl);
  }
}
