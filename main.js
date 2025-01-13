import app from "./src/index.js";


const port = process.env.SERVER_PORT || 3000;

app.listen(port, () => {
  console.log(`Running on localhost:${port}`);
});
