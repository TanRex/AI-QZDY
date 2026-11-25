export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    const { userInput } = req.body;
    if (!userInput || userInput.trim().length === 0) {
      return res.status(400).json({ error: '请输入你的需求' });
    }
  
    // 这里写死你的“事前设定”（元提示词）
    const SYSTEM_PROMPT = `
  你是一个专业的 AI 提示词优化引擎。你的任务是根据用户输入的简单需求，生成一段可直接复制使用的“AI 前置设定指令”。
  目的：让用户在其他 AI 软件（如 ChatGPT、Claude、Gemini）开启新对话时，直接粘贴这段话，从而省去多轮废话沟通，节省上下文空间，并让 AI 一开始就进入高水平工作状态。
  
  请严格按照以下格式输出，不要包含任何开场白或结束语：
  
  ### 角色设定
  [根据用户需求设定的专业专家身份]
  
  ### 核心目标
  [用一句话精准概括要完成的任务]
  
  ### 执行规则（节省空间与防蠢限制）
  1. 拒绝废话：不要输出“好的”、“没问题”等客套话，直接给结果。
  2. 风格要求：[根据需求设定的输出风格、字数或格式]
  3. 信息补全机制：如果我后续提供的信息不足，请先向我提出最多 3 个关键问题，确认后再执行。
  
  ### 启动确认
  如果你已理解以上全部规则，请仅回复“已就绪，请发送你的具体内容”，不要输出其他任何字符。
  `.trim();
  
    try {
      // 使用轻量且免费额度充足的 gemini-2.5-flash 模型
      const apiKey = process.env.GEMINI_API_KEY;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }]
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: `用户的原始需求是：${userInput.slice(0, 500)}` }]
            }
          ],
          generationConfig: {
            temperature: 0.4 // 保持输出结构稳定，不乱发挥
          }
        })
      });
  
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'API 请求失败');
      }
  
      const resultText = data.candidates[0].content.parts[0].text;
      return res.status(200).json({ result: resultText });
  
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }