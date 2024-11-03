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
    baseUrl: "https://netflixtechblog.com",
    outputPostsDir: path.join(__dirname, "../../../mnt/netflix/posts"), // ../../../ 경로로 변경
  };
  private readonly turndown: TurndownService;
  private readonly axiosInstance;

  constructor() {
    this.turndown = this.initializeTurndown();
    this.axiosInstance = this.initializeAxios();
  }

  private initializeTurndown(): TurndownService {
    const turndown = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
    });

    turndown.addRule("images", {
      filter: ["img"],
      replacement: async (content, node) => {
        const img = node as HTMLImageElement;
        const localPath = await this.downloadAndSaveImage(
          img.src,
          this.config.outputPostsDir
        );
        return `![${img.alt || ""}](${localPath})`;
      },
    });

    return turndown;
  }

  private initializeAxios() {
    return axios.create({
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });
  }

  private async downloadAndSaveImage(
    imageUrl: string,
    postDir: string
  ): Promise<string> {
    try {
      const response = await axios.get(imageUrl, {
        responseType: "arraybuffer",
      });
      const imageName = path.basename(imageUrl);
      const imagesDir = path.join(postDir, "images");
      const localPath = path.join(imagesDir, imageName);

      await fs.ensureDir(imagesDir);
      await fs.writeFile(localPath, response.data);

      return `./images/${imageName}`;
    } catch (error) {
      console.error(`이미지 다운로드 실패: ${imageUrl}`, error);
      return imageUrl;
    }
  }

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
        await this.savePageHtml(link);
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

  private async savePageHtml(url: string): Promise<void> {
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
      const htmlContent = await fs.readFile(
        path.join(__dirname, "../../../mnt/netflex/origin/2024-11-03.html"), // ../../../ 경로 설정
        "utf-8"
      );

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
