export class SystemDB {
  private static PREFIX = 'lumina_os_db_';

  static read<T>(collection: string): T | null {
    try {
      const data = localStorage.getItem(`${this.PREFIX}${collection}`);
      return data ? JSON.parse(data) as T : null;
    } catch (e) {
      console.error(`Failed to read from DB collection: ${collection}`, e);
      return null;
    }
  }

  static write<T>(collection: string, data: T): void {
    try {
      localStorage.setItem(`${this.PREFIX}${collection}`, JSON.stringify(data));
    } catch (e) {
      console.error(`Failed to write to DB collection: ${collection}`, e);
    }
  }

  static delete(collection: string): void {
    localStorage.removeItem(`${this.PREFIX}${collection}`);
  }

  static clearAll(): void {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith(this.PREFIX)) {
        localStorage.removeItem(key);
      }
    }
  }
}
