// frontend/src/declarations.d.ts
declare module "@uiw/react-md-editor" {
  import { Dispatch, SetStateAction } from "react";

  interface MDEditorProps {
    value: string;
    onChange: Dispatch<SetStateAction<string>>;
    [key: string]: any; // 나머지 속성 허용
  }

  const MDEditor: React.FC<MDEditorProps>;

  export default MDEditor;
}
