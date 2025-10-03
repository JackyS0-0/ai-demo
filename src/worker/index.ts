import { Hono } from "hono";

export interface Env {
  API_KEY: string;
}

interface GenerateImageRequest {
  prompt: string;
  image: string;
  size?: string;
}

interface ArkApiResponse {
  data?: Array<{
    url: string;
  }>;
  error?: {
    message: string;
  };
}

const app = new Hono<{ Bindings: Env }>();

app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

// 图片生成API端点
app.post("/api/generate-image", async (c) => {
  try {
    const { prompt, image, size = "2K" } = await c.req.json<GenerateImageRequest>();

    if (!prompt || !image) {
      return c.json({ error: "缺少必要的参数: prompt 和 image" }, 400);
    }

    // 构建请求数据
    const requestData = {
      model: 'doubao-seedream-4-0-250828',
      prompt: prompt.trim(),
      image: image,
      size: size,
      sequential_image_generation: 'disabled',
      stream: false,
      response_format: 'url',
      watermark: true
    };

    // 调用ARK API
    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${c.env.API_KEY}`
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      const errorData = await response.json() as ArkApiResponse;
      return c.json({ error: errorData.error?.message || 'API调用失败' }, 400);
    }

    const result = await response.json() as ArkApiResponse;
    
    if (result.data && result.data.length > 0 && result.data[0].url) {
      return c.json({
        success: true,
        imageUrl: result.data[0].url
      });
    } else {
      return c.json({ error: '未收到有效的图片URL' }, 500);
    }
  } catch (error) {
    console.error('图片生成错误:', error);
    return c.json({
      error: error instanceof Error ? error.message : '生成图片时发生未知错误'
    }, 500);
  }
});

export default app;
