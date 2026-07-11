// ============================================================
// /api/now.json 端点测试
// ============================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ---- 辅助：构造模拟 Telegram API 更新 ----

function makeTelegramUpdate(
  updateId: number,
  messageId: number,
  date: number,
  text?: string,
  caption?: string,
  photo?: Array<{ file_id: string; file_unique_id: string; width: number; height: number }>,
) {
  const update: Record<string, unknown> = {
    update_id: updateId,
    channel_post: {
      message_id: messageId,
      date,
      ...(text !== undefined ? { text } : {}),
      ...(caption !== undefined ? { caption } : {}),
      ...(photo ? { photo } : {}),
    },
  };
  return update;
}

// 模拟 fetch 的便捷函数
function mockTelegramFetch(updates: ReturnType<typeof makeTelegramUpdate>[]) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string) => {
      if ((url as string).includes('/getFile')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ok: true, result: { file_path: 'photos/test.jpg' } }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true, result: updates }),
      });
    }),
  );
}

// ---- 测试 ----

describe('/api/now.json', () => {
  beforeEach(() => {
    vi.stubEnv('TELEGRAM_BOT_TOKEN', 'test-bot-token');
    vi.stubEnv('TELEGRAM_CHANNEL_ID', '@testchannel');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  // 辅助：重新导入模块并重置
  async function freshModule() {
    vi.resetModules();
    const mod = await import('../../../src/pages/api/now.json.ts');
    mod.__resetForTest();
    return mod;
  }

  // ----------------------------------------------------------
  // 1. 筛选与解析
  // ----------------------------------------------------------
  describe('消息筛选与解析', () => {
    it('应筛选带 #now 标签的 text 消息', async () => {
      const now = Math.floor(Date.now() / 1000);
      mockTelegramFetch([
        makeTelegramUpdate(1, 100, now - 100, '#now 今天天气真好'),
        makeTelegramUpdate(2, 101, now - 200, '普通消息不带标签'),
        makeTelegramUpdate(3, 102, now - 300, '#now 学习 Rust 中'),
      ]);

      const mod = await freshModule();
      const req = new Request('http://localhost/api/now.json?limit=20');
      const res = await mod.GET({ request: req });
      const data = await res.json();

      expect(data.messages).toHaveLength(2);
      expect(data.messages[0].text).toBe('今天天气真好');
      expect(data.messages[1].text).toBe('学习 Rust 中');
    });

    it('应筛选带 #now 标签的 caption 消息（图片消息）', async () => {
      const now = Math.floor(Date.now() / 1000);
      mockTelegramFetch([
        makeTelegramUpdate(1, 100, now - 100, undefined, '#now 一张好图', [
          { file_id: 'file1', file_unique_id: 'u1', width: 800, height: 600 },
        ]),
      ]);

      const mod = await freshModule();
      const req = new Request('http://localhost/api/now.json');
      const res = await mod.GET({ request: req });
      const data = await res.json();

      expect(data.messages).toHaveLength(1);
      expect(data.messages[0].text).toBe('一张好图');
      expect(data.messages[0].images).toHaveLength(1);
    });

    it('应将 #now 标签从文本中去除', async () => {
      const now = Math.floor(Date.now() / 1000);
      mockTelegramFetch([
        makeTelegramUpdate(1, 100, now - 100, '  #now  今天写了很多代码  '),
        makeTelegramUpdate(2, 101, now - 200, '周末愉快 #NOW'),
        makeTelegramUpdate(3, 102, now - 300, '中间 #now 位置测试'),
      ]);

      const mod = await freshModule();
      const req = new Request('http://localhost/api/now.json');
      const res = await mod.GET({ request: req });
      const data = await res.json();

      expect(data.messages).toHaveLength(3);
      expect(data.messages.find((m: any) => m.id === '100').text).toBe('今天写了很多代码');
      expect(data.messages.find((m: any) => m.id === '101').text).toBe('周末愉快');
      expect(data.messages.find((m: any) => m.id === '102').text).toBe('中间 位置测试');
    });

    it('应按时间戳倒序排列消息', async () => {
      const base = Math.floor(Date.now() / 1000);
      mockTelegramFetch([
        makeTelegramUpdate(1, 100, base - 300, '#now 旧消息'),
        makeTelegramUpdate(2, 101, base - 100, '#now 新消息'),
        makeTelegramUpdate(3, 102, base - 200, '#now 中间消息'),
      ]);

      const mod = await freshModule();
      const req = new Request('http://localhost/api/now.json');
      const res = await mod.GET({ request: req });
      const data = await res.json();

      expect(data.messages).toHaveLength(3);
      expect(data.messages[0].text).toBe('新消息');
      expect(data.messages[1].text).toBe('中间消息');
      expect(data.messages[2].text).toBe('旧消息');
    });
  });

  // ----------------------------------------------------------
  // 2. 分页
  // ----------------------------------------------------------
  describe('分页参数', () => {
    it('应正确分页：limit 控制返回数量', async () => {
      const base = Math.floor(Date.now() / 1000);
      const updates = Array.from({ length: 15 }, (_, i) =>
        makeTelegramUpdate(i + 1, 200 - i, base - i * 100, `#now 消息 ${i + 1}`),
      );
      mockTelegramFetch(updates);

      const mod = await freshModule();
      const req = new Request('http://localhost/api/now.json?limit=5');
      const res = await mod.GET({ request: req });
      const data = await res.json();

      expect(data.messages).toHaveLength(5);
    });

    it('应正确分页：offset 控制起始位置', async () => {
      const base = Math.floor(Date.now() / 1000);
      const updates = Array.from({ length: 15 }, (_, i) =>
        makeTelegramUpdate(i + 1, 200 - i, base - i * 100, `#now 消息 ${i + 1}`),
      );
      mockTelegramFetch(updates);

      const mod = await freshModule();

      // 首页
      const res1 = await mod.GET({ request: new Request('http://localhost/api/now.json?limit=5') });
      const page1 = await res1.json();

      // 第二页
      const res2 = await mod.GET({ request: new Request('http://localhost/api/now.json?limit=5&offset=5') });
      const page2 = await res2.json();

      expect(page1.messages).toHaveLength(5);
      expect(page2.messages).toHaveLength(5);
      // 内容不应重复
      const ids1 = page1.messages.map((m: any) => m.id);
      const ids2 = page2.messages.map((m: any) => m.id);
      const allIds = new Set([...ids1, ...ids2]);
      expect(allIds.size).toBe(10);
    });

    it('limit 应限制在 1-100 范围内', async () => {
      const base = Math.floor(Date.now() / 1000);
      const updates = Array.from({ length: 50 }, (_, i) =>
        makeTelegramUpdate(i + 1, 200 - i, base - i * 100, `#now 消息 ${i + 1}`),
      );
      mockTelegramFetch(updates);

      const mod = await freshModule();

      // limit=0 会被 clamp 到 1
      const res1 = await mod.GET({ request: new Request('http://localhost/api/now.json?limit=0') });
      const data1 = await res1.json();
      expect(data1.messages.length).toBeLessThanOrEqual(1);

      // limit=200 会被 clamp 到 100
      const res2 = await mod.GET({ request: new Request('http://localhost/api/now.json?limit=200') });
      const data2 = await res2.json();
      expect(data2.messages.length).toBeLessThanOrEqual(100);
    });
  });

  // ----------------------------------------------------------
  // 3. 缓存逻辑
  // ----------------------------------------------------------
  describe('缓存', () => {
    it('首页应使用缓存，重复请求不触发新的 Telegram 调用', async () => {
      const base = Math.floor(Date.now() / 1000);
      const mockFetch = vi.fn().mockImplementation((url: string) => {
        if ((url as string).includes('/getFile')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ ok: true, result: { file_path: 'p.jpg' } }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              ok: true,
              result: [makeTelegramUpdate(1, 100, base - 100, '#now 测试')],
            }),
        });
      });

      vi.stubGlobal('fetch', mockFetch);

      const mod = await freshModule();

      // 第一次请求
      await mod.GET({ request: new Request('http://localhost/api/now.json') });
      // 第二次请求（应在缓存期内）
      await mod.GET({ request: new Request('http://localhost/api/now.json') });

      // 只应调用一次 getUpdates
      const getUpdatesCalls = mockFetch.mock.calls.filter(
        (args: any[]) => (args[0] as string).includes('getUpdates'),
      );
      expect(getUpdatesCalls).toHaveLength(1);
    });

    it('非首页请求（有 offset）直接从缓存切片', async () => {
      const base = Math.floor(Date.now() / 1000);
      const updates = Array.from({ length: 25 }, (_, i) =>
        makeTelegramUpdate(i + 1, 200 - i, base - i * 100, `#now 消息 ${i + 1}`),
      );

      const mockFetch = vi.fn().mockImplementation((url: string) => {
        if ((url as string).includes('/getFile')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ ok: true, result: { file_path: 'p.jpg' } }),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true, result: updates }) });
      });

      vi.stubGlobal('fetch', mockFetch);
      const mod = await freshModule();

      // 首页 → 拉取 Telegram
      await mod.GET({ request: new Request('http://localhost/api/now.json?limit=20') });
      const callsAfterFirst = mockFetch.mock.calls.filter(
        (args: any[]) => (args[0] as string).includes('getUpdates'),
      ).length;

      // 第二页 → 不拉 Telegram（缓存期内，直接从 allMessages 切片）
      const res2 = await mod.GET({ request: new Request('http://localhost/api/now.json?limit=20&offset=20') });
      const data2 = await res2.json();
      const callsAfterSecond = mockFetch.mock.calls.filter(
        (args: any[]) => (args[0] as string).includes('getUpdates'),
      ).length;

      // 分页结果正确
      expect(data2.messages).toHaveLength(5); // 25 total, offset 20 = 5 remaining
      // 不应有额外的 getUpdates 调用
      expect(callsAfterSecond).toBe(callsAfterFirst);
    });
  });

  // ----------------------------------------------------------
  // 4. 错误场景
  // ----------------------------------------------------------
  describe('错误处理', () => {
    it('无缓存时 Telegram API 失败应返回 500 错误', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

      const mod = await freshModule();
      const res = await mod.GET({ request: new Request('http://localhost/api/now.json') });
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBeDefined();
      expect(data.messages).toEqual([]);
    });

    it('Telegram API 返回非 200 时应优雅降级', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({ ok: false, status: 502 }),
      );

      const mod = await freshModule();
      const res = await mod.GET({ request: new Request('http://localhost/api/now.json') });
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBeDefined();
    });

    it('缺少 TELEGRAM_BOT_TOKEN 环境变量时应返回错误', async () => {
      vi.stubEnv('TELEGRAM_BOT_TOKEN', '');
      vi.stubGlobal('fetch', vi.fn());

      const mod = await freshModule();
      const res = await mod.GET({ request: new Request('http://localhost/api/now.json') });

      expect(res.status).toBe(500);
    });
  });

  // ----------------------------------------------------------
  // 5. hasRecentUpdate
  // ----------------------------------------------------------
  describe('hasRecentUpdate', () => {
    it('最新消息在 48 小时内应返回 true', async () => {
      const recent = Math.floor(Date.now() / 1000) - 3600; // 1 小时前
      mockTelegramFetch([makeTelegramUpdate(1, 100, recent, '#now 刚刚更新的')]);

      const mod = await freshModule();
      const res = await mod.GET({ request: new Request('http://localhost/api/now.json') });
      const data = await res.json();

      expect(data.hasRecentUpdate).toBe(true);
    });

    it('最新消息超过 48 小时应返回 false', async () => {
      const old = Math.floor(Date.now() / 1000) - 49 * 3600; // 49 小时前
      mockTelegramFetch([makeTelegramUpdate(1, 100, old, '#now 很旧的')]);

      const mod = await freshModule();
      const res = await mod.GET({ request: new Request('http://localhost/api/now.json') });
      const data = await res.json();

      expect(data.hasRecentUpdate).toBe(false);
    });

    it('无消息时应返回 false', async () => {
      mockTelegramFetch([]);

      const mod = await freshModule();
      const res = await mod.GET({ request: new Request('http://localhost/api/now.json') });
      const data = await res.json();

      expect(data.hasRecentUpdate).toBe(false);
    });
  });
});
