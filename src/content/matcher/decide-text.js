// decideText —— 按文本（标题/内容）判定是否屏蔽。
// 逐字移植 target.js 795–1008，仅将 bilibiliConfig 改为 config 参数、散参改为选项对象。
// 保留全部原始语义，包括：
//   - 视频路径：string 未命中 includes 时落入 textValue.match(k)（字符串被 match 强转的 quirk）
//   - 评论 string 项的 sourceText / [.*] 中括号双分支
//   - 动态路径：标题(keywordArray) → 正文(commentArray) → 转发正文(commentArray)

/**
 * @param {Readonly<Record<string, unknown>>} config 运行时配置（keywordArray/commentArray 已含 RegExp）
 * @param {string | null | undefined} textValue
 * @param {{
 *   isComment?: boolean, isLive?: boolean, isPic?: boolean,
 *   sourceText?: string | null, isMessageReply?: boolean,
 *   dynamicVideo?: string | null,
 *   dynamic?: { content?: string | null, sourceContent?: string | null } | null,
 *   repost?: { content?: string | null, sourceContent?: string | null } | null,
 * }} options
 * @returns {boolean}
 */
export function decideText(config, textValue, options = {}) {
  const {
    isComment = false,
    isLive = false,
    isPic = false,
    sourceText = null,
    isMessageReply = false,
    dynamicVideo = null,
    dynamic = null,
    repost = null,
  } = options;

  let isDecide = false;
  let isDecideComment = false;
  let isDecideDynamic = false;
  let isDecideDynamicTitle = false;
  let isDecideDynamicContent = false;
  let isDecideDynamicRepost = false;
  if (config.functionEnable) {
    if (textValue) {
      if (isComment) {
        if (isMessageReply) {
          if (config.messageReplyEnable) {
            isDecideComment = true;
          }
        } else {
          isDecideComment = true;
        }
      } else if (isLive) {
        if (config.liveEnable) {
          isDecide = true;
        }
      } else if (isPic) {
        if (config.picEnable) {
          isDecide = true;
        }
      } else {
        isDecide = true;
      }
    } else {
      if (config.dynamicVideo && dynamicVideo) {
        isDecideDynamic = true;
        isDecideDynamicTitle = true;
      }
      if (config.dynamicContent && dynamic) {
        isDecideDynamic = true;
        isDecideDynamicContent = true;
      }
      if (config.dynamicContent && repost) {
        isDecideDynamic = true;
        isDecideDynamicRepost = true;
      }
    }
  }
  if (isDecide) {
    if (config.keywordEnable) {
      for (const k of config.keywordArray) {
        if (k) {
          if (typeof k === 'string' && textValue.includes(k)) {
            return true;
          } else {
            try {
              if (textValue.match(k)) {
                return true;
              }
            } catch (e) {
              console.error('存在错误的正则表达式: ', e);
            }
          }
        }
      }
    }
  } else if (isDecideComment) {
    if (config.commentKeywordEnable) {
      for (const i of config.commentArray) {
        if (i) {
          if (typeof i === 'string') {
            if (textValue.includes(i)) {
              if (sourceText) {
                if (sourceText.includes(i)) {
                  return true;
                } else if (/\[.*\]/i.test(i)) {
                  return true;
                }
              } else {
                return true;
              }
            } else if (sourceText && /\[.*\]/i.test(i)) {
              if (sourceText.includes(i)) {
                return true;
              }
            }
          } else {
            try {
              if (textValue.match(i)) {
                return true;
              } else if (sourceText.match(i)) {
                return true;
              }
            } catch (e) {
              console.error('存在错误的正则表达式: ', e);
            }
          }
        }
      }
    }
  } else if (isDecideDynamic) {
    let dynamicStatus = false;
    if (isDecideDynamicTitle) {
      if (config.keywordEnable) {
        for (const o of config.keywordArray) {
          if (o) {
            if (typeof o === 'string' && dynamicVideo.includes(o)) {
              dynamicStatus = true;
              break;
            } else {
              try {
                if (dynamicVideo.match(o)) {
                  dynamicStatus = true;
                  break;
                }
              } catch (e) {
                console.error('存在错误的正则表达式: ', e);
              }
            }
          }
        }
      }
    }
    if (!dynamicStatus && dynamic.content && isDecideDynamicContent) {
      if (config.commentKeywordEnable) {
        for (const q of config.commentArray) {
          if (q) {
            if (typeof q === 'string') {
              if (dynamic.content.includes(q)) {
                if (dynamic.sourceContent) {
                  if (dynamic.sourceContent.includes(q)) {
                    dynamicStatus = true;
                    break;
                  } else if (/\[.*\]/i.test(q)) {
                    dynamicStatus = true;
                    break;
                  }
                } else {
                  dynamicStatus = true;
                  break;
                }
              } else if (dynamic.sourceContent && /\[.*\]/i.test(q)) {
                if (dynamic.sourceContent.includes(q)) {
                  dynamicStatus = true;
                  break;
                }
              }
            } else {
              try {
                if (dynamic.content.match(q)) {
                  dynamicStatus = true;
                  break;
                } else if (dynamic.sourceContent.match(q)) {
                  dynamicStatus = true;
                  break;
                }
              } catch (e) {
                console.error('存在错误的正则表达式: ', e);
              }
            }
          }
        }
      }
    }
    if (!dynamicStatus && repost.content && isDecideDynamicRepost) {
      if (config.commentKeywordEnable) {
        for (const r of config.commentArray) {
          if (r) {
            if (typeof r === 'string') {
              if (repost.content.includes(r)) {
                if (repost.sourceContent) {
                  if (repost.sourceContent.includes(r)) {
                    dynamicStatus = true;
                    break;
                  } else if (/\[.*\]/i.test(r)) {
                    dynamicStatus = true;
                    break;
                  }
                } else {
                  dynamicStatus = true;
                  break;
                }
              } else if (repost.sourceContent && /\[.*\]/i.test(r)) {
                if (repost.sourceContent.includes(r)) {
                  dynamicStatus = true;
                  break;
                }
              }
            } else {
              try {
                if (repost.content.match(r)) {
                  dynamicStatus = true;
                  break;
                } else if (repost.sourceContent.match(r)) {
                  dynamicStatus = true;
                  break;
                }
              } catch (e) {
                console.error('存在错误的正则表达式: ', e);
              }
            }
          }
        }
      }
    }
    return dynamicStatus;
  }
  return false;
}
