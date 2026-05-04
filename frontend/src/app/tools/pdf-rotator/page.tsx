"use client";

import { useState, useRef } from "react";
import { RotateCw, Upload, Download, Trash2 } from "lucide-react";

export default function PdfRotatorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [rotation, setRotation] = useState<90 | 180 | 270>(90);
  const [status, setStatus] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File | null) {
    if (f && f.type === "application/pdf") {
      setFile(f);
      setStatus("");
    } else if (f) {
      setStatus("Please select a valid PDF file.");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  }

  async function handleRotate() {
    if (!file) return;
    setStatus("Processing…");

    try {
      const { PDFDocument, degrees } = await import("pdf-lib");
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      for (const page of pages) {
        page.setRotation(degrees((page.getRotation().angle + rotation) % 360));
      }
      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.pdf$/i, "") + `_rotated${rotation}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus("Done! File downloaded.");
    } catch {
      setStatus("Failed to process PDF. Please try again.");
    }
  }

  return (
    <div className="min-h-screen pt-28 pb-20 px-6">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <RotateCw className="w-7 h-7 text-orange-400" />
          <h1 className="text-3xl font-bold">PDF Rotator</h1>
        </div>
        <p className="text-slate-400 mb-8">
          Rotate all pages in a PDF file. Processed entirely in your browser — nothing is uploaded.
        </p>

        {/* Drop zone */}
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="glass-panel border-2 border-dashed border-white/20 rounded-2xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-orange-500/60 transition-colors mb-6"
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

        {/* Rotation selector */}
        <div className="glass-panel rounded-2xl p-5 mb-6">
          <p className="text-sm font-medium mb-3 text-slate-300">Rotation angle</p>
          <div className="flex gap-3">
            {([90, 180, 270] as const).map((deg) => (
              <button
                key={deg}
                onClick={() => setRotation(deg)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                  rotation === deg
                    ? "bg-orange-500 text-white"
                    : "bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                {deg}°
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleRotate}
            disabled={!file}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="w-4 h-4" /> Rotate &amp; Download
          </button>
          {file && (
            <button
              onClick={() => { setFile(null); setStatus(""); }}
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
