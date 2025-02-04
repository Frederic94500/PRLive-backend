import { IsEnum, IsNotEmpty, IsString } from "class-validator";

import { ServerEnum } from "@/enums/server.enum";

export class UserDto {
  @IsString()
  @IsNotEmpty()
  public name: string;

  @IsString()
  @IsNotEmpty()
  public image: string;

  @IsEnum(ServerEnum)
  @IsNotEmpty()
  public server: string;
}
