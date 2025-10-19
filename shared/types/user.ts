export interface IUser {
    _id: string;
    username: string;
    firebaseUid: string;
    role: UserRole;
}

export enum UserRole {
    ADMIN = 'admin',
    TEKNISI= 'teknisi',
    HELPER= 'helper'
}