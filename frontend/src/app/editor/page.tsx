// src/app/editor/page.tsx

"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

export default function EditorPage() {
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [content, setContent] = useState("");

  const handlePost = async () => {
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, tags, content }),
      });
      if (response.ok) {
        alert("포스팅이 완료되었습니다.");
        setTitle("");
        setTags("");
        setContent("");
      } else {
        alert("포스팅에 실패했습니다.");
      }
    } catch (error) {
      console.error("Error posting content:", error);
      alert("포스팅 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="p-4 bg-gray-900 text-white text-2xl font-bold text-center">
        Markdown Editor
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* 에디터 영역 */}
        <div className="flex flex-col w-full p-4 bg-gray-900 text-white overflow-auto">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full mb-4 p-3 bg-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Tags (comma separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full mb-4 p-3 bg-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex-1">
            <MDEditor
              value={content}
              onChange={(value) => setContent(value || "")}
              className="bg-gray-800 rounded-lg"
              style={{ height: "70vh" }} // 원하는 높이로 강제 설정
            />
          </div>
          <button
            onClick={handlePost}
            className="w-full py-2 px-4 mt-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition-colors duration-200"
          >
            포스팅하기
          </button>
        </div>
      </div>
    </div>
  );
}
