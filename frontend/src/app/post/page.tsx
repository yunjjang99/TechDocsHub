import React, { useState } from "react";
import dynamic from "next/dynamic";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

const MarkdownEditor = () => {
  const [content, setContent] = useState("");

  const handlePost = async () => {
    // 여기에서 작성된 content를 서버에 저장하는 API 호출
    const response = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (response.ok) {
      alert("포스팅이 완료되었습니다.");
    } else {
      alert("포스팅에 실패했습니다.");
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <h1>Markdown Editor</h1>
      <MDEditor value={content} onChange={(value) => setContent(value || "")} />

      <button onClick={handlePost}>포스팅하기</button>
    </div>
  );
};

export default MarkdownEditor;
