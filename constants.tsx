import { ToolType, type ToolConfig } from './types';
import { 
  Files, 
  Scissors, 
  FileText, 
  PenTool, 
  Edit3, 
  Image as ImageIcon 
} from 'lucide-react';
import React from 'react';

// Omit title and description from config as they come from translations now
type ToolConfigStatic = Omit<ToolConfig, 'title' | 'description'>;

export const TOOLS: Record<ToolType, ToolConfigStatic> = {
  [ToolType.MERGE]: {
    id: ToolType.MERGE,
    icon: 'Files',
    accept: '.pdf',
    multiple: true,
    color: 'text-red-500'
  },
  [ToolType.SPLIT]: {
    id: ToolType.SPLIT,
    icon: 'Scissors',
    accept: '.pdf',
    multiple: false,
    color: 'text-pink-500'
  },
  [ToolType.PDF_TO_WORD]: {
    id: ToolType.PDF_TO_WORD,
    icon: 'FileText',
    accept: '.pdf',
    multiple: false,
    color: 'text-blue-500'
  },
  [ToolType.SIGN]: {
    id: ToolType.SIGN,
    icon: 'PenTool',
    accept: '.pdf',
    multiple: false,
    color: 'text-purple-500'
  },
  [ToolType.EDIT]: {
    id: ToolType.EDIT,
    icon: 'Edit3',
    accept: '.pdf',
    multiple: false,
    color: 'text-yellow-500'
  },
  [ToolType.JPG_TO_PDF]: {
    id: ToolType.JPG_TO_PDF,
    icon: 'ImageIcon',
    accept: 'image/jpeg, image/png',
    multiple: true,
    color: 'text-orange-500'
  },
};

export const getIcon = (name: string, className?: string) => {
  const props = { className: className || "w-6 h-6" };
  switch (name) {
    case 'Files': return <Files {...props} />;
    case 'Scissors': return <Scissors {...props} />;
    case 'FileText': return <FileText {...props} />;
    case 'PenTool': return <PenTool {...props} />;
    case 'Edit3': return <Edit3 {...props} />;
    case 'ImageIcon': return <ImageIcon {...props} />;
    default: return <Files {...props} />;
  }
};