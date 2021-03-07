export default (time: number): Promise<void> => new Promise<void>((resolve) => setTimeout(resolve, time))
