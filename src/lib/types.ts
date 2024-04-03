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

// insert / update column for janken
type IUColumnType = {
    id?: number;
    username?: string;
    win: number;
    lose: number;
    draw: number;
}

// ~~ abc 5 dasar ~~
interface IABC_Response {
    status: number;
    message: string | PostgrestError | null;
}

interface IABC_Response_Stats extends IABC_Response {
    data: {
        id: number;
        username: string;
        game_played: number;
        words_used: number;
    }[];
}

interface IABC_Response_Register extends IABC_Response {
    data: {
        id: number;
        username: string;
    }[];
}

interface IABC_Response_Categories extends IABC_Response {
    data: {
        category: string;
    }[]
}

export { 
    // commands
    CommandsType, 
    SubCommandOptionsType,
    // janken
    JankenModeType, 
    JankenPlayerType, 
    // query
    dbSelectType, 
    dbInsertType, 
    dbUpdateType,
    IUColumnType,
    queryBuilderType,
    qbMethodType,
    dbReturnType,
    // abc 5 dasar
    IABC_Response_Stats,
    IABC_Response_Register,
    IABC_Response_Categories
}