import { MessageInterface } from '@/types/types';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY as string | undefined;
const GEMINI_MODEL = 'gemini-2.5-flash';
const EXCHANGE_RATE = 25000;

type GeminiPart = {
  text?: string;
};

type GeminiContent = {
  role?: string;
  parts?: GeminiPart[];
};

type GeminiResponse = {
  candidates?: Array<{
    content?: GeminiContent;
  }>;
  error?: {
    message?: string;
  };
};

type MenuItem = {
  name: string;
  price: number;
  category: string;
};

function buildPrompt(messages: MessageInterface[], menuItems: MenuItem[]) {
  const conversation = messages
    .map((message) => `${message.role === 'user' ? 'Người dùng' : 'Trợ lý'}: ${message.content}`)
    .join('\n');

  const menuContext = menuItems.length
    ? menuItems
        .slice(0, 20)
        .map((item) => `- ${item.name} | ${item.category} | ${new Intl.NumberFormat('vi-VN').format(Math.round(item.price * EXCHANGE_RATE))}đ`)
        .join('\n')
    : '- Không có dữ liệu món';

  return [
    'Bạn là trợ lý AI cho quán cà phê. Hãy trả lời ngắn gọn, thân thiện bằng tiếng Việt.',
    'Nếu người dùng nhắc tới món trong menu, hãy ưu tiên gợi ý đúng món và có thể đề xuất thêm món liên quan.',
    'Nếu người dùng hỏi về món ăn, đồ uống, hoặc muốn đặt món, hãy trả lời theo phong cách phục vụ quán cà phê.',
    'Không bịa ra món ngoài danh sách nếu đã có món phù hợp trong menu.',
    '',
    'Danh sách món hiện có:',
    menuContext,
    '',
    'Lịch sử trò chuyện:',
    conversation,
  ].join('\n');
}

export async function callGeminiChatAPI(messages: MessageInterface[], menuItems: MenuItem[]): Promise<MessageInterface> {
  if (!GEMINI_API_KEY) {
    return {
      role: 'assistant',
      content: 'Chưa cấu hình Gemini API key. Hãy thêm EXPO_PUBLIC_GEMINI_API_KEY rồi thử lại.',
    };
  }

  const prompt = buildPrompt(messages, menuItems);
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 512,
        },
      }),
    }
  );

  const responseText = await response.text();
  let data: GeminiResponse | undefined;

  try {
    data = responseText ? JSON.parse(responseText) : undefined;
  } catch {
    data = undefined;
  }

  if (!response.ok) {
    throw new Error(data?.error?.message || responseText || `Gemini request failed with status ${response.status}.`);
  }

  const content = data?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text)
    .filter(Boolean)
    .join('')
    .trim();

  if (!content) {
    throw new Error('Gemini không trả về nội dung hợp lệ.');
  }

  return {
    role: 'assistant',
    content,
  };
}
