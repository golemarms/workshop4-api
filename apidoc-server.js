const express = require('express');
const { join } = require('path');
const app = express();

app.use('/apidoc', express.static(join(__dirname, 'apidoc')));


const PORT = parseInt(process.argv[2] || process.env.APP_PORT) || 3001;

app.listen(PORT, () => {
	console.info(`Application started on port ${PORT} at ${new Date()}`);
});
	