export const captureSupportScroll = (container: HTMLElement) => {
  const top = container.getBoundingClientRect().top;
  const anchor = Array.from(container.querySelectorAll<HTMLElement>("[data-message-id]"))
    .find((element) => element.getBoundingClientRect().bottom > top);
  return {
    id: anchor?.dataset.messageId,
    offset: anchor ? anchor.getBoundingClientRect().top - top : 0,
    scrollTop: container.scrollTop,
    scrollHeight: container.scrollHeight,
  };
};

export const restoreSupportScroll = (container: HTMLElement, snapshot: ReturnType<typeof captureSupportScroll>) => {
  const anchor = snapshot.id
    ? container.querySelector<HTMLElement>(`[data-message-id="${snapshot.id}"]`) : null;
  container.scrollTop = anchor
    ? container.scrollTop + anchor.getBoundingClientRect().top - container.getBoundingClientRect().top - snapshot.offset
    : snapshot.scrollTop + container.scrollHeight - snapshot.scrollHeight;
};
