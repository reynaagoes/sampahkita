import mysql from "mysql2/promise"

const pool = mysql.createPool({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "root12345",
  database: "sampahkita",
  waitForConnections: true,
  connectionLimit: 10,
})

type AppPool = Omit<typeof pool, "execute"> & {
  execute(sql: string, values?: unknown): Promise<[any[], unknown]>
}

export default pool as AppPool
