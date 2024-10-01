import { IsEnum, IsNotEmpty, IsString } from "class-validator";

import { Server } from "@/enums/server.enum";

export class UserDto {
  @IsString()
  @IsNotEmpty()
  public name: string;

  @IsString()
  @IsNotEmpty()
  public image: string;

  @IsEnum(Server)
  @IsNotEmpty()
  public server: string;
}
