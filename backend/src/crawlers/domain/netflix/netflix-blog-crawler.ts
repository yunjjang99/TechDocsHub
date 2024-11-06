import axios from "axios";
import * as cheerio from "cheerio";
import TurndownService = require("turndown");
import * as fs from "fs-extra";
import * as path from "path";
import puppeteer from "puppeteer";
import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { CrawlersService } from "@/crawlers/crawlers.service";
import { BlogPost } from "@/types/interfaces"; // BlogPost 타입을 임포트

interface CrawlerConfig {
  baseUrl: string;
  outputPostsDir: string;
}

@Injectable()
class NetflixBlogCrawler {
  constructor(
    @Inject(forwardRef(() => CrawlersService))
    private readonly crawlersService: CrawlersService
  ) {}

  private readonly config: CrawlerConfig = {
    baseUrl: "https://netflixtechblog.com",
    outputPostsDir: path.join(__dirname, "../../../../../mnt/netflix/posts"),
  };

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public async netflixCrawl(): Promise<void> {
    const browser = await this.initializeBrowser();

    try {
      const scrapedUrls = await this.crawlersService.getScrapedUrls("Netflix");
      const links = await this.loadParsedLinkList();
      console.log(links);
      for (const link of links) {
        if (scrapedUrls.includes(link)) {
          console.log(`⏩ 이미 스크래핑한 링크 건너뛰기: ${link}`);
          continue;
        }

        // HTML 파일 저장
        const savedHtmlPath = await this.saveNetflixBlogHtml(link);

        // 저장된 HTML 경로가 유효하지 않은 경우 패스
        if (!savedHtmlPath) {
          console.log(
            `⚠️ 유효하지 않은 링크로 인해 크롤링을 건너뜁니다: ${link}`
          );
          continue;
        }

        // BlogPost 형식으로 데이터 구성
        const blogPost: BlogPost = {
          companyName: "Netflix",
          baseBlogUrl: this.config.baseUrl,
          blogPostUrl: link,
          title: this.extractTitleFromUrl(link), // 제목 추출
          postPublishedAt: new Date(), // 실제 발행 날짜로 수정 필요
          crawledAt: new Date(), // 현재 크롤링 시간
          absolutePath: savedHtmlPath, // HTML 파일의 절대 경로
          relativePath: path.relative(
            this.config.outputPostsDir,
            savedHtmlPath
          ), // 상대 경로
          status: "active",
          description: "Netflix 기술 블로그 포스트",
          tags: ["technology", "blog"],
          retryCount: 0,
          language: "en",
        };

        // CrawlersService의 saveCrawlerData 메서드를 통해 저장
        await this.crawlersService.saveCrawlerData(blogPost);
        console.log(`✅ ${blogPost.title} 데이터가 성공적으로 저장되었습니다.`);

        await this.sleep(2000);
      }
    } catch (error) {
      console.error("❌ 크롤링 실패:", error);
      throw error;
    } finally {
      await browser.close();
    }
  }

  private async initializeBrowser() {
    return puppeteer.launch({
      headless: true,
      executablePath: process.env.CHROME_PATH || "/usr/bin/chromium",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--window-size=1920,1080",
      ],
      defaultViewport: { width: 1920, height: 1080 },
    });
  }

  private extractLinks(html: string): string[] {
    try {
      const $ = cheerio.load(html);
      const links: string[] = [];

      $("a").each((_, element) => {
        const href = $(element).attr("href");
        if (href && !href.startsWith("#") && !href.startsWith("javascript:")) {
          const fullUrl = href.startsWith("http")
            ? href
            : new URL(href, this.config.baseUrl).toString();
          links.push(fullUrl);
        }
      });

      return [...new Set(links)];
    } catch (error) {
      console.error("링크 추출 중 오류 발생:", error);
      return [];
    }
  }

  private async saveNetflixBlogHtml(url: string): Promise<string | null> {
    const browser = await this.initializeBrowser();

    try {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: "networkidle0", timeout: 40000 });

      const cleanedHtml = await page.evaluate(() => {
        const startElement = document.querySelector(
          '[data-testid="storyTitle"]'
        );
        const articleElement = startElement?.closest("article");

        if (articleElement) {
          articleElement.querySelectorAll("*").forEach((element) => {
            element.removeAttribute("class");
          });
          return articleElement.outerHTML;
        }
        return null;
      });

      if (!cleanedHtml) {
        console.log(`⚠️ 컨텐츠를 찾을 수 없음: ${url}`);
        return null;
      }

      // 이미지 저장 경로 설정
      const postName = url.split("/").pop() || "index";
      const postDir = path.join(this.config.outputPostsDir, postName);
      const imagesDir = path.join(postDir, "images");
      await fs.ensureDir(imagesDir);

      // 이미지 다운로드
      const images = await page.evaluate(() => {
        const pictureTags = Array.from(document.querySelectorAll("picture"));
        const imageUrls: string[] = [];

        pictureTags.forEach((picture) => {
          const sources = Array.from(picture.querySelectorAll("source"));
          sources.forEach((source) => {
            const srcSet = source.getAttribute("srcset");
            if (srcSet) {
              const urls = srcSet
                .split(",")
                .map((url) => url.trim().split(" ")[0]);
              urls.forEach((url) => imageUrls.push(url));
            }
          });
        });

        return imageUrls;
      });

      for (const src of images) {
        try {
          const response = await axios.get(src, {
            responseType: "arraybuffer",
          });

          // URL에서 확장자 추출
          let imageExtension = path.extname(src);
          if (!imageExtension) {
            imageExtension = ".jpg"; // 기본 확장자 설정
          }

          // URL을 파일 이름으로 사용하면서 파일 시스템에 맞게 특수 문자를 대체
          const sanitizedImageName =
            src.replace(/[:/\\*?"<>|]/g, "_").replace(/\.\w+$/, "") + // 기존 확장자를 제거
            imageExtension; // 확장자를 추가
          const imagePath = path.join(imagesDir, sanitizedImageName);

          await fs.writeFile(imagePath, response.data);
          console.log(`✅ 이미지 저장 완료: ${imagePath}`);
        } catch (error) {
          console.error(`❌ 이미지 다운로드 실패: ${src}`, error);
        }
      }

      // HTML 파일 저장
      const filePath = path.join(postDir, "index.html");
      await fs.writeFile(filePath, cleanedHtml, "utf-8");
      console.log(`✅ HTML 저장 완료: ${filePath}`);
      return filePath;
    } catch (error) {
      console.error(`❌ HTML 저장 실패 (${url}):`, error);
      return null;
    } finally {
      await browser.close();
    }
  }

  private async loadParsedLinkList(): Promise<string[]> {
    try {
      const originDir = path.join(
        __dirname,
        "../../../../../mnt/netflix/origin"
      );

      const files = await fs.readdir(originDir);
      const datePattern = /^\d{4}-\d{2}-\d{2}\.html$/;
      const filteredFiles = files.filter((file) => datePattern.test(file));

      if (filteredFiles.length === 0) {
        console.error("HTML 파일이 없습니다.");
        return [];
      }

      const today = new Date();
      const closestFile = filteredFiles.reduce((closest, current) => {
        const currentDate = new Date(current.split(".")[0]);
        const closestDate = new Date(closest.split(".")[0]);

        return Math.abs(currentDate.getTime() - today.getTime()) <
          Math.abs(closestDate.getTime() - today.getTime())
          ? current
          : closest;
      });

      const filePath = path.join(originDir, closestFile);
      const htmlContent = await fs.readFile(filePath, "utf-8");

      return this.extractLinks(htmlContent)
        .filter((link) => link.startsWith(this.config.baseUrl))
        .filter(
          (link) =>
            link !== this.config.baseUrl && link !== `${this.config.baseUrl}/`
        )
        .map((link) => {
          const index = link.indexOf("?source");
          return index !== -1 ? link.substring(0, index) : link;
        });
    } catch (error) {
      console.error("링크 목록 로드 실패:", error);
      return [];
    }
  }

  private extractTitleFromUrl(url: string): string {
    const parts = url.split("/");
    let title = parts[parts.length - 1].replace(/-/g, " "); // '-'를 공백으로 변환

    // 마지막 단어가 식별자(UUID)인 경우 제거
    title = title.replace(/\b[a-f0-9]{8,}\b$/, "").trim();

    return title;
  }
}

export default NetflixBlogCrawler;
