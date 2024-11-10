import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from "typeorm";

@Entity()
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  filePath: string; // 로컬 파일 시스템에 저장된 마크다운 파일의 경로

  @Column()
  title: string; // 포스팅될 글의 제목

  @Column({ nullable: true })
  tStoryUrl: string; // 티스토리 URL

  @Column({ nullable: true })
  naverUrl: string; // 네이버 URL

  @Column({ nullable: true })
  vlogUrl: string; // 브이로그 URL

  @CreateDateColumn()
  postedAt: Date; // 언제 포스팅되었나
}
