// BV/AV 号提取。逐字移植 target.js 1512–1520 与 1236。

/**
 * 从视频链接提取 BV/AV 号。
 * @param {string} videoLink
 * @returns {string | null} 无匹配返回 null（原实现 catch 后置 null）
 */
export function getBvNumber(videoLink) {
  let bvNum = '';
  try {
    bvNum = /\/video\/(?:av|bv)(\w+)/i.exec(videoLink)[1];
  } catch (e) {
    bvNum = null;
  }
  return bvNum;
}

/**
 * 从 data-bvid 属性提取（片尾推荐，对等 target.js 1236）。
 * @param {string | null | undefined} attr
 * @returns {string | null}
 */
export function extractDataBvid(attr) {
  let bvNum = '';
  try {
    bvNum = /(?:av|bv)(\w+)/i.exec(attr)[1];
  } catch (e) {
    bvNum = null;
  }
  return bvNum;
}
