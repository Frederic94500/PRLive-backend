export interface User {
  _id?: string;
  discordId: string;
  username: string;
  name: string;
  image: string;
  role: string;
}

export interface UserOutput {
  discordId: string;
  username: string;
  name: string;
  image: string;
}
