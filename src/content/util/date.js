// dayjs 的最小替代：仅覆盖原脚本用到的两个能力
//   dayjs().format('YYYY-MM-DD')  → todayString()
//   dayjs().diff(item.time, 'd')  → daysDiff()
const MS_PER_DAY = 86400000;

const pad = value => String(value).padStart(2, '0');

/**
 * 本地时区的 'YYYY-MM-DD'（对等 dayjs().format('YYYY-MM-DD')）。
 * @param {Date} [now] 可注入的时间（测试用）
 * @returns {string}
 */
export function todayString(now = new Date()) {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * 从 now 到 date('YYYY-MM-DD' 本地零点) 的天数差，向零截断
 * （对等 dayjs().diff(date, 'd') 的整数截断语义）。
 * @param {number} nowMs 当前时间戳（毫秒）
 * @param {string} dateString 'YYYY-MM-DD'
 * @returns {number}
 */
export function daysDiff(nowMs, dateString) {
  const start = Date.parse(`${dateString}T00:00:00`);
  if (Number.isNaN(start)) {
    return Number.NaN;
  }
  // `|| 0` 归一化 -0 → 0（数值语义不变）
  return Math.trunc((nowMs - start) / MS_PER_DAY) || 0;
}

/**
 * infoRecord 条目是否仍在有效期内（对等 target.js 437–442：diff <= 3 保留）。
 * @param {number} nowMs
 * @param {{ time: string }} record
 * @returns {boolean}
 */
export function isRecordFresh(nowMs, record) {
  const diff = daysDiff(nowMs, record?.time);
  return !Number.isNaN(diff) && diff <= 3;
}
