import fs from "fs";
import path from "path";
import { JSDOM } from "jsdom";
import React from "react";
import { htmlToMarkdown } from "@/utils/domToMD";
import ReactMarkdown from "react-markdown";

// 서버 컴포넌트로 페이지 정의
const PostPage = async ({ params }: { params: { url: string } }) => {
  // 파일 경로 정의

  if (!params.url) {
    return <p>URL이 잘못되었습니다. 다시 시도해주세요.</p>;
  }

  const filePath = path.join(
    "/Users/mac/TechDocsHub/backend/mnt/netflix/posts",
    params.url,
    "index.html"
  );

  // HTML 파일 읽기 및 변환
  const html = fs.readFileSync(filePath, "utf-8");
  const markdown = htmlToMarkdown(html);

  return (
    <div>
      <article>
        <ReactMarkdown>{markdown}</ReactMarkdown>
      </article>
    </div>
  );
};

export default PostPage;
