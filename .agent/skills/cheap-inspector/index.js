import fs from 'fs';
import path from 'path';

// Grab the API key from the environment
const apiKey = process.env.OPENROUTER_API_KEY;
const inputFile = process.argv[2];

if (!apiKey) {
  console.error("Error: OPENROUTER_API_KEY environment variable is missing.");
  process.exit(1);
}

if (!inputFile) {
  console.error("Error: Please provide a file path to inspect.");
  process.exit(1);
}

// Read the massive file that Antigravity points the script to
const inputContent = fs.readFileSync(path.resolve(inputFile), 'utf8');

async function runInspector() {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "openrouter/free",
      messages: [
        {
          role: "system",
          content: "You are a cheap inspection subagent. Read messy input and return only a JSON object with: finding, evidence pointer, confidence, next action. Do not dump raw logs. Output pure JSON."
        },
        {
          role: "user",
          content: `Inspect this and return the clean worker result:\n\n${inputContent}`
        }
      ],
      temperature: 0.2,
      max_tokens: 500
    })
  });

  if (!response.ok) {
    console.error(`API Error: ${response.status} ${response.statusText}`);
    process.exit(1);
  }

  const data = await response.json();
  
  // Print the clean output to the terminal so Antigravity can read it
  console.log(data.choices[0].message.content);
}

runInspector().catch(console.error);