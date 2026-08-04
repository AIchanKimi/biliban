// 直播间弹幕特殊逻辑。逐字移植 target.js 1334–1342。
// 按粉丝勋章屏蔽弹幕（trueLove 路径由 decideUsername 的 commentFans 门控）。

/**
 * @param {{ hideHandler: Function }} deps
 * @returns {{ run: () => void }}
 */
export function createLiveChatPage(deps) {
  const { hideHandler } = deps;

  function run() {
    const chatItems = document.querySelectorAll('#chat-items .chat-item');
    chatItems.forEach(item => {
      const fansMedalContent = item.querySelector('.fans-medal-content');
      hideHandler(item, null, null, 0, {
        trueLove: fansMedalContent ? fansMedalContent.textContent : null,
      });
    });
  }

  return { run };
}
