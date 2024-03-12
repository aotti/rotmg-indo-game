declare global {
    namespace NodeJS {
        interface ProcessEnv {
            BOT_TOKEN: string;
            BOT_ID: string;
            GUILD_ID: string;
            DB_URL: string;
            DB_APIKEY: string;
            CIPHER_SECRET_KEY: string;
            CIPHER_SECRET_IV: string;
        }
    }
  }
  
  // If this file has no import/export statements (i.e. is a script)
  // convert it into a module by adding an empty export statement.
  export {}