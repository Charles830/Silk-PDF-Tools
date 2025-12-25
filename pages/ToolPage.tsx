import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TOOLS } from '../constants';
import FileUploader from '../components/FileUploader';
import { ToolType } from '../types';
import { processFiles, createJpgPreview } from '../services/pdfService';
import { ArrowLeft, Download, Loader2, Upload, ChevronLeft, ChevronRight, Scaling, X, RotateCw, LayoutTemplate, Minimize2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

const ToolPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useApp();
  
  // Find tool config (static) and tool data (localized)
  const toolConfig = Object.values(TOOLS).find(t => t.id === id);
  const toolData = toolConfig ? t.tools[toolConfig.id] : null;
  
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [resultFile, setResultFile] = useState<{name: string, data: Uint8Array, mimeType: string} | null>(null);
  
  // Specific State for options
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [sigMode, setSigMode] = useState<'draw' | 'upload'>('draw');
  const [editText, setEditText] = useState<string>('Silk PDF Watermark');
  const [editFontSize, setEditFontSize] = useState<number>(48);
  
  // JPG to PDF State
  const [jpgOrientation, setJpgOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [jpgMargin, setJpgMargin] = useState<'none' | 'small' | 'big'>('small');
  
  // Compress State
  const [compressionLevel, setCompressionLevel] = useState<'standard' | 'strong' | 'extreme'>('standard');

  // Signature Positioning & Page Nav State
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [sigPosition, setSigPosition] = useState({ x: 0.35, y: 0.35 }); // relative 0-1
  const [sigWidthRatio, setSigWidthRatio] = useState(0.3); // signature width relative to container width
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const sigRef = useRef<HTMLImageElement>(null);
  const [isDraggingSig, setIsDraggingSig] = useState(false);
  const [isResizingSig, setIsResizingSig] = useState(false);
  
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pdfDocRef = useRef<any>(null); // Store loaded PDF document proxy
  
  // Split State
  const [splitMode, setSplitMode] = useState<'range' | 'all'>('range');
  const [splitRange, setSplitRange] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Mobile Tab State (Settings vs Preview)
  const [activeMobileTab, setActiveMobileTab] = useState<'settings' | 'preview'>('settings');

  useEffect(() => {
    // Reset state when tool changes
    setFiles([]);
    setIsProcessing(false);
    setIsComplete(false);
    setResultFile(null);
    setSignatureUrl(null);
    setSplitMode('range');
    setSplitRange('');
    setPdfPreviewUrl(null);
    setSigPosition({ x: 0.35, y: 0.35 });
    setSigWidthRatio(0.3);
    setNumPages(0);
    setCurrentPage(1);
    pdfDocRef.current = null;
    setEditText('Silk PDF Watermark');
    setEditFontSize(48);
    setJpgOrientation('portrait');
    setJpgMargin('small');
    setCompressionLevel('standard');
    setActiveMobileTab('settings');
  }, [id]);

  // Load PDF Document when file is selected for Merge/Split/Sign/Edit
  useEffect(() => {
    // We enable preview for almost all tools now to improve UX
    const supportsPreview = [ToolType.SIGN, ToolType.EDIT, ToolType.SPLIT, ToolType.MERGE].includes(toolConfig?.id as ToolType);
    
    if (supportsPreview && files.length > 0) {
      const loadPdfDoc = async () => {
        try {
          const buffer = await files[0].arrayBuffer();
          const pdfjsLib = window.pdfjsLib;
          if (!pdfjsLib) return;
          
          if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          }
          
          const loadingTask = pdfjsLib.getDocument({ data: buffer });
          const pdf = await loadingTask.promise;
          pdfDocRef.current = pdf;
          setNumPages(pdf.numPages);
          setCurrentPage(1);
          renderPage(1); // Initial render
        } catch (e) {
          console.error("PDF Load failed", e);
        }
      };
      loadPdfDoc();
    }
  }, [files, toolConfig?.id]);

  // Special Effect for JPG Preview Generation
  useEffect(() => {
    if (toolConfig?.id === ToolType.JPG_TO_PDF && files.length > 0) {
      const generatePreview = async () => {
        try {
           setPdfPreviewUrl(null); // Clear to show loading/update
           // Generate a temporary PDF for the first image with current settings
           const pdfBytes = await createJpgPreview(files[0], { 
             orientation: jpgOrientation, 
             margin: jpgMargin 
           });

           // Load this PDF into pdf.js for rendering
           const pdfjsLib = window.pdfjsLib;
           if (!pdfjsLib) return;
           if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
              pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
           }

           const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
           const pdf = await loadingTask.promise;
           pdfDocRef.current = pdf;
           setNumPages(pdf.numPages);
           setCurrentPage(1);
           // Render this temp PDF
           const page = await pdf.getPage(1);
           const viewport = page.getViewport({ scale: 1 });
           const canvas = document.createElement('canvas');
           const context = canvas.getContext('2d');
           canvas.height = viewport.height;
           canvas.width = viewport.width;
           await page.render({ canvasContext: context!, viewport: viewport }).promise;
           setPdfPreviewUrl(canvas.toDataURL());

        } catch (e) {
          console.error("JPG Preview generation failed", e);
        }
      };
      generatePreview();
    }
  }, [files, toolConfig?.id, jpgOrientation, jpgMargin]);


  // Render specific page
  const renderPage = async (pageNum: number) => {
    if (!pdfDocRef.current) return;
    try {
      setPdfPreviewUrl(null); // Clear previous to show loading state if needed
      const page = await pdfDocRef.current.getPage(pageNum);
      
      const viewport = page.getViewport({ scale: 1 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      await page.render({ canvasContext: context!, viewport: viewport }).promise;
      setPdfPreviewUrl(canvas.toDataURL());
    } catch (e) {
      console.error("Page render failed", e);
    }
  };

  const changePage = (delta: number) => {
    const newPage = Math.max(1, Math.min(numPages, currentPage + delta));
    if (newPage !== currentPage) {
      setCurrentPage(newPage);
      renderPage(newPage);
    }
  };

  if (!toolConfig || !toolData) {
    return <div className="p-10 text-center dark:text-white">{t.common.toolNotFound}</div>;
  }

  const handleProcess = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      let options: any = {};
      
      if (toolConfig.id === ToolType.SIGN && signatureUrl) {
        options.signatureDataUrl = signatureUrl;
        options.x = sigPosition.x;
        options.y = sigPosition.y;
        options.widthRatio = sigWidthRatio;
        options.targetPageIndex = currentPage - 1; // 0-based index for backend
      }
      
      if (toolConfig.id === ToolType.EDIT) {
        options.text = editText;
        options.fontSize = editFontSize;
      }

      if (toolConfig.id === ToolType.SPLIT) {
        options.splitMode = splitMode;
        options.range = splitRange;
      }

      if (toolConfig.id === ToolType.JPG_TO_PDF) {
        options.orientation = jpgOrientation;
        options.margin = jpgMargin;
      }
      
      if (toolConfig.id === ToolType.COMPRESS) {
        options.compressionLevel = compressionLevel;
      }

      const result = await processFiles(toolConfig.id, files, options);
      setResultFile(result);
      setIsComplete(true);
    } catch (error: any) {
      alert(error.message || t.common.error);
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (resultFile) {
      try {
        const blob = new Blob([resultFile.data], { type: resultFile.mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = resultFile.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (e) {
        console.error("Download failed:", e);
        if (window.download) {
           window.download(resultFile.data, resultFile.name, resultFile.mimeType);
        }
      }
    }
  };

  // --- Signature Canvas Drawing Logic ---
  
  // Helper to normalize Mouse and Touch events
  const getClientPos = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
     if ('touches' in e && e.touches.length > 0) {
        return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
     }
     if ('changedTouches' in e && e.changedTouches.length > 0) {
        return { clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY };
     }
     return { clientX: (e as React.MouseEvent).clientX, clientY: (e as React.MouseEvent).clientY };
  };

  // Calculate coordinates relative to the canvas internal resolution
  const getCanvasCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const pos = getClientPos(e);
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (pos.clientX - rect.left) * scaleX,
      y: (pos.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    // Prevent scrolling on touch
    if (e.type === 'touchstart') {
       // e.preventDefault(); // React synthetic events issue, relying on touch-none CSS usually better but let's try
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set line properties
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#000000';

    setIsDrawing(true);
    const { x, y } = getCanvasCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    // Prevent scrolling when drawing
    // if (e.type === 'touchmove') e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { x, y } = getCanvasCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  
  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (canvasRef.current) {
      setSignatureUrl(canvasRef.current.toDataURL());
    }
  };
  
  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setSignatureUrl(null);
  };

  const handleSigUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
           setSignatureUrl(ev.target.result as string);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // --- Signature Drag & Resize Logic (Unified Mouse/Touch) ---
  
  const handleSigDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    // e.preventDefault(); 
    e.stopPropagation();
    setIsDraggingSig(true);
  };

  const handleSigResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
    // e.preventDefault();
    e.stopPropagation();
    setIsResizingSig(true);
  };
  
  const handlePreviewMove = (e: React.MouseEvent | React.TouchEvent) => {
    const container = previewContainerRef.current;
    if (!container) return;
    
    // Only process if drawing
    if (!isDraggingSig && !isResizingSig) return;
    
    // Prevent scrolling while manipulating elements
    if (e.type === 'touchmove') {
       // e.preventDefault(); 
    }

    const rect = container.getBoundingClientRect();
    const pos = getClientPos(e);
    
    const relX = (pos.clientX - rect.left) / rect.width;
    const relY = (pos.clientY - rect.top) / rect.height;
    
    if (isDraggingSig) {
       // Constrain within bounds 0-1
       const x = Math.max(0, Math.min(0.9, relX));
       const y = Math.max(0, Math.min(0.9, relY));
       setSigPosition({ x, y });
    }

    if (isResizingSig && sigRef.current) {
       // Calculate new width ratio based on mouse/touch position relative to image left
       const currentRight = pos.clientX - rect.left;
       const currentLeft = sigPosition.x * rect.width;
       const newWidthPx = currentRight - currentLeft;
       const newWidthRatio = Math.max(0.1, Math.min(0.9, newWidthPx / rect.width));
       setSigWidthRatio(newWidthRatio);
    }
  };
  
  const handlePreviewEnd = () => {
    setIsDraggingSig(false);
    setIsResizingSig(false);
  };


  // --- Render Layout ---
  
  const showWorkspace = files.length > 0 && !isComplete;
  const showPreviewColumn = [ToolType.SIGN, ToolType.EDIT, ToolType.SPLIT, ToolType.MERGE, ToolType.JPG_TO_PDF].includes(toolConfig.id as ToolType);

  return (
    <div 
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 w-full" 
      // Add global listeners for drag/resize end to ensure we catch release outside element
      onMouseUp={handlePreviewEnd} 
      onMouseLeave={handlePreviewEnd}
      onTouchEnd={handlePreviewEnd}
      // Add global move listeners for smooth dragging
      onMouseMove={handlePreviewMove}
      onTouchMove={handlePreviewMove}
    >
      <button 
        onClick={() => {
           if (showWorkspace) {
             // If in workspace, back acts as reset
             setFiles([]);
           } else {
             navigate('/');
           }
        }} 
        className="flex items-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors mb-6 font-medium"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        {showWorkspace ? t.common.startOver : t.common.backToTools}
      </button>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 sm:mb-8">
         <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl bg-white dark:bg-slate-800 shadow-sm ${toolConfig.color}`}>
              {/* Icon rendering handled by ToolPage generic wrapper or just header */}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white">{toolData.title}</h1>
              <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1 max-w-xl">{toolData.description}</p>
            </div>
         </div>
      </div>

      {!showWorkspace ? (
        <div className="animate-fadeIn">
          <FileUploader 
            accept={toolConfig.accept} 
            multiple={toolConfig.multiple}
            files={files}
            setFiles={setFiles}
          />
        </div>
      ) : (
        /* Workspace Layout */
        <div className="animate-fadeIn">
            
          {/* Mobile Tab Switcher */}
          {showPreviewColumn && (
            <div className="flex lg:hidden bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm mb-6 border border-slate-100 dark:border-slate-700">
               <button 
                 onClick={() => setActiveMobileTab('settings')}
                 className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeMobileTab === 'settings' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
               >
                 Settings
               </button>
               <button 
                 onClick={() => setActiveMobileTab('preview')}
                 className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeMobileTab === 'preview' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
               >
                 Preview
               </button>
            </div>
          )}

          <div className={`grid grid-cols-1 ${showPreviewColumn ? 'lg:grid-cols-2' : ''} gap-8`}>
            
            {/* Left Column: Controls & File List */}
            <div className={`${showPreviewColumn && activeMobileTab === 'preview' ? 'hidden lg:block' : 'block'} space-y-6`}>
              
              {/* Tool Specific Controls */}
              
              {/* SPLIT Controls */}
              {toolConfig.id === ToolType.SPLIT && (
                <div className="bg-slate-50 dark:bg-slate-700/50 p-6 rounded-2xl mb-6">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-4">{t.toolSpecific.splitBtn}</h3>
                  
                  <div className="flex flex-col gap-3">
                      <label className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 cursor-pointer hover:border-violet-500 transition-colors">
                        <input 
                          type="radio" 
                          name="splitMode" 
                          checked={splitMode === 'range'}
                          onChange={() => setSplitMode('range')}
                          className="text-violet-600 focus:ring-violet-500"
                        />
                        <span className="text-slate-700 dark:text-slate-200">{t.toolSpecific.splitModes.range}</span>
                      </label>
                      
                      {splitMode === 'range' && (
                        <div className="ml-7 animate-fadeIn">
                          <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">
                            {t.toolSpecific.splitModes.rangeLabel}
                          </label>
                          <input 
                            type="text" 
                            value={splitRange}
                            onChange={(e) => setSplitRange(e.target.value)}
                            placeholder={t.toolSpecific.splitModes.rangePlaceholder}
                            className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none"
                          />
                        </div>
                      )}

                      <label className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 cursor-pointer hover:border-violet-500 transition-colors">
                        <input 
                          type="radio" 
                          name="splitMode" 
                          checked={splitMode === 'all'}
                          onChange={() => setSplitMode('all')}
                          className="text-violet-600 focus:ring-violet-500"
                        />
                        <span className="text-slate-700 dark:text-slate-200">{t.toolSpecific.splitModes.extractAll}</span>
                      </label>
                  </div>
                </div>
              )}

              {/* COMPRESS Controls */}
              {toolConfig.id === ToolType.COMPRESS && (
                <div className="bg-slate-50 dark:bg-slate-700/50 p-6 rounded-2xl mb-6">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Minimize2 className="w-5 h-5 text-teal-500" />
                    {t.toolSpecific.compressOptions.level}
                  </h3>
                  
                  <div className="flex flex-col gap-3">
                      <label className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 cursor-pointer hover:border-teal-500 transition-colors">
                        <input 
                          type="radio" 
                          name="compressionLevel" 
                          checked={compressionLevel === 'standard'}
                          onChange={() => setCompressionLevel('standard')}
                          className="text-teal-600 focus:ring-teal-500"
                        />
                        <span className="text-slate-700 dark:text-slate-200">{t.toolSpecific.compressOptions.standard}</span>
                      </label>
                      
                      <label className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 cursor-pointer hover:border-teal-500 transition-colors">
                        <input 
                          type="radio" 
                          name="compressionLevel" 
                          checked={compressionLevel === 'strong'}
                          onChange={() => setCompressionLevel('strong')}
                          className="text-teal-600 focus:ring-teal-500"
                        />
                        <span className="text-slate-700 dark:text-slate-200">{t.toolSpecific.compressOptions.strong}</span>
                      </label>

                      <label className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 cursor-pointer hover:border-teal-500 transition-colors">
                        <input 
                          type="radio" 
                          name="compressionLevel" 
                          checked={compressionLevel === 'extreme'}
                          onChange={() => setCompressionLevel('extreme')}
                          className="text-teal-600 focus:ring-teal-500"
                        />
                        <span className="text-slate-700 dark:text-slate-200">{t.toolSpecific.compressOptions.extreme}</span>
                      </label>
                  </div>
                </div>
              )}

              {/* SIGN Controls */}
              {toolConfig.id === ToolType.SIGN && (
                <div className="bg-slate-50 dark:bg-slate-700/50 p-6 rounded-2xl mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900 dark:text-white">Create Signature</h3>
                    <div className="flex bg-slate-200 dark:bg-slate-600 rounded-lg p-1">
                      <button 
                        onClick={() => setSigMode('draw')}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${sigMode === 'draw' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500 dark:text-slate-300'}`}
                      >
                        {t.toolSpecific.drawSignature}
                      </button>
                      <button 
                        onClick={() => setSigMode('upload')}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${sigMode === 'upload' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500 dark:text-slate-300'}`}
                      >
                        {t.toolSpecific.uploadSignature}
                      </button>
                    </div>
                  </div>
                  
                  {sigMode === 'draw' ? (
                    <div className="flex flex-col gap-3">
                      <canvas 
                        ref={canvasRef}
                        width={600}
                        height={300}
                        className="w-full h-40 bg-white rounded-xl border border-slate-300 dark:border-slate-600 cursor-crosshair touch-none"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        // Touch events for mobile
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                      />
                      <div className="flex justify-end">
                        <button onClick={clearSignature} className="text-sm text-red-500 hover:text-red-600 font-medium">
                          {t.toolSpecific.clearSignature}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-40 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl flex flex-col items-center justify-center bg-white dark:bg-slate-800 relative">
                      {signatureUrl ? (
                        <div className="relative w-full h-full p-2 flex items-center justify-center">
                            <img src={signatureUrl} alt="Signature" className="max-h-full max-w-full object-contain" />
                            <button 
                              onClick={clearSignature}
                              className="absolute top-2 right-2 p-1 bg-red-100 text-red-500 rounded-full hover:bg-red-200"
                            >
                              <X className="w-4 h-4" />
                            </button>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-slate-400 mb-2" />
                          <span className="text-sm text-slate-500">{t.toolSpecific.uploadSignature}</span>
                          <input type="file" accept="image/*" onChange={handleSigUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </>
                      )}
                    </div>
                  )}
                  
                  <p className="text-xs text-slate-500 mt-4 text-center">
                    {signatureUrl ? t.toolSpecific.dragSignature : "Draw or upload first"}
                  </p>
                </div>
              )}

              {/* EDIT (Watermark) Controls */}
              {toolConfig.id === ToolType.EDIT && (
                <div className="bg-slate-50 dark:bg-slate-700/50 p-6 rounded-2xl mb-6">
                  <div className="mb-4">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        {t.toolSpecific.watermarkLabel}
                      </label>
                      <input 
                        type="text" 
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-yellow-500 outline-none"
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        {t.toolSpecific.fontSizeLabel} ({editFontSize}px)
                      </label>
                      <input 
                        type="range" 
                        min="12"
                        max="120"
                        step="4"
                        value={editFontSize}
                        onChange={(e) => setEditFontSize(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                      />
                  </div>
                </div>
              )}
              
              {/* JPG Options Controls */}
              {toolConfig.id === ToolType.JPG_TO_PDF && (
                <div className="bg-slate-50 dark:bg-slate-700/50 p-6 rounded-2xl mb-6">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <RotateCw className="w-4 h-4 text-orange-500" />
                    {t.toolSpecific.jpgOptions.orientation}
                  </h3>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <button 
                      onClick={() => setJpgOrientation('portrait')}
                      className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${jpgOrientation === 'portrait' ? 'bg-orange-50 border-orange-500 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300'}`}
                    >
                      {t.toolSpecific.jpgOptions.portrait}
                    </button>
                    <button 
                      onClick={() => setJpgOrientation('landscape')}
                      className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${jpgOrientation === 'landscape' ? 'bg-orange-50 border-orange-500 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300'}`}
                    >
                      {t.toolSpecific.jpgOptions.landscape}
                    </button>
                  </div>
                  
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <LayoutTemplate className="w-4 h-4 text-orange-500" />
                    {t.toolSpecific.jpgOptions.margin}
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {['none', 'small', 'big'].map((m) => (
                      <button 
                        key={m}
                        onClick={() => setJpgMargin(m as any)}
                        className={`py-2 px-1 rounded-lg border text-xs font-medium transition-all ${jpgMargin === m ? 'bg-orange-50 border-orange-500 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300'}`}
                      >
                        {t.toolSpecific.jpgOptions[m as keyof typeof t.toolSpecific.jpgOptions]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Selected Files</h3>
                <FileUploader 
                  accept={toolConfig.accept}
                  multiple={toolConfig.multiple}
                  files={files}
                  setFiles={setFiles}
                  title=" "
                />
              </div>
              
              <button 
                onClick={handleProcess}
                disabled={isProcessing || (toolConfig.id === ToolType.SIGN && !signatureUrl)}
                className="w-full py-4 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-pink-500/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {t.common.processing}
                  </>
                ) : t.common.processFile}
              </button>
            </div>
            
            {/* Right Column: Preview Area (Hidden on mobile if Settings tab active) */}
            {showPreviewColumn && (
              <div className={`${activeMobileTab === 'settings' ? 'hidden lg:flex' : 'flex'} bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl p-4 flex-col min-h-[500px] border border-slate-200 dark:border-slate-700 h-full`}>
                  
                  {/* Page Navigation for Multi-page PDFs (Sign, Edit, Split, Merge) */}
                  {toolConfig.id !== ToolType.JPG_TO_PDF && numPages > 0 && (
                    <div className="flex items-center justify-center gap-4 mb-4 bg-white dark:bg-slate-800 p-2 rounded-xl shadow-sm">
                      <button 
                        onClick={() => changePage(-1)}
                        disabled={currentPage <= 1}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded disabled:opacity-30"
                        title={t.toolSpecific.prevPage}
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <span className="text-sm font-medium tabular-nums text-slate-700 dark:text-slate-200">
                          {t.toolSpecific.pageOf.replace('{current}', String(currentPage)).replace('{total}', String(numPages))}
                      </span>
                      <button 
                        onClick={() => changePage(1)}
                        disabled={currentPage >= numPages}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded disabled:opacity-30"
                        title={t.toolSpecific.nextPage}
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  )}

                  <div 
                    ref={previewContainerRef}
                    className="flex-grow flex items-center justify-center relative overflow-hidden bg-slate-200/50 dark:bg-slate-900/50 rounded-xl touch-none" // touch-none prevents scrolling while dragging
                  >
                    {pdfPreviewUrl ? (
                        <div className="relative shadow-2xl">
                          <img 
                            src={pdfPreviewUrl} 
                            alt="PDF Preview" 
                            className="max-w-full max-h-[600px] object-contain bg-white" 
                            draggable={false}
                          />
                          
                          {/* Overlays */}
                          
                          {/* Signature Overlay */}
                          {toolConfig.id === ToolType.SIGN && signatureUrl && (
                            <div 
                              className="absolute border-2 border-dashed border-violet-500 cursor-move group hover:bg-violet-500/10"
                              style={{
                                left: `${sigPosition.x * 100}%`,
                                top: `${sigPosition.y * 100}%`,
                                width: `${sigWidthRatio * 100}%`,
                                // Aspect ratio handled by image content usually, but here strict for container
                              }}
                              onMouseDown={handleSigDragStart}
                              onTouchStart={handleSigDragStart}
                            >
                                <img src={signatureUrl} alt="Sig" className="w-full h-auto pointer-events-none" ref={sigRef} />
                                
                                {/* Resize Handle */}
                                <div 
                                  className="absolute -bottom-2 -right-2 w-8 h-8 bg-violet-500 rounded-full cursor-nwse-resize opacity-50 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg"
                                  onMouseDown={handleSigResizeStart}
                                  onTouchStart={handleSigResizeStart}
                                >
                                   <Scaling className="w-4 h-4 text-white" />
                                </div>
                            </div>
                          )}

                          {/* Watermark Overlay (Visual Simulation) */}
                          {toolConfig.id === ToolType.EDIT && (
                              <div className="absolute inset-0 overflow-hidden pointer-events-none flex flex-wrap content-start">
                                {Array.from({ length: 12 }).map((_, i) => (
                                  <div key={i} className="w-1/3 h-1/4 flex items-center justify-center opacity-30">
                                      <span 
                                        className="text-slate-400 font-bold transform -rotate-45 whitespace-nowrap"
                                        style={{ fontSize: `${editFontSize * 0.5}px` }} // Scale down slightly for preview
                                      >
                                        {editText}
                                      </span>
                                  </div>
                                ))}
                              </div>
                          )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center text-slate-400">
                          <Loader2 className="w-8 h-8 animate-spin mb-2" />
                          <span className="text-sm">Loading Preview...</span>
                        </div>
                    )}
                  </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Result Modal / Overlay */}
      {isComplete && resultFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl transform transition-all scale-100">
             <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400`}>
                <Download className="w-8 h-8" />
             </div>
             <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{t.common.readyMessage}</h2>
             <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
               {(resultFile.data.byteLength / 1024 / 1024).toFixed(2)} MB
             </p>
             
             <div className="space-y-3">
               <button 
                 onClick={handleDownload}
                 className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold shadow-lg shadow-violet-500/30 transition-transform active:scale-95 flex items-center justify-center"
               >
                 <Download className="w-5 h-5 mr-2" />
                 {t.common.downloadFile}
               </button>
               <button 
                 onClick={() => { setIsComplete(false); setFiles([]); }}
                 className="w-full py-3 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white font-medium"
               >
                 {t.common.startOver}
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolPage;