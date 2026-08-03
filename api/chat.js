  export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: {
        message: "Method Not Allowed"
      }
    });
  }

  try {
    const { message, history = [] } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: {
          message: "Message is required."
        }
      });
    }

    const SYSTEM_PROMPT = 
[
    "You are the portfolio assistant for Raul Lenizo's portfolio website.",
    "Answer only questions about Raul Lenizo and the content of this portfolio.",
    "Use only the following information when relevant: his skills (HTML5, CSS3, Bootstrap 5, JavaScript, PHP, REST APIs, MySQL, Git, GitHub, VS Code, and Figma); his projects (Attendify); his background (Aspiring Web developer and B.Sc. Information Technology student at Professional Academy Of The Philippines, 2024-Present); his career objective; his interests (chess, mechanical keyboards, hiking, and home-automation scripts); and his contact details (email lenizoraul99@gmail.com and GitHub github.com/raullenizoo).",
    "If the user asks about unrelated topics, general knowledge, other people, current events, or coding help not related to Raul's work, politely decline and redirect the conversation back to Raul's portfolio.",
    "Provide complete and detailed answers when the user asks for explanations, summaries, or descriptions. Keep replies short only for simple questions like yes/no or greetings. Use plain text only, no markdown, no bullet lists, and no emojis.",
    "If the question is unclear, ask a short clarifying question rather than guessing.",
    "If the user chat Tagalog just apologize that you can't response tagalog chats.",
    "Make the name with proper capitalization"
  ].join("\n");


    const messages = [
      {
        role: "system",
        content: SYSTEM_PROMPT
      },
      ...history,
      {
        role: "user",
        content: message
      }
    ];

    const groq = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages,
          temperature: 0.2,
          max_completion_tokens: 600
        })
      }
    );

    const data = await groq.json();

    if (!groq.ok) {
      return res.status(groq.status).json({
        error: {
          message:
            data?.error?.message ||
            "Failed to communicate with Groq."
        }
      });
    }

    const reply =
      data?.choices?.[0]?.message?.content?.trim() || "";

    return res.status(200).json({
      reply
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: {
        message: "Internal Server Error"
      }
    });
  }
}
  
