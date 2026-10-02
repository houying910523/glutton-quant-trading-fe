
class Utils {

  static formatExchange(exchange: string) {
    if (exchange === 'SSE') {
      return '上海';
    }
    if (exchange === 'SZSE') {
      return '深圳';
    }
    return exchange;
  }

  static toTimestamp(date: string): number {
    return new Date(date).getTime();
  }

  static fromTimestamp(timestamp: number): string {
    return new Date(timestamp).toISOString().substring(0, 10);
  }
}

export default Utils;
