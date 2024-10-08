export interface SheetSimple {
    prId: string;
    finished: boolean;
}

export interface Sheet {
    _id?: string;
    prId: string;
    voterId: string;
    latestUpdate: string;
    name: string;
    image: string;
    sheet: SheetSong[];
}

export interface SheetSong {
    uuid: string;
    orderId: number;
    rank: number;
    score: number;
}
