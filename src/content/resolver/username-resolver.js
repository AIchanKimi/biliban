// BV/AV → 用户名异步查询。逐字对等 target.js 1458–1511 语义（XHR → fetch 等价替换）：
//   - 缓存命中立即 hideHandler（缓存 user 可为 ''）
//   - 未命中：先写入 {bv, user:'', time} 缓存记录（天然防止同 BV 重复在途请求）
//   - 请求以 INTERVAL_TIME × requestTotal 串行节流；requestTotal 恒增
//   - 非 200 → sendStatus 闩锁，永不再发后续请求（对等被拦截后止损）
//   - 每次响应后回写缓存并持久化（3 天过期在 loadInfoRecord 处过滤）
import { INTERVAL_TIME } from '../constants.js';
import { todayString } from '../util/date.js';

const VIEW_API = 'https://api.bilibili.com/x/web-interface/view';

/**
 * @param {{
 *   hideHandler: Function,
 *   initialInfoRecord: Array<{ bv: string, user: string, time: string }>,
 *   saveInfoRecord: (records: Array<{ bv: string, user: string, time: string }>) => Promise<void>,
 * }} deps
 * @returns {(bvNum: string | null, mainEle: Element, textValue, hideMethod?: number, typeInfo?: object) => void}
 */
export function createUsernameResolver(deps) {
  const { hideHandler, initialInfoRecord, saveInfoRecord } = deps;
  const infoRecord = [...initialInfoRecord];
  let requestTotal = 0;
  let sendStatus = true;

  return function resolveUsername(bvNum, mainEle, textValue, hideMethod = 0, typeInfo = {}) {
    let userName = '';
    if (bvNum) {
      let recordUser = false;
      infoRecord.forEach(item => {
        if (item.bv == bvNum) {
          userName = item.user;
          recordUser = true;
        }
      });
      if (recordUser) {
        hideHandler(mainEle, userName, textValue, hideMethod, typeInfo);
      } else {
        infoRecord.push({
          bv: bvNum,
          user: userName,
          time: todayString(),
        });
        const apiUrl = /^\d+$/.test(bvNum) ? `${VIEW_API}?aid=` : `${VIEW_API}?bvid=`;
        const url = apiUrl + bvNum;
        setTimeout(() => {
          if (!sendStatus) {
            return;
          }
          fetch(url)
            .then(async response => {
              if (response.ok) {
                return response.json();
              }
              sendStatus = false;
              console.info(url + '\nresponse status: ' + response.status);
              return null;
            })
            .then(data => {
              if (data && data.data && data.data.owner && data.data.owner['name']) {
                userName = data.data.owner['name'];
              }
              hideHandler(mainEle, userName, textValue, hideMethod, typeInfo);
              infoRecord.forEach(item => {
                if (item.bv == bvNum) {
                  item.user = userName;
                }
              });
              saveInfoRecord(infoRecord);
            })
            .catch(() => {
              console.info(url + '\nerror.');
              hideHandler(mainEle, userName, textValue, hideMethod, typeInfo);
            });
        }, INTERVAL_TIME * requestTotal);
        requestTotal++;
      }
    } else {
      hideHandler(mainEle, userName, textValue, hideMethod, typeInfo);
    }
  };
}
