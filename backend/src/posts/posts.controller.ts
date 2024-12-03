import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { PostsService } from "./posts.service";
import { Multer } from "multer";

@Controller("api/posts")
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post("publish/tistory")
  @UseInterceptors(FileInterceptor("file"))
  async publishToTistory(
    @UploadedFile() file: Express.Multer.File
  ): Promise<string> {
    const markdown = file.buffer.toString("utf-8");
    return this.postsService.publishToTistory(markdown);
  }
}
