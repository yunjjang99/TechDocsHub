// 필요한 모듈 및 라이브러리 임포트
import fs from "fs/promises";
import path from "path";
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

// 서버 컴포넌트로 정의
const PostPage = async ({ params }: { params: { url: string } }) => {
  // 마크다운 파일 내용을 가져오기
  const markdownContent = await getMarkdownContent(params.url);

  // 마크다운 내용이 없는 경우 에러 메시지 출력
  if (!markdownContent) {
    return <p>게시물이 존재하지 않습니다. 다시 확인해주세요.</p>;
  }

  return (
    <div className="markdown-container">
      <article>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
        >
          {markdownContent}
        </ReactMarkdown>
      </article>
    </div>
  );
};

// 비동기 함수로 파일 내용 읽기
async function getMarkdownContent(url: string): Promise<string | null> {
  try {
    const filePath = path.resolve(
      __dirname,
      "../../../../../../backend/mnt/netflix/posts",
      url,
      "index.md"
    );

    // 파일 존재 여부 확인
    const fileExists = await fs
      .access(filePath)
      .then(() => true)
      .catch(() => false);
    if (!fileExists) {
      console.error("파일이 존재하지 않습니다:", filePath);
      return null;
    }

    // 파일 읽기
    const fileBuffer = await fs.readFile(filePath, "utf-8");
    return fileBuffer;
  } catch (error) {
    console.error("파일 읽기 오류:", error);
    return null;
  }
}

export default PostPage;
