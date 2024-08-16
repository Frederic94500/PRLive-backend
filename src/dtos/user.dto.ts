import { IsNotEmpty, IsString } from "class-validator";

export class UserDto {
  @IsString()
  @IsNotEmpty()
  public name: string;

  @IsString()
  @IsNotEmpty()
  public image: string;
}
