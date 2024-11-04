import axios from "axios";
import * as cheerio from "cheerio";
import TurndownService = require("turndown");
import * as fs from "fs-extra";
import * as path from "path";
import puppeteer from "puppeteer";

interface CrawlerConfig {
  baseUrl: string;
  outputPostsDir: string;
}

class NetflixBlogCrawler {
  private readonly config: CrawlerConfig = {
    baseUrl: "https://netflixtechblog.com", //주기적으로 검사할 블로그 페이지
    outputPostsDir: path.join(__dirname, "../../../../../mnt/netflix/posts"), // 크롤링된 리소스들이 저장될 폴더
  };

  constructor() {}

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public async netflixCrawl(): Promise<void> {
    const browser = await this.initializeBrowser();

    try {
      const page = await browser.newPage();
      await this.navigateToMainPage(page);

      const links = await this.loadParsedLinkList();
      console.log(links);
      for (const link of links) {
        await this.saveNetflixBlogHtml(link);
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
      headless: process.env.IS_DEV !== "true",
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

  private async navigateToMainPage(page: any): Promise<void> {
    console.log("넷플릭스 기술 블로그 페이지로 이동 중...");
    await page.goto(this.config.baseUrl, {
      waitUntil: "networkidle0",
      timeout: 60000,
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

  private async saveNetflixBlogHtml(url: string): Promise<void> {
    const browser = await this.initializeBrowser();

    try {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });

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
        return;
      }

      const postName = url.split("/").pop() || "index";
      const postDir = path.join(this.config.outputPostsDir, postName);
      const filePath = path.join(postDir, "index.html");

      await fs.ensureDir(postDir);
      await fs.writeFile(filePath, cleanedHtml, "utf-8");

      console.log(`✅ HTML 저장 완료: ${filePath}`);
    } catch (error) {
      console.error(`❌ HTML 저장 실패 (${url}):`, error);
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

      // 폴더 내의 파일 목록을 가져오기
      const files = await fs.readdir(originDir);

      // 날짜 형식 (yyyy-mm-dd.html)으로 필터링
      const datePattern = /^\d{4}-\d{2}-\d{2}\.html$/;
      const filteredFiles = files.filter((file) => datePattern.test(file));

      if (filteredFiles.length === 0) {
        console.error("HTML 파일이 없습니다.");
        return [];
      }

      // 오늘 날짜
      const today = new Date();
      const todayString = today.toISOString().split("T")[0]; // yyyy-mm-dd 형식

      // 가장 가까운 파일 찾기
      const closestFile = filteredFiles.reduce((closest, current) => {
        const currentDate = new Date(current.split(".")[0]); // 파일명에서 날짜 추출
        const closestDate = new Date(closest.split(".")[0]);

        // 현재 파일이 가장 가까운지 비교
        return Math.abs(currentDate.getTime() - today.getTime()) <
          Math.abs(closestDate.getTime() - today.getTime())
          ? current
          : closest;
      });

      // 해당 파일 읽기
      const filePath = path.join(originDir, closestFile);
      console.log(filePath);
      const htmlContent = await fs.readFile(filePath, "utf-8");

      console.log(htmlContent);
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
}

// data-testid가 storyTitle인 요소부��� article 끝까지 추출하고, 클래스 네임을 제거하는 함수
function extractAndRemoveClassNames() {
  // data-testid="storyTitle"로 시작하는 요소 선택
  const startElement = document.querySelector('[data-testid="storyTitle"]');

  // 해당 요소가 속한 article 선택
  const articleElement = startElement.closest("article");

  if (articleElement) {
    // article 내부의 모든 요소에서 클래스 네임 제거
    articleElement.querySelectorAll("*").forEach((element) => {
      element.removeAttribute("class");
    });

    // 클래스 네임을 제거한 HTML 반환
    return articleElement.outerHTML;
  }

  return null;
}

export default NetflixBlogCrawler;
