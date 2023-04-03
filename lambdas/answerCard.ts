import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";

import { ddbDocClient } from "../lib/dynamodb-client";
import { getEventBody, send } from "../lib/Utils";
const TABLE_NAME = process.env.TABLE_NAME;

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  let cardId = event.pathParameters!.cardId;
  const body = getEventBody(event);
  let answer_field = body.is_correct
    ? "correct_attempts"
    : "incorrect_attempts";

  try {
    const res = await ddbDocClient.update({
      TableName: TABLE_NAME,
      Key: {
        id: cardId,
      },
      UpdateExpression: "ADD #counterfield :inc",
      ExpressionAttributeValues: {
        ":inc": 1,
      },
      ExpressionAttributeNames: {
        "#counterfield": answer_field,
      },
      ConditionExpression: "attribute_exists(id)",
      ReturnValues: "UPDATED_NEW",
    });
    return send(200, { item: res.Attributes });
  } catch (error) {
    return send(500, { error: (error as Error).message });
  }
};
