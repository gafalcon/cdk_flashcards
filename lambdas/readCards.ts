import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";

import { ddbDocClient } from "../lib/dynamodb-client";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
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

    return {
      statusCode: 200,
      body: JSON.stringify({ data: data.Items }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: (error as Error).message }),
    };
  }
};
