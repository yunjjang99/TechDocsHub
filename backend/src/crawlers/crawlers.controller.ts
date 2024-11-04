import { Controller, Get, UseGuards, Post } from "@nestjs/common";
import { CrawlersService } from "./crawlers.service";

@Controller("crawlers")
export class CrawlersController {
  constructor(private crawlersService: CrawlersService) {}
}
