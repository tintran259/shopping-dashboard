export interface Province {
  code: number;
  name: string;
}

export interface Ward {
  code: number;
  name: string;
  provinceCode: number;
}
