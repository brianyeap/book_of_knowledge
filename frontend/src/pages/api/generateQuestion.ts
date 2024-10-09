import OpenAI from "openai";

export const questionGenerateGPT = async (subject: string) => {
  console.log(process.env.OPENAI_API_KEY);
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `give me one question in ${subject}\nRandomisation seed: ${Date.now}`,
          },
        ],
      },
    ],
    temperature: 1,
    max_tokens: 2048,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    tools: [
      {
        type: "function",
        function: {
          name: "generate_quiz_schema",
          strict: true,
          parameters: {
            type: "object",
            required: ["question", "choices", "answer_key"],
            properties: {
              choices: {
                type: "object",
                required: ["a", "b", "c", "d"],
                properties: {
                  a: {
                    type: "string",
                    description: "Choice labeled 'a'.",
                  },
                  b: {
                    type: "string",
                    description: "Choice labeled 'b'.",
                  },
                  c: {
                    type: "string",
                    description: "Choice labeled 'c'.",
                  },
                  d: {
                    type: "string",
                    description: "Choice labeled 'd'.",
                  },
                },
                description: "An object containing quiz choices with labels.",
                additionalProperties: false,
              },
              question: {
                type: "string",
                description: "The quiz question being asked.",
              },
              answer_key: {
                type: "string",
                description:
                  "The letter corresponding to the correct answer (e.g., 'a', 'b').",
              },
            },
            additionalProperties: false,
          },
          description: "Generate a schema for a quiz.",
        },
      },
    ],
    parallel_tool_calls: true,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "quiz_response",
        strict: true,
        schema: {
          type: "object",
          properties: {
            question: {
              type: "string",
              description: "The question being asked in the quiz.",
            },
            choices: {
              type: "object",
              required: ["a", "b", "c", "d"],
              properties: {
                a: {
                  type: "string",
                  description: "Choice labeled 'a'.",
                },
                b: {
                  type: "string",
                  description: "Choice labeled 'b'.",
                },
                c: {
                  type: "string",
                  description: "Choice labeled 'c'.",
                },
                d: {
                  type: "string",
                  description: "Choice labeled 'd'.",
                },
              },
              description: "An object containing quiz choices with labels.",
              additionalProperties: false,
            },
            answer_key: {
              type: "string",
              description:
                "The correct answer from the provided answer options.",
            },
          },
          required: ["question", "choices", "answer_key"],
          additionalProperties: false,
        },
      },
    },
  });
  return response;
};

// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  const { subject } = req.query;
  const gptQuestion = JSON.parse(
    (await questionGenerateGPT(subject as string)).choices[0].message[
      "content"
    ] as string
  );
  console.log("gptQuestion", gptQuestion);
  res.status(200).json(gptQuestion);
}
