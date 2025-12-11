export enum ToolType {
  MERGE = 'merge',
  SPLIT = 'split',
  PDF_TO_WORD = 'pdf-to-word',
  SIGN = 'sign',
  EDIT = 'edit',
  JPG_TO_PDF = 'jpg-to-pdf',
}

export interface ToolConfig {
  id: ToolType;
  title: string;
  description: string;
  icon: string;
  accept: string;
  multiple: boolean;
  color: string;
}

export interface ProcessedFile {
  name: string;
  size: number;
  data: ArrayBuffer | Uint8Array;
  mimeType: string;
}

export interface User {
  username: string;
  password?: string; // stored in localstorage for simulation
}

// Declaration for the CDN loaded libraries
declare global {
  interface Window {
    PDFLib: any;
    download: any;
    JSZip: any;
    pdfjsLib: {
      GlobalWorkerOptions: {
        workerSrc: string;
      };
      getDocument: (data: any) => {
        promise: Promise<{
          numPages: number;
          getPage: (n: number) => Promise<any>;
        }>;
      };
    };
  }
}