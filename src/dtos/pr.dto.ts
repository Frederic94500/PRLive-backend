import { AnisongDb, Song } from '@/interfaces/song.interface';
import { IsArray, IsBoolean, IsISO8601, IsNotEmpty, IsNumber, IsString, IsUUID, ValidateNested, ValidationArguments, ValidationOptions, registerDecorator } from 'class-validator';

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

  @IsISO8601({ strict: true })
  @IsNotEmpty()
  public deadline: string;

  // @IsArray()
  // @ValidateNested({ each: true })
  // @Type(() => SongListDto)
  // @IsOneOfTwoFieldsNotEmpty('anisongDb', { message: 'Either songList or anisongDb must be non-empty' })
  // public songList: Song[];

  // @IsArray()
  // @ValidateNested({ each: true })
  // @Type(() => AnisongDbDto)
  // @IsOneOfTwoFieldsNotEmpty('songList', { message: 'Either songList or anisongDb must be non-empty' })
  // public anisongDb: AnisongDb[];
}

export class SongListDto {
  @IsUUID()
  @IsNotEmpty()
  public uuid: string;

  @IsString()
  @IsNotEmpty()
  public artist: string;
  
  @IsString()
  @IsNotEmpty()
  public title: string;

  @IsString()
  @IsNotEmpty()
  public type: string;

  // @IsString()
  // @IsNotEmpty()
  // public urlVideo: string;
}

export class AnisongDbDto {
  @IsString()
  @IsNotEmpty()
  public artist: string;
  
  @IsString()
  @IsNotEmpty()
  public title: string;

  // @IsString()
  // @IsNotEmpty()
  // public urlVideo: string;
}

export class AddSongPRDto {
  @IsString()
  @IsNotEmpty()
  public artist: string;
  
  @IsString()
  @IsNotEmpty()
  public title: string;

  @IsString()
  @IsNotEmpty()
  public type: string;

  @IsNumber()
  @IsNotEmpty()
  public startSample: number;
  
  @IsNumber()
  @IsNotEmpty()
  public sampleLength: number;

  @IsString()
  @IsNotEmpty()
  public urlVideo: string;

  @IsString()
  @IsNotEmpty()
  public urlAudio: string;
}

export class UpdatePRDto {
  @IsString()
  @IsNotEmpty()
  public name: string;

  @IsString()
  @IsNotEmpty()
  public creator: string;

  @IsBoolean()
  @IsNotEmpty()
  public nomination: boolean;

  @IsBoolean()
  @IsNotEmpty()
  public blind: boolean;
  
  @IsISO8601({ strict: true })
  @IsNotEmpty()
  public deadline: number;

  @IsBoolean()
  @IsNotEmpty()
  public finished: boolean;

  @IsString()
  @IsNotEmpty()
  public hashKey: string;

  @IsNumber()
  @IsNotEmpty()
  public numberSongs: number;

  @IsNumber()
  @IsNotEmpty()
  public mustBe: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SongListDto)
  public songList: Song[];
}

export class TiebreakDto {
  @IsString()
  @IsNotEmpty()
  public prId: string;

  @IsUUID()
  @IsNotEmpty()
  public uuid: string;
}
