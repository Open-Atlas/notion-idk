const Koa = require('koa');
const Router = require('@koa/router');
const helmet = require('koa-helmet');
const koaBody = require('koa-body')({multipart: true});
const cors = require('@koa/cors');

const app = new Koa();
const router = new Router();

app.use(cors());
app.use(helmet());

const notion = require('./notion/');

const { createReadStream } = require('fs')

router.get('/graph', (ctx) => {
ctx.type = 'html';
    ctx.body = createReadStream('./d3networkgraph/graph.html');
});

router.get('/graph2', (ctx) => {
ctx.type = 'html';
    ctx.body = createReadStream('./d3networkgraph/graph2.html');
});

router.get('/', (ctx) => {
  ctx.response.body = 'As we all stand on the shoulders of giants, tomorrow I hope to be the same for you.';
});

router.get('/aa', (ctx) => {
  ctx.response.body = 'As we all stand on the shoulders of giants, tomorrow I hope to be the same for you.';
});

router.post('/', (ctx) => {
  ctx.response.body = 'As we all stand on the shoulders of giants, tomorrow I hope to be the same for you.';
});

/* const basicAuth = process.env.BASIC_AUTH;

router.use(async (ctx, next) => {
	//console.log(ctx.request.header);
	if (basicAuth && ctx.request.header.authorization !== basicAuth) {
		ctx.throw(401);
	}
	//console.log("Auth OK");
	await next();
}); */

router.get('/csv', (ctx) => {
  ctx.response.body = 'blep.';
});

// PARSES CSV FILE

const fs = require('fs');
const csv = require('csv-parser');

// eslint-disable-next-line require-jsdoc
function parseCsv(filePath) {
  const results = [];
  return new Promise((resolve) => {
    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          resolve(results);
        });
  });
}

router.get('/notion/sync', async (ctx) => {
  ctx.response.body = await notion.advanced.sync();
});

router.get('/notion/relationJson', (ctx) => {
  const x = notion.advanced.relationJson(ctx.params);
  ctx.response.body = x.Books;
});

router.get('/notion/addSelectOption', async (ctx) => {
  ctx.response.body = await notion.advanced.addSelectOption(ctx.query);
});

router.get('/notion/makeHierarchy', async (ctx) => {
  ctx.response.body = await notion.advanced.makeHierarchy(ctx.query);
});

router.get('/notion/formatPage', async (ctx) => {
  ctx.response.body = await notion.advanced.formatPage(ctx.query);
});

router.get('/testquery', ctx => {
	ctx.response.body = ctx.params
})

router.get('/notion/:functionName', async (ctx) => {
	const {functionName} = ctx.params;
  ctx.response.body = await notion.request(functionName, ctx.query);
});

router.get('/notion/raw/:functionName', async (ctx) => {
	const {functionName} = ctx.params;
  ctx.response.body = await notion.request(functionName, ctx.query, {raw:true});
});

router.post('/csv', koaBody, async (ctx) => {
  // console.log(ctx.request.files)
  await parseCsv(ctx.request.files.csv.path).then((x) =>
    ctx.response.body = JSON.stringify(x));
});

router.post('/formData', (ctx) => {
  ctx.response.body = JSON.stringify(ctx.request.body);
});

router.use((ctx) => {
  ctx.response.status = 404;
});

app.use(router.routes());

app.on('error', (e) => {
  // headers data makes Koa crash during error handling
  e.headers = {};
  console.error(e);
});

// PORT
const port = process.env.PORT || 3000;
app.listen(port, () => {});
console.log('listening on port ' + port);
