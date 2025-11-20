export enum ServerEnum {
  EU = 'EU',
  NA1 = 'NA1',
  NA2 = 'NA2',
}

export const ServerURL: Record<ServerEnum, string> = {
  [ServerEnum.EU]: "https://eudist.animemusicquiz.com/",
  [ServerEnum.NA1]: "https://nawdist.animemusicquiz.com/",
  [ServerEnum.NA2]: "https://naedist.animemusicquiz.com/"
};
