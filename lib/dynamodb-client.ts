import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

const dbClient = new DynamoDBClient({
  region: "us-east-1",
});

export const ddbDocClient = DynamoDBDocument.from(dbClient);
