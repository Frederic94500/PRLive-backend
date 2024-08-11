import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsString } from "class-validator";

import { Song } from "@/interfaces/song.interface";

export class CreatePRDto {
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

    @IsNumber()
    @IsNotEmpty()
    public deadline: number;

    @IsArray()
    @IsNotEmpty()
    public songList: Song[];
}