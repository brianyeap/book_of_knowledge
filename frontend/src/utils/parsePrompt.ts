import { Prompt } from "@/types/prompt";

const parseChoices = (
  choicesArray: string[]
): { a: string; b: string; c: string; d: string } => {
  const parsedChoices = choicesArray.reduce((acc: any, element) => {
    const choiceText = element.slice(3); // Extract the choice text
    const key = element[0].toLowerCase(); // Extract the first character as the key
    acc[key] = choiceText; // Assign the key-value pair
    return acc;
  }, {} as { a: string; b: string; c: string; d: string });

  return parsedChoices;
};

// specify the type of the answer
const parseAnswer = (answerLine: string): "a" | "b" | "c" | "d" => {
  const answerArray = answerLine
    .split(" ")
    .filter((element) => element.includes(")"));
  const answer = answerArray[0].slice(0, 1).toLowerCase() as
    | "a"
    | "b"
    | "c"
    | "d";
  return answer;
};

export const parsePrompt = (prompt: string) => {
  const cleanPrompt = prompt.replace(/\*/g, "");
  console.log("cleanPrompt", cleanPrompt);
  const splitUpArray = cleanPrompt.split("\n");
  const clearArray = splitUpArray.filter((element) => element !== "");
  const question = clearArray.filter((element) => element.endsWith("?"))[0];
  const choicesArray = clearArray.filter(
    (element) => element[1] === ")" && element[1] === ")"
  );

  const answerLine = clearArray.filter((element) =>
    element.includes("Answer:")
  )[0];

  console.log({
    question: question,
    choices: parseChoices(choicesArray),
    answer: parseAnswer(answerLine),
  });
};

// const reply = "Here's a MCQ question on geography:\n";
// "\n" +
//   "**Question:** Which of the following rivers flows through the Grand Canyon?\n" +
//   "\n" +
//   "**A)** Colorado River\n" +
//   "**B)** Missouri River\n" +
//   "**C)** Mississippi River\n" +
//   "**D)** Rio Grande\n" +
//   "\n" +
//   "**Answer:** **A)** Colorado River\n" +
//   "\n" +
//   "The Colorado River is the primary river that flows through the Grand Canyon, which is a famous natural wonder located in Arizona, USA.\n" +
//   "Here's another MCQ question on geography:\n" +
//   "\n" +
//   "What is the world's largest river by discharge volume?\n" +
//   "\n" +
//   "A) Amazon River\n" +
//   "B) Nile River\n" +
//   "C) Yangtze River\n" +
//   "D) Mississippi River\n" +
//   "Answer: A) Amazon River";

// console.log(parsePrompt(reply));
