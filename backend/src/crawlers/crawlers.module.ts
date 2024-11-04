import { Module } from "@nestjs/common";
import { CrawlersService } from "./crawlers.service";
import { CrawlersController } from "./crawlers.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Crawler } from "./entities/crawlers.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Crawler])],
  controllers: [CrawlersController],
  providers: [CrawlersService],
  exports: [CrawlersService],
})
export class CrawlersModule {}
