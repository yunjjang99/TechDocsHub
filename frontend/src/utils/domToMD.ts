import { JSDOM } from "jsdom";

export function htmlToMarkdown(html: string): string {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  let markdown = "";

  // 제목 변환
  document
    .querySelectorAll("h1, h2, h3, h4, h5, h6")
    .forEach((header: Element) => {
      const level = header.tagName.slice(1);
      markdown += `${"#".repeat(parseInt(level))} ${header.textContent}\n\n`;
    });

  // 본문 텍스트와 링크 변환
  document.querySelectorAll("p, a").forEach((node: Element) => {
    if (node.tagName.toLowerCase() === "p") {
      markdown += `${node.textContent}\n\n`;
    } else if (node.tagName.toLowerCase() === "a") {
      const href = node.getAttribute("href");
      markdown += `[${node.textContent}](${href})\n\n`;
    }
  });

  // 이미지 변환
  document.querySelectorAll("img").forEach((img: HTMLImageElement) => {
    const src = img.getAttribute("src");
    const alt = img.getAttribute("alt") || "";
    markdown += `![${alt}](${src})\n\n`;
  });

  // 블록 인용 처리
  document.querySelectorAll("blockquote").forEach((blockquote: Element) => {
    markdown += `> ${blockquote.textContent}\n\n`;
  });

  // 리스트 변환
  document.querySelectorAll("ul, ol").forEach((list: Element) => {
    list.querySelectorAll("li").forEach((item, index) => {
      if (list.tagName.toLowerCase() === "ul") {
        markdown += `- ${item.textContent}\n`;
      } else {
        markdown += `${index + 1}. ${item.textContent}\n`;
      }
    });
    markdown += `\n`; // 리스트 끝에서 줄 바꿈
  });

  // 코드 블록 변환
  document.querySelectorAll("pre").forEach((pre: Element) => {
    const codeContent = pre.textContent;
    markdown += `\`\`\`\n${codeContent}\n\`\`\`\n\n`;
  });

  return markdown.trim();
}
