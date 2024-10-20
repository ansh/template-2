export function calculateFutureValue(principal: number, rate: number, time: number): number {
  // TODO: Implement future value calculation
  return principal * Math.pow(1 + rate, time);
}
