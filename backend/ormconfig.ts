import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { DataSourceOptions } from "typeorm";
import { User } from "./src/user/entities/user.entity";
import * as dotenv from "dotenv";
import { join } from "path";
import { Crawler } from "@/crawlers/entities/crawlers.entity";

dotenv.config();

const commonTypeOrmConfig: TypeOrmModuleOptions & DataSourceOptions = {
  type: "mysql",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [User, Crawler],
  migrations: [join(__dirname, "src/migrations/*.ts")],
  charset: "utf8mb4",
};

export const typeOrmConfig = {
  ...commonTypeOrmConfig,
  synchronize: process.env.IS_DEV ? true : true, // 운영 환경에서는 false로 설정
  logging: false,
};

export const dataSourceConfig: DataSourceOptions = {
  ...commonTypeOrmConfig,
  synchronize: false, // 마이그레이션 시에는 항상 false로 설정
  logging: true, // 마이그레이션 로그 확인용
};
