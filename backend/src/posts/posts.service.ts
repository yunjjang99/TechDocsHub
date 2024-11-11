import { Injectable } from "@nestjs/common";
import * as puppeteer from "puppeteer";

@Injectable()
export class PostsService {
  async publishToTistory(markdown: string): Promise<string> {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    try {
      // 티스토리 로그인 페이지로 이동
      await page.goto(
        "https://accounts.kakao.com/login/?continue=https%3A%2F%2Fkauth.kakao.com%2Foauth%2Fauthorize%3Fis_popup%3Dfalse%26ka%3Dsdk%252F1.43.5%2520os%252Fjavascript%2520sdk_type%252Fjavascript%2520lang%252Fko-KR%2520device%252FMacIntel%2520origin%252Fhttps%25253A%25252F%25252Fwww.tistory.com%26auth_tran_id%3Dxcvdx6tu9sr3e6ddd834b023f24221217e370daed18m3bbwdzk%26response_type%3Dcode%26redirect_uri%3Dhttps%253A%252F%252Fwww.tistory.com%252Fauth%252Fkakao%252Fredirect%26prompt%3Dselect_account%26client_id%3D3e6ddd834b023f24221217e370daed18%26through_account%3Dtrue&talk_login=hidden#login"
      );

      // 로그인 폼에 사용자 정보 입력
      const kakaoId = process.env.KAKAOID || "";
      const kakaoPw = process.env.KAKAOPW || "";

      // 아이디 입력
      await page.type("input[name='loginId']", kakaoId);
      // 비밀번호 입력
      await page.type("input[name='password']", kakaoPw);

      //로그인 버튼 클릭
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll("button"));
        const loginButton = buttons.find((button) =>
          button.textContent.includes("로그인")
        );
        if (loginButton) loginButton.click();
      });

      // 로그인 완료 대기
      await page.waitForNavigation();

      // 블로그 글쓰기 페이지로 이동
      await page.goto("https://yunsoo1.tistory.com/manage/newpost");

      // 마크다운 글 입력
      await page.type(".editor", markdown);

      // 포스팅 버튼 클릭
      await page.click(".btn_publish");

      // 포스팅 완료 대기
      await page.waitForNavigation();

      return "포스팅이 완료되었습니다!";
    } catch (error) {
      console.error("Error posting to Tistory:", error);
      return "포스팅에 실패했습니다.";
    } finally {
      await browser.close();
    }
  }
}
