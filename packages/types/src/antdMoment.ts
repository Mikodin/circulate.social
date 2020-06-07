export interface AntdMoment {
  toObject: () => {
    date: number;
    hours: number;
    milliseconds: number;
    minutes: number;
    months: number;
    seconds: number;
    years: number;
  };
}
