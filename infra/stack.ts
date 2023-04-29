import * as cdk from "aws-cdk-lib";
import { LambdaIntegration, RestApi, Cors } from "aws-cdk-lib/aws-apigateway";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { join } from "path";

const DDB_FLASHCARDS_TABLE_NAME = "flashcards";
const BUCKET_WEBSITE_NAME = "gafalcon_flashcards_website";

export interface SecondaryIndex {
  name: string;
  type: AttributeType;
}
export class DevStack extends cdk.Stack {
  private api = new RestApi(this, "FlashCardsAPI", {
    // // 👇 set up CORS
    // defaultCorsPreflightOptions: {
    //   allowHeaders: [
    //     "Content-Type",
    //     "X-Amz-Date",
    //     "Authorization",
    //     "X-Api-Key",
    //   ],
    //   allowMethods: ["OPTIONS", "GET", "POST", "PUT", "PATCH", "DELETE"],
    //   allowCredentials: true,
    //   allowOrigins: ["http://localhost:3000", "http://localhost:5173"],
    // },
  });
  private flashcardsTable: Table;
  // private answersTable: Table;
  private readCardsLambdaIntegration: LambdaIntegration;
  private createCardLambdaIntegration: LambdaIntegration;
  private getCardLambdaIntegration: LambdaIntegration;
  private answerCardLambdaIntegration: LambdaIntegration;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Dynamo Table
    this.flashcardsTable = new Table(this, DDB_FLASHCARDS_TABLE_NAME, {
      partitionKey: {
        name: "id",
        type: AttributeType.STRING,
      },
      tableName: DDB_FLASHCARDS_TABLE_NAME,
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    const secondaryIndexes: SecondaryIndex[] = [
      { name: "group", type: AttributeType.STRING },
      { name: "completed", type: AttributeType.NUMBER },
    ];
    for (const secondaryIndex of secondaryIndexes) {
      this.flashcardsTable.addGlobalSecondaryIndex({
        indexName: secondaryIndex.name,
        partitionKey: {
          name: secondaryIndex.name,
          type: secondaryIndex.type,
        },
      });
    }

    // API
    this.createLambdas();
    this.setAPIGateway();

    // S3 website
    this.createS3Website(BUCKET_WEBSITE_NAME);
  }

  private createLambdas() {
    const readCardsLambdaName = "readCards";
    const readCardsLambda = new NodejsFunction(this, readCardsLambdaName, {
      entry: join(__dirname, "..", "lambdas", `${readCardsLambdaName}.ts`),
      handler: "handler",
      functionName: readCardsLambdaName,
      environment: {
        TABLE_NAME: DDB_FLASHCARDS_TABLE_NAME,
      },
    });
    this.flashcardsTable.grantReadData(readCardsLambda);
    this.readCardsLambdaIntegration = new LambdaIntegration(readCardsLambda);

    const createCardLambdaName = "createCard";
    const createCardLambda = new NodejsFunction(this, createCardLambdaName, {
      entry: join(__dirname, "..", "lambdas", `${createCardLambdaName}.ts`),
      handler: "handler",
      functionName: createCardLambdaName,
      environment: {
        TABLE_NAME: DDB_FLASHCARDS_TABLE_NAME,
      },
    });
    this.flashcardsTable.grantWriteData(createCardLambda);
    this.createCardLambdaIntegration = new LambdaIntegration(createCardLambda);

    const {
      lambda: getCardlambda,
      lambdaIntegration: getCardlambdaIntegration,
    } = this.createLambda("getCard");
    this.flashcardsTable.grantReadData(getCardlambda);
    this.getCardLambdaIntegration = getCardlambdaIntegration;

    const {
      lambda: answerCardLambda,
      lambdaIntegration: answerCardLambdaIntegration,
    } = this.createLambda("answerCard");
    this.flashcardsTable.grantWriteData(answerCardLambda);
    this.answerCardLambdaIntegration = answerCardLambdaIntegration;
  }

  private createLambda(lambdaName: string) {
    const lambda = new NodejsFunction(this, lambdaName, {
      entry: join(__dirname, "..", "lambdas", `${lambdaName}.ts`),
      handler: "handler",
      functionName: lambdaName,
      environment: {
        TABLE_NAME: DDB_FLASHCARDS_TABLE_NAME,
      },
    });
    const lambdaIntegration = new LambdaIntegration(lambda);
    return { lambda, lambdaIntegration };
  }

  private setAPIGateway() {
    const flashcardsResource = this.api.root.addResource("flashcards");
    flashcardsResource.addCorsPreflight({
      allowOrigins: Cors.ALL_ORIGINS,
      allowMethods: Cors.ALL_METHODS,
      allowHeaders: Cors.DEFAULT_HEADERS,
    });
    flashcardsResource.addMethod("GET", this.readCardsLambdaIntegration);
    flashcardsResource.addMethod("POST", this.createCardLambdaIntegration);

    const flashCardResource = flashcardsResource.addResource("{cardId}");
    flashCardResource.addMethod("GET", this.getCardLambdaIntegration);

    const answerCardResource = flashCardResource.addResource("answer");
    answerCardResource.addCorsPreflight({
      allowOrigins: Cors.ALL_ORIGINS,
      allowMethods: Cors.ALL_METHODS,
      allowHeaders: Cors.DEFAULT_HEADERS,
    });
    answerCardResource.addMethod("PATCH", this.answerCardLambdaIntegration);
  }

  private createS3Website(bucketName: string) {
    const websiteBucket = new Bucket(this, "space-app-web-id", {
      bucketName: bucketName,
      publicReadAccess: true,
      websiteIndexDocument: "index.html",
    });

    return websiteBucket;
  }
}
