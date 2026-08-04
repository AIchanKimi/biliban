// hideEvent 调度器（文档化改进）：
// 原脚本在每次 DOM mutation 时全量重跑 hideEvent；这里用 rAF 批处理，
// 一帧内的多次 mutation 合并为一次执行。DOM 终态相同，CPU 开销显著降低。
// 保存/取消/延时触发器不走调度器，直接调用 hideEvent 保证即时反馈。

/**
 * @param {() => void} hideEvent
 * @returns {() => void} scheduleHideEvent
 */
export function createScheduler(hideEvent) {
  let scheduled = false;
  return function scheduleHideEvent() {
    if (scheduled) {
      return;
    }
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      hideEvent();
    });
  };
}
