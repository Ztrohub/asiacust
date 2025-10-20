export interface IUser {
    _id: string;
    username: string;
    firebaseUid: string;
    role: USER_ROLE;
}

export enum USER_ROLE {
    ADMIN = 'admin',
    TEKNISI= 'teknisi',
    HELPER= 'helper'
}