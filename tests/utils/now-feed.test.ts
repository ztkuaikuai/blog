import { describe, expect, it, vi } from 'vitest';
import { NowFeed, type NowPage } from '../../src/utils/now/feed';

const message = (id: string) => ({ id, text: id, entities: [], timestamp: '2026-01-01T00:00:00.000Z', link: `https://t.me/test/${id}`, images: [] });

function view() {
  return {
    replace: vi.fn(), append: vi.fn(), showEmpty: vi.fn(), showEnd: vi.fn(),
    showInitialError: vi.fn(), showMoreError: vi.fn(), setLoading: vi.fn(),
  };
}

describe('NowFeed', () => {
  it('首次加载失败后可以重试', async () => {
    const load = vi.fn<() => Promise<NowPage>>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ messages: [message('1')], nextCursor: null, hasRecentUpdate: true });
    const target = view();
    const feed = new NowFeed(load, target);

    await feed.loadFirst();
    expect(target.showInitialError).toHaveBeenCalledOnce();
    await target.showInitialError.mock.calls[0][0]();
    expect(target.replace).toHaveBeenCalledWith([message('1')]);
  });

  it('加载更多失败保留已有内容并允许重试', async () => {
    const load = vi.fn<(cursor: string | null) => Promise<NowPage>>()
      .mockResolvedValueOnce({ messages: [message('1')], nextCursor: 'next', hasRecentUpdate: true })
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ messages: [message('2')], nextCursor: null, hasRecentUpdate: true });
    const target = view();
    const feed = new NowFeed(load, target);

    await feed.loadFirst();
    await feed.loadMore();
    expect(target.replace).toHaveBeenCalledTimes(1);
    expect(target.showMoreError).toHaveBeenCalledOnce();
    await target.showMoreError.mock.calls[0][0]();
    expect(target.append).toHaveBeenCalledWith([message('2')]);
  });
});
