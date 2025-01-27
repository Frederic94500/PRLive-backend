import { IsNotEmpty, IsString } from "class-validator";

export class ServerDto {
  @IsString()
  @IsNotEmpty()
  public name: string;

  @IsString()
  @IsNotEmpty()
  public discordId: string;

  @IsString()
  @IsNotEmpty()
  public threadsId: string;

  @IsString()
  @IsNotEmpty()
  public announceId: string;

  @IsString()
  @IsNotEmpty()
  public roleId: string;
}
