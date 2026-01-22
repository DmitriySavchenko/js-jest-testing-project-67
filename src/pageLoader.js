import {mkdir, writeFile} from 'fs/promises'
import * as prettier from "prettier";
import axios from "axios";
import { cwd } from 'process';
import { join, extname } from 'path';
import * as cheerio from 'cheerio';
import { URL } from 'url';
import assert from 'assert';

/**
 * 
 * @param {string} url
 * @param {string} ext
 * 
 * @returns {string}
 */
function fileNameBuilder(url, ext = 'html') {
  const u = new URL(url);  
  const temp = u.hostname + (u.pathname && u.pathname != '/' ? `/${u.pathname}` : '');  
  const result = temp.replace(/[^a-zA-Z0-9]+/g, '-');  
  
  return ext ? result.concat('.', ext) : result;;
}

async function imagesLoader(file, baseUrl, output) {

  assert(URL.canParse(baseUrl));
  const currentPageUrl = new URL(baseUrl);

  const newSrcFolder = `${fileNameBuilder(currentPageUrl, '')}_files`;  

  const $ = cheerio.load(file);
  const $img = $('img');
  const loadData = [];

  for (const node of $img) {
    const src = node.attribs['src'];   
    
    const ext = extname(src).slice(1);        
    const srcUrl = src.match(/^(http|https)/) ? src : `${currentPageUrl.origin}${src}`;

    
    try {      
      const imageFileName = fileNameBuilder(srcUrl, ext);      
      loadData.push({source: srcUrl, srcOrigin: src, src: `/${newSrcFolder}/${imageFileName}` });
    } catch (error) {
      console.error(error)
    }         
  }

  const requests = await Promise.allSettled(loadData.map(async (d) => {
    const result = await axios.get(d.source, {responseType: 'arraybuffer'});
    return {
      arrayBuffer: result.data,
      ...d,
    }
  }));

  if (requests.length) {
    await mkdir(join(output, newSrcFolder), {recursive: true});
  }
 

  const writeRequests = await Promise.allSettled(requests.filter((r) => r.status == 'fulfilled').map(async (r) => {    
    await writeFile(join(output, r.value.src), Buffer.from(r.value.arrayBuffer));
    return r.value;
  }));

  writeRequests.filter((e) => e.status == 'fulfilled').forEach((e) => {  
    $img
      .filter(`[src="${e.value.srcOrigin}"]`)
      .attr('src', e.value.src)
  });

  return $.html();
}

/**
 * 
 * @param {string} url 
 * @param {string} outputPath
 * @returns {Promise<Object>}
 */
async function pageLoader(url, outputPath = cwd()) {
  if (!URL.canParse(url)) {
    throw new Error(`bad url: ${url}`);
  }  

  console.info('- download started');

  const response = await axios.get(url);

  let fileData = response.data;

  console.info('- download finished');

  const filePath = join(outputPath, fileNameBuilder(url));

  console.info('- download images started');

  fileData = await imagesLoader(fileData, url, outputPath);

  fileData = await prettier.format(fileData, {
    parser: "html"
  });

  console.info('- download images finished');

  await writeFile(filePath, fileData);

  return {filepath: filePath};
} 
export default pageLoader;