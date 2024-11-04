import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Crawler } from "./entities/crawlers.entity";

@Injectable()
export class CrawlersService {
  constructor(
    @InjectRepository(Crawler)
    private readonly crawlerRepository: Repository<Crawler>
  ) {}

  // 크롤링 실행
  async executeCrawling() {
    // 크롤링 로직 구현 예정
  }

  // 크롤링 결과 저장
  async saveCrawlingResult() {
    // 크롤링 결과 저장 로직 구현 예정
  }

  // 크롤링 이력 조회
  async getCrawlingHistory() {
    // 크롤링 이력 조회 로직 구현 예정
  }
}
