import server from './server';

// Start the server
server.listen(process.env.PORT,
  () => console.log(`Server listening to ${process.env.PORT}`));
