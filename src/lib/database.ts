import { createClient } from "@supabase/supabase-js"
import { config } from 'dotenv'
import { resolve } from 'path'

// set the env file
const envFilePath = resolve(process.cwd(), '.env')
config({ path: envFilePath })

const supabaseUrl = process.env['DB_URL']
const supabaseKey = process.env['DB_APIKEY']
const supabase = createClient(supabaseUrl, supabaseKey)

export { supabase }