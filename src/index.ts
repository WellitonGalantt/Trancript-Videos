import app from "./server";
import dotenv from "dotenv"

dotenv.config()

const port = process.env.SERVER_PORT

app.listen(port, ()=>{
  console.log(`servidor rodando em http://localhost:${port}`)
})