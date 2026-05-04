const Anthropic = require("@anthropic-ai/sdk");
const readline = require("readline");

const client = new Anthropic();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

const conversationHistory = [];

async function chat(userMessage) {
  conversationHistory.push({
    role: "user",
    content: userMessage,
  });

  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 8096,
    system: `You are a helpful personal finance assistant. You help users manage their monthly budgets effectively.
Your capabilities include:
1. Creating and editing budget categories with monthly allocations
2. Tracking expenses in different categories
3. Calculating remaining budget for each category
4. Providing budget summaries and insights
5. Offering recommendations to improve spending habits

When users interact with you, help them:
- Define their income
- Set up budget categories (e.g., Food, Transportation, Entertainment, Utilities, etc.)
- Record expenses
- Track their spending progress
- Get insights on their financial habits

Always be encouraging and practical with your advice. Format your responses clearly and ask clarifying questions when needed.`,
    messages: conversationHistory,
  });

  const contentBlock = response.content[0];
  let assistantMessage = "";

  if (contentBlock.type === "text") {
    assistantMessage = contentBlock.text;
  }

  conversationHistory.push({
    role: "assistant",
    content: assistantMessage,
  });

  return assistantMessage;
}

async function initializeBudget() {
  console.log("\n=================================");
  console.log("💰 PERSONAL MONTHLY BUDGET SIMULATOR");
  console.log("=================================\n");
  console.log("Welcome! I'm your personal finance assistant.");
  console.log(
    "I'll help you create and manage your monthly budget interactively.\n"
  );

  const initialPrompt =
    "Let's start by setting up your monthly budget. First, what is your monthly income (after taxes)?";
  const response = await chat(initialPrompt);
  console.log(`Assistant: ${response}\n`);
}

async function main() {
  try {
    await initializeBudget();

    while (true) {
      const userInput = await question("You: ");

      if (
        userInput.toLowerCase() === "exit" ||
        userInput.toLowerCase() === "quit"
      ) {
        console.log(
          "\nAssistant: Thank you for using the Budget Simulator! Remember to review your budget regularly and adjust as needed. Goodbye! 👋\n"
        );
        break;
      }

      if (userInput.trim() === "") {
        continue;
      }

      try {
        const response = await chat(userInput);
        console.log(`\nAssistant: ${response}\n`);
      } catch (error) {
        if (error.status === 429) {
          console.log(
            "\nAssistant: I'm getting too many requests. Please wait a moment before continuing.\n"
          );
        } else {
          throw error;
        }
      }
    }
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});