import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export function QuillEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <ReactQuill theme="snow" value={value} onChange={onChange} style={{ height: 300 }} />;
}
