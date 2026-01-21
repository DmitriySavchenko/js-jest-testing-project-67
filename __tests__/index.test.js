
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { afterEach, beforeEach, expect, test} from "@jest/globals";
import pageLoader from '../src/pageLoader';
import nock from 'nock';
import { mkdtemp, readFile, rm } from 'fs/promises';
import { tmpdir } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const getFixturesPath = () => join(__dirname, '..', '__fixtures__');

let outputFilesPath;
let expectFilePath;
let pageResponse;
/**
 * @type {URL|null}
 */
let url;


beforeEach(async () => {
  nock.disableNetConnect();
  url = new URL('https://mock.test/page-load');
  outputFilesPath = await mkdtemp(join(tmpdir(), 'page-response')).catch(() => {});
  expectFilePath = join(outputFilesPath, 'mock-test-page-load.html');
  pageResponse = await readFile(join(getFixturesPath(), 'page-load.html'), 'utf-8');
})

afterEach(async () => {
  rm(outputFilesPath, { recursive: true, force: true })
})

test("pageLoader should return the correct path to file and write file", async () => {
  nock(url.origin).get(url.pathname).reply(200, pageResponse) 
  
  const { filepath } = await pageLoader(url.toString(), outputFilesPath);
  const file = await readFile(filepath, 'utf-8');

  expect(filepath).toBe(expectFilePath);
  expect(file).toBe(pageResponse);
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
