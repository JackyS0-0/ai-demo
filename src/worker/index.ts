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

    const refinedPrompt = `你是一个穿搭专家，用户提供了一张全身照片，并提供了以下文字描述信息：\n${prompt}\n，请根据这些信息，发挥你的想象力，先确定人物穿搭的详细方案，再直接修改图片中的穿搭`
   
    // 构建图像生成请求数据（使用润色后的提示词）
    const requestData = {
      model: 'doubao-seedream-4-0-250828',
      prompt: refinedPrompt,
      image: image,
      size: size,
      sequential_image_generation: 'disabled',
      stream: false,
      response_format: 'url',
      watermark: true
    };

    // 调用ARK 图像生成 API
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

// 简易登录接口（演示用）
app.post("/api/login", async (c) => {
  try {
    const { username, password } = await c.req.json<{ username: string; password: string }>().catch(() => ({ username: "", password: "" }));
    if (username === "admin" && password === "123456") {
      return c.json({ token: "demo-token-" + Date.now() });
    }
    return c.json({ error: "用户名或密码错误" }, 401);
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : "登录失败" }, 500);
  }
});

export default app;
