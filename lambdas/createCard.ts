import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";

import { ddbDocClient } from "../lib/dynamodb-client";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { generateRandomId, getEventBody } from "../lib/Utils";
import {
  MissingFieldError,
  validateCreateCardBody,
} from "../lib/InputValidator";
import { FlashCard } from "../models/FlashCard";
const TABLE_NAME = process.env.TABLE_NAME;

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const body = getEventBody(event);
  try {
    validateCreateCardBody(body);
    const card: FlashCard = {
      id: generateRandomId(),
      group: body.group,
      question: body.question,
      answer: body.answer,
      two_way: body.two_way || false,
      complete: 0,
      correct_attempts: 0,
      incorrect_attempts: 0,
      correct_attempts_two_way: 0,
      incorrect_attempts_two_way: 0,
    };

    const data = await ddbDocClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: card,
      })
    );

    return {
      statusCode: 201,
      body: JSON.stringify({ created: card }),
    };
  } catch (error) {
    const statusCode = error instanceof MissingFieldError ? 400 : 500;
    return {
      statusCode: statusCode,
      body: JSON.stringify({ error: (error as Error).message }),
    };
  }
};
