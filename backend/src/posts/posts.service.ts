import { Injectable } from "@nestjs/common";
import * as puppeteer from "puppeteer";

@Injectable()
export class PostsService {
  async publishToTistory(markdown: string): Promise<string> {
    let browser: puppeteer.Browser | null = null;
    let page: puppeteer.Page | null = null;

    try {
      // Puppeteer 브라우저 및 페이지 초기화
      browser = await puppeteer.launch({ headless: false });
      page = await browser.newPage();

      // 모든 다이얼로그 자동 거절 (alert, confirm, prompt)
      page.on("dialog", async (dialog) => {
        console.log(`다이얼로그 감지: ${dialog.type()} - ${dialog.message()}`);
        await dialog.dismiss(); // 거절
      });

      // 네트워크 요청 에러 핸들링 (차단된 요청 등)
      page.on("requestfailed", (request) => {
        console.log(
          `요청 실패: ${request.url()} - ${request.failure()?.errorText}`
        );
      });

      // 티스토리 로그인 페이지로 이동
      await page.goto(
        "https://accounts.kakao.com/login/?continue=https%3A%2F%2Fkauth.kakao.com%2Foauth%2Fauthorize%3Fis_popup%3Dfalse%26ka%3Dsdk%252F1.43.5%2520os%252Fjavascript%2520sdk_type%252Fjavascript%2520lang%252Fko-KR%2520device%252FMacIntel%2520origin%252Fhttps%25253A%25252F%25252Fwww.tistory.com%26auth_tran_id%3Dxcvdx6tu9sr3e6ddd834b023f24221217e370daed18m3bbwdzk%26response_type%3Dcode%26redirect_uri%3Dhttps%253A%252F%252Fwww.tistory.com%252Fauth%252Fkakao%252Fredirect%26prompt%3Dselect_account%26client_id%3D3e6ddd834b023f24221217e370daed18%26through_account%3Dtrue&talk_login=hidden#login"
      );

      // 로그인 정보 입력
      const kakaoId = process.env.KAKAOID || "";
      const kakaoPw = process.env.KAKAOPW || "";

      await page.type("input[name='loginId']", kakaoId);
      await page.type("input[name='password']", kakaoPw);

      // 로그인 버튼 클릭 및 대기
      await page.evaluate(() => {
        const loginButton = Array.from(
          document.querySelectorAll("button")
        ).find((button) => button.textContent.includes("로그인"));
        if (loginButton) loginButton.click();
      });

      await page.waitForNavigation();

      // 블로그 글쓰기 페이지로 이동
      await page.goto("https://yunsoo1.tistory.com/manage/newpost");

      const titleTextareaSelector = "textarea[placeholder='제목을 입력하세요']";

      // 해당 textarea가 렌더링될 때까지 기다림
      await page.waitForSelector(titleTextareaSelector, {
        visible: true,
        timeout: 10000,
      });

      // textarea 클릭
      await page.click(titleTextareaSelector);
      console.log("textarea를 클릭했습니다.");

      // 텍스트 입력
      const testText = "테스트입니다";
      await page.type(titleTextareaSelector, testText);

      // 추가적인 다이얼로그 처리
      await new Promise((resolve) => setTimeout(resolve, 2000)); // 페이지 로딩 후 다이얼로그가 뜰 수 있는 시간 대기

      // const completeButtonSelector = "button"; // 버튼 요소 선택
      // await page.waitForSelector(completeButtonSelector, {
      //   visible: true,
      //   timeout: 10000,
      // });

      // // 버튼 클릭 (텍스트로 필터링)
      // await page.evaluate(() => {
      //   const completeButton = Array.from(
      //     document.querySelectorAll("button")
      //   ).find((button) => button.textContent?.includes("완료"));
      //   if (completeButton) {
      //     completeButton.click();
      //     console.log("'완료' 버튼을 클릭했습니다.");
      //   } else {
      //     console.error("'완료' 버튼을 찾을 수 없습니다.");
      //   }
      // });

      console.log("모든 다이얼로그가 자동으로 거절 처리되었습니다.");
    } catch (error) {
      console.error("Error posting to Tistory:", error);
      return "포스팅에 실패했습니다.";
    } finally {
      if (browser && browser.isConnected()) {
        console.log("브라우저는 닫지 않고 유지합니다.");
      }
    }
  }

  // 마크다운에서 타이틀과 본문 추출
  extractTitleAndContent(markdown: string): { title: string; content: string } {
    const lines = markdown.split("\n");
    let title = "";
    let content = "";

    // 타이틀 추출 (마크다운에서 첫 번째 줄 또는 `title:` 메타데이터 사용)
    const titleLine = lines.find((line) => line.startsWith("title:"));
    if (titleLine) {
      title = titleLine.replace("title:", "").trim();
    } else if (lines[0].startsWith("#")) {
      title = lines[0].replace("#", "").trim();
    } else {
      title = "Untitled";
    }

    // 본문 내용 추출
    content = lines.slice(1).join("\n");

    return { title, content };
  }
}
