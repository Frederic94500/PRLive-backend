import { AnisongDb, Song } from '@/interfaces/song.interface';
import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsString, IsUUID, ValidateNested, ValidationArguments, ValidationOptions, isString, registerDecorator } from 'class-validator';

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

export function IsOneOfTwoFieldsNotEmpty(property: string, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isOneOfTwoFieldsNotEmpty',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property],
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];
          return (value && value.length > 0) || (relatedValue && relatedValue.length > 0);
        },
        defaultMessage(args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          return `Either ${args.property} or ${relatedPropertyName} must be non-empty`;
        },
      },
    });
  };
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

  @IsBoolean()
  @IsNotEmpty()
  public nomination: boolean;

  @IsBoolean()
  @IsNotEmpty()
  public blind: boolean;

  @IsNumber()
  @IsNotEmpty()
  public deadline: number;

  @IsBoolean()
  @IsNotEmpty()
  public finished: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SongListDto)
  public songList: Song[];
}
