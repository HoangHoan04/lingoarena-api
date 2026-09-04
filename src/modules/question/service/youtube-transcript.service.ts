import { Injectable, Logger } from '@nestjs/common';
import { YoutubeTranscript } from 'youtube-transcript';

export interface YoutubeTranscriptSegment {
  sortOrder: number;
  startSec: number;
  endSec: number;
  text: string;
  translationVi?: string;
}

@Injectable()
export class YoutubeTranscriptService {
  private readonly logger = new Logger(YoutubeTranscriptService.name);

  async getTranscript(youtubeId: string): Promise<YoutubeTranscriptSegment[]> {
    if (!youtubeId) return [];

    let rawItems: Array<{ text: string; duration: number; offset: number; lang?: string }> = [];

    // 1. Try English first
    try {
      rawItems = await YoutubeTranscript.fetchTranscript(youtubeId, { lang: 'en' });
    } catch (err) {
      this.logger.warn(`Failed to fetch English transcript for ${youtubeId}, trying default: ${err.message}`);
      // 2. Fallback to default
      try {
        rawItems = await YoutubeTranscript.fetchTranscript(youtubeId);
      } catch (fallbackErr) {
        this.logger.error(`Failed to fetch transcript for ${youtubeId}: ${fallbackErr.message}`);
        return [];
      }
    }

    if (!rawItems || rawItems.length === 0) return [];

    // 3. Filter noise tags and clean text
    const cleanItems = rawItems
      .map(item => {
        let text = (item.text || '')
          .replace(/\[(?:Music|Applause|Laughter|Sound)\]/gi, '')
          .replace(/\((?:music|applause|laughter)\)/gi, '')
          .replace(/[\r\n]+/g, ' ')
          .trim();
        return {
          text,
          startSec: Math.round((item.offset / 1000) * 100) / 100,
          endSec: Math.round(((item.offset + item.duration) / 1000) * 100) / 100,
        };
      })
      .filter(item => item.text.length > 0);

    // 4. Group into short, bite-sized dictation cues (4-7 words max)
    const groupedSegments: YoutubeTranscriptSegment[] = [];
    let currentText = '';
    let currentStart = 0;
    let currentEnd = 0;
    let order = 1;

    for (let i = 0; i < cleanItems.length; i++) {
      const item = cleanItems[i];
      const itemWords = item.text.split(/\s+/).filter(Boolean).length;

      if (!currentText) {
        currentText = item.text;
        currentStart = item.startSec;
        currentEnd = item.endSec;
      } else {
        const currentWords = currentText.split(/\s+/).filter(Boolean).length;
        const endsWithPunct = /[.?!,;:]["']?$/.test(currentText.trim());
        const wouldExceedLimit = currentWords + itemWords > 6;
        const hasGap = item.startSec - currentEnd >= 0.8;

        if (endsWithPunct || wouldExceedLimit || hasGap) {
          const formattedText = currentText.charAt(0).toUpperCase() + currentText.slice(1);
          groupedSegments.push({
            sortOrder: order++,
            startSec: currentStart,
            endSec: currentEnd,
            text: formattedText.trim(),
            translationVi: '',
          });
          currentText = item.text;
          currentStart = item.startSec;
          currentEnd = item.endSec;
          continue;
        } else {
          currentText += ' ' + item.text;
          currentEnd = item.endSec;
        }
      }
    }

    if (currentText.trim()) {
      const formattedText = currentText.charAt(0).toUpperCase() + currentText.slice(1);
      groupedSegments.push({
        sortOrder: order++,
        startSec: currentStart,
        endSec: currentEnd,
        text: formattedText.trim(),
        translationVi: '',
      });
    }

    // 5. Automatically translate all segmented sentences to Vietnamese
    if (groupedSegments.length > 0) {
      try {
        const translations = await this.translateBatchToVietnamese(
          groupedSegments.map(s => s.text),
        );
        for (let i = 0; i < groupedSegments.length; i++) {
          groupedSegments[i].translationVi = translations[i] || '';
        }
      } catch (err: any) {
        this.logger.warn(`Failed to auto-translate transcript to Vietnamese: ${err?.message}`);
      }
    }

    return groupedSegments;
  }

  async translateBatchToVietnamese(texts: string[]): Promise<string[]> {
    if (!texts.length) return [];
    try {
      const results: string[] = new Array(texts.length).fill('');
      const batchSize = 35;

      for (let i = 0; i < texts.length; i += batchSize) {
        const batchTexts = texts.slice(i, i + batchSize);
        const combinedText = batchTexts.map(t => t.replace(/[\r\n]+/g, ' ').trim()).join('\n');

        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(combinedText)}`;
        const res = await fetch(url, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        });

        if (!res.ok) {
          this.logger.warn(`Translation endpoint returned status ${res.status}`);
          continue;
        }

        const data: any = await res.json();
        if (Array.isArray(data?.[0])) {
          const translatedLines: string = data[0].map((item: any) => item[0]).join('');
          const splitLines = translatedLines.split('\n');

          for (let j = 0; j < batchTexts.length; j++) {
            results[i + j] = (splitLines[j] || '').trim();
          }
        }
      }

      return results;
    } catch (err: any) {
      this.logger.error(`Error translating transcript batch: ${err?.message}`);
      return new Array(texts.length).fill('');
    }
  }
}
