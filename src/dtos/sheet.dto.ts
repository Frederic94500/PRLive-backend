import { IsArray, IsNotEmpty, IsNumber, IsString, IsUUID, MaxLength, MinLength, ValidateNested, isNumber } from "class-validator";

import { SheetSong } from "@/interfaces/sheet.interface";
import { Type } from "class-transformer";

export class SheetDto {
  @IsString()
  @IsNotEmpty()
  public prId: string;

  @IsString()
  @IsNotEmpty()
  public voterId: string;

  @IsArray()
  @IsNotEmpty()
  @Type(() => SheetSongDto)
  @ValidateNested({ each: true })
  public sheet: SheetSong[];
}

export class SheetSongDto {
  @IsUUID()
  @IsNotEmpty()
  public uuid: string;

  @IsNumber()
  @IsNotEmpty()
  public orderId: number;


  // limit the length of comment 0 to 128 characters
  @IsString()
  @MaxLength(128, { message: 'Comment is too long' })
  public comment?: string;
}
