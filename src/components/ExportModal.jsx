import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileCode, 
  Image as ImageIcon, 
  Download, 
  CheckCircle2, 
  Loader2, 
  Layers,
  FileText
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function ExportModal({ 
  isOpen, 
  onClose, 
  fileName, 
  noteType, 
  pageSize: initialPageSize = 'A4',
  paperRef 
}) {
  const [exportFormat, setExportFormat] = useState('pdf'); // 'pdf' | 'png'
  const [exportTheme, setExportTheme] = useState('current'); // 'current' | 'light' | 'dark'
  const [pageSize, setPageSize] = useState('A4');
  const [orientation, setOrientation] = useState('portrait'); // 'portrait' | 'landscape'
  const [qualityPreset, setQualityPreset] = useState('standard'); // 'standard' | 'high' | 'print'
  const [preserveNotebookStyle, setPreserveNotebookStyle] = useState(true);

  const [estimatedPages, setEstimatedPages] = useState(1);
  const [estimatedSize, setEstimatedSize] = useState('~2 MB');

  const [isExporting, setIsExporting] = useState(false);
  const [progressStage, setProgressStage] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);

  // Recalculate estimated page count based on actual content bounds
  useEffect(() => {
    if (paperRef && paperRef.current && isOpen) {
      const sourcePaper = paperRef.current;
      let maxContentBottom = 700;
      const editorElem = sourcePaper.querySelector('.ProseMirror');
      if (editorElem) {
        maxContentBottom = Math.max(maxContentBottom, editorElem.offsetTop + editorElem.offsetHeight);
      }
      const floatingCards = sourcePaper.querySelectorAll('.floating-object-wrapper');
      floatingCards.forEach(card => {
        const topVal = parseFloat(card.style.top) || 0;
        const heightVal = parseFloat(card.style.height) || 200;
        maxContentBottom = Math.max(maxContentBottom, topVal + heightVal + 60);
      });

      const pageHeightPx = orientation === 'portrait' ? 1120 : 800;
      const pages = Math.max(1, Math.ceil(maxContentBottom / pageHeightPx));
      setEstimatedPages(pages);

      const sizeMap = {
        standard: (pages * 1.5).toFixed(1) + ' MB',
        high: (pages * 3.5).toFixed(1) + ' MB',
        print: (pages * 8.0).toFixed(1) + ' MB'
      };
      setEstimatedSize('~' + (sizeMap[qualityPreset] || '2 MB'));
    }
  }, [paperRef, orientation, qualityPreset, pageSize, isOpen, exportTheme]);

  if (!isOpen) return null;

  const defaultExportName = fileName 
    ? fileName.replace(/\.(md|txt)$/i, '') 
    : 'CurrentNote';

  const handleExport = async () => {
    if (!paperRef || !paperRef.current) return;

    setIsExporting(true);
    setIsCompleted(false);

    try {
      // Stage 1: Preparing Document
      setProgressStage('Preparing Document...');
      await new Promise(r => setTimeout(r, 150));

      const sourcePaper = paperRef.current;
      const isAppDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const effectiveTheme = exportTheme === 'current' ? (isAppDark ? 'dark' : 'light') : exportTheme;

      // Calculate Content Height (prevents 56-page blank overflow)
      let maxContentBottom = 700;
      const editorElem = sourcePaper.querySelector('.ProseMirror');
      if (editorElem) {
        maxContentBottom = Math.max(maxContentBottom, editorElem.offsetTop + editorElem.offsetHeight);
      }
      const floatingCards = sourcePaper.querySelectorAll('.floating-object-wrapper');
      floatingCards.forEach(card => {
        const topVal = parseFloat(card.style.top) || 0;
        const heightVal = parseFloat(card.style.height) || 200;
        maxContentBottom = Math.max(maxContentBottom, topVal + heightVal + 60);
      });

      const exportWidth = sourcePaper.offsetWidth || 800;
      const exportHeight = Math.min(maxContentBottom + 80, 15000);

      // Create styled container for clean off-screen rendering with data-theme
      const tempContainer = document.createElement('div');
      tempContainer.setAttribute('data-theme', effectiveTheme);
      tempContainer.style.position = 'fixed';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = `${exportWidth}px`;
      tempContainer.style.height = `${exportHeight}px`;
      tempContainer.style.backgroundColor = effectiveTheme === 'dark' ? '#1E1E1E' : '#FFFFFF';
      tempContainer.style.color = effectiveTheme === 'dark' ? '#F4F4F5' : '#18181B';
      tempContainer.style.overflow = 'hidden';

      // Clone paper node
      const clone = sourcePaper.cloneNode(true);
      clone.style.width = `${exportWidth}px`;
      clone.style.height = `${exportHeight}px`;
      clone.style.position = 'relative';
      clone.style.top = '0';
      clone.style.left = '0';
      clone.style.transform = 'none';
      clone.style.backgroundColor = effectiveTheme === 'dark' ? '#1E1E1E' : '#FFFFFF';

      // Strip UI controls (resize points, toolbar buttons, selected outlines)
      const UI_ELEMENTS_TO_REMOVE = clone.querySelectorAll(
        '.resize-handle, .sticky-note-mini-toolbar, .drag-header-bar, .card-minimal-menu-container, .connection-handle'
      );
      UI_ELEMENTS_TO_REMOVE.forEach(el => el.remove());

      const SELECTED_WRAPPERS = clone.querySelectorAll('.selected');
      SELECTED_WRAPPERS.forEach(el => {
        el.classList.remove('selected');
        el.style.border = el.classList.contains('sticky-note-card') ? '1px solid rgba(0,0,0,0.08)' : '1px solid transparent';
        el.style.boxShadow = el.classList.contains('sticky-note-card') ? '0 6px 18px rgba(0,0,0,0.08)' : 'none';
      });

      tempContainer.appendChild(clone);
      document.body.appendChild(tempContainer);

      const presetConfigMap = {
        standard: { scale: 2, quality: 0.85, format: 'JPEG' },
        high: { scale: 2.5, quality: 0.92, format: 'JPEG' },
        print: { scale: 3, quality: 0.98, format: 'PNG' }
      };
      const presetConfig = presetConfigMap[qualityPreset] || presetConfigMap.standard;
      const paperBgColor = effectiveTheme === 'dark' ? '#1E1E1E' : '#FFFFFF';

      if (exportFormat === 'png') {
        setProgressStage('Rendering Notebook PNG...');
        const canvas = await html2canvas(clone, {
          scale: presetConfig.scale,
          useCORS: true,
          backgroundColor: paperBgColor,
          logging: false
        });

        document.body.removeChild(tempContainer);

        setProgressStage('Saving File...');
        const imageURI = canvas.toDataURL('image/png', presetConfig.quality);

        if (window.electronAPI) {
          const createRes = await window.electronAPI.createFileDialog({
            defaultName: `${defaultExportName}.png`,
            extension: 'png'
          });
          if (createRes.success && createRes.filePath) {
            const blob = await (await fetch(imageURI)).blob();
            const buffer = await blob.arrayBuffer();
            await window.electronAPI.saveFileContent({
              filePath: createRes.filePath,
              content: new Uint8Array(buffer)
            });
          }
        } else {
          const link = document.createElement('a');
          link.href = imageURI;
          link.download = `${defaultExportName}.png`;
          link.click();
        }
      } else {
        // PDF EXPORT
        setProgressStage('Rendering PDF Pages...');
        await new Promise(r => setTimeout(r, 100));

        const fullCanvas = await html2canvas(clone, {
          scale: presetConfig.scale,
          useCORS: true,
          backgroundColor: paperBgColor,
          logging: false
        });

        document.body.removeChild(tempContainer);

        const pdf = new jsPDF({
          orientation: orientation === 'landscape' ? 'l' : 'p',
          unit: 'mm',
          format: pageSize.toLowerCase() === 'custom' ? 'a4' : pageSize.toLowerCase()
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        const canvasWidth = fullCanvas.width;
        const canvasHeight = fullCanvas.height;
        const sliceHeightPx = Math.floor((canvasWidth * pdfHeight) / pdfWidth);

        let currentY = 0;
        let pageIndex = 0;
        const totalPdfPages = Math.max(1, Math.ceil(canvasHeight / sliceHeightPx));

        while (currentY < canvasHeight) {
          pageIndex++;
          setProgressStage(`Processing Page ${pageIndex} of ${totalPdfPages}...`);

          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvasWidth;
          const currentSliceH = Math.min(sliceHeightPx, canvasHeight - currentY);
          pageCanvas.height = currentSliceH;

          const ctx = pageCanvas.getContext('2d');
          ctx.fillStyle = paperBgColor;
          ctx.fillRect(0, 0, canvasWidth, currentSliceH);
          ctx.drawImage(
            fullCanvas,
            0, currentY, canvasWidth, currentSliceH,
            0, 0, canvasWidth, currentSliceH
          );

          const pageImgData = pageCanvas.toDataURL(`image/${presetConfig.format.toLowerCase()}`, presetConfig.quality);
          const renderedPdfHeight = (currentSliceH * pdfWidth) / canvasWidth;

          if (pageIndex > 1) {
            pdf.addPage();
          }

          pdf.addImage(pageImgData, presetConfig.format, 0, 0, pdfWidth, renderedPdfHeight);
          currentY += sliceHeightPx;
        }

        setProgressStage('Saving PDF...');
        if (window.electronAPI) {
          const createRes = await window.electronAPI.createFileDialog({
            defaultName: `${defaultExportName}.pdf`,
            extension: 'pdf'
          });
          if (createRes.success && createRes.filePath) {
            const pdfArrayBuffer = pdf.output('arraybuffer');
            await window.electronAPI.saveFileContent({
              filePath: createRes.filePath,
              content: new Uint8Array(pdfArrayBuffer)
            });
          }
        } else {
          pdf.save(`${defaultExportName}.pdf`);
        }
      }

      setProgressStage('Completed ✓');
      setIsCompleted(true);
      setTimeout(() => {
        setIsExporting(false);
        setIsCompleted(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error('Export Error:', err);
      setProgressStage('Export Failed');
      setIsExporting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="export-modal-box">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Export Note
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Export clean PDF documents and high-res notebook images.
            </p>
          </div>

          <button 
            className="btn-compact" 
            style={{ width: 28, height: 28, padding: 0, borderRadius: 8 }} 
            onClick={onClose}
            disabled={isExporting}
          >
            <X size={15} />
          </button>
        </div>

        {/* 1. EXPORT FORMAT CARDS (PDF vs PNG ONLY) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
          <div 
            className={`export-format-card ${exportFormat === 'pdf' ? 'selected' : ''}`}
            onClick={() => !isExporting && setExportFormat('pdf')}
          >
            <FileCode size={24} color={exportFormat === 'pdf' ? '#0078D4' : 'var(--text-muted)'} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>📄 PDF (.pdf)</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Paginated document</div>
            </div>
          </div>

          <div 
            className={`export-format-card ${exportFormat === 'png' ? 'selected' : ''}`}
            onClick={() => !isExporting && setExportFormat('png')}
          >
            <ImageIcon size={24} color={exportFormat === 'png' ? '#0078D4' : 'var(--text-muted)'} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>🖼 PNG (.png)</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Full notebook image</div>
            </div>
          </div>
        </div>

        {/* 2. EXPORT THEME & QUALITY SETTINGS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          {/* PDF / Export Theme Selector */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              Document Theme
            </label>
            <select 
              className="select-compact" 
              value={exportTheme} 
              onChange={(e) => setExportTheme(e.target.value)}
              disabled={isExporting}
            >
              <option value="current">Current App Theme</option>
              <option value="light">Light Theme (White Paper)</option>
              <option value="dark">Dark Theme (Dark Paper)</option>
            </select>
          </div>

          {/* Quality Preset */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              Quality Preset
            </label>
            <select 
              className="select-compact" 
              value={qualityPreset} 
              onChange={(e) => setQualityPreset(e.target.value)}
              disabled={isExporting}
            >
              <option value="standard">Standard (Compact • ~2MB)</option>
              <option value="high">High Resolution (~4MB)</option>
              <option value="print">Print Quality (Max DPI)</option>
            </select>
          </div>
        </div>

        {/* Paper Size & Orientation */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16, alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              Paper Size
            </label>
            <select 
              className="select-compact" 
              value={pageSize} 
              onChange={(e) => setPageSize(e.target.value)}
              disabled={isExporting}
            >
              <option value="A4">A4 (210 × 297 mm)</option>
              <option value="A5">A5 (148 × 210 mm)</option>
              <option value="Letter">Letter (8.5 × 11 in)</option>
              <option value="Legal">Legal (8.5 × 14 in)</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              Orientation
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                className={`btn-compact ${orientation === 'portrait' ? 'active' : ''}`}
                style={{ flex: 1, height: 32, fontSize: 12 }}
                onClick={() => !isExporting && setOrientation('portrait')}
              >
                Portrait
              </button>
              <button 
                className={`btn-compact ${orientation === 'landscape' ? 'active' : ''}`}
                style={{ flex: 1, height: 32, fontSize: 12 }}
                onClick={() => !isExporting && setOrientation('landscape')}
              >
                Landscape
              </button>
            </div>
          </div>
        </div>

        {/* 3. EXPORT METRICS PREVIEW BOX */}
        <div style={{ background: 'var(--border-light)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={16} color="var(--accent)" />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
              {exportFormat === 'pdf' ? `Estimated: ${estimatedPages} PDF ${estimatedPages === 1 ? 'Page' : 'Pages'}` : 'Full Notebook Image'}
            </span>
          </div>

          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
            Est. Size: {estimatedSize}
          </span>
        </div>

        {/* 4. PROGRESS / ACTION FOOTER */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: isCompleted ? '#10B981' : 'var(--accent)', display: 'flex', alignItems: 'center', gap: 6 }}>
            {isExporting && !isCompleted && <Loader2 size={15} className="spin" />}
            {isCompleted && <CheckCircle2 size={15} color="#10B981" />}
            <span>{progressStage}</span>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button 
              className="btn-compact" 
              onClick={onClose}
              disabled={isExporting}
            >
              Cancel
            </button>

            <button 
              className="btn-compact-primary"
              onClick={handleExport}
              disabled={isExporting}
            >
              <Download size={15} />
              <span>Export {exportFormat.toUpperCase()}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
