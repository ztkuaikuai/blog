import type { TelegramEntity } from './text';

export interface NowMessage {
  id: string;
  text: string;
  entities: TelegramEntity[];
  timestamp: string;
  link: string;
  images: Array<{ id: string; width: number; height: number }>;
}

export interface NowPage {
  messages: NowMessage[];
  nextCursor: string | null;
  hasRecentUpdate: boolean;
}

export interface NowFeedView {
  replace(messages: NowMessage[]): void;
  append(messages: NowMessage[]): void;
  showEmpty(): void;
  showEnd(): void;
  showInitialError(retry: () => Promise<void>): void;
  showMoreError(retry: () => Promise<void>): void;
  setLoading(loading: boolean): void;
}

export class NowFeed {
  private cursor: string | null = null;
  private loading = false;
  private initialized = false;

  constructor(
    private readonly fetchPage: (cursor: string | null) => Promise<NowPage>,
    private readonly view: NowFeedView,
  ) {}

  async loadFirst(): Promise<void> {
    if (this.loading) return;
    this.loading = true;
    this.view.setLoading(true);
    try {
      const page = await this.fetchPage(null);
      this.initialized = true;
      this.cursor = page.nextCursor;
      this.view.replace(page.messages);
      if (page.messages.length === 0) this.view.showEmpty();
      else if (!this.cursor) this.view.showEnd();
    } catch {
      this.view.showInitialError(() => this.loadFirst());
    } finally {
      this.loading = false;
      this.view.setLoading(false);
    }
  }

  async loadMore(): Promise<void> {
    if (this.loading || !this.initialized || !this.cursor) return;
    this.loading = true;
    this.view.setLoading(true);
    try {
      const page = await this.fetchPage(this.cursor);
      this.cursor = page.nextCursor;
      this.view.append(page.messages);
      if (!this.cursor) this.view.showEnd();
    } catch {
      this.view.showMoreError(() => this.loadMore());
    } finally {
      this.loading = false;
      this.view.setLoading(false);
    }
  }
}
