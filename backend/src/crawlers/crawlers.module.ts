import { forwardRef, Module } from "@nestjs/common";
import { CrawlersService } from "./crawlers.service";
import { CrawlersController } from "./crawlers.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Crawler } from "./entities/crawlers.entity";
import NetflixBlogCrawler from "./domain/netflix/netflix-blog-crawler";

@Module({
  imports: [
    TypeOrmModule.forFeature([Crawler]),
    forwardRef(() => CrawlersModule), // forwardRef 사용
  ],
  controllers: [CrawlersController],
  providers: [CrawlersService, NetflixBlogCrawler],
  exports: [CrawlersService, NetflixBlogCrawler],
})
export class CrawlersModule {}
