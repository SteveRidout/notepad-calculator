export interface WholeDate {
  year: number;
  month: number;
  day: number;
}

export interface User {
  id: number;
  username: string;
  hashedPassword: string;
  creationTime: Date;
}

export interface Note {
  id: number;
  // userId: number;
  title: string;
  body: string;
  creationTime: Date;
  lastModifiedTime: Date;
}
