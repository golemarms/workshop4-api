const { join } = require('path');
const uuid = require('uuid/v1')
const cors = require('cors');
const helmet = require('helmet')

const userRouter = require('./routers/user');
const cityRouter = require('./routers/city');

const { ValidationError } = require('express-json-validator-middleware')
const  OpenAPIValidator  = require('express-openapi-validator').OpenApiValidator;

const consul = require('consul')({ promisify: true });

const express = require('express');
const bodyParser = require('body-parser');

require('./db/db');

const serviceId = uuid().substring(0, 8);
const serviceName = `zips`
const auth = require('./middleware/auth')

const app = express();

//Disable etag for this workshop
app.set('etag', false);

app.use(cors());
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(userRouter);
app.use(cityRouter);
app.use(helmet());

app.use('/apidoc', express.static(join(__dirname, 'apidoc')));

new OpenAPIValidator({ 
    apiSpec: join(__dirname, 'schema', 'app-api.yaml')
}).install(app)


app.get('/health', auth, (req, resp) => {
	console.info(`health check: ${new Date()}`)
	resp.status(200)
		.type('application/json')
		.json({ time: (new Date()).toGMTString() })
})

app.use('/schema', express.static(join(__dirname, 'schema')));

app.use((error, req, resp, next) => {

	if (error instanceof ValidationError) {
		console.error('Schema validation error: ', error)
		return resp.status(400).type('application/json').json({ error: error });
	}

	else if (error.status) {
		console.error('OpenAPI specification error: ', error)
		return resp.status(400).type('application/json').json({ error: error });
	}

	console.error('Error: ', error);
	resp.status(400).type('application/json').json({ error: error });
});


const PORT = parseInt(process.argv[2] || process.env.APP_PORT) || 3000;

app.listen(PORT, () => {
	console.info(`Application started on port ${PORT} at ${new Date()}`);
	console.info(`\tService id: ${serviceId}`);

	// TODO 3/3 Add service registration here
	console.info(`Registering service ${serviceName}:${serviceId}`)
	consul.agent.service.register({
		id: serviceId,
		name: serviceName,
		port: PORT,
		check: {
			ttl: '10s',
			deregistercriticalserviceafter: '30s'
		}
	}).then(() => {
		setInterval(
			() => {
				consul.agent.check.pass({ id: `service:${serviceId}` })
			}, 10000 //10s
		)
		process.on('SIGINT', () => {
			console.info(`Deregistering service ${serviceName}:${serviceId}`)
			consul.agent.service.deregister({ id: serviceId })
				.finally(() => process.exit())
		})
	}).catch(error => console.error('Error: ', error))

});
	