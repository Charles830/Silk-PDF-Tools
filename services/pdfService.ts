import { ToolType } from '../types';

// Helper to read file as ArrayBuffer
const readFile = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

// Helper to parse page ranges (1-based user input to 0-based indices)
const parsePageRange = (rangeStr: string, totalPages: number): number[] => {
  const pages = new Set<number>();
  const parts = rangeStr.split(/,|;/);

  parts.forEach(part => {
    const trimmed = part.trim();
    if (!trimmed) return;

    if (trimmed.includes('-')) {
      const [start, end] = trimmed.split('-').map(n => parseInt(n.trim(), 10));
      if (!isNaN(start) && !isNaN(end)) {
        const safeStart = Math.max(1, Math.min(start, end));
        const safeEnd = Math.min(totalPages, Math.max(start, end));
        for (let i = safeStart; i <= safeEnd; i++) {
          pages.add(i - 1);
        }
      }
    } else {
      const pageNum = parseInt(trimmed, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        pages.add(pageNum - 1);
      }
    }
  });

  return Array.from(pages).sort((a, b) => a - b);
};

// Dedicated helper for JPG Preview to avoid processing all files
export const createJpgPreview = async (file: File, options: any): Promise<Uint8Array> => {
  const PDFLib = window.PDFLib;
  if (!PDFLib) throw new Error("PDF Library not loaded.");
  const { PDFDocument } = PDFLib;

  const doc = await PDFDocument.create();
  
  // A4 Dimensions at 72 DPI
  const A4_WIDTH = 595.28;
  const A4_HEIGHT = 841.89;

  const buffer = await readFile(file);
  let image;
  try {
    if (file.type === 'image/jpeg' || file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg')) {
      image = await doc.embedJpg(buffer);
    } else {
      image = await doc.embedPng(buffer);
    }
  } catch (e) {
    // Fallback if type detection fails, try the other
    try {
      image = await doc.embedPng(buffer);
    } catch (e2) {
      image = await doc.embedJpg(buffer);
    }
  }

  const isLandscape = options.orientation === 'landscape';
  const pageWidth = isLandscape ? A4_HEIGHT : A4_WIDTH;
  const pageHeight = isLandscape ? A4_WIDTH : A4_HEIGHT;
  
  let margin = 0;
  if (options.margin === 'small') margin = 20;
  if (options.margin === 'big') margin = 50;

  const availableWidth = pageWidth - (margin * 2);
  const availableHeight = pageHeight - (margin * 2);

  // Calculate scale to fit
  const scale = Math.min(
    availableWidth / image.width,
    availableHeight / image.height
  );
  
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  
  // Center the image
  const x = (pageWidth - drawWidth) / 2;
  const y = (pageHeight - drawHeight) / 2;

  const page = doc.addPage([pageWidth, pageHeight]);
  page.drawImage(image, {
    x: x,
    y: y,
    width: drawWidth,
    height: drawHeight,
  });

  return await doc.save();
};

export const processFiles = async (
  toolType: ToolType, 
  files: File[], 
  options: any = {}
): Promise<{ name: string, data: Uint8Array, mimeType: string }> => {
  
  // Access globals inside the function to ensure they are loaded
  const PDFLib = window.PDFLib;
  const JSZip = window.JSZip;
  const pdfjsLib = window.pdfjsLib;

  if (!PDFLib) throw new Error("PDF Library not loaded. Please refresh the page.");

  const { PDFDocument, rgb, degrees } = PDFLib;

  try {
    switch (toolType) {
      case ToolType.MERGE: {
        const mergedPdf = await PDFDocument.create();
        for (const file of files) {
          const fileBuffer = await readFile(file);
          const pdf = await PDFDocument.load(fileBuffer);
          const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
          copiedPages.forEach((page: any) => mergedPdf.addPage(page));
        }
        const pdfBytes = await mergedPdf.save();
        return {
          name: `merged_silk_${Date.now()}.pdf`,
          data: pdfBytes,
          mimeType: 'application/pdf'
        };
      }

      case ToolType.SPLIT: {
        const fileBuffer = await readFile(files[0]);
        const pdfDoc = await PDFDocument.load(fileBuffer);
        const totalPages = pdfDoc.getPageCount();

        if (options.splitMode === 'all') {
          if (!JSZip) throw new Error("JSZip library not loaded. Please refresh the page.");
          const zip = new JSZip();
          const padLength = Math.max(3, String(totalPages).length);

          for (let i = 0; i < totalPages; i++) {
            const newPdf = await PDFDocument.create();
            const copiedPages = await newPdf.copyPages(pdfDoc, [i]);
            const [copiedPage] = copiedPages;
            newPdf.addPage(copiedPage);
            
            const pdfBytes = await newPdf.save();
            const pageNum = String(i + 1).padStart(padLength, '0');
            zip.file(`page_${pageNum}.pdf`, pdfBytes);
          }
          
          const zipContent = await zip.generateAsync({ type: "uint8array" });
          return {
            name: `split_all_pages_silk_${Date.now()}.zip`,
            data: zipContent,
            mimeType: 'application/zip'
          };
        } else {
          const rangeIndices = parsePageRange(options.range || "", totalPages);
          if (rangeIndices.length === 0) throw new Error("Invalid page range or no pages selected.");

          const newPdf = await PDFDocument.create();
          const copiedPages = await newPdf.copyPages(pdfDoc, rangeIndices);
          copiedPages.forEach((page: any) => newPdf.addPage(page));
          
          const pdfBytes = await newPdf.save();
          return {
            name: `split_range_silk_${Date.now()}.pdf`,
            data: pdfBytes,
            mimeType: 'application/pdf'
          };
        }
      }

      case ToolType.COMPRESS: {
         const level = options.compressionLevel || 'standard';
         
         if (level === 'standard') {
            // Standard: Just load and save. PDF-Lib automatically compacts the file structure.
            const buffer = await readFile(files[0]);
            const pdfDoc = await PDFDocument.load(buffer);
            const pdfBytes = await pdfDoc.save();
            return {
              name: `compressed_silk_${Date.now()}.pdf`,
              data: pdfBytes,
              mimeType: 'application/pdf'
            };
         } else {
            // Strong/Extreme: Rasterize pages to JPEG images and place in new PDF
            // This is "destructive" but effective for scans or complex vectors
            if (!pdfjsLib) throw new Error("PDF.js not loaded.");
            if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
               pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            }

            const buffer = await readFile(files[0]);
            const pdfProxy = await pdfjsLib.getDocument({ data: buffer }).promise;
            const numPages = pdfProxy.numPages;
            
            const newPdf = await PDFDocument.create();
            
            // Configuration for compression levels
            // Strong: Scale 1.5 (good read quality), JPEG 0.7
            // Extreme: Scale 1.0 (screen quality), JPEG 0.5
            let scale = 1.5;
            let quality = 0.7;
            
            if (level === 'extreme') {
               scale = 1.0;
               quality = 0.5;
            }

            for (let i = 1; i <= numPages; i++) {
               const page = await pdfProxy.getPage(i);
               const viewport = page.getViewport({ scale: scale });
               
               const canvas = document.createElement('canvas');
               const ctx = canvas.getContext('2d');
               canvas.width = viewport.width;
               canvas.height = viewport.height;
               
               await page.render({ canvasContext: ctx!, viewport: viewport }).promise;
               
               const imgData = canvas.toDataURL('image/jpeg', quality);
               const img = await newPdf.embedJpg(imgData);
               
               // Restore original dimensions for the PDF page
               const originalViewport = page.getViewport({ scale: 1.0 });
               const newPage = newPdf.addPage([originalViewport.width, originalViewport.height]);
               
               newPage.drawImage(img, {
                 x: 0,
                 y: 0,
                 width: originalViewport.width,
                 height: originalViewport.height
               });
            }

            const pdfBytes = await newPdf.save();
            return {
              name: `compressed_silk_${Date.now()}.pdf`,
              data: pdfBytes,
              mimeType: 'application/pdf'
            };
         }
      }

      case ToolType.JPG_TO_PDF: {
        const doc = await PDFDocument.create();
        
        // A4 Dimensions at 72 DPI
        const A4_WIDTH = 595.28;
        const A4_HEIGHT = 841.89;

        for (const file of files) {
          const buffer = await readFile(file);
          let image;
          
          // Improved Mime Type handling
          try {
            if (file.type === 'image/jpeg' || file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg')) {
              image = await doc.embedJpg(buffer);
            } else {
              image = await doc.embedPng(buffer);
            }
          } catch (e) {
            // Fallback
             try {
              image = await doc.embedPng(buffer);
            } catch (e2) {
              image = await doc.embedJpg(buffer);
            }
          }
          
          const isLandscape = options.orientation === 'landscape';
          const pageWidth = isLandscape ? A4_HEIGHT : A4_WIDTH;
          const pageHeight = isLandscape ? A4_WIDTH : A4_HEIGHT;
          
          let margin = 0;
          if (options.margin === 'small') margin = 20;
          if (options.margin === 'big') margin = 50;

          const availableWidth = pageWidth - (margin * 2);
          const availableHeight = pageHeight - (margin * 2);

          // Calculate scale to fit
          const scale = Math.min(
            availableWidth / image.width,
            availableHeight / image.height
          );
          
          const drawWidth = image.width * scale;
          const drawHeight = image.height * scale;
          
          // Center the image
          const x = (pageWidth - drawWidth) / 2;
          const y = (pageHeight - drawHeight) / 2;

          const page = doc.addPage([pageWidth, pageHeight]);
          page.drawImage(image, {
            x: x,
            y: y,
            width: drawWidth,
            height: drawHeight,
          });
        }
        const pdfBytes = await doc.save();
        return {
          name: `images_silk_${Date.now()}.pdf`,
          data: pdfBytes,
          mimeType: 'application/pdf'
        };
      }

      case ToolType.SIGN: {
        const pdfBuffer = await readFile(files[0]);
        const pdfDoc = await PDFDocument.load(pdfBuffer);
        
        if (options.signatureDataUrl) {
           const signatureImage = await pdfDoc.embedPng(options.signatureDataUrl);
           const pages = pdfDoc.getPages();
           
           // Use the user-selected page index, default to 0
           const pageIndex = options.targetPageIndex || 0;
           // Ensure index is valid
           const targetPage = pages[pageIndex] || pages[0];
           
           const { width: pageWidth, height: pageHeight } = targetPage.getSize();
           
           // Determine dimensions from frontend ratio (0-1) or defaults
           // Default width ratio 0.3 if not set
           const widthRatio = options.widthRatio || 0.3;
           const sigWidth = widthRatio * pageWidth;
           
           // Maintain aspect ratio
           const sigHeight = (signatureImage.height / signatureImage.width) * sigWidth;
           
           // Position relative to top-left (0-1)
           // Default to center
           const xRatio = options.x !== undefined ? options.x : 0.35;
           const yRatio = options.y !== undefined ? options.y : 0.35;

           const xPos = xRatio * pageWidth;
           // PDF Y is bottom-left. Frontend Y is top-left.
           const yPos = pageHeight - (yRatio * pageHeight) - sigHeight;
           
           targetPage.drawImage(signatureImage, {
             x: xPos,
             y: yPos, 
             width: sigWidth,
             height: sigHeight,
           });
        }

        const pdfBytes = await pdfDoc.save();
        return {
          name: `signed_silk_${Date.now()}.pdf`,
          data: pdfBytes,
          mimeType: 'application/pdf'
        };
      }
      
      case ToolType.PDF_TO_WORD: {
        // High-Fidelity PDF to HTML/Word conversion using Absolute Positioning
        if (!pdfjsLib) throw new Error("PDF.js not loaded.");
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
           pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
        
        const buffer = await readFile(files[0]);
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
        const totalPages = pdf.numPages;
        
        let htmlContent = `
          <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
          <head>
            <meta charset="utf-8">
            <title>Converted Document</title>
            <!-- Basic Word-compatible styles -->
          </head>
          <body>
        `;

        for (let i = 1; i <= totalPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.0 });
          const textContent = await page.getTextContent();
          
          // Create a container for the page
          // pt to px conversion (1pt = 1.33px approx, but PDF.js viewport handles this)
          // We use pt for Word compatibility primarily
          htmlContent += `
            <div style="position: relative; width: ${viewport.width}px; height: ${viewport.height}px; page-break-after: always; margin-bottom: 20px; border: 1px solid #eee;">
          `;

          // Render page to canvas for background image (captures all graphics/images)
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          await page.render({ canvasContext: context!, viewport: viewport }).promise;
          const imgData = canvas.toDataURL('image/jpeg', 0.8);
          
          // Add background image
          htmlContent += `
            <img src="${imgData}" style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; z-index: -1;" />
          `;

          // Process text items
          for (const item of textContent.items) {
             const tx = item.transform; // [scaleX, skewY, skewX, scaleY, x, y]
             
             // Extract font size approx from transform or item height
             const fontSize = Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1]);
             
             // PDF y is from bottom, HTML from top
             const x = tx[4];
             const y = viewport.height - tx[5] - fontSize; 

             // Simple font fallback
             const fontFamily = "Times New Roman, serif"; 
             
             htmlContent += `
               <div style="
                 position: absolute; 
                 left: ${x}px; 
                 top: ${y}px; 
                 font-size: ${fontSize}px;
                 font-family: ${fontFamily};
                 white-space: nowrap;
                 pointer-events: none;
               ">
                 ${item.str}
               </div>
             `;
          }
          
          htmlContent += `</div>`;
        }
        
        htmlContent += "</body></html>";
        
        const encoder = new TextEncoder();
        return {
          name: `converted_silk_${Date.now()}.doc`, 
          data: encoder.encode(htmlContent),
          mimeType: 'application/msword'
        };
      }

      case ToolType.EDIT: {
        // Full Page Watermarking (Tiled)
        const buffer = await readFile(files[0]);
        const pdfDoc = await PDFDocument.load(buffer);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const { width, height } = firstPage.getSize();
        
        if (options.text) {
          const textSize = options.fontSize || 48;
          // Loop to create a grid pattern
          const rows = 4;
          const cols = 3;
          const xStep = width / cols;
          const yStep = height / rows;

          pages.forEach(page => {
             for (let r = 0; r < rows; r++) {
               for (let c = 0; c < cols; c++) {
                  page.drawText(options.text, {
                    x: (c * xStep) + 20,
                    y: (r * yStep) + 20,
                    size: textSize,
                    color: rgb(0.8, 0.8, 0.8),
                    opacity: 0.3,
                    rotate: degrees(45),
                  });
               }
             }
          });
        }
        
        const pdfBytes = await pdfDoc.save();
         return {
          name: `watermarked_silk_${Date.now()}.pdf`,
          data: pdfBytes,
          mimeType: 'application/pdf'
        };
      }

      default:
        throw new Error("Operation not supported or tool not implemented.");
    }
  } catch (err: any) {
    console.error(err);
    // Propagate the specific error message to the UI
    throw new Error(err.message || "Failed to process file.");
  }
};