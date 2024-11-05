// import { Injectable } from "@nestjs/common";
// import { InjectRepository } from "@nestjs/typeorm";
// import { Repository } from "typeorm";
// import { Crawler } from "./entities/crawlers.entity";

// @Injectable()
// export class CrawlersService {
//   constructor(
//     @InjectRepository(Crawler)
//     private readonly crawlerRepository: Repository<Crawler>
//   ) {}

//   // 크롤링 실행
//   async executeCrawling() {
//     // 크롤링 로직 구현 예정
//     //1.스케쥴링된 스크래핑 로직을 Cron으로 주기적으로 실행됨 주기는 1일에 1번이되도록
//     //2.이전에 가져온 목록과 현재 스크래핑으로 HTML을 가져온 href를 비교하여 블로그글들을 비교함
//     //3.현재 추가되어있는 링크들을 바탕으로 블로그글의 HTML 을 Parse 이미지는 로컬에 저장(글을 아카이빙하기에는 MD와 HTML과 이미지파일을 로컬에 저장 혹은 S3에 저장)
//     //4.parse된 글을 md로 반환 후 번역 (정리 및 번역부분은 AI를 이용?)
//     //스케쥴링은 1분에 1개의 웹사이트를 방문함을 보장 -> 이 경우에는 60개의 웹사이트를 1시간에 처리 그러면 새벽 2시에 Cron을 돌리는것으로하자
//     //스크래핑 로직은 가장최근의 블로그글만 가져오면되기때문에 (하루에 2개이상 올라오지않는다는 기준으로) / 만약 하루에 2개이상올라온다면?  스크롤이나 첫BASE URL로접근한  HTML에
//     //최신의 모든 블로그글이 없다면? 적응형 스크래핑이 필요함
//     //

//   }

//   // 크롤링 결과 저장
//   async saveCrawlingResult() {
//     // 크롤링 결과 저장 로직 구현 예정
//   }

//   // 크롤링 이력 조회
//   async getCrawlingHistory() {
//     // 크롤링 이력 조회 로직 구현 예정
//   }

//   async saveCrawlerData(links: string[]): Promise<void> {
//     const crawledAt = new Date(); // 현재 시점의 크롤링 시간
//     const baseBlogUrl = "https://netflixtechblog.com"; // Netflix 기술 블로그의 기본 URL

//     //링크에 대한 글을 parse 해서 md로 저장 , 이미지추출후 images 에 저장하는 로직이 필요함
//     // 각 링크를 Crawler 엔티티로 저장
//     const crawlerEntries = links.map((link) => {
//       const crawler = new Crawler();
//       crawler.companyName = "Netflix";
//       crawler.baseBlogUrl = baseBlogUrl;
//       crawler.blogPostUrl = link;
//       crawler.title = this.extractTitleFromUrl(link); // URL에서 제목 추출
//       crawler.postPublishedAt = new Date(); // 임의로 현재 날짜로 설정, 실제 포스트 작성 날짜를 알고 있다면 수정 필요
//       crawler.crawledAt = crawledAt;
//       crawler.absolutePath = `/mnt/netflix/origin/${this.extractFilenameFromUrl(link)}`; // 절대 경로 설정
//       crawler.relativePath = this.extractFilenameFromUrl(link); // 상대 경로 설정
//       crawler.status = "active";
//       crawler.description = "Netflix 기술 블로그 포스트"; // 포스트에 대한 간단한 설명
//       crawler.tags = ["technology", "blog"]; // 기본 태그 설정, 추가적으로 추출 가능
//       crawler.retryCount = 0;
//       crawler.language = "en"; // 영어로 설정, 필요에 따라 동적으로 설정 가능

//       return crawler;
//     });

//     // 저장
//     await this.crawlerRepository.save(crawlerEntries);
//     console.log("링크 데이터가 성공적으로 저장되었습니다.");
//   }

//   // URL에서 파일명을 추출하는 유틸리티 함수 (예: faa017b4653d.html)
//   private extractFilenameFromUrl(url: string): string {
//     return url.split("/").pop() || "";
//   }

//   // URL에서 제목을 추출하는 유틸리티 함수
//   private extractTitleFromUrl(url: string): string {
//     const parts = url.split("/");
//     return parts[parts.length - 1].replace(/-/g, " "); // URL에서 제목 부분을 추출하고 '-'를 공백으로 대체
//   }
// }

// import { Injectable } from "@nestjs/common";
// import { InjectRepository } from "@nestjs/typeorm";
// import { Repository } from "typeorm";
// import { Crawler } from "./entities/crawlers.entity";
// import { BlogPost } from "./../types/interfaces";

// @Injectable()
// export class CrawlersService {
//   constructor(
//     @InjectRepository(Crawler)
//     private readonly crawlerRepository: Repository<Crawler>
//   ) {}

//   // 블로그 포스트 하나를 받아서 DB에 저장하는 함수
//   async saveCrawlerData(blogPost: BlogPost): Promise<void> {
//     const crawler = new Crawler();
//     crawler.companyName = blogPost.companyName;
//     crawler.baseBlogUrl = blogPost.baseBlogUrl;
//     crawler.blogPostUrl = blogPost.blogPostUrl;
//     crawler.title = blogPost.title;
//     crawler.postPublishedAt = blogPost.postPublishedAt;
//     crawler.crawledAt = blogPost.crawledAt;
//     crawler.absolutePath = blogPost.absolutePath;
//     crawler.relativePath = blogPost.relativePath;
//     crawler.status = blogPost.status;
//     crawler.description = blogPost.description;
//     crawler.tags = blogPost.tags;
//     crawler.retryCount = blogPost.retryCount;
//     crawler.language = blogPost.language;

//     await this.crawlerRepository.save(crawler);
//     console.log(`블로그 데이터가 성공적으로 저장되었습니다: ${blogPost.title}`);
//   }
// }

import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Crawler } from "./entities/crawlers.entity";
import { BlogPost } from "@/types/interfaces";
import NetflixBlogCrawler from "./domain/netflix/netflix-blog-crawler";

@Injectable()
export class CrawlersService {
  private netflixBlogCrawler: NetflixBlogCrawler;

  constructor(
    @InjectRepository(Crawler)
    private readonly crawlerRepository: Repository<Crawler>
  ) {
    this.netflixBlogCrawler = new NetflixBlogCrawler();
  }

  async executeCrawling() {
    // const blogPosts = await this.netflixBlogCrawler.();
    // const savePromises = blogPosts.map((post) => this.saveCrawlerData(post));
    // await Promise.all(savePromises);
    // console.log("모든 블로그 데이터가 병렬적으로 저장되었습니다.");
  }

  async saveCrawlerData(blogPost: BlogPost): Promise<void> {
    // 크롤링 데이터를 DB에 저장하는 로직
  }
}
