import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import * as cookieParser from "cookie-parser";
import * as dotenv from "dotenv";
import { ExpressAdapter } from "@nestjs/platform-express";
import * as express from "express";
import { INestApplication } from "@nestjs/common";
import { AppLogger } from "./app.logger";
import { ResponseInterceptor } from "./common/interceptor/response.interceprot";
import NetflixBlogCrawler from "./crawlers/netflix-blog-crawler";

async function bootstrap() {
  dotenv.config();

  const server = express();
  const app = (await NestFactory.create(AppModule, new ExpressAdapter(server), {
    logger: new AppLogger(), // Winston 커스텀 로거 적용
  })) as INestApplication & express.Application;
  app.use(cookieParser());
  app.enableCors();
  app.set("trust proxy", 1);
  app.useGlobalInterceptors(new ResponseInterceptor());

  await app.listen(process.env.BACKEND_PORT);
  console.log(`서버가 포트 ${process.env.BACKEND_PORT}에서 실행 중입니다.`);

  // 1초 후에 크롤러 실행
  setTimeout(async () => {
    const crawler = new NetflixBlogCrawler();
    await crawler.openPage();
  }, 1000);
}

bootstrap();
