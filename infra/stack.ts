import * as cdk from "aws-cdk-lib";
import { LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { join } from "path";

const DDB_TABLE_NAME = "flashcards";

export class DevStack extends cdk.Stack {
  private api = new RestApi(this, "FlashCardsAPI");
  private flashcardsTable: Table;
  private readCardsLambdaIntegration: LambdaIntegration;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Dynamo Tables
    this.flashcardsTable = new Table(this, DDB_TABLE_NAME, {
      partitionKey: {
        name: "id",
        type: AttributeType.STRING,
      },
      tableName: DDB_TABLE_NAME,
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    this.createLambdas();
    this.setAPIGateway();
  }

  private createLambdas() {
    const readCardsLambdaName = "readCards";
    const readCardsLambda = new NodejsFunction(this, readCardsLambdaName, {
      entry: join(__dirname, "..", "lambdas", `${readCardsLambdaName}.ts`),
      handler: "handler",
      functionName: readCardsLambdaName,
      environment: {
        TABLE_NAME: DDB_TABLE_NAME,
      },
    });
    this.flashcardsTable.grantReadData(readCardsLambda);
    this.readCardsLambdaIntegration = new LambdaIntegration(readCardsLambda);
  }

  private setAPIGateway() {
    const flashcardsResource = this.api.root.addResource("flashcards");
    flashcardsResource.addMethod("GET", this.readCardsLambdaIntegration, {});
  }
}
