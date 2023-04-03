import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";

import { ddbDocClient } from "../lib/dynamodb-client";
import { send } from "../lib/Utils";
const TABLE_NAME = process.env.TABLE_NAME;

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  let cardId = event.pathParameters!.cardId;
  try {
    const res = await ddbDocClient.get({
      TableName: TABLE_NAME,
      Key: { id: cardId },
    });
    return send(200, { item: res.Item });
  } catch (error) {
    return send(500, { error: (error as Error).message });
  }
};
