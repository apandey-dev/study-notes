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
  const [pageSize, setPageSize] = useState('A4');
  const [orientation, setOrientation] = useState('portrait'); // 'portrait' | 'landscape'
  const [qualityPreset, setQualityPreset] = useState('standard'); // 'standard' | 'high' | 'print'
  const [preserveNotebookStyle, setPreserveNotebookStyle] = useState(true);

  const [estimatedPages, setEstimatedPages] = useState(1);
  const [estimatedSize, setEstimatedSize] = useState('~4 MB');

  const [isExporting, setIsExporting] = useState(false);
  const [progressStage, setProgressStage] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);

  // Recalculate estimated page count and file size based on notebook height
  useEffect(() => {
    if (paperRef && paperRef.current) {
      const scrollHeight = paperRef.current.scrollHeight || 1000;
      // Standard A4 aspect ratio height at 100% width is ~1120px
      const pageHeightPx = orientation === 'portrait' ? 1120 : 800;
      const pages = Math.max(1, Math.ceil(scrollHeight / pageHeightPx));
      setEstimatedPages(pages);

      const sizeMap = {
        standard: (pages * 2.5).toFixed(1) + ' MB',
        high: (pages * 5.2).toFixed(1) + ' MB',
        print: (pages * 12.5).toFixed(1) + ' MB'
      };
      setEstimatedSize('~' + (sizeMap[qualityPreset] || '4 MB'));
    }
  }, [paperRef, orientation, qualityPreset, pageSize, isOpen]);

  if (!isOpen) return null;

  const defaultExportName = fileName 
    ? fileName.replace(/\.(md|txt)$/i, '') 
    : 'CurrentNote';

  const handleExport = async () => {
    if (!paperRef || !paperRef.current) return;

    setIsExporting(true);
    setIsCompleted(false);

    try {
      // Stage 1: Preparing Document & Cloning
      setProgressStage('Preparing Document...');
      await new Promise(r => setTimeout(r, 200));

      const sourcePaper = paperRef.current;
      const totalHeight = sourcePaper.scrollHeight;
      const totalWidth = sourcePaper.offsetWidth;

      // Clone off-screen for clean, UI-stripped rendering
      const clone = sourcePaper.cloneNode(true);

      // Strip selection handles, resize points, and floating toolbars
      const UI_ELEMENTS_TO_REMOVE = clone.querySelectorAll(
        '.resize-handle, .sticky-note-mini-toolbar, .drag-header-bar, .color-picker-popover, .list-group-popover'
      );
      UI_ELEMENTS_TO_REMOVE.forEach(el => el.remove());

      const SELECTED_WRAPPERS = clone.querySelectorAll('.selected');
      SELECTED_WRAPPERS.forEach(el => {
        el.classList.remove('selected');
        el.style.borderColor = el.classList.contains('sticky-note-card') ? 'rgba(0,0,0,0.08)' : 'transparent';
        el.style.boxShadow = el.classList.contains('sticky-note-card') ? '0 8px 24px rgba(0,0,0,0.12)' : 'none';
      });

      // Explicitly transfer computed background colors and text colors to clone for html2canvas fidelity
      const origNodes = Array.from(sourcePaper.querySelectorAll('*'));
      const cloneNodes = Array.from(clone.querySelectorAll('*'));
      origNodes.forEach((origEl, idx) => {
        const cloneEl = cloneNodes[idx];
        if (!cloneEl) return;
        const computed = window.getComputedStyle(origEl);
        if (computed.backgroundColor && computed.backgroundColor !== 'rgba(0, 0, 0, 0)' && computed.backgroundColor !== 'transparent') {
          cloneEl.style.backgroundColor = computed.backgroundColor;
        }
        if (computed.color) {
          cloneEl.style.color = computed.color;
        }
        if (origEl.classList.contains('sticky-note-card') || origEl.classList.contains('text-block-card')) {
          cloneEl.style.backgroundColor = computed.backgroundColor;
          cloneEl.style.color = computed.color;
          cloneEl.style.opacity = '1';
        }
      });

      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      clone.style.top = '-9999px';
      clone.style.transform = 'none';
      document.body.appendChild(clone);

      const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
      const bgColor = preserveNotebookStyle 
        ? (isDarkMode ? '#252526' : '#FFFFFF') 
        : '#FFFFFF';

      // Quality preset scale & compression configuration
      const configMap = {
        standard: { scale: 2, quality: 0.85, format: 'JPEG' },
        high: { scale: 3, quality: 0.92, format: 'JPEG' },
        print: { scale: 4, quality: 0.98, format: 'PNG' }
      };
      const presetConfig = configMap[qualityPreset] || configMap.standard;

      if (exportFormat === 'png') {
        // FULL TALL INFINITE PNG EXPORT
        setProgressStage('Rendering Full Notebook PNG...');
        const canvas = await html2canvas(clone, {
          scale: presetConfig.scale,
          useCORS: true,
          backgroundColor: bgColor,
          logging: false
        });

        document.body.removeChild(clone);

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
        // PAGINATED INCREMENTAL PDF EXPORT (Infinite notebook pagination)
        setProgressStage('Rendering Paginated PDF...');
        await new Promise(r => setTimeout(r, 200));

        // Render full canvas off-screen
        const fullCanvas = await html2canvas(clone, {
          scale: presetConfig.scale,
          useCORS: true,
          backgroundColor: bgColor,
          logging: false
        });

        document.body.removeChild(clone);

        // Initialize jsPDF
        const pdf = new jsPDF({
          orientation: orientation === 'landscape' ? 'l' : 'p',
          unit: 'mm',
          format: pageSize.toLowerCase() === 'custom' ? 'a4' : pageSize.toLowerCase()
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        // Calculate page slice dimensions in canvas pixel space
        const canvasWidth = fullCanvas.width;
        const canvasHeight = fullCanvas.height;
        const sliceHeightPx = Math.floor((canvasWidth * pdfHeight) / pdfWidth);

        let currentY = 0;
        let pageIndex = 0;

        while (currentY < canvasHeight) {
          pageIndex++;
          setProgressStage(`Processing Page ${pageIndex} of ${estimatedPages}...`);
          await new Promise(r => setTimeout(r, 50));

          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvasWidth;
          const currentSliceH = Math.min(sliceHeightPx, canvasHeight - currentY);
          pageCanvas.height = currentSliceH;

          const ctx = pageCanvas.getContext('2d');
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
      }, 900);
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
              Publish infinite notes with auto-pagination.
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
          <div 
            className={`export-format-card ${exportFormat === 'pdf' ? 'selected' : ''}`}
            onClick={() => !isExporting && setExportFormat('pdf')}
          >
            <FileCode size={24} color={exportFormat === 'pdf' ? '#0078D4' : 'var(--text-muted)'} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>📄 PDF (.pdf)</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Paginated multi-page document</div>
            </div>
          </div>

          <div 
            className={`export-format-card ${exportFormat === 'png' ? 'selected' : ''}`}
            onClick={() => !isExporting && setExportFormat('png')}
          >
            <ImageIcon size={24} color={exportFormat === 'png' ? '#0078D4' : 'var(--text-muted)'} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>🖼 PNG (.png)</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Full tall notebook image</div>
            </div>
          </div>
        </div>

        {/* 2. QUALITY PRESETS & SETTINGS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
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
              <option value="standard">Standard (300 DPI • ~5MB)</option>
              <option value="high">High (600 DPI • ~12MB)</option>
              <option value="print">Print Quality (1200 DPI • Maximum)</option>
            </select>
          </div>

          {/* Paper Size */}
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
              <option value="Custom">Custom</option>
            </select>
          </div>
        </div>

        {/* Orientation & Background Toggle */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16, alignItems: 'center' }}>
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

          <div style={{ paddingTop: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>
              <input 
                type="checkbox"
                checked={preserveNotebookStyle}
                onChange={(e) => setPreserveNotebookStyle(e.target.checked)}
                disabled={isExporting}
                style={{ width: 18, height: 18, accentColor: 'var(--accent)', cursor: 'pointer' }}
              />
              <span>Preserve Notebook Style</span>
            </label>
          </div>
        </div>

        {/* 3. EXPORT METRICS PREVIEW BOX */}
        <div style={{ background: 'var(--border-light)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={16} color="var(--accent)" />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
              {exportFormat === 'pdf' ? `Estimated: ${estimatedPages} PDF ${estimatedPages === 1 ? 'Page' : 'Pages'}` : 'Full Infinite PNG Image'}
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
