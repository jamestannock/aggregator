import { useRef } from "react";

export default function FileDropZone({ onFileSelect }) {
  const ref = useRef();
  return (
    <div
      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50"
      onClick={() => ref.current.click()}
    >
      <p className="text-gray-600">Click or drag PDF here</p>
      <input
        type="file"
        accept=".pdf"
        ref={ref}
        className="hidden"
        onChange={e => e.target.files[0] && onFileSelect(e.target.files[0])}
      />
    </div>
  );
}
