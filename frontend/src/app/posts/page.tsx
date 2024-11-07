import { Props } from "next/script";
import ReactMarkdown from "react-markdown";

const PostPage: React.FC<Props> = ({ markdown }) => {
  return (
    <div>
      <article>
        <ReactMarkdown>{markdown}</ReactMarkdown>
      </article>
    </div>
  );
};
