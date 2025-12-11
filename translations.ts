import { ToolType } from './types';

export type Language = 'en' | 'zh';

export const translations = {
  en: {
    hero: {
      title: "Every tool you need to work with PDFs in one place",
      description: "Silk is your all-in-one PDF solution. 100% free, private, and processes files directly in your browser. No uploads, no waiting.",
      badge: "Secure Client-Side Processing"
    },
    nav: {
      allTools: "All Tools",
      pricing: "Pricing",
      login: "Login",
      signup: "Sign up",
      logout: "Logout",
      welcome: "Hi"
    },
    auth: {
      loginTitle: "Welcome Back",
      signupTitle: "Create Account",
      username: "Username",
      password: "Password",
      confirmPassword: "Confirm Password",
      submitLogin: "Log In",
      submitSignup: "Sign Up",
      switchNoAccount: "Don't have an account? Sign up",
      switchHasAccount: "Already have an account? Log in",
      errorMismatch: "Passwords do not match",
      errorExists: "Username already exists",
      errorInvalid: "Invalid username or password",
      successSignup: "Account created! Please log in."
    },
    tools: {
      [ToolType.MERGE]: {
        title: 'Merge PDF',
        description: 'Combine PDFs in the order you want with the easiest PDF merger.'
      },
      [ToolType.SPLIT]: {
        title: 'Split PDF',
        description: 'Separate one page or a whole set for easy conversion into independent PDF files.'
      },
      [ToolType.PDF_TO_WORD]: {
        title: 'PDF to Word',
        description: 'Convert your PDF to WORD documents with incredible accuracy.'
      },
      [ToolType.SIGN]: {
        title: 'Sign PDF',
        description: 'Sign yourself or request electronic signatures from others.'
      },
      [ToolType.EDIT]: {
        title: 'Watermark PDF',
        description: 'Add text watermarks to your PDF documents instantly.'
      },
      [ToolType.JPG_TO_PDF]: {
        title: 'JPG to PDF',
        description: 'Convert JPG images to PDF in seconds. Easily adjust orientation and margins.'
      }
    },
    common: {
      startNow: "Start Now",
      backToTools: "Back to Tools",
      processFile: "Process File",
      downloadFile: "Download File",
      startOver: "Start Over",
      processing: "Processing...",
      waitMessage: "Wait a moment while we handle your files.",
      readyMessage: "Your file is ready!",
      error: "Error processing file. Please try again.",
      dragReorder: "Drag files to reorder",
      addMore: "Add more files",
      selectFiles: "Select files to process",
      dropHere: "or drop files here",
      toolNotFound: "Tool not found"
    },
    toolSpecific: {
      mergeBtn: "Merge PDFs",
      splitBtn: "Split PDF",
      pdfToWordBtn: "Convert to Word",
      drawSignature: "Draw Signature",
      uploadSignature: "Upload Image",
      clearSignature: "Clear",
      dragSignature: "Drag & Resize signature",
      watermarkLabel: "Watermark Text",
      fontSizeLabel: "Font Size",
      prevPage: "Previous Page",
      nextPage: "Next Page",
      pageOf: "Page {current} of {total}",
      splitModes: {
        range: "Split by Range",
        extractAll: "Extract All Pages",
        rangeLabel: "Page Range:",
        rangePlaceholder: "e.g. 1-5, 8, 10-12"
      },
      jpgOptions: {
        orientation: "Page Orientation",
        portrait: "Portrait",
        landscape: "Landscape",
        margin: "Margins",
        none: "No Margin",
        small: "Small",
        big: "Big"
      }
    }
  },
  zh: {
    hero: {
      title: "一站式 PDF 处理工具箱",
      description: "Silk 是您的全能 PDF 解决方案。100% 免费、隐私安全，所有文件均在浏览器本地处理。无需上传，无需等待。",
      badge: "安全客户端本地处理"
    },
    nav: {
      allTools: "所有工具",
      pricing: "价格",
      login: "登录",
      signup: "注册",
      logout: "退出登录",
      welcome: "你好"
    },
    auth: {
      loginTitle: "欢迎回来",
      signupTitle: "创建账户",
      username: "用户名",
      password: "密码",
      confirmPassword: "确认密码",
      submitLogin: "登 录",
      submitSignup: "注 册",
      switchNoAccount: "还没有账号？去注册",
      switchHasAccount: "已有账号？去登录",
      errorMismatch: "两次输入的密码不一致",
      errorExists: "用户名已存在",
      errorInvalid: "用户名或密码错误",
      successSignup: "账户创建成功！请登录。"
    },
    tools: {
      [ToolType.MERGE]: {
        title: '合并 PDF',
        description: '将多个 PDF 文件按您想要的顺序合并为一个文件。'
      },
      [ToolType.SPLIT]: {
        title: '拆分 PDF',
        description: '提取特定页面或将每一页拆分为独立的 PDF 文件。'
      },
      [ToolType.PDF_TO_WORD]: {
        title: 'PDF 转 Word',
        description: '将 PDF 转换为可编辑的 Word 文档，保持极高准确率。'
      },
      [ToolType.SIGN]: {
        title: 'PDF 签名',
        description: '创建您自己的签名，或在 PDF 上添加电子签名。'
      },
      [ToolType.EDIT]: {
        title: 'PDF 添加水印',
        description: '给 PDF 文档添加文本水印，保护您的文档版权。'
      },
      [ToolType.JPG_TO_PDF]: {
        title: 'JPG 转 PDF',
        description: '秒级将 JPG/PNG 图片转换为 PDF。支持调整方向和边距。'
      }
    },
    common: {
      startNow: "立即开始",
      backToTools: "返回工具列表",
      processFile: "处理文件",
      downloadFile: "下载文件",
      startOver: "重新开始",
      processing: "处理中...",
      waitMessage: "请稍候，我们正在处理您的文件。",
      readyMessage: "您的文件已准备就绪！",
      error: "文件处理失败，请重试。",
      dragReorder: "拖拽文件以调整顺序",
      addMore: "添加更多文件",
      selectFiles: "选择文件",
      dropHere: "或将文件拖到此处",
      toolNotFound: "未找到该工具"
    },
    toolSpecific: {
      mergeBtn: "合并 PDF",
      splitBtn: "拆分 PDF",
      pdfToWordBtn: "转换为 Word",
      drawSignature: "手绘签名",
      uploadSignature: "上传图片",
      clearSignature: "清除签名",
      dragSignature: "拖拽或缩放签名",
      watermarkLabel: "水印文本",
      fontSizeLabel: "字体大小",
      prevPage: "上一页",
      nextPage: "下一页",
      pageOf: "第 {current} 页，共 {total} 页",
      splitModes: {
        range: "按页码范围拆分",
        extractAll: "提取所有页面",
        rangeLabel: "页码范围:",
        rangePlaceholder: "例如 1-5, 8, 10-12"
      },
      jpgOptions: {
        orientation: "页面方向",
        portrait: "纵向",
        landscape: "横向",
        margin: "边距",
        none: "无边距",
        small: "窄边距",
        big: "宽边距"
      }
    }
  }
};