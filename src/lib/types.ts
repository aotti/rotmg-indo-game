import { PostgrestError } from "@supabase/supabase-js";

// ~~ command types ~~
type SubCommandOptionsType = {
    type: number;
    name: string;
    description: string;
    required?: boolean;
    choices?: { 
        name: string | number, 
        value: string | number,
        hidden?: string | number
    }[]
}

type SubCommandsType = {
    type: number;
    name: string;
    description: string;
    options?: SubCommandOptionsType[];
}

type CommandsType = {
    name: string;
    description: string;
    options?: SubCommandsType[];
}

// ~~ janken types ~~
type JankenModeType = {
    [key: string]: JankenPlayerType[];
}

type JankenPlayerType = {
    id: number;
    username: string;
    finger: string;
    result: string | null;
}

// ~~ database queries ~~
type dbReturnType = {
    data: any[] | null;
    error: PostgrestError | null;
}

type qbMethodType = dbSelectType | dbInsertType | dbUpdateType

type queryBuilderType = {
    table: string;
    selectColumn: string;
    whereColumn: string | null;
    whereValue: string | number | null;
    get insertColumn(): IUColumnType;
    get updateColumn(): IUColumnType;
}

type dbSelectType = {
    table: string;
    selectColumn: string;
    whereColumn: string;
    whereValue: string | number;
}

type dbInsertType = {
    table: string;
    selectColumn: string;
    get insertColumn(): IUColumnType;
}

type dbUpdateType = {
    table: string;
    selectColumn: string;
    whereColumn: string;
    whereValue: string | number;
    get updateColumn(): IUColumnType;
}

// insert / update column 
type IUColumnType = {
    id?: number;
    username?: string;
    win: number;
    lose: number;
    draw: number;
}

// ~~ cipher ~~
type encryptedType = {
    iv: string;
    encryptedText: string;
    decryptedText?: string;
    slicedEncrypted: string[]
}

export { 
    CommandsType, 
    SubCommandOptionsType,
    JankenModeType, 
    JankenPlayerType, 
    dbSelectType, 
    dbInsertType, 
    dbUpdateType,
    IUColumnType,
    queryBuilderType,
    qbMethodType,
    dbReturnType,
    encryptedType
}