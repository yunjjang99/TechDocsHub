import axios from "axios";
import * as cheerio from "cheerio";
import TurndownService = require("turndown");
import * as fs from "fs-extra";
import * as path from "path";
import puppeteer from "puppeteer";

class NetflixBlogCrawler {
  private readonly baseUrl = "https://netflixtechblog.com";
  private readonly outputDir = "/mnt/netflix";
  private readonly turndown: TurndownService;
  private readonly axiosInstance;

  constructor() {
    this.turndown = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
    });

    // 이미지 처리를 위한 규칙 추가
    this.turndown.addRule("images", {
      filter: ["img"],
      replacement: (content, node) => {
        const img = node as HTMLImageElement;
        const src = img.src;
        const alt = img.alt || "";
        const localPath = this.downloadAndSaveImage(src);
        return `![${alt}](${localPath})`;
      },
    });

    // axios 인스턴스 설정
    this.axiosInstance = axios.create({
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36",
      },
    });
  }

  private async downloadAndSaveImage(imageUrl: string): Promise<string> {
    try {
      const response = await axios.get(imageUrl, {
        responseType: "arraybuffer",
      });
      const imageName = path.basename(imageUrl);
      const localPath = path.join(this.outputDir, "images", imageName);

      await fs.ensureDir(path.join(this.outputDir, "images"));
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

  public async openPage(): Promise<any> {
    const browser = await puppeteer.launch({
      headless: process.env.IS_DEV === "true" ? false : true,
      executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--window-size=1920,1080",
        "--start-maximized",
      ],
      defaultViewport: {
        width: 1920,
        height: 1080,
      },
    });

    try {
      const page = await browser.newPage();

      console.log("Medium 로그인 페이지로 이동 중...");
      await page.goto("https://netflixtechblog.com/", {
        waitUntil: "networkidle0",
        timeout: 60000,
      });
      this.testExtractLinks();
    } catch (error) {
      console.error("❌ Google 로그인 실패:", error.message);
      throw error;
    } finally {
      await browser.close();
    }
  }

  private extractLinks(html: string): string[] {
    try {
      const $ = cheerio.load(html);
      const links: string[] = [];

      // 모든 a 태그를 찾아서 href 속성 추출
      $("a").each((_, element) => {
        const href = $(element).attr("href");
        if (href && !href.startsWith("#") && !href.startsWith("javascript:")) {
          // 상대 경로인 경우 baseUrl과 결합
          const fullUrl = href.startsWith("http")
            ? href
            : new URL(href, this.baseUrl).toString();
          links.push(fullUrl);
        }
      });

      // 중복 제거 후 반환
      return [...new Set(links)];
    } catch (error) {
      console.error("링크 추출 중 오류 발생:", error);
      return [];
    }
  }

  private async testExtractLinks(): Promise<void> {
    try {
      const htmlContent = await fs.readFile(
        "/Users/mac/TechDocsHub/backend/mnt/netflex/html/2024-11-03.html",
        "utf-8"
      );
      const links = this.extractLinks(htmlContent);
      console.log("추출된 링크들:", links);
      console.log("총 링크 수:", links.length);
    } catch (error) {
      console.error("테스트 실행 중 오류 발생:", error);
    }
  }
}

export default NetflixBlogCrawler;
