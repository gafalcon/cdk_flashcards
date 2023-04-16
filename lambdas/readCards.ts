import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";

import { ddbDocClient } from "../lib/dynamodb-client";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { send } from "../lib/Utils";
const TABLE_NAME = process.env.TABLE_NAME;

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    const data = await ddbDocClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
      })
    );

    return send(200, { data: data.Items });
  } catch (error) {
    return send(500, { error: (error as Error).message });
  }
};
