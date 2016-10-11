
export enum ArticleType {
  NINEGAG,
  VDM,
  DTC
}

//abstract
export class Article {
  read:boolean = false;
  visibleTimer:any = null;

  constructor(
    protected type:ArticleType,
    protected data:any
  ) {

  }
}
