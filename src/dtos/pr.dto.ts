import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsString, ValidateNested, isString } from 'class-validator';

import { Song } from '@/interfaces/song.interface';
import { Type } from 'class-transformer';

export class CreatePRDto {
  @IsString()
  @IsNotEmpty()
  public name: string;

  @IsBoolean()
  @IsNotEmpty()
  public nomination: boolean;

  @IsBoolean()
  @IsNotEmpty()
  public blind: boolean;

  @IsNumber()
  @IsNotEmpty()
  public deadline: number;

  @IsArray()
  @IsNotEmpty()
  @Type(() => SongListDto)
  @ValidateNested({ each: true })
  public songList: Song[];
}

export class SongListDto {
  @IsString()
  @IsNotEmpty()
  public artist: string;
  
  @IsString()
  @IsNotEmpty()
  public title: string;

  @IsString()
  @IsNotEmpty()
  public urlVideo: string;
}
