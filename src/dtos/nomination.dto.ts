import { IsArray, IsBoolean, IsISO8601, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateIf, ValidateNested } from "class-validator";
import { NominatedSongs, Nomination } from "@/interfaces/nomination.interface";

import { Type } from "class-transformer";

export class NominatedSongsDto implements NominatedSongs{
  @IsString()
  @IsOptional()
  public uuid: string;

  @IsString()
  @IsOptional()
  public nominator: string;

  @IsString()
  @IsOptional()
  public at: string;
}

export class NominationDto implements Nomination {
  @ValidateIf(o => o.nomination !== undefined)
  @IsString()
  @IsNotEmpty()
  public prId: string;

  @ValidateIf(o => o.nomination !== undefined)
  @IsBoolean()
  @IsNotEmpty()
  public hidden: boolean;
  
  @ValidateIf(o => o.nomination !== undefined)
  @IsBoolean()
  @IsNotEmpty()
  public blind: boolean;

  @ValidateIf(o => o.nomination !== undefined)
  @IsBoolean()
  @IsNotEmpty()
  public hideNominatedSongList: boolean;

  @ValidateIf(o => o.nomination !== undefined)
  @IsISO8601({ strict: true })
  @IsNotEmpty()
  public deadlineNomination: string;

  @ValidateIf(o => o.nomination !== undefined)
  @IsBoolean()
  @IsNotEmpty()
  public endNomination: boolean;

  @ValidateIf(o => o.nomination !== undefined)
  @IsNumber()
  @IsNotEmpty()
  public songPerUser: number;

  @ValidateIf(o => o.nomination !== undefined)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NominatedSongsDto)
  public nominatedSongList: NominatedSongs[];
}