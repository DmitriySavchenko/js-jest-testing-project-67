
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { afterEach, beforeEach, expect, test} from "@jest/globals";
import pageLoader from '../src/pageLoader';
import nock from 'nock';
import { mkdtemp, readFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import * as cheerio from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const getFixturesPath = () => join(__dirname, '..', '__fixtures__');

let outputFilesPath;
let expectName;
let expectPageFilePath;
let pageResponse;
/**
 * @type {URL|null}
 */
let url;


beforeEach(async () => {
  nock.disableNetConnect();
  url = new URL('https://mock.test/page-load');
  outputFilesPath = await mkdtemp(join(tmpdir(), 'page-response')).catch(() => {});
  expectName = 'mock-test-page-load';
  expectPageFilePath = join(outputFilesPath, `${expectName}.html`);
  pageResponse = await readFile(join(getFixturesPath(), 'page-load.html'), 'utf-8');
})

afterEach(async () => {
  rm(outputFilesPath, { recursive: true, force: true })
})

test("pageLoader should return the correct path to file", async () => {
  nock(url.origin).get(url.pathname).reply(200, pageResponse) 
  
  const { filepath } = await pageLoader(url.toString(), outputFilesPath);

  expect(filepath).toBe(expectPageFilePath);
})

test("should write images", async () => {
  nock(url.origin).get(url.pathname).reply(200, pageResponse);
  nock("https://img.freepik.com")
    .get("/free-photo/river-surrounded-by-forests-cloudy-sky-thuringia-germany_181624-30863.jpg")
    .reply(200, "Test");

  const expectImagePath = `/${join(`${expectName}_files`, 'img-freepik-com-free-photo-river-surrounded-by-forests-cloudy-sky-thuringia-germany-181624-30863-jpg.jpg')}`;

  const { filepath } = await pageLoader(url.toString(), outputFilesPath);
  const file = await readFile(filepath, 'utf-8');
  const $ = cheerio.load(file);
  
  const $img = $(`img[src="${expectImagePath}"]`);
  expect($img.is('img')).toBeTruthy();
})

test("should throw error", async () => {  
  url = 'ya.ru';

  let badUrlException = new Error(`bad url: ${url}`);

  await expect(pageLoader(url.toString())).rejects.toEqual(badUrlException);

  url = 'https://ya';
  await expect(pageLoader(url.toString())).rejects.toMatchObject({
    'message': expect.anything(),
    'code': expect.anything(),
    'request': expect.anything(),
  });
})
