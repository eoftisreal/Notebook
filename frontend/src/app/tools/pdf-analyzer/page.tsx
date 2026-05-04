"use client";

import { useState, useRef } from "react";
import { FileText, Upload, Download, Trash2, Info } from "lucide-react";

export default function PdfAnalyzerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [info, setInfo] = useState<{ pages: number; size: string } | null>(null);
  const [status, setStatus] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File | null) {
    if (f && f.type === "application/pdf") {
      setFile(f);
      setInfo(null);
      setStatus("");
    } else if (f) {
      setStatus("Please select a valid PDF file.");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  }

  async function handleAnalyze() {
    if (!file) return;
    setStatus("Analyzing…");
    try {
      const { PDFDocument } = await import("pdf-lib");
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPageCount();
      const kb = (file.size / 1024).toFixed(1);
      setInfo({ pages, size: `${kb} KB` });
      setStatus("");
    } catch {
      setStatus("Could not read this PDF. It may be encrypted.");
    }
  }

  async function handleCompress() {
    if (!file) return;
    setStatus("Compressing…");
    try {
      const { PDFDocument } = await import("pdf-lib");
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const bytes = await pdfDoc.save({ useObjectStreams: true });
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.pdf$/i, "") + "_compressed.pdf";
      a.click();
      URL.revokeObjectURL(url);
      setStatus("Compressed file downloaded.");
    } catch {
      setStatus("Failed to compress PDF.");
    }
  }

  return (
    <div className="min-h-screen pt-28 pb-20 px-6">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-7 h-7 text-blue-400" />
          <h1 className="text-3xl font-bold">PDF Analyzer</h1>
        </div>
        <p className="text-slate-400 mb-8">
          Inspect and compress PDF documents entirely in your browser. No uploads, no tracking.
        </p>

        {/* Drop zone */}
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="glass-panel border-2 border-dashed border-white/20 rounded-2xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-blue-500/60 transition-colors mb-6"
        >
          <Upload className="w-8 h-8 text-slate-400" />
          {file ? (
            <p className="text-sm font-medium text-white">{file.name}</p>
          ) : (
            <p className="text-sm text-slate-400">Click or drag & drop a PDF here</p>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {/* Info panel */}
        {info && (
          <div className="glass-panel rounded-2xl p-5 mb-6 flex gap-6">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Pages</p>
              <p className="text-2xl font-bold text-white">{info.pages}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">File Size</p>
              <p className="text-2xl font-bold text-white">{info.size}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleAnalyze}
            disabled={!file}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Info className="w-4 h-4" /> Analyze
          </button>
          <button
            onClick={handleCompress}
            disabled={!file}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="w-4 h-4" /> Compress
          </button>
          {file && (
            <button
              onClick={() => { setFile(null); setInfo(null); setStatus(""); }}
              className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-slate-400"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {status && (
          <p className="mt-4 text-sm text-center text-slate-400">{status}</p>
        )}
      </div>
    </div>
  );
}
