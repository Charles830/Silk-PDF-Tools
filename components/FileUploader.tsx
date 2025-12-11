import React, { useCallback, useState } from 'react';
import { UploadCloud, File as FileIcon, X, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

interface FileUploaderProps {
  accept: string;
  multiple: boolean;
  files: File[];
  setFiles: (files: File[]) => void;
  title?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({ 
  accept, 
  multiple, 
  files, 
  setFiles,
  title 
}) => {
  const { t } = useApp();
  const [isDraggingOverDropzone, setIsDraggingOverDropzone] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // --- Dropzone Handlers ---

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverDropzone(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverDropzone(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverDropzone(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length === 0) return;

    if (multiple) {
      setFiles([...files, ...droppedFiles]);
    } else {
      setFiles([droppedFiles[0]]);
    }
  }, [files, multiple, setFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      if (multiple) {
        setFiles([...files, ...selectedFiles]);
      } else {
        setFiles([selectedFiles[0]]);
      }
    }
  }, [files, multiple, setFiles]);

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === files.length - 1) return;

    const newFiles = [...files];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap
    [newFiles[index], newFiles[targetIndex]] = [newFiles[targetIndex], newFiles[index]];
    setFiles(newFiles);
  };

  // --- Sorting (Reordering) Handlers ---

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    // Required for Firefox
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverItem = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    // Only reorder if multiple files, dragging is active, and index changed
    if (!multiple || draggedIndex === null || draggedIndex === index) return;
    
    const newFiles = [...files];
    const draggedFile = newFiles[draggedIndex];
    
    // Remove from old index
    newFiles.splice(draggedIndex, 1);
    // Insert at new index
    newFiles.splice(index, 0, draggedFile);
    
    setFiles(newFiles);
    setDraggedIndex(index);
  };
  
  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Dropzone Area */}
      {/* Show dropzone if no files OR if we allow multiple files (to add more) */}
      {(files.length === 0 || multiple) && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative group cursor-pointer
            border-2 border-dashed rounded-3xl p-6 sm:p-10 text-center transition-all duration-300
            ${isDraggingOverDropzone 
              ? 'border-pink-500 bg-pink-50/50 dark:bg-pink-900/30 scale-[1.02]' 
              : 'border-slate-300 dark:border-slate-600 hover:border-violet-400 hover:bg-white/40 dark:hover:bg-slate-800/60 bg-white/20 dark:bg-slate-900/40'
            }
          `}
        >
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept={accept}
            multiple={multiple}
            onChange={handleFileInput}
          />
          <div className="flex flex-col items-center space-y-4">
            <div className={`p-4 rounded-full transition-colors ${isDraggingOverDropzone ? 'bg-pink-100 dark:bg-pink-900/50 text-pink-600' : 'bg-white/60 dark:bg-slate-700/60 text-slate-400 dark:text-slate-300 group-hover:text-violet-500 group-hover:scale-110 transform duration-300'}`}>
              <UploadCloud className="w-12 h-12" />
            </div>
            <div>
              <p className="text-xl font-semibold text-slate-700 dark:text-slate-200">
                {title || (files.length > 0 ? t.common.addMore : t.common.selectFiles)}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                {t.common.dropHere}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-6 sm:mt-8 space-y-3">
          {files.map((file, idx) => (
            <div 
              // Use a combination of properties for key to ensure stability during reorder
              key={`${file.name}-${file.size}-${file.lastModified}`}
              draggable={multiple}
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOverItem(e, idx)}
              onDragEnd={handleDragEnd}
              className={`
                glass-panel p-3 sm:p-4 rounded-xl flex items-center justify-between 
                transition-all duration-200 select-none
                ${draggedIndex === idx ? 'opacity-50 scale-95 border-pink-400 border-dashed' : 'hover:border-violet-200 dark:hover:border-violet-500'}
                ${multiple ? 'cursor-grab active:cursor-grabbing' : ''}
                animate-fadeIn
              `}
            >
              <div className="flex items-center space-x-3 overflow-hidden">
                {multiple && (
                   <div className="flex flex-col items-center gap-1 sm:mr-1">
                      {/* Desktop Drag Handle */}
                      <div className="hidden sm:block text-slate-400 dark:text-slate-500 cursor-grab active:cursor-grabbing hover:text-slate-600 dark:hover:text-slate-300">
                        <GripVertical className="w-5 h-5" />
                      </div>
                      
                      {/* Mobile Sort Buttons */}
                      <div className="flex flex-col sm:hidden">
                        <button 
                           onClick={() => moveFile(idx, 'up')}
                           disabled={idx === 0}
                           className="p-1 text-slate-400 hover:text-violet-500 disabled:opacity-20"
                        >
                           <ChevronUp className="w-5 h-5" />
                        </button>
                        <button 
                           onClick={() => moveFile(idx, 'down')}
                           disabled={idx === files.length - 1}
                           className="p-1 text-slate-400 hover:text-violet-500 disabled:opacity-20"
                        >
                           <ChevronDown className="w-5 h-5" />
                        </button>
                      </div>
                   </div>
                )}
                
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-500 flex-shrink-0">
                  <FileIcon className="w-6 h-6" />
                </div>
                <div className="min-w-0 text-left">
                  <p className="font-medium text-slate-700 dark:text-slate-200 truncate max-w-[120px] sm:max-w-xs text-sm sm:text-base">{file.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button 
                onClick={() => removeFile(idx)}
                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 rounded-full transition-colors flex-shrink-0"
                title="Remove file"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}
          
          {multiple && files.length > 1 && (
            <p className="text-center text-xs text-slate-400 mt-4 animate-pulse">
              {t.common.dragReorder}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUploader;