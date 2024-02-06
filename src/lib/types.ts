// command types
type SubCommandOptionsType = {
    type: number;
    name: string;
    description: string;
    required?: boolean;
    choices?: { 
        name: string | number, 
        value: string | number 
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

// janken types
type JankenPlayerType = {
    id: number;
    username: string;
    finger: string;
    result: string | null;
}

export { CommandsType, JankenPlayerType }