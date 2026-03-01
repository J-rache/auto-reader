import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist/webpack';

export default function PdfReader({ filePath }) {
  const canvasRef = useRef(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageNum, setPageNum] = useState(1);

  useEffect(() => {
    // listen for file-opened events dispatched from App
    const handler = (e) => {
      const p = e.detail?.filePath;
      if (p) loadPdf(p);
    };
    window.addEventListener('file-opened', handler);
    // also check store for lastOpened
    (async () => {
      try {
        const last = await window.electronAPI.storeGet('lastOpened');
        if (last) loadPdf(last);
      } catch (err) {
        // ignore
      }
    })();
    return () => window.removeEventListener('file-opened', handler);
  }, []);

  async function loadPdf(path) {
    try {
      const data = await window.electronAPI.readFileBuffer(path);
      // pdfjs accepts typed array
      const uint8 = new Uint8Array(data);
      const loadingTask = pdfjsLib.getDocument({ data: uint8 });
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
      setPageNum(1);
      renderPage(pdf, 1);
    } catch (err) {
      console.error('loadPdf error', err);
    }
  }

  async function renderPage(pdf, num) {
    const page = await pdf.getPage(num);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    const renderContext = { canvasContext: context, viewport };
    await page.render(renderContext).promise;
  }

  const next = () => {
    if (!pdfDoc) return;
    const nextPage = Math.min(pdfDoc.numPages, pageNum + 1);
    setPageNum(nextPage);
    renderPage(pdfDoc, nextPage);
  };
  const prev = () => {
    if (!pdfDoc) return;
    const prevPage = Math.max(1, pageNum - 1);
    setPageNum(prevPage);
    renderPage(pdfDoc, prevPage);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 8, borderBottom: '1px solid #eee' }}>
        <button onClick={prev} disabled={!pdfDoc || pageNum <= 1}>Prev</button>
        <button onClick={next} disabled={!pdfDoc || (pdfDoc && pageNum >= pdfDoc.numPages)}>Next</button>
        <span style={{ marginLeft: 12 }}>{pdfDoc ? `Page ${pageNum} / ${pdfDoc.numPages}` : 'No document loaded'}</span>
      </div>
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <canvas ref={canvasRef} style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.12)' }} />
      </div>
    </div>
  );
}
