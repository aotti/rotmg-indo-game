import { supabase } from "./database";
import { dbInsertType, dbReturnType, dbSelectType, dbUpdateType, IUColumnType, qbMethodType, queryBuilderType } from "./types";

export class DatabaseQueries {

    queryBuilder(table: string, selectColumn: number, whereColumn: string | null, whereValue: string | number | null, insert?: IUColumnType | null, update?: IUColumnType | null): qbMethodType {
        function columnPicker(sc: number) {
            // select which columns wanna display 
            const choosenColumns = []
            for(let col of sc.toString().split('')) {
                switch(+col) {
                    // janken_players columns
                    case 1: choosenColumns.push('id'); break
                    case 2: choosenColumns.push('username'); break
                    case 3: choosenColumns.push('win'); break
                    case 4: choosenColumns.push('lose'); break
                }
            }
            return choosenColumns.join(', ')
        }
        // check insert and update
        let temp_qb!: qbMethodType
        if(insert == null && update == null) {
            // create queryObject
            const qb: Omit<queryBuilderType, 'insertColumn' | 'updateColumn'> = {
                table: table,
                selectColumn: columnPicker(selectColumn),
                whereColumn: whereColumn,
                whereValue: whereValue
            }
            temp_qb = qb as dbSelectType
        }
        else if(insert != null) {
            // create queryObject
            const qb: Omit<queryBuilderType, 'whereColumn' | 'whereValue' | 'updateColumn'> = {
                table: table,
                selectColumn: columnPicker(selectColumn),
                get insertColumn() {
                    return insert
                }
            }
            temp_qb = qb as dbInsertType
        }
        else if(update != null) {
            // create queryObject
            const qb: Omit<queryBuilderType, 'insertColumn'> = {
                table: table,
                selectColumn: columnPicker(selectColumn),
                whereColumn: whereColumn,
                whereValue: whereValue,
                get updateColumn() {
                    return update
                }
            }
            temp_qb = qb as dbUpdateType
        }
        return temp_qb
    }

    selectAll(queryObject: dbSelectType): Promise<dbReturnType> {
        // get all data from supabase
        const selectAllDataFromDB = async () => {
            const {data, error} = await supabase.from(queryObject.table)
                                .select(queryObject.selectColumn)
            return {data: data, error: error}
        }
        return selectAllDataFromDB()
    }

    selectOne(queryObject: dbSelectType): Promise<dbReturnType> {
        // get specific data from supabase
        const selectOneDataFromDB = async () => {
            const {data, error} = await supabase.from(queryObject.table)
                                .select(queryObject.selectColumn)
                                .eq(queryObject.whereColumn, queryObject.whereValue)
            return {data: data, error: error}
        }
        return selectOneDataFromDB()
    }

    insert(queryObject: dbInsertType): Promise<dbReturnType> {
        const insertDataToDB = async () => {
            // insert player data who joined the game
            const {data, error} = await supabase.from(queryObject.table)
                                // [] means insert multiple values 
                                .insert([queryObject.insertColumn])
                                .select(queryObject.selectColumn)
            return {data: data, error: error}
        }
        return insertDataToDB()
    }

    update(queryObject: dbUpdateType): Promise<dbReturnType> {
        const updateDataToDB = async () => {
            const {data, error} = await supabase.from(queryObject.table)
                                .update(queryObject.updateColumn)
                                .eq(queryObject.whereColumn, queryObject.whereValue)
                                .select(queryObject.selectColumn)
            return {data: data, error: error}
        }
        return updateDataToDB()
    }
}