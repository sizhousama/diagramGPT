import axios from "axios";

const API_KEY = "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"; //替换成你申请的open AI key
const model = "gpt-3.5-turbo"; //使用的语言模型

const api = axios.create({
  baseURL: "https://api.openai.com/v1",
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  },
});

export async function gererateMermaidSync(des: string, type: string) {
  const response = await api.post("/chat/completions", {
    model,
    messages: [
      { role: "system", content: "你是一个Mermaid专家" },
      {
        role: "user",
        content: `请帮我将以下描述转换成Mermaid代码,用来生成${type}:\n\n${des}`,
      },
    ],
    top_p: 0.8,
    max_tokens: 2000,
    n: 1,
  });
  const str = response.data.choices[0].message.content.slice(10);
  const res = str.slice(0, -4).trim();
  console.log(res);
  return res;
}
