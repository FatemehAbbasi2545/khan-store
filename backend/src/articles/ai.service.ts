import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AiService {
  async generateArticleDraft(topic: string) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new BadRequestException(
        'کلید هوش مصنوعی تنظیم نشده است. برای فعال‌سازی این قابلیت، متغیر ANTHROPIC_API_KEY را در تنظیمات بک‌اند اضافه کنید.',
      );
    }

    const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

    const prompt = `یک مقاله‌ی آموزشی به زبان فارسی درباره‌ی «${topic}» برای مجله‌ی گل و گیاه یک فروشگاه ممتاز به نام «گل خان» بنویس. لحن مقاله باید دوستانه، کاربردی و قابل‌اعتماد باشد.

خروجی را دقیقاً و فقط به‌صورت یک آبجکت JSON با این ساختار بده، بدون هیچ توضیح یا متن اضافه‌ی دیگری قبل یا بعد از آن:
{"title": "عنوان جذاب مقاله", "excerpt": "خلاصه‌ای یک تا دو جمله‌ای از مقاله", "content": "متن کامل مقاله با پاراگراف‌بندی مناسب (هر پاراگراف با یک خط خالی از پاراگراف بعدی جدا شود)، حداقل ۴۰۰ کلمه"}`;

    try {
      const { data } = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model,
          max_tokens: 2048,
          messages: [{ role: 'user', content: prompt }],
        },
        {
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          timeout: 60000,
        },
      );

      const text: string = data?.content?.[0]?.text ?? '';
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      if (!parsed.title || !parsed.content) {
        throw new Error('invalid AI response shape');
      }
      return {
        title: String(parsed.title),
        excerpt: String(parsed.excerpt ?? ''),
        content: String(parsed.content),
      };
    } catch (err) {
      throw new InternalServerErrorException(
        'تولید محتوا با خطا مواجه شد. لطفاً دوباره تلاش کنید یا مقاله را دستی بنویسید.',
      );
    }
  }
}
