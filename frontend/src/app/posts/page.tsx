import ReactMarkdown from "react-markdown";

const PostPage = ({ markdown }: any) => {
  return (
    <div>
      <article>
        <ReactMarkdown>{markdown}</ReactMarkdown>
      </article>
    </div>
  );
};

export default PostPage;
