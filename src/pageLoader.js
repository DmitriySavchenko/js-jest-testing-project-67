import {writeFile} from 'fs/promises'
import axios from "axios";
import { cwd } from 'process';
import { join } from 'path';


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

  return result.concat('.', ext);
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

  console.info('download started');

  const response = await axios.get(url);

  console.info('download finished');

  const filePath = join(outputPath, fileNameBuilder(url));

  await writeFile(filePath, response.data);

  return {filepath: filePath};
} 
export default pageLoader;