import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("crawlers")
export class Crawler {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 100 })
  companyName: string; // 크롤링한 기업명

  @Column({ type: "varchar", length: 255 })
  baseBlogUrl: string; // 기업의 기술 블로그 기본 URL

  @Column({ type: "varchar", length: 255 })
  blogPostUrl: string; // 크롤링한 특정 블로그 포스트 URL

  @Column({ type: "varchar", length: 255 })
  title: string; // 블로그 포스트 제목

  @Column({ type: "timestamp" })
  postPublishedAt: Date; // 블로그 글이 작성된 시점

  @Column({ type: "timestamp" })
  crawledAt: Date; // 크롤링된 시점

  @Column({ type: "varchar", length: 500 })
  absolutePath: string; // 크롤링된 HTML 문서의 절대 경로

  @Column({ type: "varchar", length: 255 })
  relativePath: string; // 크롤링된 HTML 문서의 상대 경로

  @Column({ type: "varchar", length: 50, default: "active" })
  status: string; // 크롤링 상태 (active, inactive, error 등)

  @Column({ type: "text", nullable: true })
  description: string; // 블로그 포스트 요약 또는 설명

  @Column({ type: "simple-array", nullable: true })
  tags: string[]; // 블로그 포스트 관련 태그들

  @Column({ type: "int", default: 0 })
  retryCount: number; // 크롤링 재시도 횟수

  @Column({ type: "varchar", length: 50, nullable: true })
  language: string; // 블로그 포스트 언어

  @CreateDateColumn()
  createdAt: Date; // 레코드 생성 시점

  @UpdateDateColumn()
  updatedAt: Date; // 레코드 수정 시점
}
