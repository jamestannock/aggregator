import { useRef } from "react";

export default function FileDropZone({ onFileSelect }) {
  const ref = useRef();
  return (
    <div
      className="border-2 border-dashed border-indigo-300 rounded-lg p-6 text-center cursor-pointer bg-white/60 hover:bg-white"
      onClick={() => ref.current.click()}
    >
      <p className="text-gray-700">Click or drag PDF here</p>
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
