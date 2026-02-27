/**
 * PDF Parser - 解析 Recovery Kit PDF
 * 
 * 功能：
 * 1. 从 PDF 中提取助记词
 * 2. 从 PDF 中提取 Token/ID
 * 3. 验证 PDF 格式
 */

import * as pdfjsLib from 'pdfjs-dist';

// 配置 PDF.js worker - 使用本地 Worker 避免 404 错误
if (typeof window !== 'undefined') {
  // 尝试使用本地 Worker，如果失败则禁用 Worker（使用主线程）
  try {
    // 使用 Next.js 的静态资源路径
    pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`;
  } catch {
    // 如果本地 Worker 不可用，禁用 Worker（性能稍慢但不会报错）
    pdfjsLib.GlobalWorkerOptions.workerSrc = '';
  }
}

export interface ParsedRecoveryKit {
  mnemonic: string;
  mnemonicArray: string[];
  documentId?: string;
  vaultId?: string;
  checksum?: string;
  releaseToken?: string; // 从 PDF 元数据或二维码中提取的 Release Token
  isPro?: boolean; // 是否为 Pro 级别（自动解锁标识）
}

/**
 * 从 PDF 文件中解析 Recovery Kit 信息
 */
export async function parseRecoveryKitPDF(file: File): Promise<ParsedRecoveryKit> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // 使用禁用 Worker 的方式避免 404 错误
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useWorkerFetch: false, // 禁用 Worker fetch
      isEvalSupported: false, // 禁用 eval
      useSystemFonts: true, // 使用系统字体
    });
    
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    
    // 提取所有页面的文本
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + ' ';
    }
    
    // 尝试从 PDF 元数据中提取信息
    const metadata = await pdf.getMetadata();
    let qrData: any = null;
    if (metadata?.info && typeof metadata.info === 'object' && 'Subject' in metadata.info) {
      try {
        const subject = (metadata.info as { Subject?: string }).Subject;
        if (subject) {
          qrData = JSON.parse(subject);
        }
      } catch {
        // 忽略解析错误
      }
    }

    // 解析助记词（查找数字编号的单词）
    const mnemonicWords: string[] = [];
    const wordPattern = /(\d{2})\.\s+(\w+)/g;
    let match;
    
    while ((match = wordPattern.exec(fullText)) !== null) {
      const wordIndex = parseInt(match[1]) - 1;
      const word = match[2].toLowerCase().trim();
      if (word && word.length > 0) {
        mnemonicWords[wordIndex] = word;
      }
    }

    // 确保有 24 个单词
    const mnemonicArray = mnemonicWords.filter(w => w).slice(0, 24);
    
    if (mnemonicArray.length < 24) {
      throw new Error(`Incomplete mnemonic phrase. Found ${mnemonicArray.length} words, expected 24.`);
    }

    // 提取 Document ID
    const docIdMatch = fullText.match(/DOC(?:UMENT)?\s*ID[:\s]+([A-Z0-9-]+)/i);
    const documentId = docIdMatch ? docIdMatch[1] : undefined;

    // 提取 Vault ID（从 Document ID 或其他位置）
    const vaultIdMatch = fullText.match(/VAULT\s*ID[:\s]+([A-Z0-9-]+)/i);
    const vaultId = vaultIdMatch ? vaultIdMatch[1] : undefined;

    // 提取 Checksum
    const checksumMatch = fullText.match(/CHECKSUM[:\s]+([A-F0-9]{64})/i);
    const checksum = checksumMatch ? checksumMatch[1] : undefined;

    // 提取 Release Token（优先从二维码数据，其次从文本）
    let releaseToken: string | undefined;
    let isPro = false;
    
    // 1. 从二维码数据中提取（如果存在）
    if (qrData?.releaseToken) {
      releaseToken = qrData.releaseToken;
      isPro = qrData.isPro || false;
    }
    
    // 2. 从文本中查找 Release Token
    if (!releaseToken) {
      const tokenPatterns = [
        /RELEASE\s*TOKEN[:\s]+([A-Z0-9-]+)/i,
        /TOKEN[:\s]+([A-Z0-9-]{20,})/i,
        /SOLOBOARD-PRO-(\d{4}-[A-Z0-9]+)/i,
      ];
      for (const pattern of tokenPatterns) {
        const match = fullText.match(pattern);
        if (match) {
          releaseToken = match[1];
          break;
        }
      }
    }
    
    // 3. 检测是否为 Pro 级别
    if (!isPro) {
      isPro = documentId?.includes('PRO') || 
              fullText.includes('PRO') || 
              releaseToken?.includes('PRO') || 
              qrData?.isPro || 
              false;
    }

    return {
      mnemonic: mnemonicArray.join(' '),
      mnemonicArray,
      documentId,
      vaultId,
      checksum,
      releaseToken,
      isPro,
    };
  } catch (error: any) {
    console.error('PDF parsing error:', error);
    throw new Error(`Failed to parse Recovery Kit PDF: ${error.message}`);
  }
}

/**
 * 验证 PDF 是否为有效的 Recovery Kit
 */
export async function validateRecoveryKitPDF(file: File): Promise<boolean> {
  try {
    const parsed = await parseRecoveryKitPDF(file);
    return parsed.mnemonicArray.length === 24;
  } catch {
    return false;
  }
}
