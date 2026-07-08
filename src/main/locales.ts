import { app } from 'electron'

export default class Locale {
  locale: string = 'en'

  constructor() {
    try {
      this.locale = app.getLocale()
    } catch (e) {
      console.error('Failed to get locale:', e)
    }
  }

  isCN(): boolean {
    return this.locale.startsWith('zh')
  }

  t(key: TranslationKey): string {
    return translations[key][this.isCN() ? 'zh' : 'en']
  }
}

type TranslationKey = keyof typeof translations

const translations = {
  'Show/Hide': {
    en: 'Show/Hide',
    zh: '显示/隐藏',
  },
  Exit: {
    en: 'Exit',
    zh: '退出',
  },
  New_Version: {
    en: 'New Version',
    zh: '新版本',
  },
  Restart: {
    en: 'Restart',
    zh: '重启',
  },
  Later: {
    en: 'Later',
    zh: '稍后',
  },
  App_Update: {
    en: 'App Update',
    zh: '应用更新',
  },
  New_Version_Downloaded: {
    en: 'New version has been downloaded, restart the application to apply the update.',
    zh: '新版本已经下载好，重启应用以应用更新。',
  },
  Copy: {
    en: 'Copy',
    zh: '复制',
  },
  Cut: {
    en: 'Cut',
    zh: '剪切',
  },
  Paste: {
    en: 'Paste',
    zh: '粘贴',
  },
  PasteAsPlainText: {
    en: 'Paste as Plain Text',
    zh: '粘贴为文本',
  },
  ReplaceWith: {
    en: 'Replace with',
    zh: '替换成',
  },
  ResetZoom: {
    en: 'Reset Zoom',
    zh: '重置缩放',
  },
  ZoomIn: {
    en: 'Zoom In',
    zh: '放大',
  },
  ZoomOut: {
    en: 'Zoom Out',
    zh: '缩小',
  },
  MCP_Run_Title: {
    en: 'Run MCP server?',
    zh: '运行 MCP 服务器？',
  },
  MCP_Run_Message: {
    en: 'Allow WorkspAIce to run this local command? Only approve servers you trust — it runs with your account’s permissions.',
    zh: '允许 WorkspAIce 运行此本地命令吗？请仅批准你信任的服务器——它将以你的账户权限运行。',
  },
  MCP_Allow: {
    en: 'Allow',
    zh: '允许',
  },
  MCP_Cancel: {
    en: 'Cancel',
    zh: '取消',
  },
}
