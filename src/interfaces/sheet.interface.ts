export interface Sheet {
    _id?: string;
    prId: string;
    voterId: string;
    sheet: SheetSong[];
}

export interface SheetSong {
    uuid: string;
    orderId: number;
    rank: number;
    score: number;
}
