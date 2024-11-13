import { IsNotEmpty, IsNumber, IsString, Min } from "class-validator";

export class NominateDto {
  @IsString()
  @IsNotEmpty()
  artist: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  startSample: number;

  @IsString()
  @IsNotEmpty()
  public urlVideo: string;

  @IsString()
  @IsNotEmpty()
  public urlAudio: string;
}
