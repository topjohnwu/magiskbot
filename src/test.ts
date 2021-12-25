import server from './webhook.js';

server.listen(Number(process.env.PORT), () => {
  console.log(`Server listening to ${process.env.PORT}`);
});
