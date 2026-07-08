/**
 * This file exists solely to help i18next-parser extract translation keys
 * that are used dynamically and therefore cannot be discovered from string
 * literals at the callsite.
 *
 * _errorI18nKeys covers keys defined in src/shared/models/errors.ts and used
 * dynamically via t(errorDetail.i18nKey) or <Trans i18nKey={errorDetail.i18nKey} />.
 *
 * Other enumerable dynamic keys should be added to _otherI18nKeys.
 *
 * Do NOT delete this file. It is not imported anywhere at runtime.
 * Error keys are generated from src/shared/models/errors.ts by script/sync-error-i18n-keys.mjs.
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _errorI18nKeys(t: (key: string) => string) {
  // BEGIN GENERATED ERROR I18N KEYS
  t('The selected provider is rate limited. Please try again later or choose a different provider.')
  t('Invalid request parameters detected. Please check your model/provider settings and try again.')
  t(
    'File type not supported. Supported formats vary by parser. Try PDF, modern Office files, EPUB, CSV/TSV, HTML/Markdown, or non-binary text/code files.'
  )
  t(
    'The file you sent has expired. To protect your privacy, all file-related cache data has been cleared. You need to create a new conversation or refresh the context, and then send the file again.'
  )
  t(
    'The cache data for the file was not found. Please create a new conversation or refresh the context, and then send the file again.'
  )
  t('The file size exceeds the limit of 50MB. Please reduce the file size and try again.')
  t(
    "The {{model}} API doesn't support document understanding. Use a model with file support, or use local document parsing before sending the attachment."
  )
  t(
    "The {{model}} API doesn't support document understanding. You can download <LinkToHomePage>WorkspAIce Desktop App</LinkToHomePage> for local document analysis."
  )
  t(
    'Sorry, the current model {{model}} API itself does not support image understanding. Please switch to a model with vision support.'
  )
  t(
    'Vision capability is not enabled for Model {{model}}. Please enable it or set a default OCR model in <OpenSettingButton>Settings</OpenSettingButton>'
  )
  t(
    'The {{model}} API itself does not support sending files. WorkspAIce can only inline text-based files for this model. Use a compatible model or Knowledge Base for larger documents.'
  )
  t(
    'The {{model}} API itself does not support sending files. Due to the complexity of file parsing locally, WorkspAIce only processes text-based files (including code).'
  )
  t(
    'An error occurred while processing your request. Please try again later. If this error continues, please send an email to Report issues on GitHub for support.'
  )
  t(
    'An unknown error occurred. Please try again later. If this error continues, please send an email to Report issues on GitHub for support.'
  )
  t('The {{model}} API itself does not support web browsing. Supported models: {{supported_web_browsing_models}}')
  t(
    'No search results found. Please use another <OpenExtensionSettingButton>search provider</OpenExtensionSettingButton> or try again later.'
  )
  t(
    'You have selected Tavily as the search provider, but an API key has not been entered yet. Please <OpenExtensionSettingButton>click here to open Settings</OpenExtensionSettingButton> and enter your API key, or choose a different search provider.'
  )
  t(
    'Tool use is not enabled for Model {{model}}. Please enable it in <OpenSettingButton>provider settings</OpenSettingButton> or switch to a model that supports tool use.'
  )
  t(
    'Mobile devices temporarily do not support local parsing of this file type. Please use text files (txt, markdown, etc.) or parse the file on the desktop app.'
  )
  t(
    'The web version temporarily does not support local parsing of this file type. Please use text files (txt, markdown, etc.) or parse the file on the desktop app.'
  )
  t(
    'Local document parsing failed. You can go to <OpenDocumentParserSettingButton>Settings</OpenDocumentParserSettingButton> and choose an available local or user-configured parser.'
  )
  t(
    'Document parsing failed. You can go to <OpenDocumentParserSettingButton>Settings</OpenDocumentParserSettingButton> and choose a different available parser.'
  )
  t(
    'Selected document parser is currently only supported in Knowledge Base. For chat file attachments, please go to <OpenDocumentParserSettingButton>Settings</OpenDocumentParserSettingButton> and switch to Local.'
  )
  t(
    'MinerU API token is required. Please go to <OpenDocumentParserSettingButton>Settings</OpenDocumentParserSettingButton> and configure your MinerU API token.'
  )
  t(
    'This file type requires a document parser. Please go to <OpenDocumentParserSettingButton>Settings</OpenDocumentParserSettingButton> and enable an available local or user-configured parser.'
  )
  t(
    'You have selected BoCha as the search provider, but an API key has not been entered yet. Please <OpenExtensionSettingButton>click here to open Settings</OpenExtensionSettingButton> and enter your API key, or choose a different search provider.'
  )
  t('Failed to read webpage content. Please try again later or use a different URL.')
  t(
    'The current search provider does not support reading webpages. Please <OpenExtensionSettingButton>choose a different search provider</OpenExtensionSettingButton> that supports this capability.'
  )
  // END GENERATED ERROR I18N KEYS

  // HTTP status code errors (MessageErrTips.tsx)
  t(
    'HTTP error: Unauthorized (401). Your authentication credentials are invalid or have expired. Please check your API key or login status.'
  )
  t(
    'HTTP error: Forbidden (403). You do not have permission to access this resource. Please check your API key permissions or account status.'
  )
  t('HTTP error: Request Timeout (408). The server took too long to respond. Please try again later.')
  t(
    'HTTP error: Too Many Requests (429). The service is currently experiencing high demand or resource limitations. Please wait a moment and try again.'
  )
  t('HTTP error: Internal Server Error (500). The server encountered an unexpected error. Please try again later.')
  t(
    'HTTP error: Bad Gateway (502). The server received an invalid response from the upstream service. This is usually a temporary issue, please try again later.'
  )
  t(
    'HTTP error: Service Unavailable (503). The server is temporarily unavailable, possibly due to maintenance or overload. Please try again later.'
  )
  t(
    'HTTP error: Gateway Timeout (504). The server did not receive a timely response from the upstream service. This is usually a temporary issue, please try again later.'
  )
}

function _otherI18nKeys(t: (key: string) => string) {
  // src/renderer/routes/settings/route.tsx
  t('Model Provider')
  t('Default Models')
  t('Web Search')
  t('MCP')
  t('Knowledge Base')
  t('Skills')
  t('Document Parser')
  t('Chat Settings')
  t('Keyboard Shortcuts')
  t('General Settings')

  // src/renderer/components/common/MessageLayoutPreview.tsx
  t('Classic')
  t('Bubble')

  // src/renderer/modals/ExportChat.tsx
  t('All threads')
  t('Current thread')

  // src/renderer/components/settings/DocumentParserSettings.tsx
  t('Text Only')
  t('Local')
  t('MinerU')
  t('Basic text file support only (.txt, .md, .json, code files, etc.)')
  t('Uses built-in document parsing feature, supports common file types.')
  t('Third-party cloud parsing service, supports PDF and most Office files. Requires API token.')

  // src/renderer/components/knowledge-base/KnowledgeBaseForm.tsx
  t('Parser used to process uploaded documents')

  // src/renderer/components/ModelList.tsx
  t('Embedding')
  t('Rerank')
}
