import { DetectionResult, Language } from "../types";

// --- CUSTOM OVERRIDE CONFIGURATION ---
const CUSTOM_OVERRIDES: Record<string, DetectionResult> = {
  "CUSTOM_KEY_EXAMPLE": {
    found: true,
    gridSize: { rows: 4, cols: 4 },
    anomalyPosition: { row: 1, col: 1 },
    boundingBox: { ymin: 100, xmin: 100, ymax: 300, xmax: 300 },
    description: "Custom Override Description",
    reason: "Pre-defined custom rule triggered.",
    confidence: 1.0
  }
};

const checkCustomOverrides = (base64Data: string): DetectionResult | null => {
  for (const [key, result] of Object.entries(CUSTOM_OVERRIDES)) {
    if (key !== "CUSTOM_KEY_EXAMPLE" && base64Data.includes(key)) {
      return result;
    }
  }
  return null;
};

export const detectAnomaly = async (base64Image: string, lang: Language): Promise<DetectionResult> => {
  try {
    // 确保 base64 数据包含 data URL 前缀
    let imageData = base64Image;
    if (!imageData.startsWith('data:image/')) {
      imageData = 'data:image/jpeg;base64,' + imageData;
    }

    // 提取纯 base64 数据用于自定义检查
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");

    // 1. Check Custom Overrides
    const customResult = checkCustomOverrides(base64Data);
    if (customResult) {
      await new Promise(r => setTimeout(r, 800)); // Fake network delay
      return customResult;
    }

    // 2. API Call
    const prompt = lang === 'zh'
      ? `找出网格中的异类(颜色/破损/形状不同)。返回JSON:{"found":bool,"gridSize":{"rows":n,"cols":n},"anomalyPosition":{"row":n,"col":n},"boundingBox":{"ymin":0-1000,"xmin":0-1000,"ymax":0-1000,"xmax":0-1000},"reason":"简短原因","description":"简短描述","confidence":0-1}`
      : `Find the odd one out (color/damage/shape). Return JSON:{"found":bool,"gridSize":{"rows":n,"cols":n},"anomalyPosition":{"row":n,"col":n},"boundingBox":{"ymin":0-1000,"xmin":0-1000,"ymax":0-1000,"xmax":0-1000},"reason":"brief","description":"brief","confidence":0-1}`;

    // 添加请求超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60秒超时

    const response = await fetch("https://api.siliconflow.cn/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.API_KEY}`,
        "Content-Type": "application/json"
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "zai-org/GLM-4.5V",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt + "\n\nIMPORTANT: You must respond with a valid JSON object only, no additional text or explanation."
              },
              {
                type: "image_url",
                image_url: {
                  url: imageData
                }
              }
            ]
          }
        ],
        temperature: 0.2,
        max_tokens: 1024,
        stream: false
      })
    });

    clearTimeout(timeoutId); // 清除超时定时器

    if (!response.ok) {
      let errorMessage = `SiliconFlow API error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.error && errorData.error.message) {
          errorMessage += ` - ${errorData.error.message}`;
        }
      } catch (e) {
        // 如果无法解析错误响应，使用默认消息
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();

    // 检查响应结构
    if (!result.choices || !result.choices[0] || !result.choices[0].message) {
      throw new Error("Invalid response format from SiliconFlow API");
    }

    const content = result.choices[0].message.content;

    // 尝试解析 JSON
    let data: DetectionResult;
    try {
      data = JSON.parse(content) as DetectionResult;
    } catch (parseError) {
      console.error("Failed to parse JSON response:", content);

      // 尝试从文本中提取 JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          data = JSON.parse(jsonMatch[0]) as DetectionResult;
        } catch (extractError) {
          throw new Error("Failed to parse JSON response from model");
        }
      } else {
        throw new Error("No JSON found in model response");
      }
    }

    // 验证响应数据并设置默认值
    if (!data.found && data.found !== false) {
      data.found = false;
    }
    if (!data.gridSize || typeof data.gridSize.rows !== 'number' || typeof data.gridSize.cols !== 'number') {
      data.gridSize = { rows: 4, cols: 4 }; // 默认网格大小
    }
    if (!data.description) {
      data.description = data.found ? "An anomaly was detected" : "No anomaly found";
    }
    if (!data.reason) {
      data.reason = data.found ? "Visual differences detected" : "All items appear identical";
    }
    if (typeof data.confidence !== 'number') {
      data.confidence = 0.8;
    }
    if (!data.anomalyPosition) {
      data.anomalyPosition = { row: 0, col: 0 };
    }
    if (!data.boundingBox) {
      data.boundingBox = { ymin: 0, xmin: 0, ymax: 0, xmax: 0 };
    }

    // Sanity check: if not found, ensure boundingBox is ignored/safe
    if (!data.found) {
      data.anomalyPosition = { row: 0, col: 0 };
      data.boundingBox = { ymin: 0, xmin: 0, ymax: 0, xmax: 0 };
    }

    return data;

  } catch (error) {
    // 处理超时错误
    if (error instanceof Error && error.name === 'AbortError') {
      console.error("Request timeout after 60 seconds");
      throw new Error("Request timeout - The API took too long to respond. Please try again with a smaller image or check your network connection.");
    }
    console.error("Error identifying anomaly:", error);
    throw error;
  }
};