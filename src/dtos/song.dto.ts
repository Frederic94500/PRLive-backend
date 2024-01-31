import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class CreateSongDto {
  @IsString()
  @IsNotEmpty()
  public artist: string;

  @IsString()
  @IsNotEmpty()
  public title: string;

  @IsUrl()
  @IsNotEmpty()
  public url: URL;
}
