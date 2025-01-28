import { AnisongDb, Song } from '@/interfaces/song.interface';
import { IsArray, IsBoolean, IsEnum, IsISO8601, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUUID, IsUrl, Min, ValidateNested, ValidationArguments, ValidationOptions, registerDecorator } from 'class-validator';

import { NominationDto } from './nomination.dto';
import { PRStatus } from '@/enums/prStatus.enum';
import { Type } from 'class-transformer';

export class CreatePRDto {
  @IsString()
  @IsNotEmpty()
  public name: string;

  @IsBoolean()
  @IsNotEmpty()
  public isNomination: boolean;

  @IsISO8601({ strict: true })
  @IsNotEmpty()
  public deadline: string;

  @IsString()
  @IsNotEmpty()
  public serverId: string;

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

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  public startSample: number;
  
  @IsNumber()
  @IsPositive()
  @Min(1)
  @IsNotEmpty()
  public sampleLength: number;

  @IsString()
  @IsNotEmpty()
  public urlVideo: string;

  @IsString()
  @IsNotEmpty()
  public urlAudio: string;

  @IsNumber()
  @IsNotEmpty()
  public tiebreak: number;
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
  @Min(0)
  @IsNotEmpty()
  public startSample: number;
  
  @IsNumber()
  @IsPositive()
  @Min(1)
  @IsNotEmpty()
  public sampleLength: number;

  @IsString()
  @IsNotEmpty()
  public urlVideo: string;

  @IsString()
  @IsNotEmpty()
  public urlAudio: string;

  @IsNumber()
  @IsNotEmpty()
  public tiebreak: number;
}

export class UpdatePRDto {
  @IsString()
  @IsNotEmpty()
  public name: string;

  @IsString()
  @IsNotEmpty()
  public creator: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(PRStatus)
  public status: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => NominationDto)
  public nomination?: NominationDto;
  
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

export class TiebreakSongDto {
  @IsString()
  @IsNotEmpty()
  public uuid: string;

  @IsNumber()
  @IsNotEmpty()
  public tiebreak: number;
}

export class TiebreakDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TiebreakSongDto)
  public tieSongs: TiebreakSongDto[][];
}
