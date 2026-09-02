import axios from 'axios';

export type TtsAccent = 'uk' | 'us';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const STREAM_ELEMENTS_VOICE: Record<TtsAccent, string> = {
  uk: 'Brian',
  us: 'Joanna',
};

const GOOGLE_TTS_LANG: Record<TtsAccent, string> = {
  uk: 'en-GB',
  us: 'en-US',
};

function toBuffer(data: unknown): Buffer {
  if (Buffer.isBuffer(data)) return data;
  return Buffer.from(data as ArrayBuffer);
}

function looksLikeAudio(buffer: Buffer, contentType = ''): boolean {
  if (!buffer || buffer.length < 80) return false;
  const type = contentType.toLowerCase();
  if (type.includes('audio') || type.includes('mpeg') || type.includes('octet-stream')) {
    return true;
  }
  if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) return true;
  if (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) return true;
  return false;
}

async function fetchAudioBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await axios.get<ArrayBuffer>(url, {
      responseType: 'arraybuffer',
      timeout: 20000,
      headers: {
        Accept: 'audio/mpeg,audio/*,*/*',
        'User-Agent': USER_AGENT,
      },
      validateStatus: () => true,
    });
    if (res.status >= 400) return null;
    const buffer = toBuffer(res.data);
    const contentType = String(res.headers['content-type'] || '');
    if (!looksLikeAudio(buffer, contentType)) return null;
    return buffer;
  } catch {
    return null;
  }
}

async function fetchStreamElements(text: string, accent: TtsAccent): Promise<Buffer | null> {
  const voice = STREAM_ELEMENTS_VOICE[accent];
  const url = `https://api.streamelements.com/kappa/v2/speech?voice=${encodeURIComponent(voice)}&text=${encodeURIComponent(text)}`;
  return fetchAudioBuffer(url);
}

async function fetchGoogleTts(text: string, accent: TtsAccent): Promise<Buffer | null> {
  const tl = GOOGLE_TTS_LANG[accent];
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(tl)}&q=${encodeURIComponent(text)}`;
  return fetchAudioBuffer(url);
}

export async function fetchTtsMp3(text: string, accent: TtsAccent): Promise<Buffer> {
  const cleaned = (text || '').trim();
  if (!cleaned) {
    throw new Error('Thiếu nội dung để tạo audio');
  }

  const fromStreamElements = await fetchStreamElements(cleaned, accent);
  if (fromStreamElements) return fromStreamElements;

  const fromGoogle = await fetchGoogleTts(cleaned, accent);
  if (fromGoogle) return fromGoogle;

  throw new Error(`Không tạo được audio ${accent.toUpperCase()} cho “${cleaned}”`);
}
