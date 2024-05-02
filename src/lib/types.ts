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

// ~~ fetching ~~
type FetchBodyType = {
    action: string;
    payload: object | object[];
}

// ~~ abc 5 dasar api ~~
interface IABC_Response {
    status: number;
    message: string | PostgrestError | null;
}

interface IABC_Response_Profile extends IABC_Response {
    data: {
        id: number;
        username: string;
        game_played: number;
        words_correct: number;
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

interface IABC_Response_GetWords extends IABC_Response {
    data: {
        id: number;
        category: string;
        word: string;
    }[]
}

type IABC_RoomType = {
    id: number;
    thread_id: string;
    name: string;
    password: string | null;
    num_players: number;
    max_players: number;
    rules: string;
    status: string;
}

interface IABC_Response_CreateRoom extends IABC_Response {
    data: IABC_RoomType[]
}

interface IABC_Response_UpdateRoom extends IABC_Response {
    data: Pick<IABC_RoomType, 'id' | 'thread_id' | 'name' | 'num_players' | 'status'>[]
}

interface IABC_Response_JoinRoom extends IABC_Response {
    data: Omit<IABC_RoomType, 'rules'>[]
}

interface IABC_Response_Rounds extends IABC_Response {
    data: {
        player_id: string;
        room_id: number;
        word_id: number;
        round_number: number;
    }[]
}

// ~~ threads ~~
type Thread_Create_Success = {
    id: string;
    parent_id: string;
    owner_id: string;
    member_count: number;
    thread_metadata: {
        auto_archive_duration: number;
    }
}

type Thread_Create_Fail = {
    code: number;
    message: string;
    errors: object;
}

// ~~ playing game ~~
type PlayingDataType = {
    room_id: number;
    round_number: number;
    game_rounds: number;
    categories: string[];
    num_players: {
        message_id: string;
        count: number;
    };
    max_players: number;
    game_status: string;
    player_data: {
        player_id: string;
        answer_id: number[];
        answer_words: string[];
        answer_points: number;
        answer_status: boolean;
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
    // fetching
    FetchBodyType,
    // abc 5 dasar
    IABC_Response,
    IABC_Response_Profile,
    IABC_Response_Register,
    IABC_Response_Categories,
    IABC_Response_CreateRoom,
    IABC_Response_UpdateRoom,
    IABC_Response_JoinRoom,
    IABC_Response_GetWords,
    IABC_Response_Rounds,
    // threads
    Thread_Create_Success,
    Thread_Create_Fail,
    // playing game
    PlayingDataType
}